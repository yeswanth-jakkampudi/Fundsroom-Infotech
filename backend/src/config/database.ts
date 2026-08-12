import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';

// Force IPv4 - Render free tier does not support IPv6
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;
let isPg = false;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  isPg = true;
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  console.log('🔗 Database Mode: PostgreSQL');
} else {
  const dbDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'mini_erp.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
  console.log(`📁 Database Mode: SQLite (${dbPath})`);
}

/**
 * Flexible SQL Query Helper supporting both PostgreSQL ($1, $2) and SQLite (?) syntax
 */
export async function query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  if (isPg && pgPool) {
    const res = await pgPool.query(text, params);
    return { rows: res.rows, rowCount: res.rowCount || res.rows.length };
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      let convertedText = text.replace(/\$(\d+)/g, '?');
      
      const isSelect = convertedText.trim().toLowerCase().startsWith('select');
      const isInsert = convertedText.trim().toLowerCase().startsWith('insert');

      if (isSelect) {
        sqliteDb!.all(convertedText, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [], rowCount: (rows || []).length });
        });
      } else {
        sqliteDb!.run(convertedText, params, function (err) {
          if (err) return reject(err);
          
          if (isInsert && convertedText.toLowerCase().includes('returning')) {
            sqliteDb!.get('SELECT last_insert_rowid() as id', [], (err2, row: any) => {
              if (err2) return reject(err2);
              resolve({ rows: [{ id: row ? row.id : this.lastID }], rowCount: this.changes });
            });
          } else {
            resolve({ rows: [{ id: this.lastID }], rowCount: this.changes });
          }
        });
      }
    });
  } else {
    throw new Error('Database not initialized');
  }
}

/**
 * Initialize Tables and Seed Initial Data
 */
export async function initDb() {
  try {
    const idType = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const timestampType = isPg ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';

    // 1. Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id ${idType},
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at ${timestampType}
      );
    `);

    // 2. Customers Table
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id ${idType},
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50),
        email VARCHAR(255),
        business_name VARCHAR(255),
        gst VARCHAR(50),
        type VARCHAR(50) DEFAULT 'B2B',
        address TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        follow_up_date VARCHAR(50),
        notes TEXT,
        created_at ${timestampType}
      );
    `);

    // 3. Products Table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id ${idType},
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100),
        unit_price REAL NOT NULL,
        current_stock INT DEFAULT 0,
        minimum_stock INT DEFAULT 5,
        warehouse_location VARCHAR(100),
        created_at ${timestampType}
      );
    `);

    // 4. Stock Movements Table
    await query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id ${idType},
        product_id INT NOT NULL,
        quantity_change INT NOT NULL,
        movement_type VARCHAR(20) NOT NULL,
        reason TEXT,
        created_by INT,
        timestamp ${timestampType}
      );
    `);

    // 5. Challans Table
    await query(`
      CREATE TABLE IF NOT EXISTS challans (
        id ${idType},
        challan_number VARCHAR(100) UNIQUE NOT NULL,
        customer_id INT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Draft',
        total_amount REAL DEFAULT 0,
        created_by INT,
        created_at ${timestampType}
      );
    `);

    // 6. Challan Items Table
    await query(`
      CREATE TABLE IF NOT EXISTS challan_items (
        id ${idType},
        challan_id INT NOT NULL,
        product_id INT NOT NULL,
        qty INT NOT NULL,
        product_name_snapshot VARCHAR(255) NOT NULL,
        unit_price_snapshot REAL NOT NULL,
        sku_snapshot VARCHAR(100) NOT NULL
      );
    `);

    console.log('✅ Database tables initialized successfully.');

    // Always ensure Password@123 for default demo accounts
    const hashedPassword = await bcrypt.hash('Password@123', 10);
    const seedUsers = [
      { email: 'admin@test.com', role: 'Admin', name: 'System Administrator' },
      { email: 'sales@test.com', role: 'Sales', name: 'Sales Executive' },
      { email: 'warehouse@test.com', role: 'Warehouse', name: 'Warehouse Manager' },
      { email: 'accounts@test.com', role: 'Accounts', name: 'Accounts Officer' }
    ];

    for (const u of seedUsers) {
      const existing = await query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length === 0) {
        await query(
          'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4)',
          [u.email, hashedPassword, u.role, u.name]
        );
      } else {
        // Update password to Password@123 and ensure role is set correctly
        await query(
          'UPDATE users SET password_hash = $1, role = $2, name = $3 WHERE email = $4',
          [hashedPassword, u.role, u.name, u.email]
        );
      }
    }
    console.log('✅ Updated/Seeded demo users with password "Password@123".');

    // Seed sample customers & products if customers table is empty
    const custCheck = await query('SELECT COUNT(*) as count FROM customers');
    const custCount = parseInt(custCheck.rows[0].count || custCheck.rows[0]['COUNT(*)'] || '0', 10);

    if (custCount === 0) {
      await query(`
        INSERT INTO customers (name, mobile, email, business_name, gst, type, address, status, follow_up_date, notes)
        VALUES 
        ('Acme Logistics', '9876543210', 'contact@acmelogistics.com', 'Acme Enterprises Ltd', '27AAACA1234A1Z5', 'B2B', 'Industrial Park, Hub 4, Mumbai', 'Active', '2026-08-20', 'Requested quote for Q3 supplies.'),
        ('Global Tech Solutions', '9123456789', 'procurement@globaltech.io', 'Global Tech Pvt Ltd', '29BBBCC5678B1Z2', 'B2B', 'Tech Park Block B, Bangalore', 'Active', '2026-08-15', 'Key enterprise client. Priority dispatch.'),
        ('Apex Traders', '9988776655', 'apex.traders@gmail.com', 'Apex Retailers', '33CCCDD9012C1Z9', 'B2C', 'Market Road, Chennai', 'Lead', '2026-08-18', 'Interested in bulk workstation monitors.')
      `);

      await query(`
        INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location)
        VALUES 
        ('Ergonomic Office Chair', 'FUR-CHAIR-01', 'Furniture', 4999.00, 45, 10, 'Aisle A-12'),
        ('4K IPS Monitor 27"', 'ELE-MON-27', 'Electronics', 18500.00, 8, 10, 'Rack E-04'),
        ('Mechanical Keyboard RGB', 'ELE-KB-RGB', 'Electronics', 2499.00, 60, 15, 'Rack E-05'),
        ('Standing Desk Electric', 'FUR-DESK-E', 'Furniture', 22000.00, 4, 5, 'Aisle A-15')
      `);

      const pRows = await query('SELECT id, current_stock FROM products');
      for (const p of pRows.rows) {
        await query(
          'INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason, created_by) VALUES ($1, $2, $3, $4, $5)',
          [p.id, p.current_stock, 'IN', 'Initial Stock Setup', 1]
        );
      }
    }
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
}

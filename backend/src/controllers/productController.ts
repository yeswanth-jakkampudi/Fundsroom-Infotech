import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location } = req.body;

    if (!name || !sku || unit_price === undefined) {
      return res.status(400).json({ success: false, message: 'Product name, SKU, and unit price are required' });
    }

    // Check unique SKU
    const skuCheck = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (skuCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: `SKU '${sku}' already exists` });
    }

    const stockVal = parseInt(current_stock || 0, 10);
    const minStockVal = parseInt(minimum_stock || 5, 10);
    const priceVal = parseFloat(unit_price);

    const insertResult = await query(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name, sku, category || 'General', priceVal, stockVal, minStockVal, warehouse_location || 'Main Storage']
    );

    const newId = insertResult.rows[0].id;

    // Record initial stock movement if stock > 0
    if (stockVal > 0) {
      await query(
        `INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [newId, stockVal, 'IN', 'Initial Stock Entry', req.user?.id || null]
      );
    }

    const fetchResult = await query('SELECT * FROM products WHERE id = $1', [newId]);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: fetchResult.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM products';
    let countSql = 'SELECT COUNT(*) as total FROM products';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      sql += ' WHERE name LIKE $1 OR sku LIKE $2 OR category LIKE $3';
      countSql += ' WHERE name LIKE $1 OR sku LIKE $2 OR category LIKE $3';
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total || countResult.rows[0]['COUNT(*)'] || '0', 10);

    // Annotate low stock warning flag
    const productsWithAlert = result.rows.map((p) => ({
      ...p,
      is_low_stock: p.current_stock <= p.minimum_stock
    }));

    return res.status(200).json({
      success: true,
      data: productsWithAlert,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get product movement history
    const movements = await query(
      `SELECT sm.*, u.name as user_name
       FROM stock_movements sm
       LEFT JOIN users u ON sm.created_by = u.id
       WHERE sm.product_id = $1
       ORDER BY sm.timestamp DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      product: result.rows[0],
      stockMovements: movements.rows
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location, reason } = req.body;

    const check = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const current = check.rows[0];
    const newStock = current_stock !== undefined ? parseInt(current_stock, 10) : current.current_stock;
    const oldStock = current.current_stock;
    const stockDiff = newStock - oldStock;

    await query(
      `UPDATE products
       SET name = $1, sku = $2, category = $3, unit_price = $4, current_stock = $5, minimum_stock = $6, warehouse_location = $7
       WHERE id = $8`,
      [
        name !== undefined ? name : current.name,
        sku !== undefined ? sku : current.sku,
        category !== undefined ? category : current.category,
        unit_price !== undefined ? parseFloat(unit_price) : current.unit_price,
        newStock,
        minimum_stock !== undefined ? parseInt(minimum_stock, 10) : current.minimum_stock,
        warehouse_location !== undefined ? warehouse_location : current.warehouse_location,
        id
      ]
    );

    // If stock changed, insert movement entry
    if (stockDiff !== 0) {
      const movementType = stockDiff > 0 ? 'IN' : 'OUT';
      const changeAbs = Math.abs(stockDiff);
      const movementReason = reason || (stockDiff > 0 ? 'Manual Stock Addition' : 'Manual Stock Deduction');

      await query(
        `INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, changeAbs, movementType, movementReason, req.user?.id || null]
      );
    }

    const updated = await query('SELECT * FROM products WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated.rows[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStockMovements = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT sm.*, p.name as product_name, p.sku as product_sku, u.name as user_name
       FROM stock_movements sm
       LEFT JOIN products p ON sm.product_id = p.id
       LEFT JOIN users u ON sm.created_by = u.id
       ORDER BY sm.timestamp DESC
       LIMIT 50`
    );

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

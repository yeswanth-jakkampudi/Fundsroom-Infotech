import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { name, mobile, email, business_name, gst, type, address, status, follow_up_date, notes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    const insertResult = await query(
      `INSERT INTO customers (name, mobile, email, business_name, gst, type, address, status, follow_up_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        name,
        mobile || null,
        email || null,
        business_name || null,
        gst || null,
        type || 'B2B',
        address || null,
        status || 'Active',
        follow_up_date || null,
        notes || null
      ]
    );

    const newId = insertResult.rows[0].id;
    const fetchResult = await query('SELECT * FROM customers WHERE id = $1', [newId]);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer: fetchResult.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM customers';
    let countSql = 'SELECT COUNT(*) as total FROM customers';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      sql += ' WHERE name LIKE $1 OR email LIKE $2 OR mobile LIKE $3 OR business_name LIKE $4';
      countSql += ' WHERE name LIKE $1 OR email LIKE $2 OR mobile LIKE $3 OR business_name LIKE $4';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    sql += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total || countResult.rows[0]['COUNT(*)'] || '0', 10);

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM customers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Also fetch associated challans history
    const challansResult = await query(
      'SELECT id, challan_number, status, total_amount, created_at FROM challans WHERE customer_id = $1 ORDER BY id DESC',
      [id]
    );

    return res.status(200).json({
      success: true,
      customer: result.rows[0],
      challanHistory: challansResult.rows
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, mobile, email, business_name, gst, type, address, status, follow_up_date, notes } = req.body;

    const check = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const current = check.rows[0];

    await query(
      `UPDATE customers
       SET name = $1, mobile = $2, email = $3, business_name = $4, gst = $5, type = $6, address = $7, status = $8, follow_up_date = $9, notes = $10
       WHERE id = $11`,
      [
        name !== undefined ? name : current.name,
        mobile !== undefined ? mobile : current.mobile,
        email !== undefined ? email : current.email,
        business_name !== undefined ? business_name : current.business_name,
        gst !== undefined ? gst : current.gst,
        type !== undefined ? type : current.type,
        address !== undefined ? address : current.address,
        status !== undefined ? status : current.status,
        follow_up_date !== undefined ? follow_up_date : current.follow_up_date,
        notes !== undefined ? notes : current.notes,
        id
      ]
    );

    const updatedResult = await query('SELECT * FROM customers WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer: updatedResult.rows[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addFollowUp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, follow_up_date } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, message: 'Follow-up note is required' });
    }

    const check = await query('SELECT notes, follow_up_date FROM customers WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const currentNotes = check.rows[0].notes || '';
    const dateStr = new Date().toISOString().split('T')[0];
    const userRole = req.user?.name || req.user?.role || 'User';
    const appendedNote = `${currentNotes}\n[${dateStr} - ${userRole}]: ${note}`.trim();
    const newFollowUpDate = follow_up_date || check.rows[0].follow_up_date;

    await query('UPDATE customers SET notes = $1, follow_up_date = $2 WHERE id = $3', [
      appendedNote,
      newFollowUpDate,
      id
    ]);

    const updated = await query('SELECT * FROM customers WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Follow-up note added successfully',
      customer: updated.rows[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

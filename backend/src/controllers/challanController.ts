import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateNextChallanNumber } from '../utils/challanCodeGenerator';

interface ChallanItemRequest {
  productId: number;
  qty: number;
}

export const createChallan = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, items, status } = req.body;
    const challanStatus = status === 'Confirmed' ? 'Confirmed' : 'Draft';

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required in the challan' });
    }

    // Verify Customer exists
    const customerCheck = await query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch and validate all products & stock
    const productMap = new Map<number, any>();
    for (const item of items) {
      if (!item.productId || !item.qty || item.qty <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid item product ID or quantity' });
      }

      const pResult = await query('SELECT * FROM products WHERE id = $1', [item.productId]);
      if (pResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: `Product with ID ${item.productId} not found` });
      }

      const product = pResult.rows[0];

      // Stock check if Confirmed status
      if (challanStatus === 'Confirmed') {
        if (product.current_stock < item.qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available: ${product.current_stock}, Requested: ${item.qty}. Cannot create negative stock.`
          });
        }
      }

      productMap.set(item.productId, product);
    }

    // Generate Challan Number (CH-0001, etc.)
    const challanNumber = await generateNextChallanNumber();

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items as ChallanItemRequest[]) {
      const product = productMap.get(item.productId);
      totalAmount += product.unit_price * item.qty;
    }

    // Create Challan record
    const insertChallan = await query(
      `INSERT INTO challans (challan_number, customer_id, status, total_amount, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [challanNumber, customerId, challanStatus, totalAmount, req.user?.id || null]
    );

    const challanId = insertChallan.rows[0].id;

    // Create Challan Items (snapshots) & update stock if Confirmed
    for (const item of items as ChallanItemRequest[]) {
      const product = productMap.get(item.productId);

      // Save item snapshot
      await query(
        `INSERT INTO challan_items (challan_id, product_id, qty, product_name_snapshot, unit_price_snapshot, sku_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [challanId, product.id, item.qty, product.name, product.unit_price, product.sku]
      );

      // Perform Stock Deduction & Movement Record if Confirmed
      if (challanStatus === 'Confirmed') {
        const updatedStock = product.current_stock - item.qty;

        await query('UPDATE products SET current_stock = $1 WHERE id = $2', [updatedStock, product.id]);

        await query(
          `INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, item.qty, 'OUT', `Sales Challan ${challanNumber}`, req.user?.id || null]
        );
      }
    }

    // Fetch created challan with customer details
    const fullChallan = await query(
      `SELECT c.*, cust.name as customer_name, cust.business_name, cust.email as customer_email, u.name as created_by_name
       FROM challans c
       LEFT JOIN customers cust ON c.customer_id = cust.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [challanId]
    );

    const createdItems = await query('SELECT * FROM challan_items WHERE challan_id = $1', [challanId]);

    return res.status(201).json({
      success: true,
      message: `Challan ${challanNumber} created successfully (${challanStatus})`,
      challan: {
        ...fullChallan.rows[0],
        items: createdItems.rows
      }
    });
  } catch (error: any) {
    console.error('Error creating challan:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getChallans = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status ? String(req.query.status) : '';
    let sql = `
      SELECT c.*, cust.name as customer_name, cust.business_name, u.name as created_by_name,
             (SELECT COUNT(*) FROM challan_items ci WHERE ci.challan_id = c.id) as item_count
      FROM challans c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN users u ON c.created_by = u.id
    `;
    const params: any[] = [];

    if (status) {
      sql += ' WHERE c.status = $1';
      params.push(status);
    }

    sql += ' ORDER BY c.id DESC';

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getChallanById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const challanResult = await query(
      `SELECT c.*, cust.name as customer_name, cust.mobile as customer_mobile, cust.email as customer_email,
              cust.business_name, cust.gst as customer_gst, cust.address as customer_address, u.name as created_by_name
       FROM challans c
       LEFT JOIN customers cust ON c.customer_id = cust.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (challanResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }

    const itemsResult = await query('SELECT * FROM challan_items WHERE challan_id = $1', [id]);

    return res.status(200).json({
      success: true,
      challan: {
        ...challanResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateChallanStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Confirmed or Cancelled' });
    }

    const check = await query('SELECT * FROM challans WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }

    const challan = check.rows[0];

    if (challan.status === 'Confirmed' && status === 'Confirmed') {
      return res.status(400).json({ success: false, message: 'Challan is already confirmed' });
    }

    if (challan.status === 'Draft' && status === 'Confirmed') {
      // Validate stock for all items before confirming
      const items = await query('SELECT * FROM challan_items WHERE challan_id = $1', [id]);

      for (const item of items.rows) {
        const pRes = await query('SELECT * FROM products WHERE id = $1', [item.product_id]);
        if (pRes.rows.length === 0) {
          return res.status(400).json({ success: false, message: `Product ID ${item.product_id} no longer exists` });
        }
        const product = pRes.rows[0];
        if (product.current_stock < item.qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product '${product.name}'. Available: ${product.current_stock}, Required: ${item.qty}`
          });
        }
      }

      // Perform deduction & movements
      for (const item of items.rows) {
        const pRes = await query('SELECT current_stock FROM products WHERE id = $1', [item.product_id]);
        const currentStock = pRes.rows[0].current_stock;
        const newStock = currentStock - item.qty;

        await query('UPDATE products SET current_stock = $1 WHERE id = $2', [newStock, item.product_id]);

        await query(
          `INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.product_id, item.qty, 'OUT', `Sales Challan Confirmation (${challan.challan_number})`, req.user?.id || null]
        );
      }
    }

    await query('UPDATE challans SET status = $1 WHERE id = $2', [status, id]);

    return res.status(200).json({
      success: true,
      message: `Challan status updated to ${status}`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

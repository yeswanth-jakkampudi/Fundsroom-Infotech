import { query } from '../config/database';

/**
 * Generates next sequential Challan Code e.g. CH-0001, CH-0002
 */
export async function generateNextChallanNumber(): Promise<string> {
  const result = await query('SELECT COUNT(*) as total FROM challans');
  const count = parseInt(result.rows[0].total || result.rows[0]['COUNT(*)'] || '0', 10) + 1;
  const paddedNumber = String(count).padStart(4, '0');
  return `CH-${paddedNumber}`;
}

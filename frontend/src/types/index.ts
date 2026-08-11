export type UserRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface User {
  id: string;  // Supabase UUID
  email: string;
  role: UserRole;
  name: string;
}


export interface Customer {
  id: number;
  name: string;
  mobile?: string;
  email?: string;
  business_name?: string;
  gst?: string;
  type?: 'B2B' | 'B2C';
  address?: string;
  status: 'Active' | 'Lead' | 'Inactive';
  follow_up_date?: string;
  notes?: string;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location: string;
  is_low_stock?: boolean;
  created_at?: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  quantity_change: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by?: number;
  user_name?: string;
  timestamp: string;
}

export interface ChallanItem {
  id?: number;
  challan_id?: number;
  product_id: number;
  qty: number;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  sku_snapshot: string;
}

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_mobile?: string;
  customer_address?: string;
  business_name?: string;
  customer_gst?: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  total_amount: number;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  item_count?: number;
  items?: ChallanItem[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

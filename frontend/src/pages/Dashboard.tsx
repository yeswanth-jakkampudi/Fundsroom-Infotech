import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Package, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  PlusCircle, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import { customerAPI, productAPI, challanAPI } from '../services/api';
import { Customer, Product, Challan } from '../types';

export const Dashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [cRes, pRes, chRes] = await Promise.all([
          customerAPI.getCustomers({ limit: 100 }),
          productAPI.getProducts({ limit: 100 }),
          challanAPI.getChallans()
        ]);

        if (cRes.data.success) setCustomers(cRes.data.data);
        if (pRes.data.success) setProducts(pRes.data.data);
        if (chRes.data.success) setChallans(chRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const lowStockProducts = products.filter((p) => p.current_stock <= p.minimum_stock);
  const totalRevenue = challans
    .filter((c) => c.status === 'Confirmed')
    .reduce((sum, c) => sum + (c.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner"></div>
        <span>Loading Nexus ERP Analytics...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Real-time overview of CRM, inventory levels, and sales challans</p>
        </div>
        <Link to="/challans/new" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>New Sales Challan</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon users-bg">
            <Users size={24} color="#6366f1" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Customers</span>
            <span className="metric-value">{customers.length}</span>
            <span className="metric-sub text-teal">Active CRM Directory</span>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon inventory-bg">
            <Package size={24} color="#14b8a6" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Catalog Products</span>
            <span className="metric-value">{products.length}</span>
            <span className="metric-sub">Across Warehouses</span>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon alert-bg">
            <AlertTriangle size={24} color="#f43f5e" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Low Stock Alerts</span>
            <span className="metric-value text-rose">{lowStockProducts.length}</span>
            <span className="metric-sub text-rose">Reorder Threshold Met</span>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon revenue-bg">
            <TrendingUp size={24} color="#f59e0b" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Confirmed Sales</span>
            <span className="metric-value">₹{totalRevenue.toLocaleString()}</span>
            <span className="metric-sub text-amber">{challans.length} Total Challans</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="dashboard-grid">
        {/* Recent Sales Challans */}
        <div className="glass-card grid-col-8">
          <div className="card-header-flex">
            <h3>Recent Sales Challans</h3>
            <Link to="/challans" className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {challans.slice(0, 5).map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <strong className="text-indigo">{ch.challan_number}</strong>
                    </td>
                    <td>
                      <div>{ch.customer_name || 'N/A'}</div>
                      <small className="text-muted">{ch.business_name}</small>
                    </td>
                    <td>
                      <span className={`badge badge-${ch.status.toLowerCase()}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td>
                      <strong>₹{Number(ch.total_amount || 0).toLocaleString()}</strong>
                    </td>
                    <td>
                      {new Date(ch.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {challans.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      No sales challans recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warning Sidebar */}
        <div className="glass-card grid-col-4">
          <div className="card-header-flex">
            <h3 className="text-rose">Low Stock Warning</h3>
            <Link to="/products" className="btn btn-secondary btn-sm">
              Restock
            </Link>
          </div>

          <div className="low-stock-list">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="low-stock-item">
                <div>
                  <div className="product-name">{p.name}</div>
                  <span className="product-sku">SKU: {p.sku} | Loc: {p.warehouse_location}</span>
                </div>
                <div className="stock-counter">
                  <span className="stock-num text-rose">{p.current_stock}</span>
                  <span className="stock-min">Min: {p.minimum_stock}</span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="empty-stock-state">
                <ShieldCheck size={36} color="#14b8a6" />
                <p>All stock levels are optimal!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .metric-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem 1.5rem;
        }
        .metric-icon {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .users-bg { background: rgba(99, 102, 241, 0.15); }
        .inventory-bg { background: rgba(20, 184, 166, 0.15); }
        .alert-bg { background: rgba(244, 63, 94, 0.15); }
        .revenue-bg { background: rgba(245, 158, 11, 0.15); }

        .metric-info {
          display: flex;
          flex-direction: column;
        }
        .metric-label {
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .metric-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
        }
        .metric-sub {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.2rem;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.5rem;
        }
        .grid-col-8 { grid-column: span 8; }
        .grid-col-4 { grid-column: span 4; }

        @media (max-width: 1024px) {
          .grid-col-8, .grid-col-4 { grid-column: span 12; }
        }

        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .low-stock-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .low-stock-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(244, 63, 94, 0.2);
          border-radius: 10px;
        }
        .product-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #f8fafc;
        }
        .product-sku {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .stock-counter {
          text-align: right;
        }
        .stock-num {
          font-weight: 800;
          font-size: 1.1rem;
          display: block;
        }
        .stock-min {
          font-size: 0.7rem;
          color: #64748b;
        }
        .empty-stock-state {
          text-align: center;
          padding: 2.5rem 1rem;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .text-indigo { color: #818cf8; }
        .text-teal { color: #14b8a6; }
        .text-rose { color: #f43f5e; }
        .text-amber { color: #f59e0b; }
        .loading-spinner-wrapper {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: #94a3b8;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

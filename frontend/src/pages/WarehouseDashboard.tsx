import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, ArrowRight, TrendingDown, Layers, MapPin } from 'lucide-react';
import { productAPI } from '../services/api';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';

export const WarehouseDashboard: React.FC = () => {
  const { user }    = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await productAPI.getProducts({ limit: 200 });
        if (res.data.success) setProducts(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const lowStock  = products.filter((p) => p.current_stock <= p.minimum_stock);
  const okStock   = products.filter((p) => p.current_stock >  p.minimum_stock);
  const locations = [...new Set(products.map((p) => p.warehouse_location).filter(Boolean))];

  if (loading) return <div className="loading-spinner-wrapper"><div className="spinner"></div><span>Loading Warehouse Dashboard...</span></div>;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Warehouse Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.name} — monitor inventory and stock levels</p>
        </div>
        <Link to="/products" className="btn btn-primary">
          <Package size={18} /><span>Manage Stock</span>
        </Link>
      </div>

      {/* KPIs */}
      <div className="metrics-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))' }}>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background:'rgba(20,184,166,0.15)' }}>
            <Layers size={24} color="#14b8a6" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total SKUs</span>
            <span className="metric-value">{products.length}</span>
            <span className="metric-sub" style={{ color:'#14b8a6' }}>Across {locations.length} locations</span>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background:'rgba(244,63,94,0.15)' }}>
            <AlertTriangle size={24} color="#f43f5e" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Low Stock Alerts</span>
            <span className="metric-value" style={{ color:'#f43f5e' }}>{lowStock.length}</span>
            <span className="metric-sub" style={{ color:'#f43f5e' }}>Below minimum threshold</span>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background:'rgba(99,102,241,0.15)' }}>
            <TrendingDown size={24} color="#6366f1" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Healthy Stock</span>
            <span className="metric-value">{okStock.length}</span>
            <span className="metric-sub">Items above reorder point</span>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background:'rgba(168,85,247,0.15)' }}>
            <MapPin size={24} color="#a855f7" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Warehouse Zones</span>
            <span className="metric-value">{locations.length}</span>
            <span className="metric-sub">Active storage locations</span>
          </div>
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="dashboard-grid">
        <div className="glass-card grid-col-8">
          <div className="card-header-flex">
            <h3 style={{ color:'#f43f5e' }}>⚠️ Low Stock Items</h3>
            <Link to="/products" className="btn btn-outline btn-sm">All Products <ArrowRight size={13} /></Link>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Location</th><th>Stock</th><th>Min</th><th>Status</th></tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td><strong style={{ color:'#f8fafc' }}>{p.name}</strong></td>
                    <td style={{ color:'#94a3b8', fontFamily:'monospace' }}>{p.sku}</td>
                    <td style={{ color:'#94a3b8' }}>{p.warehouse_location}</td>
                    <td><strong style={{ color:'#f43f5e' }}>{p.current_stock}</strong></td>
                    <td style={{ color:'#64748b' }}>{p.minimum_stock}</td>
                    <td>
                      {p.current_stock === 0
                        ? <span className="badge" style={{ background:'rgba(244,63,94,0.2)', color:'#f43f5e', border:'1px solid rgba(244,63,94,0.3)' }}>OUT OF STOCK</span>
                        : <span className="badge badge-draft">LOW</span>}
                    </td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'#14b8a6' }}>✅ All stock levels are healthy!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card grid-col-4">
          <div className="card-header-flex">
            <h3>Stock by Location</h3>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
            {locations.map((loc) => {
              const count = products.filter((p) => p.warehouse_location === loc).length;
              const low   = products.filter((p) => p.warehouse_location === loc && p.current_stock <= p.minimum_stock).length;
              return (
                <div key={loc} style={{ padding:'0.85rem', background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#f8fafc' }}>{loc}</div>
                      <div style={{ fontSize:'0.73rem', color:'#64748b' }}>{count} SKU{count !== 1 ? 's' : ''}</div>
                    </div>
                    {low > 0 && <span style={{ fontSize:'0.73rem', color:'#f43f5e', fontWeight:600 }}>{low} low</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .metrics-grid { display:grid; gap:1.25rem; margin-bottom:2rem; }
        .metric-card { display:flex; align-items:center; gap:1.25rem; padding:1.25rem 1.5rem; }
        .metric-icon { width:52px; height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .metric-info { display:flex; flex-direction:column; }
        .metric-label { font-size:0.78rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.03em; }
        .metric-value { font-size:1.6rem; font-weight:800; color:#fff; line-height:1.2; }
        .metric-sub { font-size:0.73rem; color:#64748b; margin-top:0.2rem; }
        .dashboard-grid { display:grid; grid-template-columns:repeat(12,1fr); gap:1.5rem; }
        .grid-col-8 { grid-column:span 8; }
        .grid-col-4 { grid-column:span 4; }
        @media(max-width:1024px){ .grid-col-8,.grid-col-4{ grid-column:span 12; } }
        .card-header-flex { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; }
        .loading-spinner-wrapper { min-height:60vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; color:#94a3b8; }
        .spinner { width:40px; height:40px; border:3px solid rgba(20,184,166,0.2); border-top-color:#14b8a6; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{ transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

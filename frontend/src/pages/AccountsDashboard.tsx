import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, TrendingUp, CheckCircle2, XCircle, ArrowRight, IndianRupee, Clock } from 'lucide-react';
import { challanAPI } from '../services/api';
import { Challan } from '../types';
import { useAuth } from '../context/AuthContext';

export const AccountsDashboard: React.FC = () => {
  const { user }    = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await challanAPI.getChallans();
        if (res.data.success) setChallans(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const confirmed  = challans.filter((c) => c.status === 'Confirmed');
  const cancelled  = challans.filter((c) => c.status === 'Cancelled');
  const draft      = challans.filter((c) => c.status === 'Draft');
  const revenue    = confirmed.reduce((s, c) => s + (c.total_amount || 0), 0);
  const cancelled$ = cancelled.reduce((s, c) => s + (c.total_amount || 0), 0);

  // Group by month for summary
  const monthlyMap: Record<string, number> = {};
  confirmed.forEach((c) => {
    const month = new Date(c.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyMap[month] = (monthlyMap[month] || 0) + (c.total_amount || 0);
  });
  const monthly = Object.entries(monthlyMap).slice(-6);

  if (loading) return <div className="loading-spinner-wrapper"><div className="spinner"></div><span>Loading Accounts Dashboard...</span></div>;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 Accounts Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.name} — financial overview of sales & challans</p>
        </div>
        <Link to="/challans" className="btn btn-primary">
          <FileText size={18} /><span>View Challans</span>
        </Link>
      </div>

      {/* KPIs */}
      <div className="metrics-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))' }}>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background:'rgba(245,158,11,0.15)' }}>
            <IndianRupee size={24} color="#f59e0b" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value" style={{ fontSize:'1.4rem' }}>₹{revenue.toLocaleString()}</span>
            <span className="metric-sub" style={{ color:'#f59e0b' }}>From confirmed challans</span>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background:'rgba(20,184,166,0.15)' }}>
            <CheckCircle2 size={24} color="#14b8a6" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Confirmed</span>
            <span className="metric-value">{confirmed.length}</span>
            <span className="metric-sub" style={{ color:'#14b8a6' }}>Challans settled</span>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background:'rgba(99,102,241,0.15)' }}>
            <Clock size={24} color="#6366f1" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Pending (Draft)</span>
            <span className="metric-value">{draft.length}</span>
            <span className="metric-sub">Awaiting confirmation</span>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background:'rgba(244,63,94,0.15)' }}>
            <XCircle size={24} color="#f43f5e" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Cancelled</span>
            <span className="metric-value">{cancelled.length}</span>
            <span className="metric-sub" style={{ color:'#f43f5e' }}>₹{cancelled$.toLocaleString()} voided</span>
          </div>
        </div>
      </div>

      {/* Ledger Table + Monthly Summary */}
      <div className="dashboard-grid">
        <div className="glass-card grid-col-8">
          <div className="card-header-flex">
            <h3>Challan Ledger</h3>
            <Link to="/challans" className="btn btn-outline btn-sm">Full Ledger <ArrowRight size={13} /></Link>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr><th>Challan No</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {challans.slice(0, 8).map((ch) => (
                  <tr key={ch.id}>
                    <td><strong style={{ color:'#818cf8' }}>{ch.challan_number}</strong></td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:'0.87rem' }}>{ch.customer_name || '—'}</div>
                      {ch.business_name && <small style={{ color:'#64748b' }}>{ch.business_name}</small>}
                    </td>
                    <td style={{ color:'#94a3b8', fontSize:'0.83rem' }}>{new Date(ch.created_at).toLocaleDateString()}</td>
                    <td><strong>₹{Number(ch.total_amount || 0).toLocaleString()}</strong></td>
                    <td><span className={`badge badge-${ch.status.toLowerCase()}`}>{ch.status}</span></td>
                  </tr>
                ))}
                {challans.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'#64748b' }}>No challans recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card grid-col-4">
          <div className="card-header-flex">
            <h3>Monthly Revenue</h3>
            <TrendingUp size={18} color="#f59e0b" />
          </div>
          {monthly.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
              {monthly.map(([month, amount]) => (
                <div key={month} style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem' }}>
                    <span style={{ color:'#94a3b8' }}>{month}</span>
                    <span style={{ color:'#f59e0b', fontWeight:700 }}>₹{amount.toLocaleString()}</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:4, height:6, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius:4, width:`${Math.min(100, (amount / revenue) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color:'#64748b', textAlign:'center', padding:'1.5rem' }}>No confirmed revenue yet.</p>
          )}
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
        .spinner { width:40px; height:40px; border:3px solid rgba(245,158,11,0.2); border-top-color:#f59e0b; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{ transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

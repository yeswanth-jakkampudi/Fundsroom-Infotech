import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus2, FileText, Users, TrendingUp, ArrowRight, PlusCircle, CheckCircle2, Clock
} from 'lucide-react';
import { customerAPI, challanAPI } from '../services/api';
import { Customer, Challan } from '../types';
import { useAuth } from '../context/AuthContext';

export const SalesDashboard: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [challans, setChallans]   = useState<Challan[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, chRes] = await Promise.all([
          customerAPI.getCustomers({ limit: 100 }),
          challanAPI.getChallans()
        ]);
        if (cRes.data.success)  setCustomers(cRes.data.data);
        if (chRes.data.success) setChallans(chRes.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const confirmed = challans.filter((c) => c.status === 'Confirmed');
  const draft     = challans.filter((c) => c.status === 'Draft');
  const revenue   = confirmed.reduce((s, c) => s + (c.total_amount || 0), 0);
  const leads     = customers.filter((c) => c.status === 'Lead');

  if (loading) return <div className="loading-spinner-wrapper"><div className="spinner"></div><span>Loading Sales Dashboard...</span></div>;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">💼 Sales Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} — track your pipeline and challans</p>
        </div>
        <Link to="/challans/new" className="btn btn-primary">
          <PlusCircle size={18} /><span>New Challan</span>
        </Link>
      </div>

      {/* KPIs */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))' }}>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(20,184,166,0.15)' }}>
            <TrendingUp size={24} color="#14b8a6" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Revenue (Confirmed)</span>
            <span className="metric-value">₹{revenue.toLocaleString()}</span>
            <span className="metric-sub" style={{ color: '#14b8a6' }}>{confirmed.length} confirmed challans</span>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <FileText size={24} color="#6366f1" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Draft Challans</span>
            <span className="metric-value">{draft.length}</span>
            <span className="metric-sub">Pending confirmation</span>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Users size={24} color="#f59e0b" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Customers</span>
            <span className="metric-value">{customers.filter(c => c.status === 'Active').length}</span>
            <span className="metric-sub">{leads.length} leads in pipeline</span>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="dashboard-grid">
        <div className="glass-card grid-col-7">
          <div className="card-header-flex">
            <h3>Recent Challans</h3>
            <Link to="/challans" className="btn btn-outline btn-sm">View All <ArrowRight size={13} /></Link>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr><th>Challan No</th><th>Customer</th><th>Status</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {challans.slice(0, 6).map((ch) => (
                  <tr key={ch.id}>
                    <td><strong style={{ color: '#818cf8' }}>{ch.challan_number}</strong></td>
                    <td>{ch.customer_name || '—'}</td>
                    <td>
                      <span className={`badge badge-${ch.status.toLowerCase()}`}>
                        {ch.status === 'Confirmed' ? <CheckCircle2 size={11} style={{marginRight:3}}/> : <Clock size={11} style={{marginRight:3}}/>}
                        {ch.status}
                      </span>
                    </td>
                    <td><strong>₹{Number(ch.total_amount || 0).toLocaleString()}</strong></td>
                  </tr>
                ))}
                {challans.length === 0 && <tr><td colSpan={4} style={{ textAlign:'center', padding:'2rem', color:'#64748b' }}>No challans yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card grid-col-5">
          <div className="card-header-flex">
            <h3>Lead Pipeline</h3>
            <Link to="/customers" className="btn btn-outline btn-sm">CRM <ArrowRight size={13} /></Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
            {leads.slice(0, 5).map((c) => (
              <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem', background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:'9px' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#f8fafc' }}>{c.name}</div>
                  <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{c.mobile || c.email || '—'}</div>
                </div>
                <span className="badge badge-lead">Lead</span>
              </div>
            ))}
            {leads.length === 0 && <p style={{ color:'#64748b', textAlign:'center', padding:'1.5rem' }}>No leads in pipeline.</p>}
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
        .grid-col-7 { grid-column:span 7; }
        .grid-col-5 { grid-column:span 5; }
        @media(max-width:1024px){ .grid-col-7,.grid-col-5{ grid-column:span 12; } }
        .card-header-flex { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; }
        .loading-spinner-wrapper { min-height:60vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; color:#94a3b8; }
        .spinner { width:40px; height:40px; border:3px solid rgba(99,102,241,0.2); border-top-color:#6366f1; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{ transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Eye, 
  CheckCircle2, 
  Printer, 
  X, 
  Building2, 
  UserCheck 
} from 'lucide-react';
import { challanAPI } from '../services/api';
import { Challan } from '../types';

export const ChallanList: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Selected Challan for Detailed View / Print Modal
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await challanAPI.getChallans(filterStatus ? { status: filterStatus } : undefined);
      if (res.data.success) {
        setChallans(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [filterStatus]);

  const handleOpenDetailModal = async (id: number) => {
    try {
      const res = await challanAPI.getChallanById(id);
      if (res.data.success) {
        setSelectedChallan(res.data.challan);
        setIsModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load challan details');
    }
  };

  const handleConfirmDraftChallan = async (id: number) => {
    if (!window.confirm('Are you sure you want to Confirm this Sales Challan? Stock inventory will be deducted.')) return;
    
    setIsConfirmingStatus(true);
    try {
      const res = await challanAPI.updateStatus(id, 'Confirmed');
      if (res.data.success) {
        alert(res.data.message);
        handleOpenDetailModal(id);
        fetchChallans();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm challan');
    } finally {
      setIsConfirmingStatus(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="challan-list-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans & Invoices</h1>
          <p className="page-subtitle">Manage issued delivery challans, item snapshots, and order confirmations</p>
        </div>
        <Link to="/challans/new" className="btn btn-primary">
          <Plus size={18} />
          <span>New Sales Challan</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card filter-card">
        <div className="filter-group">
          <span className="filter-label">Filter Status:</span>
          <div className="filter-chips">
            <button
              className={`filter-chip ${filterStatus === '' ? 'active' : ''}`}
              onClick={() => setFilterStatus('')}
            >
              All Challans
            </button>
            <button
              className={`filter-chip ${filterStatus === 'Confirmed' ? 'active confirmed' : ''}`}
              onClick={() => setFilterStatus('Confirmed')}
            >
              Confirmed
            </button>
            <button
              className={`filter-chip ${filterStatus === 'Draft' ? 'active draft' : ''}`}
              onClick={() => setFilterStatus('Draft')}
            >
              Draft
            </button>
            <button
              className={`filter-chip ${filterStatus === 'Cancelled' ? 'active cancelled' : ''}`}
              onClick={() => setFilterStatus('Cancelled')}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Challan No</th>
              <th>Customer</th>
              <th>Items Count</th>
              <th>Status</th>
              <th>Total Amount</th>
              <th>Issued By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading Challans...
                </td>
              </tr>
            ) : challans.map((ch) => (
              <tr key={ch.id}>
                <td>
                  <strong className="text-indigo">{ch.challan_number}</strong>
                </td>
                <td>
                  <div>{ch.customer_name || 'N/A'}</div>
                  {ch.business_name && <small className="text-muted">{ch.business_name}</small>}
                </td>
                <td>{ch.item_count || 1} items</td>
                <td>
                  <span className={`badge badge-${ch.status.toLowerCase()}`}>
                    {ch.status}
                  </span>
                </td>
                <td>
                  <strong>₹{Number(ch.total_amount || 0).toLocaleString()}</strong>
                </td>
                <td>{ch.created_by_name || 'System User'}</td>
                <td>{new Date(ch.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="icon-btn view"
                    onClick={() => handleOpenDetailModal(ch.id)}
                    title="View Challan Receipt & Snapshots"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && challans.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                  No sales challans recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Challan Detail / Printable Receipt Modal */}
      {isModalOpen && selectedChallan && (
        <div className="modal-overlay">
          <div className="modal-content lg printable-modal">
            <div className="modal-header no-print">
              <h3 className="modal-title">
                Delivery Challan: <strong className="text-indigo">{selectedChallan.challan_number}</strong>
              </h3>
              <div className="header-actions">
                <button className="btn btn-secondary btn-sm" onClick={handlePrintReceipt}>
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="receipt-container">
              <div className="receipt-header">
                <div>
                  <h2 className="receipt-brand">NEXUS ENTERPRISE ERP</h2>
                  <p className="receipt-subtitle">Delivery Challan & Item Snapshot</p>
                </div>
                <div className="receipt-meta">
                  <div className="receipt-no">{selectedChallan.challan_number}</div>
                  <div className="receipt-date">
                    Date: {new Date(selectedChallan.created_at).toLocaleString()}
                  </div>
                  <span className={`badge badge-${selectedChallan.status.toLowerCase()}`}>
                    {selectedChallan.status}
                  </span>
                </div>
              </div>

              <div className="receipt-parties">
                <div className="party-box">
                  <span className="party-label">Billed To (Customer):</span>
                  <strong className="party-name">{selectedChallan.customer_name}</strong>
                  {selectedChallan.business_name && (
                    <div className="party-detail">
                      <Building2 size={12} /> {selectedChallan.business_name}
                    </div>
                  )}
                  {selectedChallan.customer_gst && (
                    <div className="party-detail text-indigo">
                      GST: {selectedChallan.customer_gst}
                    </div>
                  )}
                  {selectedChallan.customer_address && (
                    <div className="party-detail">{selectedChallan.customer_address}</div>
                  )}
                  {selectedChallan.customer_mobile && (
                    <div className="party-detail">Ph: {selectedChallan.customer_mobile}</div>
                  )}
                </div>

                <div className="party-box">
                  <span className="party-label">Issued By:</span>
                  <strong className="party-name">Nexus Warehouse & Logistics Hub</strong>
                  <div className="party-detail">
                    <UserCheck size={12} /> Created By: {selectedChallan.created_by_name || 'System Administrator'}
                  </div>
                  <div className="party-detail">Status: {selectedChallan.status}</div>
                </div>
              </div>

              {/* Items Table Snapshot */}
              <div className="receipt-items-table">
                <table className="custom-table print-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Description (Snapshot)</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Unit Price (₹)</th>
                      <th>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedChallan.items || []).map((item, idx) => {
                      const itemAmount = item.qty * item.unit_price_snapshot;
                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{item.product_name_snapshot}</strong>
                          </td>
                          <td><code>{item.sku_snapshot}</code></td>
                          <td><strong>{item.qty}</strong></td>
                          <td>₹{Number(item.unit_price_snapshot).toLocaleString()}</td>
                          <td><strong>₹{itemAmount.toLocaleString()}</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Receipt Footer */}
              <div className="receipt-footer">
                <div className="terms-box">
                  <span>Authorized Signature & Seal</span>
                </div>
                <div className="receipt-total-box">
                  <span className="total-label">Grand Total:</span>
                  <span className="total-value">
                    ₹{Number(selectedChallan.total_amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions no-print">
              {selectedChallan.status === 'Draft' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleConfirmDraftChallan(selectedChallan.id)}
                  disabled={isConfirmingStatus}
                >
                  <CheckCircle2 size={18} />
                  <span>{isConfirmingStatus ? 'Confirming...' : 'Confirm & Deduct Stock'}</span>
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .filter-card {
          margin-bottom: 1.5rem;
          padding: 0.75rem 1.25rem;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .filter-label {
          font-size: 0.85rem;
          color: #94a3b8;
          font-weight: 600;
        }
        .filter-chips {
          display: flex;
          gap: 0.5rem;
        }
        .filter-chip {
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .filter-chip.active {
          color: #fff;
          background: #6366f1;
          border-color: #6366f1;
        }
        .filter-chip.active.confirmed { background: #14b8a6; border-color: #14b8a6; }
        .filter-chip.active.draft { background: #f59e0b; border-color: #f59e0b; }
        .filter-chip.active.cancelled { background: #f43f5e; border-color: #f43f5e; }

        /* Printable Receipt Styles */
        .receipt-container {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1rem;
        }
        .receipt-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 1rem;
          margin-bottom: 1.25rem;
        }
        .receipt-brand {
          font-size: 1.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.02em;
        }
        .receipt-subtitle {
          font-size: 0.8rem;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .receipt-meta {
          text-align: right;
        }
        .receipt-no {
          font-size: 1.2rem;
          font-weight: 800;
          color: #818cf8;
        }
        .receipt-date {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-bottom: 0.4rem;
        }
        .receipt-parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .party-box {
          background: rgba(30, 41, 59, 0.6);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.85rem;
        }
        .party-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .party-name {
          font-size: 1rem;
          color: #fff;
        }
        .party-detail {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          color: #cbd5e1;
        }
        .receipt-items-table {
          margin-bottom: 1.25rem;
        }
        .receipt-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .terms-box {
          font-size: 0.8rem;
          color: #64748b;
          border-top: 1px solid #64748b;
          padding-top: 0.25rem;
          min-width: 180px;
        }
        .receipt-total-box {
          text-align: right;
        }
        .total-label {
          font-size: 0.9rem;
          color: #94a3b8;
          margin-right: 0.5rem;
        }
        .total-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: #14b8a6;
        }

        @media print {
          .no-print, .sidebar, .top-navbar {
            display: none !important;
          }
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .modal-overlay {
            position: static !important;
            background: none !important;
          }
          .receipt-container {
            background: #fff !important;
            color: #000 !important;
            border: 1px solid #ccc !important;
          }
          .receipt-brand, .party-name, .total-value {
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
};

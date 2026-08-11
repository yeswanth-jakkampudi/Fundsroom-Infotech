import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  MessageSquarePlus, 
  Clock 
} from 'lucide-react';
import { customerAPI } from '../services/api';
import { Customer, Challan } from '../types';

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [challanHistory, setChallanHistory] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  // New follow up note state
  const [newNote, setNewNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchCustomerDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await customerAPI.getCustomerById(id);
      if (res.data.success) {
        setCustomer(res.data.customer);
        setChallanHistory(res.data.challanHistory || []);
        if (res.data.customer.follow_up_date) {
          setFollowUpDate(res.data.customer.follow_up_date);
        }
      }
    } catch (err) {
      console.error('Error loading customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await customerAPI.addFollowUp(id, {
        note: newNote,
        follow_up_date: followUpDate
      });

      if (res.data.success) {
        setCustomer(res.data.customer);
        setNewNote('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add follow-up note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner"></div>
        <span>Loading Customer Profile...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Customer Not Found</h2>
        <Link to="/customers" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="customer-details-page">
      <div className="page-header">
        <div className="header-left">
          <Link to="/customers" className="btn btn-secondary btn-sm back-btn">
            <ArrowLeft size={16} /> Back to Directory
          </Link>
          <div className="title-with-badge">
            <h1 className="page-title">{customer.name}</h1>
            <span className={`badge badge-${customer.status.toLowerCase()}`}>
              {customer.status}
            </span>
            <span className="badge badge-secondary">{customer.type}</span>
          </div>
        </div>

        <Link to="/challans/new" className="btn btn-primary">
          <FileText size={18} />
          <span>Create Challan for Customer</span>
        </Link>
      </div>

      <div className="details-grid">
        {/* Customer Profile Summary */}
        <div className="glass-card detail-card">
          <h3 className="card-subtitle">
            <Building2 size={18} color="#6366f1" /> Company Information
          </h3>

          <div className="info-list">
            <div className="info-item">
              <span className="info-label">Business Name:</span>
              <span className="info-value">{customer.business_name || 'N/A'}</span>
            </div>

            <div className="info-item">
              <span className="info-label">GST Number:</span>
              <span className="info-value text-indigo">{customer.gst || 'Not Provided'}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">
                <Phone size={14} color="#94a3b8" /> {customer.mobile || 'N/A'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">
                <Mail size={14} color="#94a3b8" /> {customer.email || 'N/A'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Address:</span>
              <span className="info-value">
                <MapPin size={14} color="#94a3b8" /> {customer.address || 'N/A'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Next Scheduled Follow-up:</span>
              <span className="info-value text-amber">
                <Calendar size={14} color="#f59e0b" /> {customer.follow_up_date || 'No Date Set'}
              </span>
            </div>
          </div>
        </div>

        {/* Challans Order History */}
        <div className="glass-card detail-card">
          <h3 className="card-subtitle">
            <FileText size={18} color="#14b8a6" /> Sales Challans History
          </h3>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {challanHistory.map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <strong className="text-indigo">{ch.challan_number}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${ch.status.toLowerCase()}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td>₹{Number(ch.total_amount).toLocaleString()}</td>
                    <td>{new Date(ch.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {challanHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No past challans recorded for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Follow-up Notes Section */}
      <div className="glass-card followups-section">
        <h3 className="card-subtitle">
          <MessageSquarePlus size={18} color="#f59e0b" /> Follow-up Notes & Interactions
        </h3>

        {/* Add Note Form */}
        <form onSubmit={handleAddFollowUp} className="add-note-form">
          <div className="note-form-grid">
            <div className="form-group flex-2">
              <label className="form-label">Add Follow-up Note / Meeting Summary</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Log conversation details, requirements, next action items..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Next Follow-up Date</label>
              <input
                type="date"
                className="form-control"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary submit-note-btn"
                disabled={isSubmittingNote}
              >
                <Clock size={16} />
                <span>{isSubmittingNote ? 'Saving...' : 'Add Log'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Notes Timeline Box */}
        <div className="notes-timeline-container">
          <label className="form-label">Interaction History Log:</label>
          <div className="notes-box">
            {customer.notes ? (
              customer.notes.split('\n').map((line, idx) => (
                <div key={idx} className="note-timeline-item">
                  <span className="timeline-dot"></span>
                  <p className="note-text">{line}</p>
                </div>
              ))
            ) : (
              <p className="text-muted">No follow-up notes logged yet.</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .header-left {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .title-with-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 900px) {
          .details-grid { grid-template-columns: 1fr; }
        }
        .card-subtitle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .info-label {
          color: #94a3b8;
        }
        .info-value {
          font-weight: 600;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .add-note-form {
          margin-bottom: 1.5rem;
        }
        .note-form-grid {
          display: flex;
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .note-form-grid { flex-direction: column; }
        }
        .flex-2 { flex: 2; }
        .flex-1 { flex: 1; }
        .submit-note-btn {
          width: 100%;
          margin-top: 0.75rem;
          justify-content: center;
        }
        .notes-timeline-container {
          margin-top: 1rem;
        }
        .notes-box {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 1.25rem;
          max-height: 250px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .note-timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .timeline-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6366f1;
          margin-top: 0.4rem;
          flex-shrink: 0;
        }
        .note-text {
          font-size: 0.88rem;
          color: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

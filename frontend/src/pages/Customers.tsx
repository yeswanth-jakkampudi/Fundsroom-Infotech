import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Phone, 
  Mail, 
  Building2, 
  X 
} from 'lucide-react';
import { customerAPI } from '../services/api';
import { Customer, Pagination } from '../types';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    business_name: '',
    gst: '',
    type: 'B2B',
    address: '',
    status: 'Active',
    follow_up_date: '',
    notes: ''
  });

  const fetchCustomers = async (page = 1, search = searchQuery) => {
    setLoading(true);
    try {
      const res = await customerAPI.getCustomers({ page, limit: 10, search });
      if (res.data.success) {
        setCustomers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, searchQuery);
  }, [searchQuery]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        business_name: customer.business_name || '',
        gst: customer.gst || '',
        type: customer.type || 'B2B',
        address: customer.address || '',
        status: customer.status || 'Active',
        follow_up_date: customer.follow_up_date || '',
        notes: customer.notes || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        business_name: '',
        gst: '',
        type: 'B2B',
        address: '',
        status: 'Active',
        follow_up_date: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerAPI.updateCustomer(editingCustomer.id, formData);
      } else {
        await customerAPI.createCustomer(formData);
      }
      setIsModalOpen(false);
      fetchCustomers(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save customer');
    }
  };

  return (
    <div className="customers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer CRM Directory</h1>
          <p className="page-subtitle">Manage customer profiles, lead pipelines, GST info, and follow-ups</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card search-bar-card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by name, mobile, email, or business name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Business & GST</th>
              <th>Contact Info</th>
              <th>Type</th>
              <th>Status</th>
              <th>Next Follow-up</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading Customers...
                </td>
              </tr>
            ) : customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong className="text-white">{c.name}</strong>
                </td>
                <td>
                  <div className="flex-center-gap">
                    <Building2 size={14} color="#94a3b8" />
                    <span>{c.business_name || 'N/A'}</span>
                  </div>
                  {c.gst && <small className="text-muted">GST: {c.gst}</small>}
                </td>
                <td>
                  {c.mobile && (
                    <div className="flex-center-gap text-subtle">
                      <Phone size={13} /> <span>{c.mobile}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex-center-gap text-subtle">
                      <Mail size={13} /> <span>{c.email}</span>
                    </div>
                  )}
                </td>
                <td>
                  <span className="badge badge-secondary">{c.type}</span>
                </td>
                <td>
                  <span className={`badge badge-${c.status.toLowerCase()}`}>
                    {c.status}
                  </span>
                </td>
                <td>
                  {c.follow_up_date ? (
                    <span className="follow-up-badge">{c.follow_up_date}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <Link
                      to={`/customers/${c.id}`}
                      className="icon-btn view"
                      title="View Details & Notes"
                    >
                      <Eye size={16} />
                    </Link>
                    <button
                      className="icon-btn edit"
                      onClick={() => handleOpenModal(c)}
                      title="Edit Customer"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  No customers found matching search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-container">
        <span>
          Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
        </span>
        <div className="pagination-controls">
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchCustomers(pagination.page - 1)}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchCustomers(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content lg">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Business / Company Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Apex Tech Solutions"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="contact@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="27AAACA1234A1Z5"
                    value={formData.gst}
                    onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select
                    className="form-control"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="B2B">B2B (Enterprise)</option>
                    <option value="B2C">B2C (Retail)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Pipeline Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Lead">Lead</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Next Follow-up Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Street, City, State, Pincode"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Notes & Requirements</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Special instructions, requirement summary..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .search-bar-card {
          margin-bottom: 1.5rem;
          padding: 0.75rem 1.25rem;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
        }
        .search-input {
          padding-left: 2.75rem;
          width: 100%;
        }
        .flex-center-gap {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
        }
        .follow-up-badge {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          transition: all 0.2s ease;
        }
        .icon-btn.view:hover {
          color: #6366f1;
          background: rgba(99, 102, 241, 0.15);
        }
        .icon-btn.edit:hover {
          color: #14b8a6;
          background: rgba(20, 184, 166, 0.15);
        }
        .modal-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .modal-form-grid { grid-template-columns: 1fr; }
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
};

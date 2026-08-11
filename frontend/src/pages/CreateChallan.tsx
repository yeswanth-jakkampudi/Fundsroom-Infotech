import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FilePlus2, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  Calculator 
} from 'lucide-react';
import { customerAPI, productAPI, challanAPI } from '../services/api';
import { Customer, Product } from '../types';

interface LineItemRow {
  productId: number;
  qty: number;
}

export const CreateChallan: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [lineItems, setLineItems] = useState<LineItemRow[]>([{ productId: 0, qty: 1 }]);
  const [status, setStatus] = useState<'Draft' | 'Confirmed'>('Confirmed');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          customerAPI.getCustomers({ limit: 100 }),
          productAPI.getProducts({ limit: 100 })
        ]);

        if (cRes.data.success) setCustomers(cRes.data.data);
        if (pRes.data.success) setProducts(pRes.data.data);
      } catch (err) {
        console.error('Error loading customers or products:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const productMap = new Map<number, Product>();
  products.forEach((p) => productMap.set(p.id, p));

  const handleAddItem = () => {
    setLineItems([...lineItems, { productId: 0, qty: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemRow, value: number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
    setErrorMsg(null);
  };

  // Calculate Subtotal & Total
  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const prod = productMap.get(item.productId);
      return sum + (prod ? prod.unit_price * (item.qty || 0) : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer for this sales challan');
      return;
    }

    // Validate line items
    const validItems = lineItems.filter((i) => i.productId > 0 && i.qty > 0);
    if (validItems.length === 0) {
      setErrorMsg('Please select at least one valid product and quantity');
      return;
    }

    // Client-side stock check for Confirmed status
    if (status === 'Confirmed') {
      for (const item of validItems) {
        const p = productMap.get(item.productId);
        if (p && p.current_stock < item.qty) {
          setErrorMsg(
            `Insufficient stock for product '${p.name}'. Requested: ${item.qty}, Available: ${p.current_stock}. Stock cannot go negative!`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await challanAPI.createChallan({
        customerId: Number(selectedCustomerId),
        items: validItems,
        status
      });

      if (res.data.success) {
        navigate('/challans');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create sales challan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner"></div>
        <span>Loading Form Dependencies...</span>
      </div>
    );
  }

  const selectedCustomerObj = customers.find((c) => c.id === Number(selectedCustomerId));

  return (
    <div className="create-challan-page">
      <div className="page-header">
        <div>
          <Link to="/challans" className="btn btn-secondary btn-sm back-btn" style={{ marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Challans
          </Link>
          <h1 className="page-title">Generate New Sales Challan</h1>
          <p className="page-subtitle">Select customer, add products, verify stock availability, and issue challan</p>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="create-challan-grid">
          {/* Left Column: Customer & Details */}
          <div className="glass-card">
            <h3 className="card-section-title">1. Customer Selection</h3>
            
            <div className="form-group">
              <label className="form-label">Select Customer *</label>
              <select
                className="form-control"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.business_name ? `(${c.business_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerObj && (
              <div className="customer-preview-box">
                <div className="preview-row">
                  <span className="text-muted">Business:</span>
                  <strong>{selectedCustomerObj.business_name || 'N/A'}</strong>
                </div>
                <div className="preview-row">
                  <span className="text-muted">GST No:</span>
                  <strong className="text-indigo">{selectedCustomerObj.gst || 'N/A'}</strong>
                </div>
                <div className="preview-row">
                  <span className="text-muted">Contact:</span>
                  <span>{selectedCustomerObj.mobile || selectedCustomerObj.email || 'N/A'}</span>
                </div>
                <div className="preview-row">
                  <span className="text-muted">Address:</span>
                  <span>{selectedCustomerObj.address || 'N/A'}</span>
                </div>
              </div>
            )}

            <div className="status-toggle-section">
              <h3 className="card-section-title" style={{ marginTop: '1.5rem' }}>2. Challan Issue Status</h3>
              <div className="status-options">
                <label className={`status-option-card ${status === 'Confirmed' ? 'selected confirmed' : ''}`}>
                  <input
                    type="radio"
                    name="status"
                    value="Confirmed"
                    checked={status === 'Confirmed'}
                    onChange={() => setStatus('Confirmed')}
                  />
                  <div>
                    <div className="status-option-title flex-center-gap">
                      <CheckCircle2 size={16} color="#14b8a6" /> Confirmed Dispatch
                    </div>
                    <small className="status-option-desc">Immediately checks & deducts stock inventory.</small>
                  </div>
                </label>

                <label className={`status-option-card ${status === 'Draft' ? 'selected draft' : ''}`}>
                  <input
                    type="radio"
                    name="status"
                    value="Draft"
                    checked={status === 'Draft'}
                    onChange={() => setStatus('Draft')}
                  />
                  <div>
                    <div className="status-option-title flex-center-gap">
                      <FilePlus2 size={16} color="#f59e0b" /> Draft Quotation
                    </div>
                    <small className="status-option-desc">Saves without deducting stock until confirmed.</small>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Line Items Selector */}
          <div className="glass-card">
            <div className="card-header-flex">
              <h3 className="card-section-title">3. Add Products & Quantities</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItem}
              >
                <Plus size={16} /> Add Line Item
              </button>
            </div>

            <div className="line-items-container">
              {lineItems.map((item, idx) => {
                const selectedProd = productMap.get(item.productId);
                const isStockInsufficient = selectedProd && status === 'Confirmed' && item.qty > selectedProd.current_stock;
                const rowTotal = selectedProd ? selectedProd.unit_price * item.qty : 0;

                return (
                  <div key={idx} className={`line-item-row ${isStockInsufficient ? 'stock-warning' : ''}`}>
                    <div className="form-group flex-3">
                      <label className="form-label">Product #{idx + 1}</label>
                      <select
                        className="form-control"
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', Number(e.target.value))}
                        required
                      >
                        <option value={0}>-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (SKU: {p.sku}) — Stock: {p.current_stock}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group flex-1">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                        required
                      />
                    </div>

                    <div className="form-group flex-1 price-column">
                      <label className="form-label">Subtotal</label>
                      <span className="item-subtotal">₹{rowTotal.toLocaleString()}</span>
                    </div>

                    <button
                      type="button"
                      className="remove-row-btn"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={lineItems.length === 1}
                      title="Remove Row"
                    >
                      <Trash2 size={16} />
                    </button>

                    {selectedProd && (
                      <div className="stock-info-row">
                        <span className="text-muted">Unit Price: ₹{selectedProd.unit_price.toLocaleString()}</span> | 
                        <span className={selectedProd.current_stock < 5 ? 'text-rose' : 'text-teal'}>
                          Available Stock: {selectedProd.current_stock} units
                        </span>
                        {isStockInsufficient && (
                          <span className="stock-error-text"> (Exceeds available stock!)</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total Summary Footer */}
            <div className="challan-total-summary">
              <div className="summary-left">
                <Calculator size={20} color="#6366f1" />
                <span>Challan Grand Total:</span>
              </div>
              <div className="summary-right">
                <span className="grand-total-amount">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary submit-challan-btn"
              disabled={isSubmitting}
            >
              <CheckCircle2 size={18} />
              <span>{isSubmitting ? 'Processing Challan...' : `Issue ${status} Sales Challan`}</span>
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .create-challan-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 960px) {
          .create-challan-grid { grid-template-columns: 1fr; }
        }
        .card-section-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          color: #f8fafc;
        }
        .customer-preview-box {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 1rem;
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.85rem;
        }
        .preview-row {
          display: flex;
          justify-content: space-between;
        }
        .status-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .status-option-card {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.85rem;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .status-option-card.selected.confirmed {
          border-color: #14b8a6;
          background: rgba(20, 184, 166, 0.1);
        }
        .status-option-card.selected.draft {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }
        .status-option-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: #fff;
        }
        .status-option-desc {
          color: #94a3b8;
          font-size: 0.78rem;
        }
        .line-items-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .line-item-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }
        .line-item-row.stock-warning {
          border-color: rgba(244, 63, 94, 0.5);
          background: rgba(244, 63, 94, 0.08);
        }
        .flex-3 { flex: 3; }
        .flex-1 { flex: 1; }
        .price-column {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .item-subtotal {
          font-weight: 700;
          font-size: 0.95rem;
          color: #fff;
          padding-top: 0.5rem;
        }
        .remove-row-btn {
          background: rgba(244, 63, 94, 0.15);
          color: #f43f5e;
          border: 1px solid rgba(244, 63, 94, 0.3);
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1.25rem;
        }
        .remove-row-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .stock-info-row {
          width: 100%;
          font-size: 0.8rem;
          padding-top: 0.4rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 0.5rem;
        }
        .stock-error-text {
          color: #f87171;
          font-weight: 700;
        }
        .challan-total-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        .summary-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 1rem;
          font-weight: 700;
        }
        .grand-total-amount {
          font-size: 1.6rem;
          font-weight: 800;
          color: #fff;
        }
        .submit-challan-btn {
          width: 100%;
          justify-content: center;
          padding: 0.85rem;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  AlertCircle, 
  History, 
  X, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { productAPI } from '../services/api';
import { Product, StockMovement, Pagination } from '../types';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    unit_price: '',
    current_stock: '',
    minimum_stock: '5',
    warehouse_location: 'Aisle A-1',
    reason: ''
  });

  // Stock Movement Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [stockLogs, setStockLogs] = useState<StockMovement[]>([]);

  const fetchProducts = async (page = 1, search = searchQuery) => {
    setLoading(true);
    try {
      const res = await productAPI.getProducts({ page, limit: 10, search });
      if (res.data.success) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, searchQuery);
  }, [searchQuery]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category || 'General',
        unit_price: String(product.unit_price),
        current_stock: String(product.current_stock),
        minimum_stock: String(product.minimum_stock),
        warehouse_location: product.warehouse_location || 'Storage',
        reason: 'Stock Audit Update'
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        category: 'Electronics',
        unit_price: '',
        current_stock: '10',
        minimum_stock: '5',
        warehouse_location: 'Rack A-1',
        reason: 'Initial Product Setup'
      });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct.id, formData);
      } else {
        await productAPI.createProduct(formData);
      }
      setIsModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleOpenStockLogs = async () => {
    try {
      const res = await productAPI.getStockMovements();
      if (res.data.success) {
        setStockLogs(res.data.data);
        setIsLogModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load stock movements:', err);
    }
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product & Inventory Catalog</h1>
          <p className="page-subtitle">Track stock movements, reorder thresholds, pricing, and warehouse locations</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleOpenStockLogs}>
            <History size={18} />
            <span>Stock Movement Logs</span>
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card search-bar-card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by product name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Current Stock</th>
              <th>Min Stock</th>
              <th>Warehouse Loc</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading Products...
                </td>
              </tr>
            ) : products.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="sku-badge">{p.sku}</span>
                </td>
                <td>
                  <strong className="text-white">{p.name}</strong>
                </td>
                <td>
                  <span className="badge badge-secondary">{p.category}</span>
                </td>
                <td>
                  <strong>₹{Number(p.unit_price).toLocaleString()}</strong>
                </td>
                <td>
                  <div className="flex-center-gap">
                    <strong className={p.is_low_stock ? 'text-rose' : 'text-white'}>
                      {p.current_stock}
                    </strong>
                    {p.is_low_stock && (
                      <span className="badge badge-low-stock">Low Stock</span>
                    )}
                  </div>
                </td>
                <td className="text-muted">{p.minimum_stock}</td>
                <td>{p.warehouse_location}</td>
                <td>
                  <button
                    className="icon-btn edit"
                    onClick={() => handleOpenModal(p)}
                    title="Edit Product / Adjust Stock"
                  >
                    <Edit3 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                  No products found in inventory.
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
            onClick={() => fetchProducts(pagination.page - 1)}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchProducts(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content lg">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? `Update Product - ${editingProduct.name}` : 'Add New Product'}
              </h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-form-grid">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ergonomic Office Chair"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SKU (Stock Keeping Unit) *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. FUR-CHAIR-01"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Electronics, Furniture"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="4999.00"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Current Available Stock *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Minimum Reorder Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Warehouse Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Aisle A-12, Rack 4"
                    value={formData.warehouse_location}
                    onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
                  />
                </div>

                {editingProduct && (
                  <div className="form-group">
                    <label className="form-label">Reason for Stock Adjustment</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Physical inventory audit"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                )}
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Log Modal */}
      {isLogModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content lg">
            <div className="modal-header">
              <h3 className="modal-title">
                <History size={20} color="#14b8a6" /> Inventory Movement Audit Log
              </h3>
              <button className="close-btn" onClick={() => setIsLogModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Qty Change</th>
                    <th>Reason</th>
                    <th>Logged By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <strong>{log.product_name || `Product #${log.product_id}`}</strong>
                        {log.product_sku && (
                          <small className="text-muted" style={{ display: 'block' }}>
                            {log.product_sku}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${log.movement_type.toLowerCase()}`}>
                          {log.movement_type === 'IN' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {log.movement_type}
                        </span>
                      </td>
                      <td>
                        <strong className={log.movement_type === 'IN' ? 'text-teal' : 'text-rose'}>
                          {log.movement_type === 'IN' ? `+${log.quantity_change}` : `-${log.quantity_change}`}
                        </strong>
                      </td>
                      <td>{log.reason}</td>
                      <td>{log.user_name || 'System'}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                  {stockLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                        No stock movement logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsLogModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .header-actions {
          display: flex;
          gap: 0.75rem;
        }
        .sku-badge {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

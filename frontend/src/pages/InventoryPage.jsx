import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../api/inventoryApi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

const TEA_TYPES = ['Black', 'Green', 'White', 'Oolong', 'Herbal', 'CTC', 'Orthodox'];
const GRADES = ['BOPF', 'BOP', 'OP', 'FBOP', 'Pekoe', 'Dust', 'Fannings', 'Silver Tips', 'Golden Tips'];
const STATUSES = ['In Stock', 'Low Stock', 'Out of Stock', 'Processing', 'Dispatched'];

const empty = {
  batchId: '', teaType: '', grade: '', quantity: '', unit: 'kg',
  pricePerUnit: '', harvestDate: '', expiryDate: '', fieldSection: '', status: 'In Stock', notes: '',
};

const statusStyle = {
  'In Stock': 'bg-secondary-container/30 text-on-secondary-container',
  'Low Stock': 'bg-yellow-100 text-yellow-800',
  'Out of Stock': 'bg-red-100 text-red-800',
  'Processing': 'bg-surface-variant text-on-surface-variant',
  'Dispatched': 'bg-primary-container/20 text-on-primary-container',
};

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterType) params.teaType = filterType;
      if (filterStatus) params.status = filterStatus;
      const { data } = await inventoryAPI.getAll(params);
      setItems(data.data);
    } catch { toast.error('Failed to load inventory'); }
    setLoading(false);
  }, [search, filterType, filterStatus]);

  const fetchStats = async () => {
    try { const { data } = await inventoryAPI.getStats(); setStats(data.data); } catch {}
  };

  useEffect(() => { fetchItems(); fetchStats(); }, [fetchItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await inventoryAPI.update(editing, form); toast.success('Updated!'); }
      else { await inventoryAPI.create(form); toast.success('Batch added!'); }
      setForm(empty); setEditing(null); setShowForm(false);
      fetchItems(); fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed');
    }
  };

  const handleEdit = (item) => {
    setForm({ batchId: item.batchId, teaType: item.teaType, grade: item.grade, quantity: item.quantity, unit: item.unit, pricePerUnit: item.pricePerUnit, harvestDate: item.harvestDate?.slice(0,10)||'', expiryDate: item.expiryDate?.slice(0,10)||'', fieldSection: item.fieldSection||'', status: item.status, notes: item.notes||'' });
    setEditing(item._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await inventoryAPI.remove(deleteId);
      toast.success('Deleted');
      setShowDeleteConfirm(false);
      setDeleteId(null);
      fetchItems();
      fetchStats();
    } catch {
      toast.error('Delete failed');
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-primary">Inventory Management</h1>
          <p className="text-on-surface-variant mt-1">Oversee batch processing and warehouse storage levels.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if(showForm){setForm(empty);setEditing(null);} }}
          className="px-6 py-3 bg-gradient-to-br from-secondary to-primary text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'Record New Batch'}
        </button>
      </div>

      {/* Stats */}
      {stats?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Batches', value: stats.summary.totalBatches, icon: 'inventory_2' },
            { label: 'Total Stock', value: `${stats.summary.totalQuantity?.toLocaleString()} kg`, icon: 'grass' },
            { label: 'Total Value', value: `₹${stats.summary.totalValue?.toLocaleString()}`, icon: 'payments' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-on-surface-variant text-sm font-semibold">{s.label}</p>
                <span className="material-symbols-outlined text-xl text-primary/60">{s.icon}</span>
              </div>
              <span className="font-headline text-2xl font-semibold text-primary">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-8 shadow-lg">
          <h2 className="font-headline text-xl font-semibold text-primary mb-4">{editing ? 'Edit Batch' : 'Record New Batch'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name:'batchId', label:'Batch ID *', type:'text', placeholder:'BTH-2026-001', disabled:!!editing },
              { name:'quantity', label:'Quantity *', type:'number', placeholder:'0' },
              { name:'pricePerUnit', label:'Price/Unit (₹) *', type:'number', placeholder:'0.00' },
              { name:'harvestDate', label:'Harvest Date *', type:'date' },
              { name:'expiryDate', label:'Expiry Date', type:'date' },
              { name:'fieldSection', label:'Field Section', type:'text', placeholder:'Section A-3' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">{f.label}</label>
                <input name={f.name} type={f.type} value={form[f.name]} onChange={e => setForm({...form,[e.target.name]:e.target.value})}
                  required={f.label.includes('*')} disabled={f.disabled} placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low/50 text-sm text-on-surface focus:outline-none focus:border-primary transition-all disabled:opacity-50" />
              </div>
            ))}
            {[
              { name:'teaType', label:'Tea Type *', opts:TEA_TYPES },
              { name:'grade', label:'Grade *', opts:GRADES },
              { name:'unit', label:'Unit', opts:['kg','g','lb'] },
              { name:'status', label:'Status', opts:STATUSES },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">{f.label}</label>
                <select name={f.name} value={form[f.name]} onChange={e => setForm({...form,[e.target.name]:e.target.value})} required={f.label.includes('*')}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low/50 text-sm text-on-surface focus:outline-none focus:border-primary transition-all">
                  {!form[f.name] && <option value="">Select...</option>}
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Notes</label>
              <textarea name="notes" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low/50 text-sm text-on-surface focus:outline-none focus:border-primary transition-all resize-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="px-6 py-3 bg-gradient-to-br from-secondary to-primary text-white rounded-full font-semibold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95">
                {editing ? 'Update Batch' : 'Add Batch'}
              </button>
              <button type="button" onClick={() => {setShowForm(false);setForm(empty);setEditing(null);}}
                className="px-6 py-3 bg-surface-container text-on-surface rounded-full font-semibold text-sm hover:bg-surface-container-high transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xl shadow-primary/5">
        <div className="p-4 border-b border-outline-variant/20 flex flex-wrap gap-3 items-center bg-surface-container-low/50">
          <h3 className="font-headline text-xl font-semibold text-primary flex-1">Inventory Batches</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search batch ID..."
              className="pl-9 pr-4 py-2 bg-surface-container rounded-full border-none text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)}
            className="px-3 py-2 bg-surface-container rounded-full border-none text-sm focus:outline-none">
            <option value="">All Types</option>
            {TEA_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-surface-container rounded-full border-none text-sm focus:outline-none">
            <option value="">All Status</option>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-lowest/50">
                {['Batch ID','Type','Grade','Qty','Price/Unit','Value','Status','Harvest','Actions'].map(h=>(
                  <th key={h} className="px-6 py-4 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl text-outline mb-2 block">inventory_2</span>
                  No batches yet. Click "Record New Batch" to add one.
                </td></tr>
              ) : items.map(item => (
                <tr key={item._id} className="hover:bg-surface-container-lowest/40 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-primary">{item.batchId}</div>
                    <div className="text-xs text-on-surface-variant">{new Date(item.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"/>{item.teaType}</div>
                  </td>
                  <td className="px-6 py-5 text-on-surface-variant">{item.grade}</td>
                  <td className="px-6 py-5 font-medium">{item.quantity} {item.unit}</td>
                  <td className="px-6 py-5 text-on-surface-variant">₹{item.pricePerUnit}</td>
                  <td className="px-6 py-5 font-bold text-primary">₹{item.totalValue?.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[item.status]||'bg-surface-variant text-on-surface-variant'}`}>{item.status}</span>
                  </td>
                  <td className="px-6 py-5 text-on-surface-variant">{new Date(item.harvestDate).toLocaleDateString()}</td>
                  <td className="px-6 py-5">
                    <div className="flex gap-1">
                      <button onClick={()=>handleEdit(item)} className="p-2 rounded-lg hover:bg-secondary-container/30 text-secondary transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={()=>handleDelete(item._id)} className="p-2 rounded-lg hover:bg-red-50 text-error transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-surface-container-lowest/30 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">Showing {items.length} batches</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Batch"
        message="Are you sure you want to delete this batch? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}

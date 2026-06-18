import { useState, useEffect, useCallback } from 'react';
import { salesAPI } from '../api/salesApi';
import toast from 'react-hot-toast';

const TEA_TYPES = ['Black', 'Green', 'White', 'Oolong', 'Herbal', 'CTC', 'Orthodox'];
const STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
const getEmptyForm = () => ({ 
  orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000), 
  buyerName: '', teaType: '', quantity: '', pricePerUnit: '', orderDate: '', status: 'Pending', notes: '' 
});

const statusStyle = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Shipped': 'bg-primary-container/20 text-on-primary-container',
  'Delivered': 'bg-secondary-container/30 text-on-secondary-container',
  'Cancelled': 'bg-red-100 text-red-800',
};

export default function SalesPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(getEmptyForm());
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [invoice, setInvoice] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const { data } = await salesAPI.getAll(params);
      setItems(data.data);
    } catch { toast.error('Failed to load sales data'); }
    setLoading(false);
  }, [search, filterStatus]);

  const fetchStats = async () => {
    try { const { data } = await salesAPI.getStats(); setStats(data.data); } catch {}
  };

  useEffect(() => { fetchItems(); fetchStats(); }, [fetchItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await salesAPI.update(editing, form); toast.success('Order updated!'); }
      else { await salesAPI.create(form); toast.success('Order created!'); }
      setForm(getEmptyForm()); setEditing(null); setShowForm(false);
      fetchItems(); fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed');
    }
  };

  const handleEdit = (item) => {
    setForm({ 
      orderId: item.orderId, 
      buyerName: item.buyerName, 
      teaType: item.teaType, 
      quantity: item.quantity, 
      pricePerUnit: item.pricePerUnit, 
      orderDate: item.orderDate?.slice(0, 10) || '', 
      status: item.status, 
      notes: item.notes || '' 
    });
    setEditing(item._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try { await salesAPI.remove(id); toast.success('Deleted'); fetchItems(); fetchStats(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="relative">
      {/* Invoice Modal Template */}
      {invoice && (
        <div className="fixed inset-0 z-[100] bg-surface/90 backdrop-blur-sm flex justify-center items-start overflow-y-auto print:bg-white print:static print:h-auto print:block">
          <div className="bg-white text-black w-full max-w-3xl my-8 p-10 rounded-2xl shadow-2xl relative print:shadow-none print:m-0 print:p-0 print:rounded-none">
            
            {/* Modal Controls (Hidden when printing) */}
            <div className="absolute top-4 right-4 flex gap-2 print:hidden">
              <button onClick={handlePrint} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary/90 font-semibold text-sm transition-all">
                <span className="material-symbols-outlined text-sm">print</span> Print / Save PDF
              </button>
              <button onClick={() => setInvoice(null)} className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Invoice Content */}
            <div className="print:w-full">
              <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-1">
                    <span className="material-symbols-outlined text-3xl">eco</span>
                    TEAnest Estate
                  </div>
                  <p className="text-gray-500 text-sm">123 Highland Ridge</p>
                  <p className="text-gray-500 text-sm">Darjeeling, West Bengal 734101</p>
                  <p className="text-gray-500 text-sm">contact@teanest.com</p>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-light text-gray-800 mb-2 uppercase tracking-widest">Invoice</h2>
                  <p className="text-sm text-gray-500 font-semibold">INV-{invoice.orderId}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(invoice.orderDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex justify-between mb-10">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To:</p>
                  <p className="font-bold text-gray-800 text-lg">{invoice.buyerName}</p>
                  <p className="text-sm text-gray-500">Client / Distributor</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status:</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    invoice.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    invoice.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{invoice.status}</span>
                </div>
              </div>

              <table className="w-full mb-8 text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800 text-gray-800">
                    <th className="py-3 font-semibold text-sm uppercase tracking-wider">Description</th>
                    <th className="py-3 font-semibold text-sm uppercase tracking-wider text-right">Quantity</th>
                    <th className="py-3 font-semibold text-sm uppercase tracking-wider text-right">Price/kg</th>
                    <th className="py-3 font-semibold text-sm uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-4">
                      <p className="font-bold text-gray-800">{invoice.teaType} Tea</p>
                      <p className="text-xs text-gray-500">Premium Estate Harvest</p>
                    </td>
                    <td className="py-4 text-right text-gray-700">{invoice.quantity} kg</td>
                    <td className="py-4 text-right text-gray-700">₹{invoice.pricePerUnit.toLocaleString()}</td>
                    <td className="py-4 text-right font-bold text-gray-800">₹{invoice.totalAmount?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end mb-16">
                <div className="w-1/2">
                  <div className="flex justify-between py-2 text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{invoice.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200">
                    <span>Tax (0%)</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex justify-between py-4 text-xl font-bold text-gray-800">
                    <span>Total Due</span>
                    <span className="text-primary">₹{invoice.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-center text-xs text-gray-400">Thank you for your business. For any queries regarding this invoice, please contact support.</p>
                <p className="text-center text-xs font-bold text-gray-300 mt-1 uppercase tracking-widest">TEANEST ESTATE SYSTEM</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content (Hidden when printing invoice) */}
      <div className="print:hidden">
        {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-primary">Sales & Dispatch</h1>
          <p className="text-on-surface-variant mt-1">Manage orders, buyers, and delivery status.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if(!showForm && !editing){setForm(getEmptyForm());} if(showForm){setEditing(null);} }}
          className="px-6 py-3 bg-gradient-to-br from-secondary to-primary text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Order'}
        </button>
      </div>

      {/* Stats */}
      {stats?.summary && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[
            { label: 'Total Orders', value: stats.summary.totalOrders, icon: 'receipt_long' },
            { label: 'Total Revenue', value: `₹${stats.summary.totalRevenue?.toLocaleString()}`, icon: 'payments' },
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
          <h2 className="font-headline text-xl font-semibold text-primary mb-4">{editing ? 'Edit Order' : 'Create New Order'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name:'orderId', label:'Order ID (Auto-Generated)', type:'text', disabled: true },
              { name:'buyerName', label:'Buyer Name *', type:'text', placeholder:'Tea Co.' },
              { name:'quantity', label:'Quantity (kg) *', type:'number', placeholder:'0' },
              { name:'pricePerUnit', label:'Price/kg (₹) *', type:'number', placeholder:'0.00' },
              { name:'orderDate', label:'Order Date *', type:'date' },
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
                {editing ? 'Update Order' : 'Create Order'}
              </button>
              <button type="button" onClick={() => {setShowForm(false);setForm(getEmptyForm());setEditing(null);}}
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
          <h3 className="font-headline text-xl font-semibold text-primary flex-1">Sales Orders</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search buyer..."
              className="pl-9 pr-4 py-2 bg-surface-container rounded-full border-none text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
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
                {['Order ID','Buyer','Tea Type','Quantity','Total Amount','Status','Date','Actions'].map(h=>(
                  <th key={h} className="px-6 py-4 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl text-outline mb-2 block">receipt_long</span>
                  No orders yet. Click "New Order" to create one.
                </td></tr>
              ) : items.map(item => (
                <tr key={item._id} className="hover:bg-surface-container-lowest/40 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-primary">{item.orderId}</div>
                  </td>
                  <td className="px-6 py-5 text-on-surface-variant">{item.buyerName}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"/>{item.teaType}</div>
                  </td>
                  <td className="px-6 py-5 font-medium">{item.quantity} kg</td>
                  <td className="px-6 py-5 font-bold text-primary">₹{item.totalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[item.status]||'bg-surface-variant text-on-surface-variant'}`}>{item.status}</span>
                  </td>
                  <td className="px-6 py-5 text-on-surface-variant">{new Date(item.orderDate).toLocaleDateString()}</td>
                  <td className="px-6 py-5">
                    <div className="flex gap-1">
                      <button onClick={()=>setInvoice(item)} className="p-2 rounded-lg hover:bg-primary-container/30 text-primary transition-colors" title="Invoice">
                        <span className="material-symbols-outlined text-sm">receipt</span>
                      </button>
                      <button onClick={()=>handleEdit(item)} className="p-2 rounded-lg hover:bg-secondary-container/30 text-secondary transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={()=>handleDelete(item._id)} className="p-2 rounded-lg hover:bg-red-50 text-error transition-colors" title="Delete">
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
          <p className="text-xs text-on-surface-variant">Showing {items.length} orders</p>
        </div>
      </div>
      </div>
    </div>
  );
}

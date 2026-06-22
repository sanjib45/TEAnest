import { useState, useEffect, useCallback, useMemo } from 'react';
import { merchantTxnAPI } from '../api/merchantTransactionApi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import TransactionDetailModal from '../components/TransactionDetailModal';

const TEA_TYPES = ['Green Tea', 'CTC', 'Other'];

const emptyForm = {
  merchantName: '',
  teaType: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  grossQty: '',
  lessPercent: '0',
  ratePerKg: '',
  laborCount: '0',
  laborChargePerWorker: '0',
  advancePayment: '0',
  notes: '',
};

// ── Small helper components ────────────────────────────────────────────────────
function StatCard({ label, value, icon, highlight }) {
  return (
    <div className="glass-card p-5 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">{label}</p>
        <span className="material-symbols-outlined text-xl text-primary/60">{icon}</span>
      </div>
      <span className={`font-headline text-2xl font-bold ${highlight ? 'text-primary' : 'text-on-surface'}`}>
        {value}
      </span>
    </div>
  );
}

function CalcRow({ label, value, bold, highlight, border }) {
  return (
    <div className={`flex justify-between items-center py-2 ${border ? 'border-t border-outline-variant/30 mt-1 pt-3' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-primary text-base' : 'text-on-surface'}`}>
        ₹{Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

function InputField({ label, name, type = 'text', value, onChange, placeholder, required, readOnly, step }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
        {label}{required && ' *'}
      </label>
      <input
        id={`field-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        step={step}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-on-surface focus:outline-none transition-all
          ${readOnly
            ? 'bg-surface-container/30 border-outline-variant/30 text-on-surface-variant cursor-not-allowed'
            : 'border-outline-variant bg-surface-container-low/50 focus:border-primary'
          }`}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MerchantPage() {
  const [items, setItems]             = useState([]);
  const [stats, setStats]             = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [editing, setEditing]         = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('');
  const [datePreset, setDatePreset]   = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [tempDates, setTempDates]     = useState({ start: '', end: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId]       = useState(null);
  const [selectedTxnId, setSelectedTxnId] = useState(null);

  // ── Live calculations (client-side mirror) ──────────────────────────────────
  const calc = useMemo(() => merchantTxnAPI.compute(form), [form]);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterType) params.teaType = filterType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await merchantTxnAPI.getAll(params);
      setItems(data.data);
    } catch {
      toast.error('Failed to load transactions');
    }
    setLoading(false);
  }, [search, filterType, startDate, endDate]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await merchantTxnAPI.getStats();
      setStats(data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchItems(); fetchStats(); }, [fetchItems, fetchStats]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDatePresetChange = (e) => {
    const val = e.target.value;
    setDatePreset(val);
    if (val === '') {
      setStartDate('');
      setEndDate('');
    } else if (val === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
    } else if (val === '5day') {
      const today = new Date();
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(today.getDate() - 5);
      setStartDate(fiveDaysAgo.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    } else if (val === 'custom') {
      setTempDates({ start: startDate, end: endDate });
      setShowCustomDateModal(true);
    }
  };

  const handleCustomDateSubmit = () => {
    setStartDate(tempDates.start);
    setEndDate(tempDates.end);
    setShowCustomDateModal(false);
  };

  const editItem = (item) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, ...calc }; // include pre-calculated values
      if (editing) {
        await merchantTxnAPI.update(editing, payload);
        toast.success('Transaction updated!');
      } else {
        await merchantTxnAPI.create(payload);
        toast.success('Transaction recorded!');
      }
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
      fetchItems();
      fetchStats();
    } catch (err) {
      toast.error(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'Something went wrong'
      );
    }
    setSubmitting(false);
  };

  const handleEdit = (item) => {
    setForm({
      merchantName:        item.merchantName,
      teaType:             item.teaType,
      transactionDate:     item.transactionDate?.slice(0, 10) || '',
      grossQty:            String(item.grossQty),
      lessPercent:         String(item.lessPercent),
      ratePerKg:           String(item.ratePerKg),
      laborCount:          String(item.laborCount),
      laborChargePerWorker: String(item.laborChargePerWorker),
      advancePayment:      String(item.advancePayment),
      notes:               item.notes || '',
    });
    setEditing(item._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await merchantTxnAPI.remove(deleteId);
      toast.success('Transaction deleted');
      fetchItems();
      fetchStats();
    } catch {
      toast.error('Delete failed');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditing(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-primary">Merchant</h1>
          <p className="text-on-surface-variant mt-1">Procurement transactions — track tea purchases and payments.</p>
        </div>
        <button
          id="btn-new-transaction"
          onClick={() => { setShowForm(!showForm); if (showForm) cancelForm(); }}
          className="px-6 py-3 bg-gradient-to-br from-secondary to-primary text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Transaction'}
        </button>
      </div>

      {/* ── Stats Cards ── */}
      {stats?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Transactions" value={stats.summary.totalTransactions} icon="receipt_long" />
          <StatCard label="Net Qty Purchased" value={`${(stats.summary.totalNetQty || 0).toLocaleString()} kg`} icon="grass" />
          <StatCard label="Total Gross Amount" value={`₹${(stats.summary.totalGrossAmount || 0).toLocaleString('en-IN')}`} icon="payments" highlight />
          <StatCard label="Outstanding Balance" value={`₹${(stats.summary.totalBalance || 0).toLocaleString('en-IN')}`} icon="account_balance_wallet" />
        </div>
      )}

      {/* ── Transaction Form ── */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-8 shadow-xl shadow-primary/10">
          <h2 className="font-headline text-xl font-semibold text-primary mb-6">
            {editing ? 'Edit Transaction' : 'Record New Transaction'}
          </h2>

          <form id="merchant-transaction-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Merchant Name */}
              <InputField label="Merchant Name" name="merchantName" value={form.merchantName} onChange={handleChange} placeholder="e.g. Ravi Tea Traders" required />

              {/* Tea Type */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Tea Type *
                </label>
                <select
                  id="field-teaType"
                  name="teaType"
                  value={form.teaType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low/50 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                >
                  {!form.teaType && <option value="">Select type...</option>}
                  {TEA_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Transaction Date */}
              <InputField label="Transaction Date" name="transactionDate" type="date" value={form.transactionDate} onChange={handleChange} required />
            </div>

            {/* ── Quantity Section ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <InputField label="Gross Qty (kg)" name="grossQty" type="number" step="0.01" value={form.grossQty} onChange={handleChange} placeholder="0.00" required />
              <InputField label="Less %" name="lessPercent" type="number" step="0.01" value={form.lessPercent} onChange={handleChange} placeholder="0" />
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Less Qty (kg)</label>
                <div className="w-full px-4 py-2.5 rounded-xl bg-surface-container/30 border border-outline-variant/30 text-sm text-on-surface-variant font-semibold">
                  {calc.lessQty.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Net Qty (kg)</label>
                <div className="w-full px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary font-bold">
                  {calc.netQty.toFixed(2)}
                </div>
              </div>
            </div>

            {/* ── Financial Section ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <InputField label="Rate per kg (₹)" name="ratePerKg" type="number" step="0.01" value={form.ratePerKg} onChange={handleChange} placeholder="0.00" required />
              <InputField label="Labor Count" name="laborCount" type="number" step="1" value={form.laborCount} onChange={handleChange} placeholder="0" />
              <InputField label="Charge / Worker (₹)" name="laborChargePerWorker" type="number" step="0.01" value={form.laborChargePerWorker} onChange={handleChange} placeholder="0.00" />
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Total Labor (₹)</label>
                <div className="w-full px-4 py-2.5 rounded-xl bg-surface-container/30 border border-outline-variant/30 text-sm text-on-surface-variant font-semibold">
                  ₹{calc.totalLaborCharges?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <InputField label="Advance Payment (₹)" name="advancePayment" type="number" step="0.01" value={form.advancePayment} onChange={handleChange} placeholder="0.00" />
            </div>

            {/* ── Live Calculation Summary ── */}
            <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-5 mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">calculate</span>
                Live Calculation Preview
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                <div>
                  <CalcRow label="Net Qty × Rate" value={calc.grossAmount} />
                  <CalcRow label={`Labor (${form.laborCount || 0} workers × ₹${form.laborChargePerWorker || 0})`} value={calc.totalLaborCharges} />
                  <CalcRow label="Net Payable" value={calc.netPayable} bold />
                </div>
                <div>
                  <CalcRow label="Net Payable" value={calc.netPayable} />
                  <CalcRow label="Less Advance Payment" value={form.advancePayment || 0} />
                  <CalcRow label="Final Balance" value={calc.finalPayable} bold highlight border />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Notes</label>
              <textarea
                id="field-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Optional remarks..."
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low/50 text-sm text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                id="btn-submit-transaction"
                type="submit"
                disabled={submitting}
                className="px-7 py-3 bg-gradient-to-br from-secondary to-primary text-white rounded-full font-semibold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
              >
                {submitting && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                {editing ? 'Update Transaction' : 'Save Transaction'}
              </button>
              <button
                id="btn-cancel-transaction"
                type="button"
                onClick={cancelForm}
                className="px-7 py-3 bg-surface-container text-on-surface rounded-full font-semibold text-sm hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Transaction Table ── */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xl shadow-primary/5">
        {/* Table header / filters */}
        <div className="p-4 border-b border-outline-variant/20 flex flex-wrap gap-3 items-center bg-surface-container-low/50">
          <h3 className="font-headline text-xl font-semibold text-primary flex-1">Procurement Management</h3>
          
          <select
            value={datePreset}
            onChange={handleDatePresetChange}
            className="px-3 py-2 bg-surface-container rounded-full border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select Date</option>
            <option value="today">Today</option>
            <option value="5day">5 Day</option>
            <option value="custom">Custom Date</option>
          </select>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              id="search-merchant"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant..."
              className="pl-9 pr-4 py-2 bg-surface-container rounded-full border-none text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            id="filter-tea-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-surface-container rounded-full border-none text-sm focus:outline-none"
          >
            <option value="">All Types</option>
            {TEA_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface border-y border-outline-variant/20">
                {['Sl. No.', 'Date', 'Merchant', 'Type', 'Gross Qty', 'Net Qty', 'Rate/kg', 'Gross Amt', 'Workers', 'Labor Total', 'Advance', 'Balance', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-on-surface-variant font-bold text-sm whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-16 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl text-outline mb-3 block">receipt_long</span>
                    No transactions yet. Click &quot;New Transaction&quot; to get started.
                  </td>
                </tr>
              ) : items.map((item, index) => (
                <tr key={item._id} className="odd:bg-white even:bg-surface-container-lowest/50 border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors text-on-surface">
                  <td className="px-4 py-4 text-on-surface-variant font-medium">{index + 1}</td>
                  <td className="px-4 py-4 text-on-surface-variant whitespace-nowrap">
                    <span className="block">{new Date(item.transactionDate).toLocaleDateString('en-CA')}</span>
                    <span className="text-xs">{new Date(item.transactionDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="px-4 py-4 font-semibold">{item.merchantName}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">{item.teaType}</span>
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant">{item.grossQty} kg</td>
                  <td className="px-4 py-4 font-medium">{item.netQty} kg</td>
                  <td className="px-4 py-4 text-on-surface-variant">₹{item.ratePerKg}</td>
                  <td className="px-4 py-4 font-medium">₹{(item.grossAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{item.laborCount} × ₹{item.laborChargePerWorker}</td>
                  <td className="px-4 py-4 text-on-surface-variant">₹{(item.totalLaborCharges || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-on-surface-variant">₹{item.advancePayment}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="block text-sm font-bold text-on-surface mb-0.5">₹{(item.balance || 0).toLocaleString('en-IN')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${item.balance > 0 ? 'bg-orange-100 text-orange-700' : item.balance < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.balance > 0 ? 'Amount Due' : item.balance < 0 ? 'Overpaid' : 'Paid'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button id={`details-${item._id}`} onClick={() => setSelectedTxnId(item._id)}
                        className="px-3 py-1.5 border border-[#3b4b59] text-[#3b4b59] rounded-lg text-xs font-semibold hover:bg-[#3b4b59]/5 transition-colors whitespace-nowrap" title="View Details">
                        View Details
                      </button>
                      <button id={`edit-${item._id}`} onClick={() => handleEdit(item)} 
                        className="px-3 py-1.5 border border-secondary text-secondary rounded-lg text-xs font-semibold hover:bg-secondary/5 transition-colors whitespace-nowrap" title="Edit">
                        Edit
                      </button>
                      <button id={`delete-${item._id}`} onClick={() => handleDelete(item._id)} 
                        className="px-3 py-1.5 border border-error text-error rounded-lg text-xs font-semibold hover:bg-error/5 transition-colors whitespace-nowrap" title="Cancel/Delete">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-surface-container-lowest/30 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">Showing {items.length} transactions</p>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
      />

      {/* Transaction Detail Drawer */}
      {selectedTxnId && (
        <TransactionDetailModal
          txnId={selectedTxnId}
          onClose={() => { setSelectedTxnId(null); fetchItems(); fetchStats(); }}
        />
      )}

      {/* Custom Date Range Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-outline-variant/20">
              <h3 className="text-lg font-bold text-on-surface">Select Entry Date Range</h3>
            </div>
            <div className="p-6 flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">From</label>
                <input 
                  type="date" 
                  value={tempDates.start}
                  onChange={(e) => setTempDates({ ...tempDates, start: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low/50 focus:border-primary text-sm focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">To</label>
                <input 
                  type="date" 
                  value={tempDates.end}
                  onChange={(e) => setTempDates({ ...tempDates, end: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low/50 focus:border-primary text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="p-4 bg-surface-container-low/50 flex justify-end gap-3 border-t border-outline-variant/20">
              <button 
                onClick={() => {
                  setTempDates({ start: '', end: '' });
                  setDatePreset('');
                  setShowCustomDateModal(false);
                }}
                className="px-5 py-2 rounded-full text-sm font-semibold text-error hover:bg-error/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setTempDates({ start: '', end: '' })}
                className="px-5 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={handleCustomDateSubmit}
                className="px-6 py-2 rounded-full text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

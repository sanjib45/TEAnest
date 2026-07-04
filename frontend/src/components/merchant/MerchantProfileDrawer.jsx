/**
 * MerchantProfileDrawer
 * ─────────────────────────────────────────────────────────────────────────────
 * When the user clicks "View Details" on ANY row for a merchant, this drawer
 * slides in from the right and shows:
 *
 *  1. Merchant-level summary (total qty, total gross amount, outstanding balance)
 *  2. Invoice Download section — pick a date, preview invoice, download PDF
 *  3. All transactions for that merchant, sorted newest-first
 *  4. Each transaction card is expandable → shows quantity/financial breakdown
 *     + inline payment history + "Record Payment" form
 *
 * Props:
 *   merchantName  – string  — filters all transactions by this name
 *   onClose       – fn()   — called when drawer is closed
 *   onDataChange  – fn()   — called after any payment add/delete (so parent
 *                            can refresh the table and stats)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { merchantTxnAPI } from '../../api/merchantTransactionApi';
import { merchantMasterAPI } from '../../api/merchantMasterApi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../ConfirmationModal';



// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Other'];

// ── Invoice Download Section ──────────────────────────────────────────────────
function InvoiceSection({ merchantName }) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState(today);
  const [checking, setChecking]   = useState(false);
  const [txnCount, setTxnCount]         = useState(null);   // null = unchecked
  const [noData, setNoData]             = useState(false);
  const [previewing, setPreviewing]     = useState(false);
  const [previewHtml, setPreviewHtml]   = useState('');
  const [downloading, setDownloading]   = useState(false);
  const iframeRef = useRef(null);

  // Whenever date changes reset state
  useEffect(() => {
    setTxnCount(null);
    setNoData(false);
  }, [startDate, endDate]);

  // ── Check how many transactions exist for that date ───────────────────────
  const handleCheck = async () => {
    setChecking(true);
    setNoData(false);
    setTxnCount(null);
    try {
      const { data: res } = await merchantTxnAPI.getAll({
        merchantName,
        startDate,
        endDate,
        limit:     500,
      });
      if (!res.data || res.data.length === 0) {
        setNoData(true);
      } else {
        setTxnCount(res.data.length);
      }
    } catch {
      toast.error('Failed to check transactions');
    }
    setChecking(false);
  };

  // ── Preview: fetch HTML from backend and show in iframe modal ─────────────
  const handlePreview = async () => {
    try {
      const { data: html } = await merchantTxnAPI.getInvoiceHtmlByDate(merchantName, startDate, endDate);
      setPreviewHtml(html);
      setPreviewing(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Preview failed';
      toast.error(msg);
    }
  };

  // Write HTML into iframe once it mounts
  useEffect(() => {
    if (previewing && iframeRef.current && previewHtml) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [previewing, previewHtml]);

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(
        `http://localhost:5005/api/merchant-transactions/invoice/by-merchant-date?merchantName=${encodeURIComponent(merchantName)}&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Download failed' }));
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      const safeStart = startDate.replace(/-/g,'');
      const safeEnd   = endDate.replace(/-/g,'');
      const dateStr   = startDate === endDate ? safeStart : `${safeStart}_${safeEnd}`;
      a.download = `invoice-${merchantName.replace(/\s+/g,'_')}-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
      
    } catch (err) {
      toast.error(err.message || 'Download failed');
    }
    setDownloading(false);
  };

  return (
    <>
      {/* ── Section card ── */}
      <div className="mx-4 mb-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
          <p className="text-sm font-bold text-primary uppercase tracking-wider">
            Download Invoice
          </p>
        </div>

        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-on-surface-variant">
            Select a date range to generate a payment voucher for all transactions within that period.
          </p>

          {/* Date picker + check row */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                max={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                max={today}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <button
              id="invoice-check-btn"
              onClick={handleCheck}
              disabled={checking}
              className="px-4 py-2 rounded-xl border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap"
            >
              {checking
                ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                : <span className="material-symbols-outlined text-sm">search</span>}
              Check Entries
            </button>
          </div>

          {/* Result feedback */}
          {noData && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700">
              <span className="material-symbols-outlined text-sm">info</span>
              No transactions found for {merchantName} in this period.
            </div>
          )}

          {txnCount !== null && !noData && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>
                  Found <strong>{txnCount}</strong> transaction{txnCount !== 1 ? 's' : ''} in this period — ready to generate invoice.
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  id="invoice-preview-btn"
                  onClick={handlePreview}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">preview</span>
                  Preview Invoice
                </button>
                <button
                  id="invoice-download-btn"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-secondary to-primary text-white text-xs font-semibold shadow hover:shadow-md transition-all active:scale-95 disabled:opacity-60"
                >
                  {downloading
                    ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    : <span className="material-symbols-outlined text-sm">download</span>}
                  {downloading ? 'Generating PDF…' : 'Save as PDF'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Preview Modal (full-screen iframe) ── */}
      {previewing && createPortal(
        <div className="fixed inset-0 z-[200] flex flex-col bg-black/70 backdrop-blur-sm">
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#1a1a1a] shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <span className="text-white font-semibold text-sm">
                Invoice Preview — {merchantName} · {startDate === endDate ? startDate : `${startDate} to ${endDate}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="invoice-download-from-preview-btn"
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-br from-secondary to-primary text-white text-xs font-semibold shadow hover:shadow-md transition-all active:scale-95 disabled:opacity-60"
              >
                {downloading
                  ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  : <span className="material-symbols-outlined text-sm">download</span>}
                {downloading ? 'Generating…' : 'Save PDF'}
              </button>
              <button
                onClick={() => { setPreviewing(false); setPreviewHtml(''); }}
                className="p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-white">close</span>
              </button>
            </div>
          </div>

          {/* iframe */}
          <iframe
            ref={iframeRef}
            title="Invoice Preview"
            className="flex-1 w-full bg-white"
            style={{ border: 'none' }}
          />
        </div>,
        document.body
      )}
    </>
  );
}

// ── Balance badge ─────────────────────────────────────────────────────────────
function BalanceBadge({ balance }) {
  if (balance > 0)
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-orange-700">
        ₹{fmt(balance)} Due
      </span>
    );
  if (balance < 0)
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700">
        Overpaid ₹{fmt(Math.abs(balance))}
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700">
      ✓ Settled
    </span>
  );
}

// ── Single transaction card (expandable) ──────────────────────────────────────
function TransactionCard({ txn, index, onDataChange }) {
  const [open, setOpen] = useState(false);
  const [payData, setPayData] = useState(null);   // { payments, summary }
  const [loadingPay, setLoadingPay] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: 'Cash',
    notes: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePayId, setDeletePayId] = useState(null);

  // Load payments when card is expanded
  const loadPayments = useCallback(async () => {
    setLoadingPay(true);
    try {
      const { data: res } = await merchantTxnAPI.getPayments(txn._id);
      setPayData(res.data);
    } catch {
      toast.error('Failed to load payments');
    }
    setLoadingPay(false);
  }, [txn._id]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !payData) loadPayments();
  };

  // Add payment
  const handlePay = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await merchantTxnAPI.addPayment(txn._id, payForm);
      toast.success('Payment recorded!');
      setPayForm({
        amount: '',
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMode: 'Cash',
        notes: '',
      });
      setShowPayForm(false);
      await loadPayments();
      onDataChange();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Payment failed'
      );
    }
    setSubmitting(false);
  };

  // Delete payment
  const handleConfirmDelete = async () => {
    try {
      await merchantTxnAPI.deletePayment(txn._id, deletePayId);
      toast.success('Payment deleted');
      await loadPayments();
      onDataChange();
    } catch {
      toast.error('Delete failed');
    } finally {
      setShowDeleteConfirm(false);
      setDeletePayId(null);
    }
  };

  const isPaid = payData?.summary?.isPaidFull;
  const remaining = payData?.summary?.remainingBalance ?? txn.balance;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        open
          ? 'border-primary/30 shadow-md shadow-primary/5'
          : 'border-outline-variant/20 hover:border-primary/20'
      } bg-surface overflow-hidden`}
    >
      {/* ── Card Header (always visible) ── */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Index badge */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
              ${index === 0 ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}
          >
            {index + 1}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-on-surface text-sm">
                {fmtDate(txn.transactionDate)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                {txn.teaType}
              </span>
              <BalanceBadge balance={txn.balance} />
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 font-mono">
              {txn.transactionId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-3">
          <div className="text-right">
            <p className="text-xs text-on-surface-variant">Net Qty</p>
            <p className="font-bold text-on-surface text-sm">{txn.netQty} kg</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-on-surface-variant">Final Payable</p>
            <p className="font-bold text-primary text-sm">₹{fmt(txn.finalPayable)}</p>
          </div>
          <span
            className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* ── Expanded content ── */}
      {open && (
        <div className="border-t border-outline-variant/20 p-4 space-y-4">

          {/* Quantity + Financial grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Quantity breakdown */}
            <div className="bg-surface-container-low/50 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">grass</span>
                Quantity
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Gross Qty</span>
                  <span className="font-medium">{txn.grossQty} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Less ({txn.lessPercent}%)</span>
                  <span className="font-medium text-error">− {txn.lessQty} kg</span>
                </div>
                <div className="flex justify-between border-t border-outline-variant/20 pt-1.5">
                  <span className="font-semibold">Net Qty</span>
                  <span className="font-bold text-primary">{txn.netQty} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Rate / kg</span>
                  <span className="font-medium">₹{txn.ratePerKg}</span>
                </div>
              </div>
            </div>

            {/* Financial breakdown */}
            <div className="bg-surface-container-low/50 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">calculate</span>
                Financials
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Gross Amount</span>
                  <span className="font-medium">₹{fmt(txn.grossAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">
                    Labor ({txn.laborCount} × ₹{txn.laborChargePerWorker})
                  </span>
                  <span className="font-medium text-error">− ₹{fmt(txn.totalLaborCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Advance</span>
                  <span className="font-medium text-error">− ₹{fmt(txn.advancePayment)}</span>
                </div>
                <div className="flex justify-between border-t border-outline-variant/20 pt-1.5">
                  <span className="font-semibold">Final Payable</span>
                  <span className="font-bold text-primary">₹{fmt(txn.finalPayable)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {txn.notes && (
            <p className="text-xs text-on-surface-variant bg-surface-container/40 rounded-xl px-4 py-2.5 italic">
              📝 {txn.notes}
            </p>
          )}

          {/* ── Payment section ── */}
          {loadingPay ? (
            <div className="flex justify-center py-4">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">
                progress_activity
              </span>
            </div>
          ) : payData ? (
            <>
              {/* Payment summary bar */}
              <div
                className={`rounded-xl p-3 flex flex-wrap items-center gap-4 text-sm border ${
                  isPaid
                    ? 'bg-green-50/50 border-green-200'
                    : 'bg-orange-50/50 border-orange-200'
                }`}
              >
                <div>
                  <span className="text-on-surface-variant text-xs">Paid So Far</span>
                  <p className="font-bold text-on-surface">₹{fmt(payData.summary.totalPaid)}</p>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs">Remaining</span>
                  <p className={`font-bold ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                    ₹{fmt(payData.summary.remainingBalance)}
                  </p>
                </div>
                <div className="ml-auto">
                  {isPaid ? (
                    <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Fully Paid
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (!showPayForm) {
                          setPayForm((p) => ({
                            ...p,
                            amount: String(payData.summary.remainingBalance),
                          }));
                        }
                        setShowPayForm((v) => !v);
                      }}
                      className="px-4 py-1.5 bg-gradient-to-br from-secondary to-primary text-white rounded-full text-xs font-semibold flex items-center gap-1 shadow hover:shadow-md transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {showPayForm ? 'close' : 'payments'}
                      </span>
                      {showPayForm ? 'Cancel' : 'Record Payment'}
                    </button>
                  )}
                </div>
              </div>

              {/* Inline pay form */}
              {showPayForm && !isPaid && (
                <form
                  onSubmit={handlePay}
                  className="bg-surface-container-low/50 rounded-xl p-4 space-y-3 border border-primary/20"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    New Payment
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Amount */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max={payData.summary.remainingBalance}
                        value={payForm.amount}
                        onChange={(e) =>
                          setPayForm((p) => ({ ...p, amount: e.target.value }))
                        }
                        placeholder={`Max ₹${fmt(payData.summary.remainingBalance)}`}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPayForm((p) => ({
                            ...p,
                            amount: String(payData.summary.remainingBalance),
                          }))
                        }
                        className="mt-1 text-[11px] text-primary font-semibold hover:underline"
                      >
                        Pay full (₹{fmt(payData.summary.remainingBalance)})
                      </button>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={payForm.paymentDate}
                        onChange={(e) =>
                          setPayForm((p) => ({ ...p, paymentDate: e.target.value }))
                        }
                        required
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>

                    {/* Mode */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        Mode
                      </label>
                      <select
                        value={payForm.paymentMode}
                        onChange={(e) =>
                          setPayForm((p) => ({ ...p, paymentMode: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary transition-all"
                      >
                        {PAYMENT_MODES.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={payForm.notes}
                        onChange={(e) =>
                          setPayForm((p) => ({ ...p, notes: e.target.value }))
                        }
                        placeholder="Optional remarks"
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-gradient-to-br from-secondary to-primary text-white rounded-xl font-semibold text-sm shadow hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting && (
                      <span className="material-symbols-outlined animate-spin text-sm">
                        progress_activity
                      </span>
                    )}
                    Confirm Payment
                  </button>
                </form>
              )}

              {/* Payment history list */}
              {payData.payments.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">receipt_long</span>
                    Payment History ({payData.payments.length})
                  </p>
                  <div className="space-y-2">
                    {payData.payments.map((pay, idx) => (
                      <div
                        key={pay._id}
                        className="flex items-center justify-between bg-surface-container-low/50 rounded-xl px-4 py-2.5 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                              idx === 0
                                ? 'bg-primary/15 text-primary'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface">
                              {fmtDate(pay.paymentDate)}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {pay.paymentMode}
                              {pay.notes && ` · ${pay.notes}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="font-bold text-primary text-sm">₹{fmt(pay.amount)}</p>
                          <button
                            onClick={() => {
                              setDeletePayId(pay._id);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1 rounded-lg text-error hover:bg-error/10 transition-colors"
                            title="Delete payment"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Delete payment confirmation */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletePayId(null);
        }}
      />
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────
export default function MerchantProfileDrawer({ merchantName, onClose, onDataChange }) {
  const [transactions, setTransactions] = useState([]);
  const [merchantProfile, setMerchantProfile] = useState(null);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch profile
      try {
        const { data: mRes } = await merchantMasterAPI.search(merchantName);
        if (mRes.data && mRes.data.length > 0) {
          setMerchantProfile(mRes.data.find(m => m.name.toLowerCase() === merchantName.toLowerCase()) || mRes.data[0]);
        }
      } catch (err) {
        console.error('Failed to load merchant profile', err);
      }

      // Fetch all transactions for this merchant (no pagination limit needed here;
      // we pass a high limit so we always get the complete history)
      const { data: res } = await merchantTxnAPI.getAll({
        merchantName,
        sort: '-transactionDate',
        limit: 500,
      });
      setTransactions(res.data);
    } catch {
      toast.error('Failed to load merchant history');
    }
    setLoading(false);
  }, [merchantName]);

  useEffect(() => {
    load();
  }, [load]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Aggregate stats across all transactions
  const summary = transactions.reduce(
    (acc, t) => ({
      totalNetQty:     acc.totalNetQty     + (t.netQty        || 0),
      totalGrossAmt:   acc.totalGrossAmt   + (t.grossAmount   || 0),
      totalFinalPay:   acc.totalFinalPay   + (t.finalPayable  || 0),
      totalBalance:    acc.totalBalance    + (t.balance        || 0),
    }),
    { totalNetQty: 0, totalGrossAmt: 0, totalFinalPay: 0, totalBalance: 0 }
  );

  const handleDataChange = () => {
    load();          // refresh transaction list (balance updated)
    onDataChange();  // refresh parent table + stats cards
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-end bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Drawer panel */}
      <div className="h-full w-full max-w-2xl bg-surface flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/60 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">person</span>
              <h2 className="font-headline text-xl font-bold text-primary">
                {merchantName}
              </h2>
            </div>
            {merchantProfile && (
              <div className="flex flex-wrap gap-4 mt-2 mb-1 text-sm text-on-surface">
                {merchantProfile.phone && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">phone</span>
                    {merchantProfile.phone}
                  </span>
                )}
                {merchantProfile.address && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                    {merchantProfile.address}
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-on-surface-variant mt-0.5">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} · All time history
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* ── Summary bar ── */}
        {!loading && transactions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-b border-outline-variant/20 shrink-0">
            {[
              { label: 'Total Net Qty', value: `${summary.totalNetQty.toFixed(2)} kg`, icon: 'grass' },
              { label: 'Gross Amount', value: `₹${fmt(summary.totalGrossAmt)}`, icon: 'payments' },
              { label: 'Final Payable', value: `₹${fmt(summary.totalFinalPay)}`, icon: 'receipt_long' },
              {
                label: 'Outstanding',
                value: `₹${fmt(summary.totalBalance)}`,
                icon: 'account_balance_wallet',
                highlight: summary.totalBalance > 0,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col px-4 py-3 border-r border-outline-variant/10 last:border-r-0"
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-sm text-primary/60">{s.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {s.label}
                  </span>
                </div>
                <span
                  className={`font-headline font-bold text-base ${
                    s.highlight ? 'text-orange-600' : 'text-on-surface'
                  }`}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Invoice Download Section ── */}
        {!loading && <InvoiceSection merchantName={merchantName} />}

        {/* ── Transaction list ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">
                progress_activity
              </span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">receipt_long</span>
              <p className="text-sm">No transactions found for this merchant.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-on-surface-variant px-1">
                Tap a transaction to see details &amp; manage payments
              </p>
              {transactions.map((txn, index) => (
                <TransactionCard
                  key={txn._id}
                  txn={txn}
                  index={index}
                  onDataChange={handleDataChange}
                />
              ))}
            </>
          )}
        </div>

        {/* Bottom padding */}
        <div className="h-4 shrink-0" />
      </div>
    </div>,
    document.body
  );
}

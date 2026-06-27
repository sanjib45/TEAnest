const MerchantTransaction = require('../models/MerchantTransaction');
const Factory             = require('../models/Factory');

/**
 * GET /api/dashboard
 * Returns all data needed for the dashboard in a single request:
 *  - kpi           : top-level KPI numbers
 *  - merchantStats : merchant procurement summary
 *  - factoryStats  : factory sales summary
 *  - recentMerchant: last 8 merchant transactions
 *  - recentFactory : last 8 factory sales records
 *  - dueMerchants  : merchants with outstanding balance (top 5)
 *  - dueBuyers     : buyers with outstanding factory due (top 5)
 */
exports.getDashboard = async (req, res) => {
  try {
    const [
      merchantSummary,
      factorySummaryRaw,
      factoryPaymentAgg,
      recentMerchant,
      recentFactory,
      dueMerchants,
    ] = await Promise.all([

      // ── Merchant aggregate ──────────────────────────────────────────────
      MerchantTransaction.aggregate([
        {
          $group: {
            _id: null,
            totalTransactions:  { $sum: 1 },
            totalNetQty:        { $sum: '$netQty' },
            totalGrossAmount:   { $sum: '$grossAmount' },
            totalFinalPayable:  { $sum: '$finalPayable' },
            totalBalance:       { $sum: '$balance' },
            totalAdvance:       { $sum: '$advancePayment' },
            totalLaborCharges:  { $sum: '$totalLaborCharges' },
          },
        },
      ]),

      // ── Factory aggregate ──────────────────────────────────────────────
      Factory.aggregate([
        {
          $group: {
            _id: null,
            totalSales:    { $sum: 1 },
            totalQty:      { $sum: '$totalQuantity' },
            totalNetQty:   {
              $sum: {
                $subtract: [
                  '$totalQuantity',
                  { $multiply: ['$totalQuantity', { $divide: ['$lessPercentage', 100] }] },
                ],
              },
            },
            totalAmount:   {
              $sum: {
                $multiply: [
                  { $subtract: ['$totalQuantity', { $multiply: ['$totalQuantity', { $divide: ['$lessPercentage', 100] }] }] },
                  '$rate',
                ],
              },
            },
            totalAdvance:  { $sum: '$advance' },
          },
        },
      ]),

      // ── Factory payments total ──────────────────────────────────────────
      Factory.aggregate([
        { $unwind: { path: '$payments', preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, totalPaid: { $sum: '$payments.amount' } } },
      ]),

      // ── Recent 8 merchant transactions ─────────────────────────────────
      MerchantTransaction.find()
        .sort('-transactionDate')
        .limit(8)
        .select('transactionId merchantName teaType netQty finalPayable balance transactionDate'),

      // ── Recent 8 factory sales ─────────────────────────────────────────
      Factory.find()
        .sort('-date')
        .limit(8)
        .select('buyerName date totalQuantity lessPercentage rate advance payments remarks'),

      // ── Top due merchants (balance > 0) ────────────────────────────────
      MerchantTransaction.aggregate([
        { $match: { balance: { $gt: 0 } } },
        {
          $group: {
            _id:         '$merchantName',
            totalDue:    { $sum: '$balance' },
            lastTxnDate: { $max: '$transactionDate' },
          },
        },
        { $sort: { totalDue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const ms = merchantSummary[0] || {
      totalTransactions: 0, totalNetQty: 0, totalGrossAmount: 0,
      totalFinalPayable: 0, totalBalance: 0, totalAdvance: 0, totalLaborCharges: 0,
    };

    const fs = factorySummaryRaw[0] || {
      totalSales: 0, totalQty: 0, totalNetQty: 0, totalAmount: 0, totalAdvance: 0,
    };
    const fPaid  = factoryPaymentAgg[0]?.totalPaid || 0;
    const fDue   = Math.round((fs.totalAmount - fs.totalAdvance - fPaid) * 100) / 100;

    // ── Enrich factory records with computed virtuals ──────────────────────
    const enrichedFactory = recentFactory.map(item => {
      const obj = item.toObject();
      const tq  = obj.totalQuantity  || 0;
      const lp  = obj.lessPercentage || 0;
      const r   = obj.rate           || 0;
      const adv = obj.advance        || 0;
      const netQty     = parseFloat((tq - (tq * lp / 100)).toFixed(2));
      const totalAmount = parseFloat((netQty * r).toFixed(2));
      const paid        = (obj.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
      const due         = parseFloat((totalAmount - adv - paid).toFixed(2));
      return { ...obj, netQty, totalAmount, totalPaid: paid, due };
    });

    // ── Top due buyers from enriched factory ──────────────────────────────
    const allFactory = await Factory.find({ 'payments.0': { $exists: true } }).select('buyerName date totalQuantity lessPercentage rate advance payments');
    const buyerDueMap = {};
    allFactory.forEach(item => {
      const tq  = item.totalQuantity  || 0;
      const lp  = item.lessPercentage || 0;
      const r   = item.rate           || 0;
      const adv = item.advance        || 0;
      const nq  = tq - (tq * lp / 100);
      const ta  = nq * r;
      const paid = (item.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
      const due  = ta - adv - paid;
      if (due > 0) {
        if (!buyerDueMap[item.buyerName]) buyerDueMap[item.buyerName] = 0;
        buyerDueMap[item.buyerName] += due;
      }
    });
    // Also include factory records without payments
    const allFactoryNoPay = await Factory.find({ 'payments': { $size: 0 } }).select('buyerName totalQuantity lessPercentage rate advance');
    allFactoryNoPay.forEach(item => {
      const tq  = item.totalQuantity  || 0;
      const lp  = item.lessPercentage || 0;
      const r   = item.rate           || 0;
      const adv = item.advance        || 0;
      const nq  = tq - (tq * lp / 100);
      const ta  = nq * r;
      const due = ta - adv;
      if (due > 0) {
        if (!buyerDueMap[item.buyerName]) buyerDueMap[item.buyerName] = 0;
        buyerDueMap[item.buyerName] += due;
      }
    });

    const dueBuyers = Object.entries(buyerDueMap)
      .map(([name, totalDue]) => ({ _id: name, totalDue: Math.round(totalDue * 100) / 100 }))
      .sort((a, b) => b.totalDue - a.totalDue)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        kpi: {
          totalMerchantTxns:   ms.totalTransactions,
          totalProcuredQty:    parseFloat((ms.totalNetQty || 0).toFixed(2)),
          totalMerchantDue:    parseFloat((ms.totalBalance || 0).toFixed(2)),
          totalFactorySales:   fs.totalSales,
          totalSoldQty:        parseFloat((fs.totalNetQty || 0).toFixed(2)),
          totalFactoryDue:     fDue,
          totalRevenue:        parseFloat((fs.totalAmount || 0).toFixed(2)),
          totalProcurementAmt: parseFloat((ms.totalGrossAmount || 0).toFixed(2)),
        },
        merchantStats: {
          totalTransactions:  ms.totalTransactions,
          totalNetQty:        parseFloat((ms.totalNetQty || 0).toFixed(2)),
          totalGrossAmount:   parseFloat((ms.totalGrossAmount || 0).toFixed(2)),
          totalFinalPayable:  parseFloat((ms.totalFinalPayable || 0).toFixed(2)),
          totalBalance:       parseFloat((ms.totalBalance || 0).toFixed(2)),
          totalAdvance:       parseFloat((ms.totalAdvance || 0).toFixed(2)),
          totalLaborCharges:  parseFloat((ms.totalLaborCharges || 0).toFixed(2)),
        },
        factoryStats: {
          totalSales:    fs.totalSales,
          totalNetQty:   parseFloat((fs.totalNetQty || 0).toFixed(2)),
          totalAmount:   parseFloat((fs.totalAmount || 0).toFixed(2)),
          totalAdvance:  parseFloat((fs.totalAdvance || 0).toFixed(2)),
          totalPaid:     parseFloat(fPaid.toFixed(2)),
          totalDue:      fDue,
        },
        recentMerchant,
        recentFactory: enrichedFactory,
        dueMerchants,
        dueBuyers,
      },
    });
  } catch (err) {
    console.error('[Dashboard] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

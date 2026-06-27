const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const connectDB  = require('./config/db');
const mongoose   = require('mongoose');
const { protect } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

// ── One-time migration: drop stale orderId index ──────────────────────────────
mongoose.connection.once('open', async () => {
  try {
    const factoryCol = mongoose.connection.collection('factory');
    const indexes    = await factoryCol.indexes();
    const staleIdx   = indexes.find(idx => idx.key && idx.key.orderId !== undefined);
    if (staleIdx) {
      await factoryCol.dropIndex(staleIdx.name);
      console.log('[Migration] Dropped stale orderId index from factory collection');
    }
  } catch (e) {
    console.log('[Migration] orderId index already removed or not found:', e.message);
  }
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// ── Request logger (dev only) ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ── Public routes (no auth) ────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));

// ── Protected routes ───────────────────────────────────────────────────────────
app.use('/api/merchants',             protect, require('./routes/merchantMasterRoutes'));
app.use('/api/buyers',                protect, require('./routes/buyerRoutes'));
app.use('/api/merchant',              protect, require('./routes/merchantRoutes'));
app.use('/api/merchant-transactions', protect, require('./routes/merchantTransactionRoutes'));
app.use('/api/merchant-transactions/:txnId/payments', protect, require('./routes/merchantPaymentRoutes'));
app.use('/api/labor',                 protect, require('./routes/laborRoutes'));
app.use('/api/factory',               protect, require('./routes/factoryRoutes'));
app.use('/api/payments',              protect, require('./routes/paymentRoutes'));

// ── Health check (public) ──────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', project: 'DOOARS GREEN FPO MCS LTD.' }));

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`DOOARS GREEN Server running on port ${PORT}`));

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

dotenv.config();
connectDB();

// ── One-time migration: drop the old unique orderId index if it exists ──
// The original Sales schema had orderId: { unique: true }. After the schema
// redesign, that index is stale and causes E11000 duplicate key errors.
mongoose.connection.once('open', async () => {
  try {
    const salesCol = mongoose.connection.collection('sales');
    const indexes = await salesCol.indexes();
    const staleIdx = indexes.find(idx => idx.key && idx.key.orderId !== undefined);
    if (staleIdx) {
      await salesCol.dropIndex(staleIdx.name);
      console.log('[Migration] Dropped stale orderId index from sales collection');
    }
  } catch (e) {
    // Index may already be gone — safe to ignore
    console.log('[Migration] orderId index already removed or not found:', e.message);
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/labor', require('./routes/laborRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'TEAnest' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`TEAnest Server running on port ${PORT}`));

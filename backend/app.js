const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(helmet());

// ── Request logger ──────────────────────────────────────────────────────────
// Logs: METHOD /path  STATUS  response-time ms
morgan.token('status-color', (req, res) => {
  const s = res.statusCode;
  if (s >= 500) return `\x1b[31m${s}\x1b[0m`; // red
  if (s >= 400) return `\x1b[33m${s}\x1b[0m`; // yellow
  if (s >= 300) return `\x1b[36m${s}\x1b[0m`; // cyan
  return `\x1b[32m${s}\x1b[0m`;               // green
});
morgan.token('method-color', (req) => {
  const colors = { GET: '\x1b[34m', POST: '\x1b[32m', PUT: '\x1b[33m', PATCH: '\x1b[35m', DELETE: '\x1b[31m' };
  return `${colors[req.method] || ''}${req.method}\x1b[0m`;
});
app.use(morgan('  :method-color :url :status-color :response-time ms'));
// ────────────────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api', limiter, routes);

app.get('/', (_req, res) => {
  res.send('hello world i am here to help you !!');
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

app.locals.networkInterfaces = os.networkInterfaces();

module.exports = app;

/**
 * JWT Authentication Middleware
 * ──────────────────────────────────────────────────
 * Verifies Bearer token from Authorization header.
 * Attaches req.user = { id, role } on success.
 */
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // ── Extract token ─────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // ── Verify token ──────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // ── Attach user (without password) ────────────
    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired — please login again' });
    }
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

module.exports = { protect };

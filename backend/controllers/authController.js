const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;
    
    const userExists = await User.findOne({ phone });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists with this phone number' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, phone, password: hashedPassword, role });
    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, phone: user.phone, role: user.role, token: generateToken(user._id) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid phone or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid phone or password' });

    res.json({ success: true, data: { _id: user._id, name: user.name, phone: user.phone, role: user.role, token: generateToken(user._id) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;
    
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};


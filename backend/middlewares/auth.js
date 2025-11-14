const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.get('Authorization') || req.get('x-access-token');
  if (!header) return res.status(401).json({ message: 'Token missing' });

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('JWT_SECRET not set — using insecure default (development only).');
  }

  try {
    const payload = jwt.verify(token, secret || 'secret');
    req.user = payload;
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Auth verify error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
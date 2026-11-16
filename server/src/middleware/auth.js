const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { COOKIE_NAME } = require('../utils/cookies');

module.exports = async function requireAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next(new AppError(401, 'Not authenticated'));

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new AppError(401, 'Session expired or invalid'));
  }

  const user = await User.findById(payload.sub);
  if (!user) return next(new AppError(401, 'User no longer exists'));

  req.user = user;
  next();
};

const jwt = require('jsonwebtoken');
const { matchedData } = require('express-validator');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { COOKIE_NAME, MAX_AGE_MS, cookieOptions } = require('../utils/cookies');

const sendSession = (res, user, status = 200) => {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });
  res.status(status).json({ user });
};

exports.register = async (req, res) => {
  const { name, email, password } = matchedData(req);
  if (await User.exists({ email })) throw new AppError(409, 'Email is already registered');
  const user = await User.create({ name, email, password });
  sendSession(res, user, 201);
};

exports.login = async (req, res) => {
  const { email, password } = matchedData(req);
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password, to avoid account enumeration.
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(401, 'Invalid email or password');
  }
  sendSession(res, user);
};

exports.logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.status(204).end();
};

exports.me = (req, res) => {
  res.json({ user: req.user });
};

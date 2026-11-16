const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

module.exports = function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new AppError(400, 'Validation failed', details));
};

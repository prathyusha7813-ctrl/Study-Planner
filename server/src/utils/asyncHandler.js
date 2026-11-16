// Express 5 forwards rejected promises automatically; this keeps that explicit
// and keeps controllers working if the app is ever moved to Express 4.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

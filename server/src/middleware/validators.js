const { body, param, query } = require('express-validator');
const { PRIORITIES, STATUSES } = require('../models/Task');

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const isRealDate = (v) => {
  if (!YMD.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
};
const dateField = (chain) =>
  chain.isString().custom(isRealDate).withMessage('Must be a valid date (YYYY-MM-DD)');

exports.register = [
  body('name').isString().trim().isLength({ min: 1, max: 60 }).withMessage('Name is required (max 60 chars)'),
  body('email').isString().trim().isEmail().withMessage('A valid email is required').normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isString()
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8–72 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
    .matches(/\d/).withMessage('Password must contain a number'),
];

exports.login = [
  body('email').isString().trim().isEmail().withMessage('A valid email is required').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

exports.idParam = [param('id').isMongoId().withMessage('Invalid id')];

const subjectFields = (optional) => [
  (optional ? body('name').optional() : body('name'))
    .isString().trim().isLength({ min: 1, max: 50 }).withMessage('Name is required (max 50 chars)'),
  body('color').optional().isString().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a hex value like #3b82f6'),
];
exports.createSubject = subjectFields(false);
exports.updateSubject = [...exports.idParam, ...subjectFields(true)];

const taskFields = (optional) => {
  const f = (name) => (optional ? body(name).optional() : body(name));
  return [
    f('title').isString().trim().isLength({ min: 1, max: 120 }).withMessage('Title is required (max 120 chars)'),
    f('subject').isMongoId().withMessage('A valid subject is required'),
    dateField(f('dueDate')),
    body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
    body('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  ];
};
exports.createTask = taskFields(false);
exports.updateTask = [
  ...exports.idParam,
  ...taskFields(true),
  body().custom((b) => b && typeof b === 'object' && Object.keys(b).length > 0).withMessage('Provide at least one field to update'),
];

exports.listTasks = [
  query('subject').optional().isMongoId().withMessage('Invalid subject'),
  query('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  query('status').optional().isIn(STATUSES).withMessage('Invalid status'),
  query('sort').optional().isIn(['dueDate', 'priority', 'title', 'createdAt']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  dateField(query('from').optional()),
  dateField(query('to').optional()),
];

exports.dashboard = [dateField(query('date').optional())];

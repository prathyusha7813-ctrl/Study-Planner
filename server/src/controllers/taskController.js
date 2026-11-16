const { matchedData } = require('express-validator');
const Task = require('../models/Task');
const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');
const { toUtcDate } = require('../utils/dates');

const SUBJECT_FIELDS = 'name color';

const assertSubjectOwned = async (subjectId, userId) => {
  const ok = await Subject.exists({ _id: subjectId, user: userId });
  if (!ok) throw new AppError(400, 'Subject does not exist', [
    { field: 'subject', message: 'Choose one of your subjects' },
  ]);
};

const findOwned = async (req) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw new AppError(404, 'Task not found');
  return task;
};

const SORT_FIELDS = {
  dueDate: 'dueDate',
  priority: 'priorityRank',
  title: 'title',
  createdAt: 'createdAt',
};

exports.list = async (req, res) => {
  const q = matchedData(req, { locations: ['query'] });
  const filter = { user: req.user._id };
  if (q.subject) filter.subject = q.subject;
  if (q.priority) filter.priority = q.priority;
  if (q.status) filter.status = q.status;
  if (q.from || q.to) {
    filter.dueDate = {};
    if (q.from) filter.dueDate.$gte = toUtcDate(q.from);
    if (q.to) filter.dueDate.$lte = toUtcDate(q.to);
  }

  const dir = q.order === 'desc' ? -1 : 1;
  const sortField = SORT_FIELDS[q.sort || 'dueDate'];
  const sort = { [sortField]: dir, dueDate: 1, _id: 1 }; // stable tie-breakers

  const tasks = await Task.find(filter).sort(sort).populate('subject', SUBJECT_FIELDS);
  res.json({ tasks });
};

exports.get = async (req, res) => {
  const task = await findOwned(req);
  await task.populate('subject', SUBJECT_FIELDS);
  res.json({ task });
};

exports.create = async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  await assertSubjectOwned(data.subject, req.user._id);
  const task = await Task.create({ ...data, dueDate: toUtcDate(data.dueDate), user: req.user._id });
  await task.populate('subject', SUBJECT_FIELDS);
  res.status(201).json({ task });
};

exports.update = async (req, res) => {
  const task = await findOwned(req);
  const data = matchedData(req, { locations: ['body'] });
  if (data.subject) await assertSubjectOwned(data.subject, req.user._id);
  if (data.dueDate) data.dueDate = toUtcDate(data.dueDate);
  Object.assign(task, data);
  await task.save();
  await task.populate('subject', SUBJECT_FIELDS);
  res.json({ task });
};

exports.remove = async (req, res) => {
  const task = await findOwned(req);
  await task.deleteOne();
  res.status(204).end();
};

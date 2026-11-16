const { matchedData } = require('express-validator');
const Subject = require('../models/Subject');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');

const findOwned = async (req) => {
  const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
  if (!subject) throw new AppError(404, 'Subject not found');
  return subject;
};

exports.list = async (req, res) => {
  const subjects = await Subject.find({ user: req.user._id }).sort({ name: 1 });
  res.json({ subjects });
};

exports.create = async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  const subject = await Subject.create({ ...data, user: req.user._id });
  res.status(201).json({ subject });
};

exports.update = async (req, res) => {
  const subject = await findOwned(req);
  Object.assign(subject, matchedData(req, { locations: ['body'] }));
  await subject.save();
  res.json({ subject });
};

// Deleting a subject removes its tasks too, so no task is left orphaned.
exports.remove = async (req, res) => {
  const subject = await findOwned(req);
  const { deletedCount } = await Task.deleteMany({ user: req.user._id, subject: subject._id });
  await subject.deleteOne();
  res.json({ deleted: subject._id, tasksDeleted: deletedCount });
};

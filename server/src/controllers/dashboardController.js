const { matchedData } = require('express-validator');
const Task = require('../models/Task');
const Subject = require('../models/Subject');
const { toUtcDate, todayYmd, addDays } = require('../utils/dates');

const STATUS_ORDER = { doing: 0, todo: 1, done: 2 };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
// In progress first, then to do, then done; high priority first within each.
const byStatusThenPriority = (a, b) =>
  STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
  PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];

// The client sends its own local date (?date=YYYY-MM-DD) so "today" matches
// the user's calendar rather than the server's timezone.
exports.summary = async (req, res) => {
  const { date } = matchedData(req, { locations: ['query'] });
  const today = toUtcDate(date || todayYmd());
  const tomorrow = addDays(today, 1);
  const userId = req.user._id;

  const [todayTasks, overdueTasks, subjects, counts] = await Promise.all([
    Task.find({ user: userId, dueDate: { $gte: today, $lt: tomorrow } })
      .populate('subject', 'name color'),
    Task.find({ user: userId, dueDate: { $lt: today }, status: { $ne: 'done' } })
      .sort({ dueDate: 1, priorityRank: -1 })
      .populate('subject', 'name color'),
    Subject.find({ user: userId }).sort({ name: 1 }),
    Task.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const bySubject = new Map(counts.map((c) => [String(c._id), c]));
  const progress = subjects.map((s) => {
    const { total = 0, done = 0 } = bySubject.get(String(s._id)) || {};
    return {
      subject: { _id: s._id, name: s.name, color: s.color },
      total,
      done,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  });

  const totals = progress.reduce(
    (acc, p) => ({ total: acc.total + p.total, done: acc.done + p.done }),
    { total: 0, done: 0 }
  );

  res.json({
    date: today.toISOString().slice(0, 10),
    today: todayTasks.sort(byStatusThenPriority),
    overdue: overdueTasks,
    progress,
    totals,
  });
};

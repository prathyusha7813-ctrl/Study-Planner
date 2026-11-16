const mongoose = require('mongoose');

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'doing', 'done'];
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    // Due dates are calendar dates, stored as UTC midnight.
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    // Numeric copy of priority so the database can sort it logically.
    priorityRank: { type: Number, select: false },
    status: { type: String, enum: STATUSES, default: 'todo' },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, subject: 1 });

taskSchema.pre('validate', function setRank() {
  this.priorityRank = PRIORITY_RANK[this.priority];
});

taskSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.priorityRank;
    return ret;
  },
});

module.exports = mongoose.model('Task', taskSchema);
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;

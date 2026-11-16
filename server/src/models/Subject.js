const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    color: { type: String, default: '#6366f1', match: /^#[0-9a-fA-F]{6}$/ },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

// A user can't have two subjects with the same name (case-insensitive).
subjectSchema.index(
  { user: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Subject', subjectSchema);

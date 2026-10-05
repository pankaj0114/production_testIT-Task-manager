// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'archived'],
      default: 'active',
    },
    startDate: Date,
    endDate: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

projectSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);

import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    remarks: { type: String },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },

    issueDate: { type: Date, default: Date.now, immutable: true },
    dueDate: { type: Date, required: false },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    remarks: { type: String },
    totalHours: { type: Number },
    totalMinutes: { type: Number },

    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
    },
    tags: [String],
  },
  { timestamps: true },
);

export default mongoose.model('Task', taskSchema);

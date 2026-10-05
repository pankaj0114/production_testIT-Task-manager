import mongoose from 'mongoose';

const wfhRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    startDate: {
      type: String,
      required: true,
    },

    endDate: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    adminComment: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('WfhRequest', wfhRequestSchema);

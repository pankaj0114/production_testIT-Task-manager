import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Always store YYYY-MM-DD
    dateKey: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['WFO', 'WFH', 'LEAVE'],
      required: true,
    },

    source: {
      type: String,
      enum: ['employee', 'admin', 'leave-approval'],
      default: 'employee',
    },
  },
  {
    timestamps: true,
  },
);

// One attendance record per employee per day
attendanceSchema.index({ employee: 1, dateKey: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);

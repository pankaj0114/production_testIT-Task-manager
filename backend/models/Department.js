import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // reference to the department head
    },
    isActive: {
      type: Boolean,
      default: true, // departments are active by default
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // who created this department
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model('Department', departmentSchema);

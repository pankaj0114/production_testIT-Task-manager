import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      default: 'system',
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;

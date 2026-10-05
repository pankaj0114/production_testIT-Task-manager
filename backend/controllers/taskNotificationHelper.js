import Notification from '../models/Notification.js';

export const createTaskChangeNotification = async ({
  req,
  task,
  message,
  recipientId = null,
}) => {
  try {
    if (!req?.user?.id || !task || !message) {
      return null;
    }

    const actorId = String(req.user.id);

    const assignedToId = task.assignedTo
      ? String(task.assignedTo._id || task.assignedTo)
      : '';

    const assignedById = task.assignedBy
      ? String(task.assignedBy._id || task.assignedBy)
      : '';

    if (!assignedToId || !assignedById || assignedToId === assignedById) {
      return null;
    }

    let finalRecipientId = recipientId;

    if (!finalRecipientId) {
      if (actorId === assignedToId) {
        finalRecipientId = assignedById;
      } else if (actorId === assignedById) {
        finalRecipientId = assignedToId;
      }
    }

    if (!finalRecipientId) {
      return null;
    }

    if (String(finalRecipientId) === actorId) {
      return null;
    }

    const notification = new Notification({
      recipient: finalRecipientId,
      sender: req.user.id,
      task: task._id,
      message,
    });

    await notification.save();

    const io = req.app.get('io');

    if (io) {
      io.to(String(finalRecipientId)).emit('newNotification', notification);
    }

    console.log('TASK NOTIFICATION CREATED:', {
      task: task._id,
      recipient: finalRecipientId,
      message,
    });

    return notification;
  } catch (error) {
    console.error('TASK CHANGE NOTIFICATION ERROR:', error);

    return null;
  }
};

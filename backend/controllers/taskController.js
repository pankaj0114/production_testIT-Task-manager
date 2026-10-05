import Task from '../../../TaskAssignmentProductionTest/backend/models/Task.js';
import { createTaskChangeNotification } from './taskNotificationHelper.js';

const canUpdateTask = (task, userId) => {
  if (!task || !userId) return false;

  const loggedInUserId = String(userId);

  const assignedById = task.assignedBy
    ? String(task.assignedBy._id || task.assignedBy)
    : '';

  const assignedToId = task.assignedTo
    ? String(task.assignedTo._id || task.assignedTo)
    : '';

  return loggedInUserId === assignedById || loggedInUserId === assignedToId;
};

// ===============================
// TITLE
// ===============================
export const updateAssignedTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (!canUpdateTask(task, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this task',
      });
    }

    task.title = title?.trim() || '';

    await task.save();

    await createTaskChangeNotification({
      req,
      task,
      message: `Task "${task.title}" title was changed.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Title updated successfully',
      task,
    });
  } catch (error) {
    console.error('UPDATE TITLE ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update title',
      error: error.message,
    });
  }
};

// ===============================
// DUE DATE
// ===============================
export const updateAssignedTaskDueDate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { dueDate } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const actorId = String(req.user.id);

    const assignedById = task.assignedBy
      ? String(task.assignedBy._id || task.assignedBy)
      : '';

    const assignedToId = task.assignedTo
      ? String(task.assignedTo._id || task.assignedTo)
      : '';

    if (actorId !== assignedById && actorId !== assignedToId) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this task',
      });
    }

    task.dueDate = dueDate ? new Date(dueDate) : null;

    await task.save();

    await createTaskChangeNotification({
      req,
      task,
      message: `Task "${task.title}" due date was changed.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Due date updated successfully',
      task,
    });
  } catch (error) {
    console.error('UPDATE DUE DATE ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update due date',
      error: error.message,
    });
  }
};

// ===============================
// STATUS
// ===============================
export const updateAssignedTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Not Started', 'In Progress', 'Completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (!canUpdateTask(task, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this task',
      });
    }

    task.status = status;

    await task.save();

    await createTaskChangeNotification({
      req,
      task,
      message: `Task "${task.title}" status was changed to ${status}.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      task,
    });
  } catch (error) {
    console.error('UPDATE STATUS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message,
    });
  }
};

// ===============================
// REMARKS
// ===============================
export const updateAssignedTaskRemarks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { remarks } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (!canUpdateTask(task, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this task',
      });
    }

    task.remarks = remarks || '';

    await task.save();

    await createTaskChangeNotification({
      req,
      task,
      message: `Task "${task.title}" remarks were changed.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Remarks updated successfully',
      task,
    });
  } catch (error) {
    console.error('UPDATE REMARKS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update remarks',
      error: error.message,
    });
  }
};

// ===============================
// CLIENT
// ===============================
export const updateAssignedTaskClient = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { client } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (!canUpdateTask(task, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this task',
      });
    }

    task.client = client || null;

    await task.save();

    await createTaskChangeNotification({
      req,
      task,
      message: `Task "${task.title}" client was changed.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      task,
    });
  } catch (error) {
    console.error('UPDATE CLIENT ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error.message,
    });
  }
};

// ===============================
// DELETE
// ===============================
export const deleteAssignedTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const actorId = String(req.user.id);

    const assignedById = task.assignedBy
      ? String(task.assignedBy._id || task.assignedBy)
      : '';

    const assignedToId = task.assignedTo
      ? String(task.assignedTo._id || task.assignedTo)
      : '';

    // Only assignedBy or assignedTo can delete
    if (actorId !== assignedById && actorId !== assignedToId) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to delete this task',
      });
    }

    const taskTitle = task.title;

    // Determine who should receive the notification
    let recipientId = null;

    if (actorId === assignedToId) {
      // Assigned employee deleted it
      // -> notify the person who assigned it
      recipientId = assignedById;
    } else if (actorId === assignedById) {
      // Person who assigned it deleted it
      // -> notify assigned employee
      recipientId = assignedToId;
    }

    // Send DELETE notification BEFORE deleting task
    if (
      recipientId &&
      recipientId !== actorId &&
      assignedById !== assignedToId
    ) {
      await createTaskChangeNotification({
        req,
        task,
        recipientId,
        message: `Task "${taskTitle}" was deleted.`,
      });
    }

    // Now delete task
    await Task.findByIdAndDelete(taskId);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      deletedTaskId: taskId,
    });
  } catch (error) {
    console.error('DELETE ASSIGNED TASK ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message,
    });
  }
};

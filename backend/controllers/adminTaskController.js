//import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import User from '../models/User.js';

// =====================================================
// GET ALL TASKS FOR ADMIN
// GET /api/admin/tasks
// =====================================================

export const getAllAdminTasks = async (req, res) => {
  try {
    const tasks = await Task.find({})
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('client', 'name email company')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('GET ALL ADMIN TASKS ERROR:', error);

    res.status(500).json({
      message: 'Failed to fetch admin tasks',
      error: error.message,
    });
  }
};

// =====================================================
// GET MY TASKS
// Tasks assigned TO the logged-in admin
//
// GET /api/admin/my-tasks
// =====================================================

export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user.id,
    })
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('client', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('GET MY TASKS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch my tasks',
    });
  }
};
// =====================================================
// GET TASKS ASSIGNED BY ME
// Tasks where logged-in admin is assignedBy
//
// GET /api/admin/assigned-tasks
// =====================================================

export const getAssignedTasks = async (req, res) => {
  try {
    const adminId = req.user._id;

    const tasks = await Task.find({
      assignedBy: adminId,
    })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('client', 'name email company')
      .sort({
        dueDate: 1,
        createdAt: -1,
      });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('GET ASSIGNED TASKS ERROR:', error);

    res.status(500).json({
      message: 'Failed to fetch assigned tasks',
      error: error.message,
    });
  }
};

// ==========================================
// CREATE MY TASK
// ==========================================
export const createMyTask = async (req, res) => {
  try {
    const adminId = req.user.id;

    const { title, dueDate, client, assignedBy } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required',
      });
    }

    if (!assignedBy) {
      return res.status(400).json({
        success: false,
        message: 'Assigned By employee is required',
      });
    }

    // Verify selected employee exists
    const assigningEmployee = await User.findById(assignedBy);

    if (!assigningEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Assigned By employee not found',
      });
    }

    // Only employees can be selected
    if (assigningEmployee.role !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Assigned By must be an employee',
      });
    }

    // Validate client if selected
    if (client) {
      const clientExists = await Client.findById(client);

      if (!clientExists) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }
    }

    const task = await Task.create({
      title: title.trim(),

      // Date task was created/assigned
      issueDate: new Date(),

      dueDate,

      client: client || null,

      // Employee selected in the form
      assignedBy: assigningEmployee._id,

      // Logged-in admin
      assignedTo: adminId,

      status: 'Not Started',

      priority: 'Medium',

      remarks: '',

      totalHours: 0,

      totalMinutes: 0,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('client', 'name company')
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email');

    return res.status(201).json({
      success: true,
      message: 'My task created successfully',
      task: populatedTask,
    });
  } catch (error) {
    console.error('CREATE MY TASK ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create my task',
      error: error.message,
    });
  }
};

export const getAdminClients = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ name: 1 });

    return res.status(200).json(clients);
  } catch (error) {
    console.error('GET ADMIN CLIENTS ERROR:', error);

    return res.status(500).json({
      message: 'Failed to fetch clients',
      error: error.message,
    });
  }
};

export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ name: 1 });

    return res.status(200).json(clients);
  } catch (error) {
    console.error('GET CLIENTS ERROR:', error);

    return res.status(500).json({
      message: 'Failed to fetch clients',
      error: error.message,
    });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, totalHours, totalMinutes } = req.body;

    const allowedStatuses = ['Not Started', 'In Progress', 'Completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid task status',
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    task.status = status;

    // Only save time when task is completed
    if (status === 'Completed') {
      if (totalHours === undefined || totalMinutes === undefined) {
        return res.status(400).json({
          message: 'Total hours and minutes are required',
        });
      }

      task.totalHours = Number(totalHours);
      task.totalMinutes = Number(totalMinutes);
    }

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('client', 'name email company');

    return res.status(200).json({
      message: 'Task status updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('UPDATE TASK STATUS ERROR:', error);

    return res.status(500).json({
      message: 'Failed to update task status',
      error: error.message,
    });
  }
};

export const getEmployeesForTaskAssignment = async (req, res) => {
  try {
    const employees = await User.find({
      role: 'employee',
    })
      .select('_id name email')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error('GET EMPLOYEES FOR TASK ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message,
    });
  }
};

export const updateMyTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Make sure this task belongs to the logged-in admin
    if (task.assignedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this task',
      });
    }

    task.title = title.trim();

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('client', 'name company')
      .populate('assignedBy', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Task title updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('UPDATE TITLE ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update task title',
      error: error.message,
    });
  }
};

export const updateMyTaskDueDate = async (req, res) => {
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

    if (task.assignedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this task',
      });
    }

    task.dueDate = dueDate || null;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('client', 'name company')
      .populate('assignedBy', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Due date updated successfully',
      task: updatedTask,
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

export const updateMyTaskClient = async (req, res) => {
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

    if (task.assignedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this task',
      });
    }

    if (client) {
      const clientExists = await Client.findById(client);

      if (!clientExists) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }
    }

    task.client = client || null;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('client', 'name company')
      .populate('assignedBy', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      task: updatedTask,
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

export const updateMyTaskRemarks = async (req, res) => {
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

    if (task.assignedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this task',
      });
    }

    task.remarks = remarks || '';

    await task.save();

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

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, dueDate, client, remarks } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (title !== undefined) {
      task.title = title;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }

    if (client !== undefined) {
      task.client = client || null;
    }

    if (remarks !== undefined) {
      task.remarks = remarks;
    }

    await task.save();

    await task.populate('assignedBy', 'name email');
    await task.populate('assignedTo', 'name email');
    await task.populate('client', 'name');

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('UPDATE TASK ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
    });
  }
};

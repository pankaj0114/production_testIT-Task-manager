// controllers/adminController.js

import bcrypt from 'bcryptjs';
import User from '../../../TaskAssignmentProductionTest/backend/models/User.js';
import Client from '../../../TaskAssignmentProductionTest/backend/models/Client.js';
import Task from '../../../TaskAssignmentProductionTest/backend/models/Task.js';

export const registerEmployee = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, dateOfJoining } = req.body;

    if (!name || !email || !password || !confirmPassword || !dateOfJoining) {
      return res.status(400).json({
        message: 'All fields are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists',
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'employee',
      dateOfJoining,
    });

    await employee.save();

    return res.status(201).json({
      message: 'Employee registered successfully',

      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        dateOfJoining: employee.dateOfJoining,

        // Only for immediate frontend display
        passwordForDisplay: password,
      },
    });
  } catch (error) {
    console.error('Register employee error:', error);

    return res.status(500).json({
      message: 'Server error while registering employee',
    });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: 'employee',
    }).select('name email dateOfJoining');

    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);

    res.status(500).json({
      message: 'Failed to fetch employees',
    });
  }
};

export const createClient = async (req, res) => {
  try {
    const { name, email, company } = req.body;

    if (!name || !email || !company) {
      return res.status(400).json({
        message: 'Client name, email and company are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingClient = await Client.findOne({
      email: normalizedEmail,
    });

    if (existingClient) {
      return res.status(400).json({
        message: 'A client with this email already exists.',
      });
    }

    const client = new Client({
      name: name.trim(),
      email: normalizedEmail,
      company: company.trim(),
      assignedTo: null,
    });

    await client.save();

    return res.status(201).json({
      message: 'Client created successfully.',
      client,
    });
  } catch (error) {
    console.error('Create client error:', error);

    return res.status(500).json({
      message: 'Failed to create client.',
    });
  }
};
export const assignClientToEmployees = async (req, res) => {
  try {
    const { clientId, employeeIds } = req.body;

    console.log('Assign client request:', {
      clientId,
      employeeIds,
    });

    if (!clientId) {
      return res.status(400).json({
        message: 'Client is required.',
      });
    }

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        message: 'At least one employee must be selected.',
      });
    }

    // Verify that all selected IDs belong to employees
    const employees = await User.find({
      _id: { $in: employeeIds },
      role: 'employee',
    }).select('_id name email');

    if (employees.length !== employeeIds.length) {
      return res.status(400).json({
        message: 'One or more selected employees are invalid.',
      });
    }

    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        message: 'Client not found.',
      });
    }

    // Replace current assignment with the selected employees
    client.assignedTo = employeeIds;

    await client.save();

    const updatedClient = await Client.findById(client._id).populate(
      'assignedTo',
      'name email',
    );

    return res.status(200).json({
      // message: 'Client assigned successfully.',
      client: updatedClient,
    });
  } catch (error) {
    console.error('Assign client error:', error);

    return res.status(500).json({
      message: 'Failed to assign client.',
      error: error.message,
    });
  }
};

export const getAdminClients = async (req, res) => {
  try {
    const clients = await Client.find()
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching admin clients:', error);

    return res.status(500).json({
      message: 'Failed to fetch clients',
      error: error.message,
    });
  }
};

export const getAllAdminTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('client', 'name company')
      .sort({ createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Get all admin tasks error:', error);

    return res.status(500).json({
      message: 'Failed to fetch all tasks',
    });
  }
};

export const deleteAdminTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: 'Task ID is required',
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    await Task.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Task deleted successfully',
      taskId: id,
    });
  } catch (error) {
    console.error('Delete admin task error:', error);

    return res.status(500).json({
      message: 'Failed to delete task',
    });
  }
};

// ==========================================
// GET EMPLOYEE PERFORMANCE
// ==========================================

export const getEmployeePerformance = async (req, res) => {
  try {
    // Get all employees
    const employees = await User.find({
      role: 'employee',
    }).select('_id name email');

    // Get completed-task totals grouped by employee
    const performanceData = await Task.aggregate([
      {
        $match: {
          status: 'Completed',
          assignedTo: { $ne: null },
        },
      },

      {
        $group: {
          _id: '$assignedTo',

          completedTasks: {
            $sum: 1,
          },

          totalMinutesSpent: {
            $sum: {
              $add: [
                {
                  $multiply: [
                    {
                      $ifNull: ['$totalHours', 0],
                    },
                    60,
                  ],
                },
                {
                  $ifNull: ['$totalMinutes', 0],
                },
              ],
            },
          },
        },
      },
    ]);

    // Convert ObjectId -> performance object
    const performanceMap = new Map();

    performanceData.forEach((item) => {
      performanceMap.set(String(item._id), {
        completedTasks: item.completedTasks || 0,

        totalMinutesSpent: item.totalMinutesSpent || 0,
      });
    });

    // Include employees with ZERO completed tasks too
    const result = employees.map((employee) => {
      const data = performanceMap.get(String(employee._id)) || {
        completedTasks: 0,
        totalMinutesSpent: 0,
      };

      const totalMinutes = data.totalMinutesSpent;

      const totalHours = Math.floor(totalMinutes / 60);

      const remainingMinutes = totalMinutes % 60;

      const averageMinutes =
        data.completedTasks > 0
          ? Math.round(totalMinutes / data.completedTasks)
          : 0;

      const averageHours = Math.floor(averageMinutes / 60);

      const averageRemainingMinutes = averageMinutes % 60;

      return {
        employeeId: employee._id,
        name: employee.name,
        email: employee.email,

        completedTasks: data.completedTasks,

        totalHours,

        totalMinutes: remainingMinutes,

        totalMinutesSpent: totalMinutes,

        averageTime:
          data.completedTasks > 0
            ? `${averageHours}h ${averageRemainingMinutes}m`
            : '—',
      };
    });

    // Highest completed tasks first
    result.sort((a, b) => b.completedTasks - a.completedTasks);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Employee performance error:', error);

    return res.status(500).json({
      message: 'Failed to fetch employee performance.',
    });
  }
};

export const resetEmployeePassword = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        message: 'New password is required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found',
      });
    }

    // Make sure admin can only reset employee passwords
    if (employee.role !== 'employee') {
      return res.status(403).json({
        message: 'You can only reset employee passwords',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    employee.password = hashedPassword;

    await employee.save();

    return res.status(200).json({
      message: 'Employee password reset successfully',
    });
  } catch (error) {
    console.error('RESET EMPLOYEE PASSWORD ERROR:', error);

    return res.status(500).json({
      message: 'Failed to reset employee password',
      error: error.message,
    });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const { name, email, dateOfJoining } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        message: 'Employee ID is required.',
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Employee name is required.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: 'Employee email is required.',
      });
    }

    if (!dateOfJoining) {
      return res.status(400).json({
        message: 'Date of joining is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether another employee already uses this email
    const existingEmployee = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: employeeId },
    });

    if (existingEmployee) {
      return res.status(409).json({
        message: 'Another employee already uses this email.',
      });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found.',
      });
    }

    employee.name = name.trim();
    employee.email = normalizedEmail;
    employee.dateOfJoining = dateOfJoining;

    await employee.save();

    return res.status(200).json({
      message: 'Employee details updated successfully.',
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        dateOfJoining: employee.dateOfJoining,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error('UPDATE EMPLOYEE ERROR:', error);

    return res.status(500).json({
      message: 'Failed to update employee details.',
      error: error.message,
    });
  }
};

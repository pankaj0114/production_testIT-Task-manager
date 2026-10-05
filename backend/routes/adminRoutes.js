import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

import {
  registerEmployee,
  getEmployees,
  getAdminClients,
  assignClientToEmployees,
  createClient,
  getAllAdminTasks,
  deleteAdminTask,
  getEmployeePerformance,
  resetEmployeePassword,
  updateEmployee,
} from '../controllers/adminController.js';

import {
  getMyTasks,
  getAssignedTasks,
  createMyTask,
  getAllClients,
  updateTaskStatus,
  getEmployeesForTaskAssignment,
  updateMyTaskTitle,
  updateMyTaskDueDate,
  updateMyTaskClient,
  updateMyTaskRemarks,
  updateTask,
} from '../controllers/adminTaskController.js';

//import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/register-employee',
  authMiddleware,
  adminMiddleware,
  registerEmployee,
);

router.get('/clients', authMiddleware, adminMiddleware, getAdminClients);

router.post('/clients', authMiddleware, adminMiddleware, createClient);

router.put(
  '/clients/assign',
  authMiddleware,
  adminMiddleware,
  assignClientToEmployees,
);
router.get('/tasks', authMiddleware, adminMiddleware, getAllAdminTasks);

router.delete('/tasks/:id', authMiddleware, adminMiddleware, deleteAdminTask);
router.get('/employees', authMiddleware, adminMiddleware, getEmployees);

router.get(
  '/employee-performance',
  authMiddleware,
  adminMiddleware,
  getEmployeePerformance,
);

router.get('/tasks', authMiddleware, adminMiddleware, getAllAdminTasks);

// =====================================================
// GET MY TASKS
// Tasks assigned TO the logged-in admin
// GET /api/admin/tasks/my
// =====================================================

router.get('/tasks/my', authMiddleware, adminMiddleware, getMyTasks);

// =====================================================
// GET ASSIGNED TASKS
// Tasks assigned BY the logged-in admin
// GET /api/admin/tasks/assigned
// =====================================================

router.get(
  '/tasks/assigned',
  authMiddleware,
  adminMiddleware,
  getAssignedTasks,
);

router.post('/tasks/my', authMiddleware, adminMiddleware, createMyTask);

//router.get('/clients', authMiddleware, adminMiddleware, getAdminClients);
router.get('/clients', authMiddleware, adminMiddleware, getAllClients);

router.put(
  '/tasks/:taskId/status',
  authMiddleware,
  adminMiddleware,
  updateTaskStatus,
);

router.put(
  '/employees/:employeeId/reset-password',
  authMiddleware,
  adminMiddleware,
  resetEmployeePassword,
);

router.get(
  '/employees/task-assignment',
  authMiddleware,
  adminMiddleware,
  getEmployeesForTaskAssignment,
);

router.post('/tasks/my', authMiddleware, adminMiddleware, createMyTask);

router.get('/tasks/my', authMiddleware, adminMiddleware, getMyTasks);

router.put(
  '/tasks/my/:taskId/title',
  authMiddleware,
  adminMiddleware,
  updateMyTaskTitle,
);

router.put(
  '/tasks/my/:taskId/due-date',
  authMiddleware,
  adminMiddleware,
  updateMyTaskDueDate,
);

router.put(
  '/tasks/my/:taskId/client',
  authMiddleware,
  adminMiddleware,
  updateMyTaskClient,
);

router.put(
  '/tasks/my/:taskId/remarks',
  authMiddleware,
  adminMiddleware,
  updateMyTaskRemarks,
);

router.put('/tasks/:taskId', authMiddleware, adminMiddleware, updateTask);

router.put(
  '/employees/:employeeId',
  authMiddleware,
  adminMiddleware,
  updateEmployee,
);
export default router;

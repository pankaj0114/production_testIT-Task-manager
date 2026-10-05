import express from 'express';

import {
  getAttendanceEmployees,
  getEmployeeMonthlyAttendance,
  adminSetAttendance,
  adminSetOwnAttendance,
  getAdminOwnAttendance,
  getPendingLeaveRequests,
  handleLeaveRequest,
  reviewLeaveRequest,
} from '../controllers/attendanceController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

/*
=========================================================
EMPLOYEES
=========================================================
*/

router.get(
  '/employees',
  authMiddleware,
  adminMiddleware,
  getAttendanceEmployees,
);

/*
=========================================================
EMPLOYEE MONTHLY ATTENDANCE
=========================================================
*/

router.get(
  '/employee/:employeeId',
  authMiddleware,
  adminMiddleware,
  getEmployeeMonthlyAttendance,
);

/*
=========================================================
ADMIN MANAGES EMPLOYEE ATTENDANCE
=========================================================
*/

router.put(
  '/employee/:employeeId',
  authMiddleware,
  adminMiddleware,
  adminSetAttendance,
);

/*
=========================================================
ADMIN OWN ATTENDANCE
=========================================================
*/

router.get('/my', authMiddleware, adminMiddleware, getAdminOwnAttendance);

router.put('/my', authMiddleware, adminMiddleware, adminSetOwnAttendance);

/*
=========================================================
LEAVE REQUESTS
=========================================================
*/

router.get(
  '/leave-requests',
  authMiddleware,
  adminMiddleware,
  getPendingLeaveRequests,
);

router.put(
  '/leave-requests/:attendanceId',
  authMiddleware,
  adminMiddleware,
  handleLeaveRequest,
);

router.put(
  '/admin/leave-requests/:requestId',
  authMiddleware,
  adminMiddleware,
  reviewLeaveRequest,
);

export default router;

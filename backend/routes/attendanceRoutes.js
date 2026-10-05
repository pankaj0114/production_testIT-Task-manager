import express from 'express';
import LeaveRequest from '../models/LeaveRequest.js';
import WfhRequest from '../models/WfhRequest.js';

import {
  getMyAttendance,
  markAttendance,
  requestLeave,
  getLeaveRequestsForAdmin,
  reviewLeaveRequest,
  requestWfh,
  getWfhRequestsForAdmin,
  reviewWfhRequest,
} from '../controllers/attendanceController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------
| EMPLOYEE
|--------------------------------------------------------------------------
*/

router.get('/my', authMiddleware, getMyAttendance);

router.put('/my', authMiddleware, markAttendance);

router.post('/leave-requests', authMiddleware, requestLeave);

router.post('/wfh-requests', authMiddleware, requestWfh);

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

router.get(
  '/admin/leave-requests',
  authMiddleware,
  adminMiddleware,
  getLeaveRequestsForAdmin,
);

router.put(
  '/admin/leave-requests/:requestId',
  authMiddleware,
  adminMiddleware,
  reviewLeaveRequest,
);

router.get(
  '/admin/wfh-requests',
  authMiddleware,
  adminMiddleware,
  getWfhRequestsForAdmin,
);

router.put(
  '/admin/wfh-requests/:requestId',
  authMiddleware,
  adminMiddleware,
  reviewWfhRequest,
);

router.delete(
  '/leave-requests/:requestId',
  authMiddleware,
  async (req, res) => {
    try {
      const request = await LeaveRequest.findOne({
        _id: req.params.requestId,
        employee: req.user.id,
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found.',
        });
      }

      await LeaveRequest.deleteOne({
        _id: request._id,
      });

      return res.status(200).json({
        success: true,
        message: 'Leave request deleted successfully.',
      });
    } catch (error) {
      console.error('DELETE LEAVE REQUEST ERROR:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to delete leave request.',
        error: error.message,
      });
    }
  },
);

router.delete('/wfh-requests/:requestId', authMiddleware, async (req, res) => {
  try {
    const request = await WfhRequest.findOne({
      _id: req.params.requestId,
      employee: req.user.id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'WFH request not found.',
      });
    }

    await WfhRequest.deleteOne({
      _id: request._id,
    });

    return res.status(200).json({
      success: true,
      message: 'WFH request deleted successfully.',
    });
  } catch (error) {
    console.error('DELETE WFH REQUEST ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete WFH request.',
      error: error.message,
    });
  }
});

export default router;

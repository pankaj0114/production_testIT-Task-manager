import express from 'express';
import Notification from '../models/Notification.js';
import authMiddleware from '../middleware/authMiddleware.js';

import {
  getMyNotifications,
  markNotificationsAsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

console.log('NOTIFICATION ROUTES LOADED');

// =====================================================
// GET MY NOTIFICATIONS
// Works for BOTH admin and employee
// =====================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('========== FETCH NOTIFICATIONS ==========');
    console.log('Logged-in user:', req.user);
    console.log('User ID:', req.user?.id);
    console.log('User role:', req.user?.role);

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .populate('sender', 'name email firstName lastName')
      .populate('task', 'title')
      .sort({ createdAt: -1 });

    console.log('Notifications found:', notifications.length);

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('========== FETCH NOTIFICATIONS ERROR ==========');
    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
});

// =====================================================
// MARK ALL MY NOTIFICATIONS AS READ
// =====================================================
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user.id,
        isRead: { $ne: true },
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    console.log('========== MARK ALL READ ==========');
    console.log('User:', req.user.id);
    console.log('Matched:', result.matchedCount);
    console.log('Modified:', result.modifiedCount);
    console.log('===================================');

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('MARK ALL READ ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message,
    });
  }
});

// =====================================================
// DELETE ONE NOTIFICATION
// Deletes ONLY the notification, NOT the task
// =====================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notificationId = req.params.id;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required',
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    console.log('Notification deleted:', notificationId);

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      notificationId,
    });
  } catch (error) {
    console.error('========== DELETE NOTIFICATION ERROR ==========');
    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Server error while deleting notification',
      error: error.message,
    });
  }
});

export default router;

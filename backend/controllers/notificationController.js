import Notification from '../models/Notification.js';

// ==========================================
// GET MY NOTIFICATIONS
// ==========================================

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .populate('sender', 'name email role')
      .sort({
        createdAt: -1,
      });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);

    res.status(500).json({
      message: 'Failed to fetch notifications.',
    });
  }
};

// ==========================================
// MARK ALL AS READ
// ==========================================

export const markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    return res.status(200).json({
      message: 'Notifications marked as read.',
    });
  } catch (error) {
    console.error('MARK NOTIFICATIONS READ ERROR:', error);

    return res.status(500).json({
      message: 'Failed to mark notifications as read.',
    });
  }
};

export const getAdminNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required.',
      });
    }

    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .populate('sender', 'name email role')
      .sort({
        createdAt: -1,
      });

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Get admin notifications error:', error);

    return res.status(500).json({
      message: 'Failed to fetch notifications.',
    });
  }
};

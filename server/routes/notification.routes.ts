import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  getGiftNotificationSettings,
  updateGiftNotificationSettings
} from '../controllers/notification.controller';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Todas as rotas requerem autenticação
router.use(auth);

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', getNotifications);

// @route   GET /api/notifications/unread/count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread/count', getUnreadNotificationsCount);

// @route   GET /api/notifications/settings
// @desc    Get notification settings
// @access  Private
router.get('/settings', getNotificationSettings);

// @route   PUT /api/notifications/settings
// @desc    Update notification settings
// @access  Private
router.put(
  '/settings',
  [
    body('settings', 'Settings object is required').isObject(),
    validateRequest
  ],
  updateNotificationSettings
);

// @route   PUT /api/notifications/:notificationId/read
// @desc    Mark a notification as read
// @access  Private
router.put(
  '/:notificationId/read',
  [
    param('notificationId').isMongoId().withMessage('Invalid notification ID'),
    validateRequest
  ],
  markNotificationAsRead
);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', markAllNotificationsAsRead);

// @route   GET /api/notifications/settings/gifts
// @desc    Get gift notification settings
// @access  Private
router.get('/settings/gifts', getGiftNotificationSettings);

// @route   PUT /api/notifications/settings/gifts
// @desc    Update gift notification settings
// @access  Private
router.put(
  '/settings/gifts',
  [
    body('settings', 'Settings object is required').isObject(),
    validateRequest
  ],
  updateGiftNotificationSettings
);

export default router;

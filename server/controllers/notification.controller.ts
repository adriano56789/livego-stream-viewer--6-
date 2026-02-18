import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { NotFoundError, BadRequestError } from '../errors/request-validation-error';
import Notification, { NotificationType, INotification } from '../routes/models/Notification';
import User from '../routes/models/User';

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS = {
  email: true,
  push: true,
  inApp: true,
  sound: true,
  vibrate: true,
  minGiftAmount: 0,
  showGifterInfo: true,
  notificationTypes: {
    [NotificationType.NEW_FOLLOWER]: true,
    [NotificationType.GIFT_RECEIVED]: true,
    [NotificationType.STREAM_STARTED]: true,
    [NotificationType.DIAMOND_RECEIVED]: true,
    [NotificationType.SYSTEM_ANNOUNCEMENT]: true,
    [NotificationType.STREAM_RECOMMENDATION]: true
  }
};

// Helper function to get user notification settings with defaults
const getUserNotificationSettings = async (userId: string) => {
  const user = await User.findById(userId).select('settings.notifications');
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(user.settings?.notifications || {})
  };
};

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for the authenticated user
 * @access  Private
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestError('User not authenticated');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get notifications with pagination and sort by creation date (newest first)
    const [notifications, total] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedUser', 'name avatar')
        .populate('relatedStream', 'title thumbnail'),
      
      Notification.countDocuments({ user: userId })
    ]);

    res.json({
      notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @route   GET /api/notifications/settings
 * @desc    Get notification settings for the authenticated user
 * @access  Private
 */
export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestError('User not authenticated');
    
    const settings = await getUserNotificationSettings(userId);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching notification settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @route   PUT /api/notifications/settings
 * @desc    Update notification settings for the authenticated user
 * @access  Private
 */
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestError('User not authenticated');
    
    const {
      email,
      push,
      inApp,
      sound,
      vibrate,
      minGiftAmount,
      showGifterInfo,
      notificationTypes
    } = req.body;

    // Validate notification types if provided
    if (notificationTypes) {
      const validTypes = Object.values(NotificationType);
      const invalidTypes = Object.keys(notificationTypes).filter(
        type => !validTypes.includes(type as NotificationType)
      );
      
      if (invalidTypes.length > 0) {
        throw new BadRequestError(`Invalid notification types: ${invalidTypes.join(', ')}`);
      }
    }

    // Update user settings
    const update: any = { $set: { 'settings.notifications': {} } };
    
    // Only update provided fields
    if (email !== undefined) update.$set['settings.notifications.email'] = email;
    if (push !== undefined) update.$set['settings.notifications.push'] = push;
    if (inApp !== undefined) update.$set['settings.notifications.inApp'] = inApp;
    if (sound !== undefined) update.$set['settings.notifications.sound'] = sound;
    if (vibrate !== undefined) update.$set['settings.notifications.vibrate'] = vibrate;
    if (minGiftAmount !== undefined) update.$set['settings.notifications.minGiftAmount'] = Math.max(0, minGiftAmount);
    if (showGifterInfo !== undefined) update.$set['settings.notifications.showGifterInfo'] = showGifterInfo;
    if (notificationTypes) {
      update.$set['settings.notifications.notificationTypes'] = {
        ...DEFAULT_NOTIFICATION_SETTINGS.notificationTypes,
        ...notificationTypes
      };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      update,
      { new: true, runValidators: true }
    ).select('settings.notifications');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: user.settings?.notifications || DEFAULT_NOTIFICATION_SETTINGS
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    const status = error instanceof BadRequestError ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating notification settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Private
 */
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) throw new BadRequestError('User not authenticated');
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { 
        $set: { 
          isRead: true,
          readAt: new Date() 
        } 
      },
      { new: true }
    )
    .populate('relatedUser', 'name avatar')
    .populate('relatedStream', 'title thumbnail');
    
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    
    // Emit real-time update via WebSocket if needed
    // req.app.get('io').to(`user:${userId}`).emit('notification:updated', notification);
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    const status = error instanceof NotFoundError ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error marking notification as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read for the authenticated user
 * @access  Private
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestError('User not authenticated');
    
    // Mark all unread notifications as read
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { 
        $set: { 
          isRead: true,
          readAt: new Date() 
        } 
      },
      { session }
    );
    
    // Update user's unread count
    await User.findByIdAndUpdate(
      userId,
      { $set: { 'notifications.$[].read': true } },
      { session }
    );
    
    await session.commitTransaction();
    
    // Emit real-time update via WebSocket if needed
    // req.app.get('io').to(`user:${userId}`).emit('notifications:all-read');
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    session.endSession();
  }
};

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications for the authenticated user
 * @access  Private
 */
export const getUnreadNotificationsCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestError('User not authenticated');
    
    const count = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread notifications count',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @route   GET /api/notifications/settings/gifts
 * @desc    Get gift notification settings for the authenticated user
 * @access  Private
 */
export const getGiftNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestError('User not authenticated');
    
    const settings = await getUserNotificationSettings(userId);
    const { minGiftAmount, showGifterInfo, ...rest } = settings;
    
    res.json({
      success: true,
      data: {
        ...rest,
        minGiftAmount,
        showGifterInfo
      }
    });
  } catch (error) {
    console.error('Error getting gift notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gift notification settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @route   PUT /api/notifications/settings/gifts
 * @desc    Update gift notification settings for the authenticated user
 * @access  Private
 */
export const updateGiftNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestError('User not authenticated');
    
    const { 
      minGiftAmount,
      showGifterInfo,
      ...otherSettings 
    } = req.body;
    
    // Validate minimum gift amount
    if (minGiftAmount !== undefined && (isNaN(minGiftAmount) || minGiftAmount < 0)) {
      throw new BadRequestError('Invalid minimum gift amount');
    }
    
    // Prepare update object
    const update: any = { $set: { 'settings.notifications': {} } };
    
    // Only update provided fields
    if (minGiftAmount !== undefined) {
      update.$set['settings.notifications.minGiftAmount'] = Math.max(0, minGiftAmount);
    }
    
    if (showGifterInfo !== undefined) {
      update.$set['settings.notifications.showGifterInfo'] = showGifterInfo;
    }
    
    // Update other notification settings if provided
    Object.entries(otherSettings).forEach(([key, value]) => {
      if (key in DEFAULT_NOTIFICATION_SETTINGS) {
        update.$set[`settings.notifications.${key}`] = value;
      }
    });
    
    const user = await User.findByIdAndUpdate(
      userId,
      update,
      { new: true, runValidators: true }
    ).select('settings.notifications');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    res.json({
      success: true,
      data: {
        ...(user.settings?.notifications || DEFAULT_NOTIFICATION_SETTINGS),
        minGiftAmount: user.settings?.notifications?.minGiftAmount ?? DEFAULT_NOTIFICATION_SETTINGS.minGiftAmount,
        showGifterInfo: user.settings?.notifications?.showGifterInfo ?? DEFAULT_NOTIFICATION_SETTINGS.showGifterInfo
      }
    });
  } catch (error) {
    console.error('Error updating gift notification settings:', error);
    const status = error instanceof BadRequestError ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating gift notification settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Helper function to create a new notification
 * This can be used by other parts of the application to create notifications
 */
export const createNotification = async (notificationData: {
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedUser?: string;
  relatedStream?: string;
  metadata?: any;
  expiresAt?: Date;
}): Promise<INotification> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check if user exists and get their notification settings
    // Convert string IDs to ObjectId
    const userId = new Types.ObjectId(notificationData.user);
    const relatedUserId = notificationData.relatedUser ? new Types.ObjectId(notificationData.relatedUser) : undefined;
    
    const user = await User.findById(userId)
      .select('settings.notifications blockedUsers')
      .session(session);
      
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Check if the related user is blocked (using the converted ObjectId)
    if (relatedUserId && user.blockedUsers?.some(id => id.equals(relatedUserId))) {
      throw new Error('Cannot send notification to blocked user');
    }
    
    // Get user notification settings with defaults
    const settings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(user.settings?.notifications || {})
    };
    
    // Check if this type of notification is enabled for the user
    if (!settings.notificationTypes?.[notificationData.type]) {
      throw new Error(`Notification type ${notificationData.type} is disabled for this user`);
    }
    
    // For gift notifications, check minimum amount
    if (notificationData.type === NotificationType.GIFT_RECEIVED) {
      const giftAmount = notificationData.metadata?.amount || 0;
      if (giftAmount < (settings.minGiftAmount || 0)) {
        throw new Error(`Gift amount ${giftAmount} is below minimum threshold`);
      }
      
      // Hide gifter info if disabled in settings
      if (!settings.showGifterInfo) {
        notificationData.relatedUser = undefined;
        notificationData.metadata = { ...(notificationData.metadata || {}), hideGifter: true };
      }
    }
    
    // Create the notification
    const notification = new Notification({
      ...notificationData,
      user: userId,
      relatedUser: relatedUserId,
      relatedStream: notificationData.relatedStream ? new Types.ObjectId(notificationData.relatedStream) : undefined,
      isRead: false,
      readAt: null,
      expiresAt: notificationData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
    });
    
    await notification.save({ session });
    
    // Update user's unread notifications count
    await User.findByIdAndUpdate(
      notificationData.user,
      { $inc: { 'unreadNotifications': 1 } },
      { session }
    );
    
    await session.commitTransaction();
    
    // Emit real-time notification if needed
    // const io = require('../server').io;
    // io.to(`user:${notificationData.user}`).emit('notification:new', notification);
    
    return notification;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating notification:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

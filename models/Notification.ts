import mongoose, { Document } from 'mongoose';

export enum NotificationType {
  NEW_FOLLOWER = 'new_follower',
  GIFT_RECEIVED = 'gift_received',
  STREAM_STARTED = 'stream_started',
  DIAMOND_RECEIVED = 'diamond_received',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  STREAM_RECOMMENDATION = 'stream_recommendation'
}

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedUser?: mongoose.Types.ObjectId;
  relatedStream?: mongoose.Types.ObjectId;
  metadata?: any;
  expiresAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  type: { 
    type: String, 
    enum: Object.values(NotificationType), 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  relatedUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  relatedStream: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Stream' 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  },
  expiresAt: { 
    type: Date 
  },
  readAt: { 
    type: Date 
  }
}, {
  timestamps: true
});

// TTL index to automatically remove expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster unread notifications query
notificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);

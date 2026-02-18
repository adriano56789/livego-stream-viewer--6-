import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotificationSettings extends Document {
  user: Types.ObjectId;
  email: {
    enabled: boolean;
    newFollower: boolean;
    streamLive: boolean;
    streamSchedule: boolean;
    donationReceived: boolean;
    subscriptionRenewal: boolean;
    newsletter: boolean;
  };
  push: {
    enabled: boolean;
    newFollower: boolean;
    streamLive: boolean;
    streamOffline: boolean;
    donationReceived: boolean;
    subscriptionRenewal: boolean;
    chatMention: boolean;
    chatMessage: boolean;
  };
  inApp: {
    enabled: boolean;
    newFollower: boolean;
    streamLive: boolean;
    streamOffline: boolean;
    donationReceived: boolean;
    subscriptionRenewal: boolean;
    chatMention: boolean;
    chatMessage: boolean;
    newComment: boolean;
    commentReply: boolean;
    raidNotification: boolean;
    hostNotification: boolean;
  };
  sound: {
    enabled: boolean;
    volume: number;
    newMessage: string;
    donation: string;
    raid: string;
    follower: string;
  };
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: number[]; // 0 (Domingo) a 6 (Sábado)
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSettingsSchema = new Schema<INotificationSettings>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    email: {
      enabled: { type: Boolean, default: true },
      newFollower: { type: Boolean, default: true },
      streamLive: { type: Boolean, default: true },
      streamSchedule: { type: Boolean, default: true },
      donationReceived: { type: Boolean, default: true },
      subscriptionRenewal: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true },
    },
    push: {
      enabled: { type: Boolean, default: true },
      newFollower: { type: Boolean, default: true },
      streamLive: { type: Boolean, default: true },
      streamOffline: { type: Boolean, default: true },
      donationReceived: { type: Boolean, default: true },
      subscriptionRenewal: { type: Boolean, default: true },
      chatMention: { type: Boolean, default: true },
      chatMessage: { type: Boolean, default: true },
    },
    inApp: {
      enabled: { type: Boolean, default: true },
      newFollower: { type: Boolean, default: true },
      streamLive: { type: Boolean, default: true },
      streamOffline: { type: Boolean, default: true },
      donationReceived: { type: Boolean, default: true },
      subscriptionRenewal: { type: Boolean, default: true },
      chatMention: { type: Boolean, default: true },
      chatMessage: { type: Boolean, default: true },
      newComment: { type: Boolean, default: true },
      commentReply: { type: Boolean, default: true },
      raidNotification: { type: Boolean, default: true },
      hostNotification: { type: Boolean, default: true },
    },
    sound: {
      enabled: { type: Boolean, default: true },
      volume: { type: Number, default: 50, min: 0, max: 100 },
      newMessage: { type: String, default: 'default' },
      donation: { type: String, default: 'cash-register' },
      raid: { type: String, default: 'trumpet' },
      follower: { type: String, default: 'bell' },
    },
    doNotDisturb: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '08:00' },
      days: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }, // Todos os dias
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
notificationSettingsSchema.index({ user: 1 }, { unique: true });

// Middleware para criar configurações padrão ao criar um novo usuário
notificationSettingsSchema.statics.createDefaultSettings = async function (userId: Types.ObjectId) {
  return this.create({ user: userId });
};

const NotificationSettings = mongoose.model<INotificationSettings>(
  'NotificationSettings',
  notificationSettingsSchema
);

export default NotificationSettings;

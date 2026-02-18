"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var NotificationType;
(function (NotificationType) {
    NotificationType["NEW_FOLLOWER"] = "new_follower";
    NotificationType["GIFT_RECEIVED"] = "gift_received";
    NotificationType["STREAM_STARTED"] = "stream_started";
    NotificationType["DIAMOND_RECEIVED"] = "diamond_received";
    NotificationType["SYSTEM_ANNOUNCEMENT"] = "system_announcement";
    NotificationType["STREAM_RECOMMENDATION"] = "stream_recommendation";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const notificationSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User'
    },
    relatedStream: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Stream'
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed
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
exports.default = mongoose_1.default.model('Notification', notificationSchema);

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopGifters = exports.getGiftHistory = exports.sendGift = exports.getGifts = void 0;
const Gift_1 = __importDefault(require("../../models/Gift"));
const User_1 = __importDefault(require("../../models/User"));
const Transaction_1 = __importDefault(require("../../models/Transaction"));
const Stream_1 = __importDefault(require("../../models/Stream"));
const Notification_1 = __importStar(require("../../models/Notification"));
const getGifts = async (req, res) => {
    try {
        const gifts = await Gift_1.default.find({ isActive: true });
        res.json(gifts);
    }
    catch (error) {
        console.error('Error in getGifts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getGifts = getGifts;
const sendGift = async (req, res) => {
    try {
        const { giftId, streamId, message } = req.body;
        const senderId = req.user.id;
        // Find the gift
        const gift = await Gift_1.default.findById(giftId);
        if (!gift || !gift.isActive) {
            return res.status(404).json({ message: 'Gift not found or inactive' });
        }
        // Find sender and receiver (streamer)
        const [sender, stream] = await Promise.all([
            User_1.default.findById(senderId),
            Stream_1.default.findById(streamId).populate('streamer', 'id diamonds')
        ]);
        if (!sender || !stream) {
            return res.status(404).json({ message: 'Sender or stream not found' });
        }
        // Check if sender has enough diamonds
        if (sender.diamonds < gift.value) {
            return res.status(400).json({ message: 'Not enough diamonds' });
        }
        // Deduct diamonds from sender
        sender.diamonds -= gift.value;
        // Add diamonds to receiver (streamer)
        stream.streamer.diamonds += gift.value;
        // Create transaction record
        const transaction = new Transaction_1.default({
            user: senderId,
            type: 'GIFT_SENT',
            amount: -gift.value,
            description: `Sent ${gift.name} to ${stream.streamer.name}`,
            metadata: {
                giftId: gift._id,
                giftName: gift.name,
                recipient: stream.streamer._id,
                streamId: stream._id
            }
        });
        // Create notification for receiver
        const notification = new Notification_1.default({
            user: stream.streamer._id,
            type: Notification_1.NotificationType.GIFT_RECEIVED,
            title: 'New Gift Received',
            message: `${sender.name} sent you a ${gift.name}`,
            isRead: false,
            relatedUser: sender._id,
            relatedStream: stream._id,
            metadata: {
                giftId: gift._id,
                giftName: gift.name,
                giftValue: gift.value
            }
        });
        // Save all changes in a transaction
        await Promise.all([
            sender.save(),
            stream.streamer.save(),
            transaction.save(),
            notification.save()
        ]);
        // Emit WebSocket event
        // webSocketService.broadcastToStream(streamId, {
        //   type: 'GIFT_SENT',
        //   user: sender,
        //   gift,
        //   message,
        //   timestamp: new Date()
        // });
        res.json({
            success: true,
            message: 'Gift sent successfully',
            diamonds: sender.diamonds
        });
    }
    catch (error) {
        console.error('Error in sendGift:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.sendGift = sendGift;
const getGiftHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const history = await Transaction_1.default.find({
            user: userId,
            type: { $in: ['GIFT_SENT', 'GIFT_RECEIVED'] }
        })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate('metadata.recipient', 'name avatar')
            .populate('metadata.sender', 'name avatar');
        const total = await Transaction_1.default.countDocuments({
            user: userId,
            type: { $in: ['GIFT_SENT', 'GIFT_RECEIVED'] }
        });
        res.json({
            success: true,
            data: history,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
                limit: Number(limit)
            }
        });
    }
    catch (error) {
        console.error('Error in getGiftHistory:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getGiftHistory = getGiftHistory;
const getTopGifters = async (req, res) => {
    try {
        const { streamId } = req.params;
        // Get top gifters for a specific stream
        const topGifters = await Transaction_1.default.aggregate([
            {
                $match: {
                    'metadata.streamId': streamId,
                    type: 'GIFT_SENT'
                }
            },
            {
                $group: {
                    _id: '$user',
                    totalGifts: { $sum: 1 },
                    totalValue: { $sum: { $abs: '$amount' } }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 0,
                    user: {
                        id: '$user._id',
                        name: '$user.name',
                        avatar: '$user.avatar',
                        level: '$user.level'
                    },
                    totalGifts: 1,
                    totalValue: 1
                }
            },
            { $sort: { totalValue: -1 } },
            { $limit: 10 }
        ]);
        res.json({
            success: true,
            data: topGifters
        });
    }
    catch (error) {
        console.error('Error in getTopGifters:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTopGifters = getTopGifters;

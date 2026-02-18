"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const streamSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    streamer: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    isLive: { type: Boolean, default: false },
    viewers: { type: Number, default: 0 },
    thumbnail: { type: String, default: '' },
    category: { type: String, required: true },
    tags: [{ type: String }],
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    chatEnabled: { type: Boolean, default: true },
    chatMessages: [{
            user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
            message: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            isGift: { type: Boolean, default: false },
            giftDetails: {
                giftId: String,
                name: String,
                value: Number,
                image: String
            }
        }],
    viewersHistory: [{
            timestamp: { type: Date, default: Date.now },
            count: { type: Number, default: 0 }
        }]
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Stream', streamSchema);

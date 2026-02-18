"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStream = exports.listStreams = exports.getStream = exports.endStream = exports.startStream = void 0;
const Stream_1 = __importDefault(require("../../models/Stream"));
const startStream = async (data) => {
    const stream = new Stream_1.default({
        ...data,
        isLive: true,
        startTime: new Date(),
        viewers: 0,
        chatMessages: [],
        viewersHistory: []
    });
    return await stream.save();
};
exports.startStream = startStream;
const endStream = async (streamId, streamerId) => {
    const stream = await Stream_1.default.findOneAndUpdate({ _id: streamId, streamer: streamerId, isLive: true }, {
        $set: {
            isLive: false,
            endTime: new Date()
        }
    }, { new: true });
    return stream;
};
exports.endStream = endStream;
const getStream = async (streamId) => {
    return await Stream_1.default.findById(streamId)
        .populate('streamer', 'name avatar')
        .populate('chatMessages.user', 'name avatar');
};
exports.getStream = getStream;
const listStreams = async ({ query, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;
    const [streams, total] = await Promise.all([
        Stream_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('streamer', 'name avatar'),
        Stream_1.default.countDocuments(query)
    ]);
    return {
        streams,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
    };
};
exports.listStreams = listStreams;
const updateStream = async (streamId, streamerId, updateData) => {
    return await Stream_1.default.findOneAndUpdate({ _id: streamId, streamer: streamerId }, { $set: updateData }, { new: true });
};
exports.updateStream = updateStream;

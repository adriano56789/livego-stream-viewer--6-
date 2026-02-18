"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendChatMessage = exports.updateStreamInfo = exports.getAllStreams = exports.getStreamInfo = exports.stopStream = exports.createStream = void 0;
const Stream_1 = __importDefault(require("../../models/Stream"));
const stream_service_1 = require("../services/stream.service");
const createStream = async (req, res) => {
    try {
        const { title, description, category, tags } = req.body;
        const streamer = req.user.id;
        const stream = await (0, stream_service_1.startStream)({
            title,
            description,
            streamer,
            category,
            tags,
        });
        res.status(201).json(stream);
    }
    catch (error) {
        console.error('Error in createStream:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createStream = createStream;
const stopStream = async (req, res) => {
    try {
        const streamId = Array.isArray(req.params.streamId) ? req.params.streamId[0] : req.params.streamId;
        const stream = await (0, stream_service_1.endStream)(streamId, req.user.id);
        if (!stream) {
            return res.status(404).json({ message: 'Stream not found or unauthorized' });
        }
        res.json({ message: 'Stream ended successfully', stream });
    }
    catch (error) {
        console.error('Error in stopStream:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.stopStream = stopStream;
const getStreamInfo = async (req, res) => {
    try {
        const streamId = Array.isArray(req.params.streamId) ? req.params.streamId[0] : req.params.streamId;
        const stream = await (0, stream_service_1.getStream)(streamId);
        if (!stream) {
            return res.status(404).json({ message: 'Stream not found' });
        }
        res.json(stream);
    }
    catch (error) {
        console.error('Error in getStreamInfo:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getStreamInfo = getStreamInfo;
const getAllStreams = async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        const query = { isLive: true };
        if (category) {
            query.category = category;
        }
        const streams = await (0, stream_service_1.listStreams)({
            query,
            page: Number(page),
            limit: Number(limit)
        });
        res.json(streams);
    }
    catch (error) {
        console.error('Error in getAllStreams:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllStreams = getAllStreams;
const updateStreamInfo = async (req, res) => {
    try {
        const streamId = Array.isArray(req.params.streamId) ? req.params.streamId[0] : req.params.streamId;
        const { title, description, category, tags } = req.body;
        const updatedStream = await (0, stream_service_1.updateStream)(streamId, req.user.id, {
            title,
            description,
            category,
            tags
        });
        if (!updatedStream) {
            return res.status(404).json({ message: 'Stream not found or unauthorized' });
        }
        res.json(updatedStream);
    }
    catch (error) {
        console.error('Error in updateStreamInfo:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateStreamInfo = updateStreamInfo;
const sendChatMessage = async (req, res) => {
    try {
        const { streamId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;
        // This would typically be handled by WebSocket
        // For REST, we'll just save the message to the database
        const stream = await Stream_1.default.findById(streamId);
        if (!stream) {
            return res.status(404).json({ message: 'Stream not found' });
        }
        stream.chatMessages.push({
            user: userId,
            message,
            timestamp: new Date(),
            isGift: false
        });
        await stream.save();
        // In a real app, you would emit this message via WebSocket
        // webSocketService.broadcastToStream(streamId, {
        //   type: 'CHAT_MESSAGE',
        //   user: userId,
        //   message,
        //   timestamp: new Date()
        // });
        res.status(201).json({ message: 'Message sent' });
    }
    catch (error) {
        console.error('Error in sendChatMessage:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.sendChatMessage = sendChatMessage;

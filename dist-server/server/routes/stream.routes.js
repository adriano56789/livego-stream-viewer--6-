"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const stream_controller_js_1 = require("../controllers/stream.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
// @route   POST /api/streams
// @desc    Start a new stream
// @access  Private (Streamer)
router.post('/', [
    auth_js_1.auth,
    (0, express_validator_1.body)('title', 'Title is required').notEmpty(),
    (0, express_validator_1.body)('description', 'Description is required').optional(),
    (0, express_validator_1.body)('category', 'Category is required').notEmpty(),
    (0, express_validator_1.body)('tags', 'Tags must be an array').optional().isArray(),
    validateRequest_js_1.validateRequest
], stream_controller_js_1.createStream);
// @route   POST /api/streams/:streamId/stop
// @desc    Stop a stream
// @access  Private (Streamer)
router.post('/:streamId/stop', auth_js_1.auth, stream_controller_js_1.stopStream);
// @route   GET /api/streams/:streamId
// @desc    Get stream information
// @access  Public
router.get('/:streamId', stream_controller_js_1.getStreamInfo);
// @route   GET /api/streams
// @desc    Get all live streams with optional filtering
// @access  Public
router.get('/', stream_controller_js_1.getAllStreams);
// @route   PUT /api/streams/:streamId
// @desc    Update stream information
// @access  Private (Streamer)
router.put('/:streamId', [
    auth_js_1.auth,
    (0, express_validator_1.body)('title', 'Title is required').optional().notEmpty(),
    (0, express_validator_1.body)('description', 'Description is required').optional(),
    (0, express_validator_1.body)('category', 'Category is required').optional().notEmpty(),
    (0, express_validator_1.body)('tags', 'Tags must be an array').optional().isArray(),
    validateRequest_js_1.validateRequest
], stream_controller_js_1.updateStreamInfo);
// @route   POST /api/streams/:streamId/chat
// @desc    Send a chat message to a stream
// @access  Private
router.post('/:streamId/chat', [
    auth_js_1.auth,
    (0, express_validator_1.body)('message', 'Message is required').notEmpty().trim(),
    validateRequest_js_1.validateRequest
], stream_controller_js_1.sendChatMessage);
exports.default = router;

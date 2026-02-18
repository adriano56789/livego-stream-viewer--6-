"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const gift_controller_js_1 = require("../controllers/gift.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
// @route   GET /api/gifts
// @desc    Get all active gifts
// @access  Public
router.get('/', gift_controller_js_1.getGifts);
// @route   POST /api/gifts/send
// @desc    Send a gift to a streamer
// @access  Private
router.post('/send', [
    auth_js_1.auth,
    (0, express_validator_1.body)('giftId', 'Gift ID is required').notEmpty().isMongoId(),
    (0, express_validator_1.body)('streamId', 'Stream ID is required').notEmpty().isMongoId(),
    (0, express_validator_1.body)('message', 'Message is required').optional().isString().trim(),
    validateRequest_js_1.validateRequest
], gift_controller_js_1.sendGift);
// @route   GET /api/gifts/history/:userId
// @desc    Get gift history for a user
// @access  Private
router.get('/history/:userId', [
    auth_js_1.auth,
    (0, express_validator_1.param)('userId', 'Valid user ID is required').isMongoId(),
    validateRequest_js_1.validateRequest
], gift_controller_js_1.getGiftHistory);
// @route   GET /api/gifts/top/:streamId
// @desc    Get top gifters for a stream
// @access  Public
router.get('/top/:streamId', [
    (0, express_validator_1.param)('streamId', 'Valid stream ID is required').isMongoId(),
    validateRequest_js_1.validateRequest
], gift_controller_js_1.getTopGifters);
exports.default = router;

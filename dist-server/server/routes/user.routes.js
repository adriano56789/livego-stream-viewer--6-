"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const user_controller_js_1 = require("../controllers/user.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
// @route   GET /api/users/profile/:userId
// @desc    Get user profile
// @access  Public
router.get('/profile/:userId', user_controller_js_1.getProfile);
// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    auth_js_1.auth,
    (0, express_validator_1.body)('name', 'Name is required').notEmpty(),
    (0, express_validator_1.body)('bio', 'Bio is required').optional(),
    validateRequest_js_1.validateRequest
], user_controller_js_1.updateProfile);
// @route   POST /api/users/follow/:userId
// @desc    Follow a user
// @access  Private
router.post('/follow/:userId', auth_js_1.auth, user_controller_js_1.followUser);
// @route   POST /api/users/unfollow/:userId
// @desc    Unfollow a user
// @access  Private
router.post('/unfollow/:userId', auth_js_1.auth, user_controller_js_1.unfollowUser);
exports.default = router;

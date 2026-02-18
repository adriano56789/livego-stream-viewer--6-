"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
// Register a new user
router.post('/register', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
], validateRequest_js_1.validateRequest, auth_controller_js_1.register);
// Login user
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').exists().withMessage('Password is required'),
], validateRequest_js_1.validateRequest, auth_controller_js_1.login);
// Logout user
router.post('/logout', (req, res) => {
    // In a real app, you would handle token invalidation here
    res.json({ message: 'Logged out successfully' });
});
exports.default = router;

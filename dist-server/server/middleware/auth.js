"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isStreamer = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../../models/User"));
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        // Get user from the token
        const user = await User_1.default.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }
        // Add user to request object
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Error in auth middleware:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
exports.auth = auth;
// Middleware to check if user is a streamer
const isStreamer = (req, res, next) => {
    if (!req.user || !req.user.isStreamer) {
        return res.status(403).json({ message: 'Access denied. Streamer privileges required.' });
    }
    next();
};
exports.isStreamer = isStreamer;
// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};
exports.isAdmin = isAdmin;

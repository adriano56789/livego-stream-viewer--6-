"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const user_routes_js_1 = __importDefault(require("./user.routes.js"));
const stream_routes_js_1 = __importDefault(require("./stream.routes.js"));
const gift_routes_js_1 = __importDefault(require("./gift.routes.js"));
const setupRoutes = (app) => {
    // API Routes
    app.use('/api/auth', auth_routes_js_1.default);
    app.use('/api/users', user_routes_js_1.default);
    app.use('/api/streams', stream_routes_js_1.default);
    app.use('/api/gifts', gift_routes_js_1.default);
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });
    // Error handler
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });
};
exports.setupRoutes = setupRoutes;

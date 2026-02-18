"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const websocket_1 = __importDefault(require("./websocket"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./routes");
const cors_2 = __importDefault(require("./config/cors"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Middleware
app.use(express_1.default.json());
// CORS Configuration
app.use((0, cors_1.default)(cors_2.default));
// CORS is already configured with cors() middleware
// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongoConnected: mongoose_1.default.connection.readyState === 1
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// Setup API routes
(0, routes_1.setupRoutes)(app);
// Initialize WebSocket service
const webSocketService = new websocket_1.default(server);
// MongoDB connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';
        await mongoose_1.default.connect(mongoURI);
        console.log('✅ Conectado ao MongoDB');
    }
    catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};
// Start the server
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log('╔═══════════════════════════════════════════════════╗');
            console.log('║ SERVIDOR LIVEGO RODANDO (WebSocket ativo)         ║');
            console.log('╠═══════════════════════════════════════════════════╣');
            console.log(`║ Porta: ${PORT}${' '.repeat(39 - String(PORT).length)}║`);
            console.log(`║ Modo: ${process.env.NODE_ENV || 'development'}${' '.repeat(25 - String(process.env.NODE_ENV || 'development').length)}║`);
            console.log(`║ MongoDB: ${mongoose_1.default.connection.host}${' '.repeat(33 - String(mongoose_1.default.connection.host).length)}║`);
            console.log('╚═══════════════════════════════════════════════════╝');
        });
    }
    catch (error) {
        console.error('❌ Falha ao iniciar o servidor:', error);
        process.exit(1);
    }
};
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});
// Handle SIGTERM
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
// Start the server
startServer();

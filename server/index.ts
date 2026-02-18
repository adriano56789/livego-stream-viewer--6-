import http from 'http';
import express from 'express';
import cors from 'cors';
import WebSocketService from './websocket.js';
import { database } from '../services/mongo';
import { dbConfig } from '../services/config';
import { setupRoutes } from './routes';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Setup API routes
setupRoutes(app);

// Initialize WebSocket service
const webSocketService = new WebSocketService(server);

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    await database.connect();
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`╔═══════════════════════════════════════════════════╗`);
      console.log(`║ SERVIDOR LIVEGO RODANDO (WebSocket ativo)           ║`);
      console.log(`╠═══════════════════════════════════════════════════╣`);
      console.log(`║ Porta: ${PORT}                                       ║`);
      console.log(`║ URL:   http://0.0.0.0:${PORT}                       ║`);
      console.log(`║ MongoDB: ${dbConfig.mongodb.url}                     ║`);
      console.log(`╚═══════════════════════════════════════════════════╝`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
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

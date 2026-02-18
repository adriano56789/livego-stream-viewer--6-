import http, { Server as HttpServer } from 'http';
import express from 'express';
import cors from 'cors';
import WebSocketService from './websocket';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupRoutes } from './routes';
import corsConfig from './config/cors';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());

// CORS Configuration
app.use(cors(corsConfig));

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
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Setup API routes
setupRoutes(app);

// Initialize WebSocket service
const webSocketService = new WebSocketService(server);

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
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
      console.log(`║ MongoDB: ${mongoose.connection.host}${' '.repeat(33 - String(mongoose.connection.host).length)}║`);
      console.log('╚═══════════════════════════════════════════════════╝');
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
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

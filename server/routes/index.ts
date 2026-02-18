import { Express } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import streamRoutes from './stream.routes.js';
import giftRoutes from './gift.routes.js';
import adminRoutes from './admin.routes';

export const setupRoutes = (app: Express) => {
  // API Routes
  // Rotas de API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/streams', streamRoutes);
  app.use('/api/gifts', giftRoutes);
  
  // Rotas de administração - requerem autenticação e privilégios de admin
  app.use('/api/admin', adminRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
};

import { Router } from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Register a new user
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validateRequest,
  register
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

// Logout user
router.post('/logout', (req, res) => {
  // In a real app, you would handle token invalidation here
  res.json({ message: 'Logged out successfully' });
});

export default router;

import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile, followUser, unfollowUser } from '../controllers/user.controller.js';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// @route   GET /api/users/profile/:userId
// @desc    Get user profile
// @access  Public
router.get('/profile/:userId', getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    auth,
    body('name', 'Name is required').notEmpty(),
    body('bio', 'Bio is required').optional(),
    validateRequest
  ],
  updateProfile
);

// @route   POST /api/users/follow/:userId
// @desc    Follow a user
// @access  Private
router.post('/follow/:userId', auth, followUser);

// @route   POST /api/users/unfollow/:userId
// @desc    Unfollow a user
// @access  Private
router.post('/unfollow/:userId', auth, unfollowUser);

export default router;

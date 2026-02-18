import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getGifts, 
  sendGift, 
  getGiftHistory, 
  getTopGifters 
} from '../controllers/gift.controller.js';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// @route   GET /api/gifts
// @desc    Get all active gifts
// @access  Public
router.get('/', getGifts);

// @route   POST /api/gifts/send
// @desc    Send a gift to a streamer
// @access  Private
router.post(
  '/send',
  [
    auth,
    body('giftId', 'Gift ID is required').notEmpty().isMongoId(),
    body('streamId', 'Stream ID is required').notEmpty().isMongoId(),
    body('message', 'Message is required').optional().isString().trim(),
    validateRequest
  ],
  sendGift
);

// @route   GET /api/gifts/history/:userId
// @desc    Get gift history for a user
// @access  Private
router.get(
  '/history/:userId',
  [
    auth,
    param('userId', 'Valid user ID is required').isMongoId(),
    validateRequest
  ],
  getGiftHistory
);

// @route   GET /api/gifts/top/:streamId
// @desc    Get top gifters for a stream
// @access  Public
router.get(
  '/top/:streamId',
  [
    param('streamId', 'Valid stream ID is required').isMongoId(),
    validateRequest
  ],
  getTopGifters
);

export default router;

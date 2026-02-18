import { Router } from 'express';
import { body } from 'express-validator';
import { 
  createStream, 
  stopStream, 
  getStreamInfo, 
  getAllStreams, 
  updateStreamInfo, 
  sendChatMessage 
} from '../controllers/stream.controller.js';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// @route   POST /api/streams
// @desc    Start a new stream
// @access  Private (Streamer)
router.post(
  '/',
  [
    auth,
    body('title', 'Title is required').notEmpty(),
    body('description', 'Description is required').optional(),
    body('category', 'Category is required').notEmpty(),
    body('tags', 'Tags must be an array').optional().isArray(),
    validateRequest
  ],
  createStream
);

// @route   POST /api/streams/:streamId/stop
// @desc    Stop a stream
// @access  Private (Streamer)
router.post('/:streamId/stop', auth, stopStream);

// @route   GET /api/streams/:streamId
// @desc    Get stream information
// @access  Public
router.get('/:streamId', getStreamInfo);

// @route   GET /api/streams
// @desc    Get all live streams with optional filtering
// @access  Public
router.get('/', getAllStreams);

// @route   PUT /api/streams/:streamId
// @desc    Update stream information
// @access  Private (Streamer)
router.put(
  '/:streamId',
  [
    auth,
    body('title', 'Title is required').optional().notEmpty(),
    body('description', 'Description is required').optional(),
    body('category', 'Category is required').optional().notEmpty(),
    body('tags', 'Tags must be an array').optional().isArray(),
    validateRequest
  ],
  updateStreamInfo
);

// @route   POST /api/streams/:streamId/chat
// @desc    Send a chat message to a stream
// @access  Private
router.post(
  '/:streamId/chat',
  [
    auth,
    body('message', 'Message is required').notEmpty().trim(),
    validateRequest
  ],
  sendChatMessage
);

export default router;

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { 
  getChatMessages,
  sendMessage,
  deleteMessage,
  getConversations,
  getConversation,
  markMessagesAsRead,
  getUnreadMessagesCount,
  getChatPermissions,
  updateChatPermissions
} from '../controllers/chat.controller';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Todas as rotas requerem autenticação
router.use(auth);

// @route   GET /api/chat/conversations
// @desc    Get user conversations
// @access  Private
router.get('/conversations', getConversations);

// @route   GET /api/chat/conversations/:userId
// @desc    Get conversation with a specific user
// @access  Private
router.get(
  '/conversations/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    validateRequest
  ],
  getConversation
);

// @route   GET /api/chat/messages
// @desc    Get messages in a conversation
// @access  Private
router.get(
  '/messages',
  [
    query('recipientId').isMongoId().withMessage('Invalid recipient ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('before').optional().isISO8601().withMessage('Invalid date format'),
    validateRequest
  ],
  getChatMessages
);

// @route   POST /api/chat/messages
// @desc    Send a message
// @access  Private
router.post(
  '/messages',
  [
    body('recipientId', 'Recipient ID is required').isMongoId(),
    body('content', 'Message content is required').notEmpty(),
    body('type', 'Message type is required').isIn(['text', 'image', 'gift']),
    body('mediaUrl').optional().isURL(),
    body('giftId').optional().isMongoId(),
    validateRequest
  ],
  sendMessage
);

// @route   DELETE /api/chat/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete(
  '/messages/:messageId',
  [
    param('messageId').isMongoId().withMessage('Invalid message ID'),
    validateRequest
  ],
  deleteMessage
);

// @route   PUT /api/chat/messages/read
// @desc    Mark messages as read
// @access  Private
router.put(
  '/messages/read',
  [
    body('messageIds', 'Message IDs are required').isArray({ min: 1 }),
    body('messageIds.*', 'Invalid message ID').isMongoId(),
    validateRequest
  ],
  markMessagesAsRead
);

// @route   GET /api/chat/unread/count
// @desc    Get count of unread messages
// @access  Private
router.get('/unread/count', getUnreadMessagesCount);

// @route   GET /api/chat/permissions
// @desc    Get chat permissions
// @access  Private
router.get('/permissions', getChatPermissions);

// @route   PUT /api/chat/permissions
// @desc    Update chat permissions
// @access  Private
router.put(
  '/permissions',
  [
    body('permission', 'Permission is required').isIn(['all', 'followers', 'none']),
    validateRequest
  ],
  updateChatPermissions
);

export default router;

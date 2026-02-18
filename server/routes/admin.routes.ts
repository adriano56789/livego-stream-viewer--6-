import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { 
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
  getReports,
  resolveReport,
  getSystemStats,
  getModerationLogs,
  updateSystemSettings,
  sendGlobalAnnouncement,
  getWithdrawalRequests,
  processWithdrawal,
  getAdminEarnings,
  requestAdminWithdrawal,
  getAdminWithdrawalHistory
} from '../controllers/admin.controller';
import { auth, isAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Todas as rotas requerem autenticação e privilégios de administrador
router.use(auth, isAdmin);

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private/Admin
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString(),
    query('role').optional().isIn(['user', 'moderator', 'admin']),
    query('status').optional().isIn(['active', 'banned', 'suspended']),
    validateRequest
  ],
  getUsers
);

// @route   GET /api/admin/users/:userId
// @desc    Get user by ID
// @access  Private/Admin
router.get(
  '/users/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    validateRequest
  ],
  getUserById
);

// @route   PUT /api/admin/users/:userId
// @desc    Update user (admin override)
// @access  Private/Admin
router.put(
  '/users/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['user', 'moderator', 'admin']),
    body('status').optional().isIn(['active', 'banned', 'suspended']),
    body('diamonds').optional().isInt({ min: 0 }),
    validateRequest
  ],
  updateUser
);

// @route   DELETE /api/admin/users/:userId
// @desc    Delete a user (admin)
// @access  Private/Admin
router.delete(
  '/users/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    validateRequest
  ],
  deleteUser
);

// @route   POST /api/admin/users/:userId/ban
// @desc    Ban a user
// @access  Private/Admin
router.post(
  '/users/:userId/ban',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('reason', 'Reason is required').notEmpty(),
    validateRequest
  ],
  banUser
);

// @route   POST /api/admin/users/:userId/unban
// @desc    Unban a user
// @access  Private/Admin
router.post(
  '/users/:userId/unban',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    validateRequest
  ],
  unbanUser
);

// @route   GET /api/admin/reports
// @desc    Get all reports
// @access  Private/Admin
router.get(
  '/reports',
  [
    query('status').optional().isIn(['pending', 'resolved', 'rejected']),
    query('type').optional().isIn(['user', 'stream', 'content']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  getReports
);

// @route   PUT /api/admin/reports/:reportId/resolve
// @desc    Resolve a report
// @access  Private/Admin
router.put(
  '/reports/:reportId/resolve',
  [
    param('reportId').isMongoId().withMessage('Invalid report ID'),
    body('action', 'Action is required').isIn(['warn', 'ban', 'delete', 'dismiss']),
    body('message').optional().isString(),
    validateRequest
  ],
  resolveReport
);

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Private/Admin
router.get('/stats', getSystemStats);

// @route   GET /api/admin/logs
// @desc    Get moderation logs
// @access  Private/Admin
router.get(
  '/logs',
  [
    query('action').optional().isString(),
    query('moderatorId').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  getModerationLogs
);

// @route   PUT /api/admin/settings
// @desc    Update system settings
// @access  Private/Admin
router.put(
  '/settings',
  [
    body('settings', 'Settings object is required').isObject(),
    validateRequest
  ],
  updateSystemSettings
);

// @route   POST /api/admin/announcements
// @desc    Send global announcement
// @access  Private/Admin
router.post(
  '/announcements',
  [
    body('title', 'Title is required').notEmpty(),
    body('message', 'Message is required').notEmpty(),
    body('type', 'Type is required').isIn(['info', 'warning', 'important']),
    body('targetAudience').optional().isIn(['all', 'streamers', 'viewers']),
    validateRequest
  ],
  sendGlobalAnnouncement
);

// @route   GET /api/admin/withdrawals
// @desc    Get withdrawal requests
// @access  Private/Admin
router.get(
  '/withdrawals',
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  getWithdrawalRequests
);

// @route   PUT /api/admin/withdrawals/:withdrawalId/process
// @desc    Process a withdrawal request
// @access  Private/Admin
router.put(
  '/withdrawals/:withdrawalId/process',
  [
    param('withdrawalId').isMongoId().withMessage('Invalid withdrawal ID'),
    body('status', 'Status is required').isIn(['approved', 'rejected']),
    body('notes').optional().isString(),
    validateRequest
  ],
  processWithdrawal
);

// @route   GET /api/admin/earnings
// @desc    Get admin earnings
// @access  Private/Admin
router.get(
  '/earnings',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validateRequest
  ],
  getAdminEarnings
);

// @route   POST /api/admin/withdraw
// @desc    Request admin withdrawal
// @access  Private/Admin
router.post(
  '/withdraw',
  [
    body('amount', 'Amount is required').isNumeric(),
    body('method', 'Method is required').isIn(['pix', 'bank_transfer']),
    body('details', 'Details are required').isObject(),
    validateRequest
  ],
  requestAdminWithdrawal
);

// @route   GET /api/admin/withdrawal-history
// @desc    Get admin withdrawal history
// @access  Private/Admin
router.get(
  '/withdrawal-history',
  [
    query('status').optional().isIn(['pending', 'completed', 'failed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  getAdminWithdrawalHistory
);

export default router;

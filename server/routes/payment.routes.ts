import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getDiamondPackages, 
  createOrder, 
  processPixPayment,
  processCreditCardPayment,
  confirmPurchase,
  getPurchaseHistory,
  getEarningsInfo,
  calculateWithdrawal,
  confirmWithdrawal,
  setWithdrawalMethod
} from '../controllers/payment.controller';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Todas as rotas requerem autenticação
router.use(auth);

// @route   GET /api/payments/packages
// @desc    Get available diamond packagesJ
// @access  Private
router.get('/packages', getDiamondPackages);

// @route   POST /api/payments/order
// @desc    Create a new order
// @access  Private
router.post(
  '/order',
  [
    body('packageId', 'Package ID is required').notEmpty().isMongoId(),
    body('amount', 'Amount is required').isNumeric(),
    body('diamonds', 'Diamonds count is required').isNumeric(),
    validateRequest
  ],
  createOrder
);

// @route   POST /api/payments/pix
// @desc    Process PIX payment
// @access  Private
router.post(
  '/pix',
  [
    body('orderId', 'Order ID is required').notEmpty().isMongoId(),
    validateRequest
  ],
  processPixPayment
);

// @route   POST /api/payments/credit-card
// @desc    Process credit card payment
// @access  Private
router.post(
  '/credit-card',
  [
    body('orderId', 'Order ID is required').notEmpty().isMongoId(),
    body('cardNumber', 'Card number is required').notEmpty(),
    body('cardHolder', 'Card holder name is required').notEmpty(),
    body('expiryDate', 'Expiry date is required').notEmpty(),
    body('cvv', 'CVV is required').notEmpty(),
    validateRequest
  ],
  processCreditCardPayment
);

// @route   POST /api/payments/confirm
// @desc    Confirm a purchase
// @access  Private
router.post(
  '/confirm',
  [
    body('orderId', 'Order ID is required').notEmpty().isMongoId(),
    validateRequest
  ],
  confirmPurchase
);

// @route   GET /api/payments/history/:userId
// @desc    Get purchase history for a user
// @access  Private
router.get(
  '/history/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    validateRequest
  ],
  getPurchaseHistory
);

// @route   GET /api/payments/earnings/:userId
// @desc    Get earnings information for a user
// @access  Private
router.get(
  '/earnings/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    validateRequest
  ],
  getEarningsInfo
);

// @route   POST /api/payments/calculate-withdrawal
// @desc    Calculate withdrawal amount
// @access  Private
router.post(
  '/calculate-withdrawal',
  [
    body('amount', 'Amount is required').isNumeric(),
    validateRequest
  ],
  calculateWithdrawal
);

// @route   POST /api/payments/withdraw/:userId
// @desc    Confirm withdrawal
// @access  Private
router.post(
  '/withdraw/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('amount', 'Amount is required').isNumeric(),
    validateRequest
  ],
  confirmWithdrawal
);

// @route   POST /api/payments/withdrawal-method
// @desc    Set withdrawal method
// @access  Private
router.post(
  '/withdrawal-method',
  [
    body('method', 'Method is required').notEmpty(),
    body('details', 'Details are required').isObject(),
    validateRequest
  ],
  setWithdrawalMethod
);

export default router;

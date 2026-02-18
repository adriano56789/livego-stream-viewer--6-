import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { 
  getProfileImages, 
  deleteProfileImage, 
  reorderProfileImages,
  getProfileField,
  updateProfileField
} from '../controllers/profile.controller.js';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(auth);

// @route   GET /api/profile/images
// @desc    Get user's profile images
// @access  Private
router.get('/images', getProfileImages);

// @route   DELETE /api/profile/images/:id
// @desc    Delete a profile image
// @access  Private
router.delete('/images/:id', deleteProfileImage);

// @route   PUT /api/profile/images/reorder
// @desc    Reorder profile images
// @access  Private
router.put(
  '/images/reorder',
  [
    body('orderedIds', 'Ordered IDs are required').isArray({ min: 1 }),
    validateRequest
  ],
  reorderProfileImages
);

// Helper function to create field routes
const createFieldRoute = (field: string, validations: any[] = []) => {
  // GET route
  router.get(`/${field}`, (req, res, next) => 
    getProfileField(req, res, next, field)
  );
  
  // PUT route
  router.put(
    `/${field}`,
    [
      body('value', `Value for ${field} is required`).notEmpty(),
      ...validations,
      validateRequest
    ],
    (req, res, next) => updateProfileField(req, res, next, field)
  );
};

// Create routes for each profile field
createFieldRoute('nickname');
createFieldRoute('gender');
createFieldRoute('birthday');
createFieldRoute('bio');
createFieldRoute('residence');
createFieldRoute('emotional-status');
createFieldRoute('tags');
createFieldRoute('profession');

export default router;

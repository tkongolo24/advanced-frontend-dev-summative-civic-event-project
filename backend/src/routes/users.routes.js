
import express from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/users.controller.js';
import validateBody from '../middlewares/validateBody.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Self-management routes must come before /:id.
// Otherwise "profile" can be treated as a user ID.
router.get('/profile/me', authenticate, controller.getSelf);

router.patch(
    '/profile/me',
    authenticate,
    [
        body('full_name')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Full name cannot be empty'),

        body('email')
            .optional()
            .trim()
            .isEmail()
            .withMessage('Must be a valid email'),

        body('role')
            .not()
            .exists()
            .withMessage('Cannot update role'),

        body('is_active')
            .not()
            .exists()
            .withMessage('Cannot update status'),
    ],
    validateBody,
    controller.updateSelf
);

// Admin-only routes
router.get('/', authenticate, authorize(['admin']), controller.list);

router.get('/:id', authenticate, authorize(['admin']), controller.get);

router.patch('/:id/enable', authenticate, authorize(['admin']), controller.enable);

router.patch('/:id/disable', authenticate, authorize(['admin']), controller.disable);

export default router;

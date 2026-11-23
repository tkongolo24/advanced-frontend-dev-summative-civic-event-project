
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import * as controller from '../controllers/auth.controller.js';
import { body } from 'express-validator';
import validateBody from '../middlewares/validateBody.middleware.js';

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        status: 429,
        message: 'Too many login attempts. Please try again later.'
    }
});

router.post(
    '/signup',
    [
        body('full_name')
            .trim()
            .notEmpty()
            .withMessage('Full name is required'),

        body('email')
            .trim()
            .isEmail()
            .withMessage('Valid email is required')
            .normalizeEmail(),

        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
            .withMessage('Password must include uppercase, lowercase, number, and special character'),

        body('role')
            .not()
            .exists()
            .withMessage('Account role cannot be specified during registration')
    ],
    validateBody,
    controller.signup
);

router.post(
    '/login',
    loginLimiter,
    [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Valid email is required')
            .normalizeEmail(),

        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    validateBody,
    controller.login
);

export default router;

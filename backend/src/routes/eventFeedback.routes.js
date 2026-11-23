import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validateBody from '../middlewares/validateBody.middleware.js';
import * as Controller from '../controllers/eventFeedback.controller.js';

const router = express.Router();

const validateFeedback = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be an integer between 1 and 5'),

    body('comment')
        .optional()
        .isString()
        .withMessage('Comment must be text')
        .isLength({ max: 2000 })
        .withMessage('Comment cannot exceed 2000 characters'),

    validateBody,
];

router.post(
    '/',
    authenticate,
    [
        body('event_id')
            .isUUID()
            .withMessage('A valid event ID is required'),
        ...validateFeedback,
    ],
    Controller.createFeedback
);

router.put(
    '/:id',
    authenticate,
    [
        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be an integer between 1 and 5'),

        body('comment')
            .optional()
            .isString()
            .withMessage('Comment must be text')
            .isLength({ max: 2000 })
            .withMessage('Comment cannot exceed 2000 characters'),

        validateBody,
    ],
    Controller.updateFeedback
);

router.get('/my-feedback', authenticate, Controller.getUserFeedback);

router.get(
    '/event/:event_id',
    authenticate,
    Controller.getEventFeedback
);

export default router;

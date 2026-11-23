import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validateBody from '../middlewares/validateBody.middleware.js';
import * as Controller from '../controllers/eventRegistrations.controller.js';

const router = express.Router();

const validateEventId = [
    body('event_id')
        .isUUID()
        .withMessage('A valid event ID is required'),
    validateBody,
];

router.post(
    '/register',
    authenticate,
    validateEventId,
    Controller.registerForEvent
);

router.post(
    '/cancel',
    authenticate,
    validateEventId,
    Controller.cancelRegistration
);

router.get(
    '/my-registrations',
    authenticate,
    Controller.getUserRegistrations
);

router.get(
    '/event/:event_id/attendees',
    authenticate,
    authorize(['admin']),
    Controller.getEventAttendees
);

export default router;

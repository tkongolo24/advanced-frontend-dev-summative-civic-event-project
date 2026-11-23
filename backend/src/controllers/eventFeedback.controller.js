
import * as Feedback from '../models/eventFeedback.model.js';
import * as Events from '../models/events.model.js';
import * as EventRegistrations from '../models/eventRegistrations.model.js';

export const createFeedback = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { event_id, rating, comment } = req.body;

        const event = await Events.findById(event_id);

        if (!event) {
            return res.status(404).json({
                status: 404,
                message: 'Event not found'
            });
        }

        if (!await EventRegistrations.hasRegisteredForEvent(user_id, event_id)) {
            return res.status(403).json({
                status: 403,
                message: 'You must be registered for this event to submit feedback'
            });
        }

        if (!event.ends_at || new Date(event.ends_at) > new Date()) {
            return res.status(409).json({
                status: 409,
                message: 'Feedback is available after the event has ended'
            });
        }

        const feedback = await Feedback.createFeedback({
            user_id,
            event_id,
            rating,
            comment
        });

        if (!feedback) {
            return res.status(409).json({
                status: 409,
                message: 'Feedback could not be submitted'
            });
        }

        return res.status(201).json({
            status: 201,
            message: 'Feedback submitted',
            data: feedback
        });
    } catch (err) {
        next(err);
    }
};

export const updateFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const updated = await Feedback.updateFeedback(
            id,
            req.user.id,
            { rating, comment }
        );

        if (!updated) {
            return res.status(404).json({
                status: 404,
                message: 'Feedback not found'
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Feedback updated',
            data: updated
        });
    } catch (err) {
        next(err);
    }
};

export const getEventFeedback = async (req, res, next) => {
    try {
        const { event_id } = req.params;
        const event = await Events.findById(event_id);

        if (!event) {
            return res.status(404).json({
                status: 404,
                message: 'Event not found'
            });
        }

        const feedbacks = await Feedback.findByEvent(event_id);

        return res.status(200).json({
            status: 200,
            data: feedbacks
        });
    } catch (err) {
        next(err);
    }
};

export const getUserFeedback = async (req, res, next) => {
    try {
        const feedbacks = await Feedback.findByUser(req.user.id);

        return res.status(200).json({
            status: 200,
            data: feedbacks
        });
    } catch (err) {
        next(err);
    }
};

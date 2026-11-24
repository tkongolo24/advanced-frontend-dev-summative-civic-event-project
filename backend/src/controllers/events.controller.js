import * as Events from '../models/events.model.js';
import * as Notifications from '../models/notifications.model.js';
import { removeUploadedFile, removeManagedMedia } from '../utils/media.js';

const isAdmin = (req) => req.user?.role === 'admin';

const notifySafely = async (data) => {
    try {
        await Notifications.create(data);
    } catch (error) {
        console.error('Event notification could not be created:', error);
    }
};

export const create = async (req, res, next) => {
    try {
        const { title, description, location, starts_at, ends_at } = req.body;
        const published = req.body.published === undefined
            ? true
            : req.body.published === true || req.body.published === 'true';

        const eventData = {
            title,
            description,
            location,
            starts_at,
            ends_at,
            metadata: {},
            published,
        };

        if (req.file) {
            eventData.metadata.image_url =
                `${req.protocol}://${req.get('host')}/uploads/events/${req.file.filename}`;
        }

        let createdEvent;

        try {
            createdEvent = await Events.create(eventData);
        } catch (error) {
            if (req.file) await removeUploadedFile(req.file);
            throw error;
        }

        if (createdEvent.published) {
            await notifySafely({
                title: 'New Event Published',
                message: `A new event titled "${createdEvent.title}" has been added!`,
                type: 'event',
                recipient_id: null,
                metadata: { event_id: createdEvent.id },
                created_by: req.user?.id || null,
            });
        }

        return res.status(201).json({
            status: 201,
            message: 'Event created successfully',
            data: createdEvent,
        });
    } catch (error) {
        next(error);
    }
};

export const list = async (req, res, next) => {
    try {
        const data = await Events.findAll(isAdmin(req));

        return res.status(200).json({
            status: 200,
            message: 'Events fetched successfully',
            data,
        });
    } catch (error) {
        next(error);
    }
};

export const get = async (req, res, next) => {
    try {
        const event = await Events.findById(
            req.params.id,
            isAdmin(req)
        );

        if (!event) {
            return res.status(404).json({
                status: 404,
                message: 'Event not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Event fetched successfully',
            data: event,
        });
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existingEvent = await Events.findById(id, true);

        if (!existingEvent) {
            if (req.file) await removeUploadedFile(req.file);

            return res.status(404).json({
                status: 404,
                message: 'Event not found',
            });
        }

        const {
            title,
            description,
            location,
            starts_at,
            ends_at,
        } = req.body;

        const published = req.body.published === undefined
            ? existingEvent.published
            : req.body.published === true || req.body.published === 'true';

        const metadata = {
            ...(existingEvent.metadata || {}),
        };

        if (req.file) {
            metadata.image_url =
                `${req.protocol}://${req.get('host')}/uploads/events/${req.file.filename}`;
        }

        const updatedData = {
            title: title ?? existingEvent.title,
            description: description ?? existingEvent.description,
            location: location ?? existingEvent.location,
            starts_at: starts_at ?? existingEvent.starts_at,
            ends_at: ends_at ?? existingEvent.ends_at,
            metadata,
            published,
        };

        let updated;

        try {
            updated = await Events.update(id, updatedData);
        } catch (error) {
            if (req.file) await removeUploadedFile(req.file);
            throw error;
        }

        if (!updated) {
            if (req.file) await removeUploadedFile(req.file);

            return res.status(404).json({
                status: 404,
                message: 'Event not found',
            });
        }

        if (req.file && existingEvent.metadata?.image_url) {
            await removeManagedMedia(
                existingEvent.metadata.image_url,
                'events',
                req.get('host')
            );
        }

        return res.status(200).json({
            status: 200,
            message: 'Event updated successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};


export const publish = async (req, res, next) => {
    try {
        const existing = await Events.findById(req.params.id, true);

        if (!existing) {
            return res.status(404).json({
                status: 404,
                message: 'Event not found',
            });
        }

        const event = await Events.publish(req.params.id);

        if (!existing.published) {
            await notifySafely({
                title: 'Event Published',
                message: `The event "${event.title}" is now available.`,
                type: 'event',
                recipient_id: null,
                metadata: { event_id: event.id },
                created_by: req.user?.id || null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Event published successfully',
            data: event,
        });
    } catch (error) {
        next(error);
    }
};

export const unpublish = async (req, res, next) => {
    try {
        const event = await Events.unpublish(req.params.id);

        if (!event) {
            return res.status(404).json({
                status: 404,
                message: 'Event not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Event unpublished successfully',
            data: event,
        });
    } catch (error) {
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        const deleted = await Events.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                message: 'Event not found',
            });
        }

        if (deleted.metadata?.image_url) {
            await removeManagedMedia(
                deleted.metadata.image_url,
                'events',
                req.get('host')
            );
        }

        return res.status(200).json({
            status: 200,
            message: 'Event deleted successfully',
            data: {
                id: deleted.id,
                title: deleted.title,
            },
        });
    } catch (error) {
        next(error);
    }
};

import * as Promos from '../models/promos.model.js';
import * as Notifications from '../models/notifications.model.js';
import { removeUploadedFile, removeManagedMedia } from '../utils/media.js';

const isAdmin = (req) => req.user?.role === 'admin';

const notifySafely = async (data) => {
    try {
        await Notifications.create(data);
    } catch (error) {
        console.error('Promo notification could not be created:', error);
    }
};

export const list = async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

        const result = await Promos.findAll(
            { page, limit },
            isAdmin(req)
        );

        return res.status(200).json({
            status: 200,
            message: 'Promos fetched successfully',
            data: result.promos,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

export const get = async (req, res, next) => {
    try {
        const promo = await Promos.findById(
            req.params.id,
            isAdmin(req)
        );

        if (!promo) {
            return res.status(404).json({
                status: 404,
                message: 'Promo not found',
            });
        }

        return res.status(200).json({
            status: 200,
            data: promo,
        });
    } catch (error) {
        next(error);
    }
};

export const create = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 400,
                message: 'Video file is required',
            });
        }

        const { title, description, caption_text } = req.body;
        const created_by = req.user.id;
        const video_url =
            `${req.protocol}://${req.get('host')}/uploads/promos/${req.file.filename}`;

        let promo;

        try {
            promo = await Promos.create({
                title,
                description,
                caption_text,
                video_url,
                created_by,
            });
        } catch (error) {
            await removeUploadedFile(req.file);
            throw error;
        }

        await notifySafely({
            title: 'New Promo Added!',
            message: `A new promo titled "${promo.title}" has been published.`,
            type: 'promo',
            recipient_id: null,
            metadata: { promo_id: promo.id },
            created_by,
        });

        return res.status(201).json({
            status: 201,
            message: 'Promo created successfully',
            data: promo,
        });
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existingPromo = await Promos.findById(id, true);

        if (!existingPromo) {
            if (req.file) await removeUploadedFile(req.file);

            return res.status(404).json({
                status: 404,
                message: 'Promo not found',
            });
        }

        const fieldsToUpdate = {
            title: req.body.title,
            description: req.body.description,
            caption_text: req.body.caption_text,
            published: req.body.published,
        };

        if (req.file) {
            fieldsToUpdate.video_url =
                `${req.protocol}://${req.get('host')}/uploads/promos/${req.file.filename}`;
        }

        let updated;

        try {
            updated = await Promos.update(id, fieldsToUpdate);
        } catch (error) {
            if (req.file) await removeUploadedFile(req.file);
            throw error;
        }

        if (!updated) {
            if (req.file) await removeUploadedFile(req.file);

            return res.status(404).json({
                status: 404,
                message: 'Promo not found',
            });
        }

        if (req.file) {
            await removeManagedMedia(
                existingPromo.video_url,
                'promos',
                req.get('host')
            );
        }

        return res.status(200).json({
            status: 200,
            message: 'Promo updated successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        const deleted = await Promos.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                message: 'Promo not found',
            });
        }

        await removeManagedMedia(
            deleted.video_url,
            'promos',
            req.get('host')
        );

        return res.status(200).json({
            status: 200,
            message: 'Promo deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const publishPromo = async (req, res, next) => {
    try {
        const promo = await Promos.publish(req.params.id);

        if (!promo) {
            return res.status(404).json({
                status: 404,
                message: 'Promo not found',
            });
        }

        await notifySafely({
            title: 'Promo Published',
            message: `The promo "${promo.title}" is now live.`,
            type: 'promo',
            recipient_id: null,
            metadata: { promo_id: promo.id },
            created_by: req.user?.id || null,
        });

        return res.status(200).json({
            status: 200,
            message: 'Promo published successfully',
            data: promo,
        });
    } catch (error) {
        next(error);
    }
};

export const unpublishPromo = async (req, res, next) => {
    try {
        const promo = await Promos.unpublish(req.params.id);

        if (!promo) {
            return res.status(404).json({
                status: 404,
                message: 'Promo not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Promo unpublished successfully',
            data: promo,
        });
    } catch (error) {
        next(error);
    }
};

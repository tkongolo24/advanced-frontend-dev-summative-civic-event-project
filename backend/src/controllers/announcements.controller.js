import * as AnnouncementModel from '../models/announcements.model.js';
import * as NotificationModel from '../models/notifications.model.js';
import { removeUploadedFile, removeManagedMedia } from '../utils/media.js';

const isAdmin = (req) => req.user?.role === 'admin';

const notifySafely = async (data) => {
    try {
        await NotificationModel.create(data);
    } catch (error) {
        console.error('Announcement notification could not be created:', error);
    }
};

export const getAllAnnouncements = async (req, res, next) => {
    try {
        const announcements = await AnnouncementModel.findAll(req.query, isAdmin(req));

        return res.status(200).json({
            status: 200,
            message: 'Announcements retrieved successfully',
            data: announcements,
        });
    } catch (error) {
        next(error);
    }
};

export const getAnnouncementById = async (req, res, next) => {
    try {
        const announcement = await AnnouncementModel.findById(
            req.params.id,
            isAdmin(req)
        );

        if (!announcement) {
            return res.status(404).json({
                status: 404,
                message: 'Announcement not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Announcement retrieved successfully',
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
};

export const createAnnouncement = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 400,
                message: 'Audio file is required',
            });
        }

        const { title, published = true } = req.body;
        const audio_url =
            `${req.protocol}://${req.get('host')}/uploads/announcements/${req.file.filename}`;

        let created;

        try {
            created = await AnnouncementModel.create({
                title,
                audio_url,
                published,
            });
        } catch (error) {
            await removeUploadedFile(req.file);
            throw error;
        }

        await notifySafely({
            title: 'New Announcement Published',
            message: `A new announcement titled "${title}" has been added.`,
            type: 'announcement',
            recipient_id: null,
            metadata: { announcement_id: created.id },
            created_by: req.user?.id || null,
        });

        return res.status(201).json({
            status: 201,
            message: 'Announcement created successfully',
            data: created,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAnnouncement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await AnnouncementModel.findById(id, true);

        if (!existing) {
            if (req.file) await removeUploadedFile(req.file);

            return res.status(404).json({
                status: 404,
                message: 'Announcement not found',
            });
        }

        const fields = {
            title: req.body.title,
            published: req.body.published,
        };

        if (req.file) {
            fields.audio_url =
                `${req.protocol}://${req.get('host')}/uploads/announcements/${req.file.filename}`;
        }

        let updated;

        try {
            updated = await AnnouncementModel.update(id, fields);
        } catch (error) {
            if (req.file) await removeUploadedFile(req.file);
            throw error;
        }

        if (req.file) {
            await removeManagedMedia(
                existing.audio_url,
                'announcements',
                req.get('host')
            );
        }

        return res.status(200).json({
            status: 200,
            message: 'Announcement updated successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAnnouncement = async (req, res, next) => {
    try {
        const deleted = await AnnouncementModel.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                message: 'Announcement not found',
            });
        }

        await removeManagedMedia(
            deleted.audio_url,
            'announcements',
            req.get('host')
        );

        return res.status(200).json({
            status: 200,
            message: 'Announcement deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const publishAnnouncement = async (req, res, next) => {
    try {
        const announcement = await AnnouncementModel.publish(req.params.id);

        if (!announcement) {
            return res.status(404).json({
                status: 404,
                message: 'Announcement not found',
            });
        }

        await notifySafely({
            title: 'Announcement Published',
            message: `The announcement "${announcement.title}" is now live.`,
            type: 'announcement',
            recipient_id: null,
            metadata: { announcement_id: announcement.id },
            created_by: req.user?.id || null,
        });

        return res.status(200).json({
            status: 200,
            message: 'Announcement published successfully',
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
};

export const unpublishAnnouncement = async (req, res, next) => {
    try {
        const announcement = await AnnouncementModel.unpublish(req.params.id);

        if (!announcement) {
            return res.status(404).json({
                status: 404,
                message: 'Announcement not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Announcement unpublished successfully',
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
};

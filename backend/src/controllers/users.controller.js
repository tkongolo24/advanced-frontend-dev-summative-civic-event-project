import * as Users from '../models/users.model.js';

// Get all users
export const list = async (req, res, next) => {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);

        if (
            !Number.isInteger(page) || page < 1 ||
            !Number.isInteger(limit) || limit < 1 || limit > 100
        ) {
            return res.status(400).json({
                status: 400,
                message: 'Page must be a positive integer and limit must be between 1 and 100',
            });
        }

        const users = await Users.findAll({ page, limit });

        return res.status(200).json({
            status: 200,
            message: 'Users retrieved successfully',
            data: users,
        });
    } catch (err) {
        next(err);
    }
};

// Get single user
export const get = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await Users.findById(id);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'User retrieved successfully',
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// Enable user
export const enable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await Users.enableUser(id);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'User enabled successfully',
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// Disable user
export const disable = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (String(id) === String(req.user.id)) {
            return res.status(403).json({
                status: 403,
                message: 'You cannot disable your own account',
            });
        }

        const user = await Users.disableUser(id);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'User disabled successfully',
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// Get own profile
export const getSelf = async (req, res, next) => {
    try {
        const user = await Users.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'User profile retrieved successfully',
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// Update own profile
export const updateSelf = async (req, res, next) => {
    try {
        const { full_name, email } = req.body;

        if (email) {
            const existingUser = await Users.findByEmail(email);

            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(409).json({
                    status: 409,
                    message: 'Email is already in use',
                });
            }
        }

        const updatedData = {};

        if (full_name !== undefined) updatedData.full_name = full_name;
        if (email !== undefined) updatedData.email = email;

        const user = await Users.updateUser(req.user.id, updatedData);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Profile updated successfully',
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

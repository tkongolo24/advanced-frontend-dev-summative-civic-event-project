
import jwt from 'jsonwebtoken';
import * as Users from '../models/users.model.js';
import { getJwtSecret } from '../config/jwt.js';

export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 401,
            message: 'Authorization token is required'
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            status: 401,
            message: 'Authorization token is required'
        });
    }

    let decoded;

    try {
        decoded = jwt.verify(token, getJwtSecret());
    } catch (err) {
        if (err.name === 'JsonWebTokenError' ||
            err.name === 'TokenExpiredError' ||
            err.name === 'NotBeforeError') {
            return res.status(401).json({
                status: 401,
                message: 'Invalid or expired token'
            });
        }

        return next(err);
    }

    if (!decoded?.id) {
        return res.status(401).json({
            status: 401,
            message: 'Invalid token payload'
        });
    }

    try {
        const user = await Users.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                status: 401,
                message: 'User not found'
            });
        }

        if (user.is_active !== true) {
            return res.status(403).json({
                status: 403,
                message: 'Your account is disabled'
            });
        }

        req.user = user;
        return next();
    } catch (err) {
        return next(err);
    }
};

export const authorize = (roles = []) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            status: 403,
            message: 'You do not have permission to perform this action'
        });
    }

    return next();
};

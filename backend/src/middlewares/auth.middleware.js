import jwt from 'jsonwebtoken';
import * as Users from '../models/users.model.js';
import { getJwtSecret } from '../config/jwt.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 401,
        message: 'Authorization header missing'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());

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
    next();
  } catch (err) {
    return res.status(401).json({
      status: 401,
      message: 'Invalid or expired token'
    });
  }
};

export const authorize = (roles = []) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      status: 403,
      message: 'You do not have permission to perform this action'
    });
  }

  next();
};

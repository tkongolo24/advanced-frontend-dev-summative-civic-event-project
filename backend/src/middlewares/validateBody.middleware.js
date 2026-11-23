import { validationResult } from 'express-validator';
import { removeUploadedFile } from '../utils/media.js';

const validateBody = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file) {
            await removeUploadedFile(req.file);
        }

        return res.status(400).json({
            status: 400,
            message: 'Validation failed',
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }

    return next();
};

export default validateBody;

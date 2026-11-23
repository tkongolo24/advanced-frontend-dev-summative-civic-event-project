/**
 * Global error handler middleware
 * Should be the last middleware added in app.js
 */
const errorHandler = (err, req, res, next) => {
    console.error(err);

    let status = Number.isInteger(err.status) ? err.status : 500;
    let message = err.message || 'Internal Server Error';

    // Validation errors
    if (err.name === 'ValidationError') {
        status = 400;
        message = err.message;
    } else if (err.name === 'UnauthorizedError') {
        status = 401;
        message = 'Invalid or missing token';
    }

    // Multer upload errors
    if (err.name === 'MulterError') {
        status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

        message = err.code === 'LIMIT_FILE_SIZE'
            ? 'Uploaded file exceeds the allowed size'
            : 'Invalid file upload';
    }

    // PostgreSQL errors
    if (err.code === '23505') {
        status = 409;
        message = 'Duplicate entry';
    } else if (err.code === '23503') {
        status = 409;
        message = 'This operation conflicts with existing related records';
    } else if (err.code === '22P02') {
        status = 400;
        message = 'Invalid identifier or data format';
    } else if (err.code === '23514') {
        status = 400;
        message = 'Data does not satisfy the required constraints';
    }

    // Never expose internal server/database details to clients.
    if (status >= 500) {
        status = 500;
        message = 'Internal Server Error';
    }

    return res.status(status).json({
        status,
        message,
        ...(process.env.NODE_ENV === 'development' && status === 500
            ? { stack: err.stack }
            : {}),
    });
};

export default errorHandler;


import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import routes from './src/routes/index.routes.js';
import errorHandler from './src/middlewares/errorHandler.middleware.js';

const app = express();

const configuredOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin) => {
    if (!origin) return true;

    const isLocalOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    return isLocalOrigin || configuredOrigins.includes(origin);
};

app.use(cors({
    origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin));
    }
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api', routes);

app.get('/health', (req, res) => {
    res.json({
        ok: true,
        env: process.env.NODE_ENV || 'development'
    });
});

app.use(errorHandler);

export default app;

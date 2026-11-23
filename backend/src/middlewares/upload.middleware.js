import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadRoot = path.resolve(process.cwd(), 'uploads');

const ensureFolderExists = (folder) => {
    const directory = path.join(uploadRoot, folder);
    fs.mkdirSync(directory, { recursive: true });
    return directory;
};

const createStorage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, ensureFolderExists(folder));
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        cb(null, uniqueName);
    }
});

const validateFile = (allowedTypes, description) => (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = allowedTypes[extension];

    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
        const error = new Error(`Invalid ${description} file type or MIME type`);
        error.status = 400;
        return cb(error);
    }

    cb(null, true);
};

export const uploadEventImage = multer({
    storage: createStorage('events'),
    fileFilter: validateFile({
        '.jpg': ['image/jpeg'],
        '.jpeg': ['image/jpeg'],
        '.png': ['image/png'],
        '.gif': ['image/gif'],
    }, 'image'),
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

export const uploadPromoVideo = multer({
    storage: createStorage('promos'),
    fileFilter: validateFile({
        '.mp4': ['video/mp4'],
        '.mov': ['video/quicktime'],
        '.avi': ['video/x-msvideo', 'video/avi'],
        '.mkv': ['video/x-matroska'],
    }, 'video'),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

export const uploadAudio = multer({
    storage: createStorage('announcements'),
    fileFilter: validateFile({
        '.mp3': ['audio/mpeg'],
        '.wav': ['audio/wav', 'audio/x-wav'],
        '.m4a': ['audio/mp4', 'audio/x-m4a'],
        '.ogg': ['audio/ogg'],
    }, 'audio'),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

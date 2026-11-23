import fs from 'fs/promises';
import path from 'path';

const uploadRoot = path.resolve(process.cwd(), 'uploads');

export const removeUploadedFile = async (file) => {
    if (!file?.path) return;

    try {
        await fs.unlink(path.resolve(file.path));
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Could not remove uploaded file:', error);
        }
    }
};

export const removeManagedMedia = async (url, folder, expectedHost) => {
    if (!url || !expectedHost ||
        !['events', 'promos', 'announcements'].includes(folder)) {
        return;
    }

    try {
        const parsedUrl = new URL(url);

        // Only remove files created under the current request host.
        if (!['http:', 'https:'].includes(parsedUrl.protocol) ||
            parsedUrl.host !== expectedHost) {
            return;
        }

        const expectedPrefix = `/uploads/${folder}/`;
        if (!parsedUrl.pathname.startsWith(expectedPrefix)) return;

        const filename = path.basename(decodeURIComponent(parsedUrl.pathname));

        if (!filename || filename === '.' || filename === '..') return;

        const directory = path.resolve(uploadRoot, folder);
        const filePath = path.resolve(directory, filename);

        if (!filePath.startsWith(directory + path.sep)) return;

        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT' && !(error instanceof TypeError)) {
            console.error('Could not remove managed media:', error);
        }
    }
};

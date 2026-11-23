import db from '../config/db.js';

export const findAll = async (filters = {}, includeUnpublished = false) => {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const offset = (page - 1) * limit;

    const res = await db.query(
        `SELECT * FROM announcements
         WHERE ($1::boolean = true OR published = true)
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [includeUnpublished, limit, offset]
    );

    return res.rows;
};

export const findById = async (id, includeUnpublished = true) => {
    const res = await db.query(
        `SELECT * FROM announcements
         WHERE id = $1 AND ($2::boolean = true OR published = true)`,
        [id, includeUnpublished]
    );

    return res.rows[0] || null;
};

export const create = async ({ title, audio_url, published = true }) => {
    const res = await db.query(
        `INSERT INTO announcements (title, audio_url, published)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [title, audio_url, published]
    );

    return res.rows[0];
};

export const update = async (id, data) => {
    const existing = await findById(id, true);

    if (!existing) {
        throw Object.assign(new Error('Announcement not found'), { status: 404 });
    }

    const updated = { ...existing, ...data };

    const res = await db.query(
        `UPDATE announcements
         SET title = $1,
             audio_url = $2,
             published = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [updated.title, updated.audio_url, updated.published, id]
    );

    return res.rows[0];
};

export const remove = async (id) => {
    const res = await db.query(
        `DELETE FROM announcements WHERE id = $1 RETURNING *`,
        [id]
    );

    return res.rows[0] || null;
};

export const publish = async (id) => {
    const res = await db.query(
        `UPDATE announcements
         SET published = true, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return res.rows[0] || null;
};

export const unpublish = async (id) => {
    const res = await db.query(
        `UPDATE announcements
         SET published = false, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return res.rows[0] || null;
};

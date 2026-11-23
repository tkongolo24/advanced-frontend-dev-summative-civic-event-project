
import db from '../config/db.js';

export const createFeedback = async ({ user_id, event_id, rating, comment }) => {
    const res = await db.query(
        `INSERT INTO event_feedback (user_id, event_id, rating, comment)
         SELECT $1, e.id, $3, $4
         FROM events e
         WHERE e.id = $2
           AND e.ends_at IS NOT NULL
           AND e.ends_at <= NOW()
           AND EXISTS (
               SELECT 1
               FROM event_registrations er
               WHERE er.user_id = $1
                 AND er.event_id = e.id
                 AND er.status = 'registered'
           )
         RETURNING *`,
        [user_id, event_id, rating, comment]
    );

    return res.rows[0] || null;
};

export const updateFeedback = async (id, user_id, { rating, comment }) => {
    const res = await db.query(
        `UPDATE event_feedback
         SET rating = $1,
             comment = $2,
             updated_at = NOW()
         WHERE id = $3
           AND user_id = $4
         RETURNING *`,
        [rating, comment, id, user_id]
    );

    return res.rows[0] || null;
};

export const findByEvent = async (event_id) => {
    const res = await db.query(
        `SELECT ef.*, u.full_name, u.email
         FROM event_feedback ef
         JOIN users u ON ef.user_id = u.id
         WHERE ef.event_id = $1
         ORDER BY ef.created_at DESC`,
        [event_id]
    );

    return res.rows;
};

export const findByUser = async (user_id) => {
    const res = await db.query(
        `SELECT ef.*, e.title, e.starts_at
         FROM event_feedback ef
         JOIN events e ON ef.event_id = e.id
         WHERE ef.user_id = $1
         ORDER BY ef.created_at DESC`,
        [user_id]
    );

    return res.rows;
};

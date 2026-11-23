import db from '../config/db.js';

/**
 * Create a new regular user.
 * Public registration cannot assign privileged roles.
 */
export const createUser = async ({ full_name, email, password_hash }) => {
    const res = await db.query(
        `INSERT INTO users (full_name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'user', true)
         RETURNING id, full_name, email, role, is_active`,
        [full_name, email, password_hash]
    );

    return res.rows[0];
};

/**
 * Find a user by email (including password_hash).
 */
export const findByEmail = async (email) => {
    const res = await db.query(
        'SELECT * FROM users WHERE email=$1',
        [email]
    );

    return res.rows[0] || null;
};

/**
 * Find a user by ID (without password_hash).
 */
export const findById = async (id) => {
    const res = await db.query(
        `SELECT id, full_name, email, role, is_active,
                created_at, updated_at
         FROM users WHERE id=$1`,
        [id]
    );

    return res.rows[0] || null;
};

/**
 * List all users with pagination.
 */
export const findAll = async ({ page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;

    const res = await db.query(
        `SELECT id, full_name, email, role, is_active,
                created_at, updated_at
         FROM users
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    return res.rows;
};

/**
 * Update only permitted profile fields.
 */
export const updateUser = async (id, data = {}) => {
    const allowedFields = ['full_name', 'email'];

    const entries = Object.entries(data).filter(
        ([key, value]) =>
            allowedFields.includes(key) && value !== undefined
    );

    if (entries.length === 0) {
        return findById(id);
    }

    const fields = [];
    const values = [];

    entries.forEach(([key, value], index) => {
        fields.push(`${key}=$${index + 1}`);
        values.push(value);
    });

    fields.push('updated_at=NOW()');

    values.push(id);

    const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id=$${values.length}
        RETURNING id, full_name, email, role, is_active,
                  created_at, updated_at
    `;

    const res = await db.query(query, values);

    return res.rows[0] || null;
};

/**
 * Enable a user.
 */
export const enableUser = async (id) => {
    const res = await db.query(
        `UPDATE users
         SET is_active = true, updated_at = NOW()
         WHERE id = $1
         RETURNING id, full_name, email, role, is_active,
                   created_at, updated_at`,
        [id]
    );

    return res.rows[0];
};

/**
 * Disable a user.
 */
export const disableUser = async (id) => {
    const res = await db.query(
        `UPDATE users
         SET is_active = false, updated_at = NOW()
         WHERE id = $1
         RETURNING id, full_name, email, role, is_active,
                   created_at, updated_at`,
        [id]
    );

    return res.rows[0];
};

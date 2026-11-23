import '../src/config/loadEnv.js';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT || 5432)
});

const marker = 'CivicEvents Demo:';
const now = new Date();

const daysFromNow = (days, hour = 10) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const events = [
  {
    title: `${marker} Kigali Innovation Summit`,
    description: 'A gathering of entrepreneurs, innovators and technology enthusiasts exploring solutions for Rwanda and Africa.',
    location: 'Kigali Convention Centre',
    start: daysFromNow(5),
    end: daysFromNow(5, 17),
    published: true
  },
  {
    title: `${marker} Community Clean-Up Day`,
    description: 'Join local volunteers in keeping our neighbourhoods clean and promoting environmental responsibility.',
    location: 'Kimironko, Kigali',
    start: daysFromNow(9),
    end: daysFromNow(9, 13),
    published: true
  },
  {
    title: `${marker} Youth Skills Workshop`,
    description: 'Practical workshops covering leadership, communication, career development and digital skills.',
    location: 'Norrsken House Kigali',
    start: daysFromNow(14),
    end: daysFromNow(14, 16),
    published: true
  },
  {
    title: `${marker} Public Health Awareness Forum`,
    description: 'A community forum discussing public health awareness and access to local services.',
    location: 'Kigali Public Library',
    start: daysFromNow(20),
    end: daysFromNow(20, 15),
    published: true
  },
  {
    title: `${marker} Digital Literacy Training`,
    description: 'An introductory session helping community members build confidence using digital tools.',
    location: 'Kigali Public Library',
    start: daysFromNow(-10),
    end: daysFromNow(-10, 15),
    published: true
  },
  {
    title: `${marker} Community Leadership Meeting`,
    description: 'A completed community meeting focused on local development and civic participation.',
    location: 'Gasabo District, Kigali',
    start: daysFromNow(-20),
    end: daysFromNow(-20, 12),
    published: true
  },
  {
    title: `${marker} Draft Planning Session`,
    description: 'An unpublished planning event for administrators.',
    location: 'Kigali',
    start: daysFromNow(30),
    end: daysFromNow(30, 12),
    published: false
  }
];

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const adminResult = await client.query(
      `SELECT id FROM users WHERE role = 'admin' AND is_active = true LIMIT 1`
    );

    const userResult = await client.query(
      `SELECT id FROM users WHERE role = 'user' AND is_active = true LIMIT 1`
    );

    if (!adminResult.rows.length || !userResult.rows.length) {
      throw new Error('An active admin and normal user account are required.');
    }

    const adminId = adminResult.rows[0].id;
    const userId = userResult.rows[0].id;

    console.log('Using existing admin and user accounts.');

    // Events: reuse matching demo titles on subsequent runs.
    const eventIds = {};

    for (const event of events) {
      const result = await client.query(
        `INSERT INTO events
          (title, description, location, starts_at, ends_at, published, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          event.title,
          event.description,
          event.location,
          event.start,
          event.end,
          event.published,
          JSON.stringify({})
        ]
      );

      let id = result.rows[0]?.id;

      if (!id) {
        const existing = await client.query(
          'SELECT id FROM events WHERE title = $1 LIMIT 1',
          [event.title]
        );
        id = existing.rows[0]?.id;
      }

      eventIds[event.title] = id;
    }

    // Registrations for one completed and one upcoming event.
    const pastEventId = eventIds[`${marker} Digital Literacy Training`];
    const upcomingEventId = eventIds[`${marker} Kigali Innovation Summit`];

    await client.query(
      `INSERT INTO event_registrations (user_id, event_id, status)
       VALUES ($1, $2, 'registered')
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [userId, pastEventId]
    );

    await client.query(
      `INSERT INTO event_registrations (user_id, event_id, status)
       VALUES ($1, $2, 'registered')
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [userId, upcomingEventId]
    );

    // Feedback for the completed event.
    await client.query(
      `INSERT INTO event_feedback (user_id, event_id, rating, comment)
       VALUES ($1, $2, 5, $3)
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [
        userId,
        pastEventId,
        'Very informative session. I enjoyed the practical activities.'
      ]
    );

    // Announcements.
    const announcements = [
      'Community Service Update',
      'Upcoming Civic Participation Activities',
      'Important Public Notice'
    ];

    for (const title of announcements) {
      await client.query(
        `INSERT INTO announcements (title, audio_url, published)
         SELECT $1, $2, true
         WHERE NOT EXISTS (
           SELECT 1 FROM announcements WHERE title = $1
         )`,
        [
          `${marker} ${title}`,
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
        ]
      );
    }

    // Promos.
    const promos = [
      {
        title: 'Discover Kigali Community Events',
        description: 'Explore activities and opportunities happening around Kigali.',
        captions: 'Discover community events. Participate. Connect. Make a difference.'
      },
      {
        title: 'Get Involved in Your Community',
        description: 'Find opportunities to contribute to local initiatives.',
        captions: 'Your community needs your ideas and participation.'
      },
      {
        title: 'Youth Skills and Opportunities',
        description: 'Discover learning and development opportunities for young people.',
        captions: 'Learn new skills. Build connections. Create opportunities.'
      }
    ];

    for (const promo of promos) {
      const title = `${marker} ${promo.title}`;

      await client.query(
        `INSERT INTO promos
          (title, description, video_url, caption_text, published, created_by)
         SELECT $1, $2, $3, $4, true, $5
         WHERE NOT EXISTS (
           SELECT 1 FROM promos WHERE title = $1
         )`,
        [
          title,
          promo.description,
          'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          promo.captions,
          adminId
        ]
      );
    }

    // Broadcast notification.
    await client.query(
      `INSERT INTO notifications
        (title, message, type, recipient_id, metadata, created_by)
       SELECT $1, $2, 'announcement', NULL, $3, $4
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications WHERE title = $1
       )`,
      [
        `${marker} Welcome to CivicEvents`,
        'Explore upcoming events, register for activities and stay informed about your community.',
        JSON.stringify({}),
        adminId
      ]
    );

    // User-specific notification.
    await client.query(
      `INSERT INTO notifications
        (title, message, type, recipient_id, metadata, created_by)
       SELECT $1, $2, 'event', $3, $4, $5
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications
         WHERE title = $1 AND recipient_id = $3
       )`,
      [
        `${marker} Your event registration`,
        'You are registered for the Kigali Innovation Summit.',
        userId,
        JSON.stringify({ event_id: upcomingEventId }),
        adminId
      ]
    );

    await client.query('COMMIT');

    console.log('\nDemo data seeded successfully.');
    console.log('Existing accounts and records were preserved.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\nSeed failed. Changes rolled back:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

try {
  await seed();
} finally {
  await pool.end();
}

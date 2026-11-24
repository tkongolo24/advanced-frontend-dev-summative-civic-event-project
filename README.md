# CivicEvents Accessible City Events & Services Portal

CivicEvents is a community events and information portal developed for the **African Leadership University Advanced Frontend Development Summative Project**.

The platform allows users to discover local events, register for activities, access announcements and promotional content, and receive community notifications.

## Features

### User Features
- User registration and login
- Secure authentication using JWT
- Browse and search published events
- Register for and cancel event registrations
- View event feedback and submit feedback
- Listen to audio announcements
- Watch promotional videos with captions
- View notifications and registration history
- Manage profile information

### Administrator Features
- Create, edit, publish, unpublish, and delete events
- Manage announcements and promotional content
- View event attendees and feedback
- View dashboard statistics
- Manage user account status
- Send and manage notifications

## Technology Stack

- **Frontend:** HTML, Tailwind CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Authentication:** JSON Web Tokens (JWT)
- **Media Uploads:** Multer

## Requirements

Before running the project, ensure you have:

- Node.js and npm
- PostgreSQL
- A modern web browser
- Visual Studio Code
- Live Server extension for VS Code (recommended)

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tkongolo24/advanced-frontend-dev-summative-civic-event-project.git
cd advanced-frontend-dev-summative-civic-event-project
```

### 2. Configure the Backend

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Update `backend/.env` with your PostgreSQL credentials and a secure JWT secret.

Required environment variables:

```env
DB_HOST=localhost
DB_NAME=civic_events
DB_USER=your_database_user
DB_PASS=your_database_password
DB_PORT=5432

JWT_SECRET=your_secure_jwt_secret

PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
```

SMTP configuration is optional unless email functionality is enabled.

### 3. Set Up the Database

Make sure PostgreSQL is running and the database specified by `DB_NAME` exists.

Load the environment variables and run the database setup scripts from the `backend` directory:

```bash
set -a
source .env
set +a

npm run db:setup
npm run db:seed
```

The setup script creates the required database tables. The seed script inserts sample data for development and testing.

### 4. Start the Backend

From the `backend` directory, run:

```bash
npm run dev
```

The backend will run at:

- **API:** http://localhost:4000/api
- **Health Check:** http://localhost:4000/health

### 5. Start the Frontend

Open the `frontend` directory in Visual Studio Code.

Launch `index.html` using the Live Server extension, or use another local static web server.

The frontend is configured to use the backend at:

```text
http://localhost:4000
```

To change the backend URL, configure `window.CIVIC_EVENTS_CONFIG.BACKEND_URL` before the frontend configuration script loads.

Never place database passwords, JWT secrets, or other private credentials in frontend files.

## Project Structure

```text
.
├── backend/
│   ├── migrations/
│   ├── scripts/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   ├── index.html
│   └── README.md
└── README.md
```


## Notes

- The backend API is included in this repository for local development and integration testing.
- The `.env.example` file provides a template for environment configuration.
- Environment files containing secrets must never be committed to Git.
- This project was developed as part of the ALU Advanced Frontend Development summative assignment.
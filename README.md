# MediSmart Hub

A full-stack healthcare clinic management platform with role-based authentication, area-based staff onboarding, and an admin dashboard.

## Tech Stack

| Layer    | Technologies                                      |
| -------- | ------------------------------------------------- |
| Frontend | React, Vite, Tailwind CSS, React Router, Axios  |
| Backend  | Node.js, Express, MongoDB, Mongoose               |
| Auth     | JWT (httpOnly cookies), bcryptjs                |
| Email    | Nodemailer (Gmail)                                |

## Features

- **User authentication** — signup, login, logout, email verification
- **Password reset** — 6-digit code sent by email, code verification, then new password
- **Role-based access** — `admin` and `nurses`
- **Area management** — admins create a clinic area and receive a shareable code (`MSH-XXXXXX`)
- **Staff onboarding** — nurses sign up with a valid area code
- **Admin dashboard** — sidebar navigation, staff list, analytics, and placeholder modules (patients, triage, pharmacy, reports, audit log, settings)
- **Nurses dashboard** — dedicated view for staff members

## Project Structure

```
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route handlers
│   ├── middleware/      # JWT & role guards
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── mailer/          # Email templates & sending
│   ├── utils/           # Helpers
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/         # Axios client
│       ├── components/
│       │   ├── auth/    # Auth UI components
│       │   └── admin/   # Admin layout & sidebar
│       ├── pages/
│       │   ├── auth/    # Login, signup, reset password, etc.
│       │   ├── admin/   # Admin dashboard pages
│       │   └── staff/   # Nurses dashboard
│       └── routes/      # App routing
├── .env.example
└── package.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for Nodemailer

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd <project-folder>

# Backend dependencies (root)
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable      | Description                                      |
| ------------- | ------------------------------------------------ |
| `PORT`        | Backend port (default: `5000`)                   |
| `NODE_ENV`    | `development` or `production`                    |
| `MONGO_URI`   | MongoDB connection string                        |
| `JWT_SECRET`  | Long random string for signing tokens            |
| `CLIENT_URL`  | Frontend URL (e.g. `http://localhost:5173`)      |
| `EMAIL_USER`  | Gmail address used to send emails                |
| `EMAIL_PASS`  | Gmail app password                               |
| `EMAIL_NAME`  | Display name in outgoing emails                  |

Optional frontend variable (create `frontend/.env` if needed):

```env
VITE_API_URL=http://localhost:5000
```

### 3. Run the application

Open two terminals:

**Backend** (from project root):

```bash
npm run dev
```

**Frontend** (from `frontend/`):

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## User Roles

### Admin

1. Sign up as **Admin** (no area code required).
2. After login, create a clinic **area** on the dashboard.
3. Copy the generated area code and share it with nurses.
4. Manage staff and view analytics from the admin sidebar.

### Nurses

1. Sign up as **Nurses** and enter the area code from your admin.
2. Verify your email with the 6-digit code sent to your inbox.
3. Log in to access the nurses dashboard.

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| POST   | `/signup`                   | Register a new user      |
| POST   | `/login`                    | Log in                   |
| POST   | `/logout`                   | Log out                  |
| GET    | `/check-auth`               | Get current user         |
| POST   | `/verify-email`             | Verify email with code   |
| POST   | `/resend-verification-email`| Resend verification code |
| POST   | `/forgot-password`          | Send password reset code |
| POST   | `/verify-reset-code`        | Validate reset code      |
| POST   | `/reset-password`           | Set new password         |

### Areas — `/api/areas`

| Method | Endpoint   | Access | Description          |
| ------ | ---------- | ------ | -------------------- |
| POST   | `/create`  | Admin  | Create clinic area   |
| GET    | `/my-area` | Auth | Get linked area      |
| GET    | `/staff`   | Admin  | List area staff      |

## Password Reset Flow

1. **Forgot password** — user enters email and receives a 6-digit code.
2. **Enter code** — user submits email + code on `/reset-password-code`.
3. **New password** — if the code is valid, user sets a new password on `/reset-password`.

## Production Build

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` folder with any static host and point `CLIENT_URL` and `VITE_API_URL` to your production URLs.

## License

ISC

# MediSmart Hub 🏥

MediSmart Hub is a comprehensive clinical platform designed to streamline healthcare facility management. It offers role-based access for Administrators, Nurses, Triage staff, and Pharmacy personnel, providing specialized dashboards and tools for each department to manage patient flow, consultations, and medical data efficiently.

## 🌟 Features

*   **Role-Based Access Control (RBAC):** Secure access tailored for different roles (`admin`, `nurses`, `triage`, `pharmacy`).
*   **Area Management:** Admins create clinic areas and receive shareable codes (`MSH-XXXXXX`) for staff onboarding.
*   **Dynamic Dashboards:** Real-time analytics, active class tracking, and quick actions specific to the logged-in user's role.
*   **Smart Triage System:** Efficiently process new patients and manage consultations.
*   **Patient Management:** Comprehensive patient profiles, medical history tracking, and cohort visualization.
*   **Disease Classifications:** Manage and categorize disease classes (Admin only) to assist in triage and patient placement.
*   **Pharmacy Monitor:** Track pharmacy operations and medication flows.
*   **Secure Authentication:** Features include email verification, password reset flows, and secure session management using HTTP-only cookies and JWTs.
*   **Modern UI/UX:** A premium, responsive design built with React, Vite, and Tailwind CSS.

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, React Router, Axios |
| **Backend** | Node.js, Express, MongoDB, Mongoose |
| **Auth** | JWT (httpOnly cookies), bcryptjs |
| **Email** | Nodemailer (Gmail) |

## 🔐 Role Capabilities

| Feature | Admin | Nurse | Triage | Pharmacy |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard** | ✅ | ✅ | 🚧 | 🚧 |
| **Patients** | ✅ (Full) | ✅ (Read/Update) | 🚧 | 🚧 |
| **Smart Triage** | ✅ | ✅ | ✅ | ❌ |
| **Pharmacy** | ✅ | ✅ | ❌ | ✅ |
| **Disease Classes**| ✅ (Manage) | ✅ (Read Only) | ❌ | ❌ |
| **Reports** | ✅ | ❌ | ❌ | ❌ |
| **Area Staff** | ✅ | ✅ (Read Only) | ❌ | ❌ |

*(Note: 🚧 denotes features currently in development or planned for specific roles)*

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [MongoDB](https://www.mongodb.com/) (local or Atlas)
*   A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for Nodemailer

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Eya-Kouki2/Medi_Smart.git
    cd "ies nodes and hubs"
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    ```
    *   Create a `.env` file in the `backend` directory (see Environment Variables below).
    *   Start the development server:
        ```bash
        npm run dev
        ```

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    ```
    *   Start the Vite development server:
        ```bash
        npm run dev
        ```

4.  **Access the Application:**
    Open your browser and navigate to `http://localhost:5173`.
    Backend API runs on `http://localhost:5000`.

## ⚙️ Environment Variables

### Backend (`backend/.env`)

Copy the `.env.example` file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
| :--- | :--- |
| `PORT` | Backend port (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string for signing tokens |
| `CLIENT_URL` | Frontend URL (e.g. `http://localhost:5173`) |
| `EMAIL_USER` | Gmail address used to send emails |
| `EMAIL_PASS` | Gmail app password |
| `EMAIL_NAME` | Display name in outgoing emails |

### Frontend

The frontend uses an Axios instance configured to point to `http://localhost:5000/api` by default. If needed, you can create a `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000
```

## 📁 Project Structure

```text
├── backend/
│   ├── config/          # Database connection & configurations
│   ├── controllers/     # Route handlers (Auth, Patients, Areas, etc.)
│   ├── mailer/          # Email templates & sending utilities
│   ├── middleware/      # JWT & role guards
│   ├── models/          # Mongoose schemas (User, Patient, DiseaseClass, etc.)
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point for the Express application
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── api/         # Axios client
│       ├── assets/      # Images, global styles
│       ├── components/  # Reusable UI components (Auth, Admin Layouts, Sidebar)
│       ├── constants/   # Global constants
│       ├── hooks/       # Custom React hooks
│       ├── pages/       # Route components (AdminHome, Login, Signup, Patients)
│       ├── routes/      # React Router configuration (AppRoutes.jsx)
│       ├── utils/       # Frontend helper functions (getDashboardPath, etc.)
│       ├── App.jsx      # Root React component
│       ├── main.jsx     # React DOM rendering entry point
│       └── index.css    # Main stylesheet including Tailwind directives
├── .env.example
└── package.json
```

## 🌐 API Endpoints Overview

*   **Auth** (`/api/auth`): Signup, login, logout, check-auth, verify-email, password reset flow.
*   **Areas** (`/api/areas`): Create area, get my area, get staff list.
*   **Patients** (`/api/patients`): CRUD operations for patients and their medical history/triage.
*   **Disease Classes** (`/api/disease-classes`): Manage disease categories for triage.

## 🛠️ Production Build

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` folder with any static host and point `CLIENT_URL` and `VITE_API_URL` to your production URLs.

---
*Built by the MediSmart Team.*

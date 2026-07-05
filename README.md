# MediSmart Hub 🏥

## 📋 Table of Contents
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [System Modules](#-system-modules)
- [Tech Stack](#-tech-stack)
- [Role Capabilities](#-role-capabilities)
- [How to Run (Step by Step)](#-how-to-run-step-by-step)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)

---

## ❗ The Problem

Modern hospitals and clinics face critical bottlenecks in patient management:

1. **Slow Manual Triage**: Nurses manually assess every arriving patient, leading to long waiting queues and delayed care — especially dangerous in emergency scenarios.
2. **No Intelligent Room Assignment**: Staff must manually track which rooms are available for which disease, with no automatic routing to the right department.
3. **Pharmacy Inefficiency**: Medication stock is tracked manually, with no automated scanning or expiry monitoring, leading to errors and wasted resources.
4. **Disconnected Systems**: Patient data, triage results, room assignments, and pharmacy records live in separate places, forcing staff to switch between multiple tools.
5. **No Contactless Patient Interaction**: All triage interactions require physical touchscreen input or nurse involvement, slowing down the process and increasing exposure risk.

---

## ✅ Our Solution

**MediSmart Hub** is a unified, intelligent clinical platform that automates and streamlines hospital operations through AI and voice technology.

### How we solve each problem:
| Problem | Solution |
| :--- | :--- |
| Slow triage | AI symptom detection with 25-question ML model (`triage_rf_model_v2.pkl`) |
| No room assignment | Automatic disease-to-room matching with real-time availability tracking |
| Pharmacy inefficiency | OCR-based medicine scanner (`pharmacy_scan.py`) extracts drug info from box images |
| Disconnected systems | Single unified dashboard with role-based access for all staff |
| No contactless interaction | Physical voice kiosk (`triage_kiosk.py`) that mirrors results live on the dashboard |

---

## 🧩 System Modules

### 1. 🔐 Authentication & Role Management
Secure login system with JWT tokens stored in HTTP-only cookies. Staff members are onboarded via a clinic area code (`MSH-XXXXXX`). Roles determine exactly which features each user can access.
- **Roles**: `admin`, `nurse`, `triage`, `pharmacy`
- **Features**: Email verification, password reset, session management

---

### 2. 🧬 Detect Sickness (AI Triage Module)
The core intelligence of the platform. Diagnoses patients using a **Random Forest ML model** trained on 25 clinical symptoms.

**Mode A — Manual (Web Form)**
- Nurse clicks "Start Assessment" → answers Yes/No questions on screen for the patient
- ML model runs in the backend → room assignment appears instantly

**Mode B — Voice (Browser)**
- Nurse clicks "🎤 Start with Voice" → browser microphone activates
- Patient speaks "Oui" or "Non" → selected button lights up on screen → auto-advances
- Nobody needs to touch the screen

**Mode C — Physical Kiosk (`triage_kiosk.py`)**
- ESP32 sensor detects a patient approaching → webcam confirms the face
- Python voice assistant asks all 25 questions out loud in French via TTS
- Patient answers by voice → STT recognizes "Oui/Non"
- **Each answer is sent LIVE to the web dashboard via Server-Sent Events (SSE)**
- Dashboard mirrors every answer in real-time: question appears on screen, button flashes
- After all 25 questions → AI runs → final result (room number) appears on dashboard

---

### 3. 💊 Pharmacy Monitor (AI Medicine Scanner)
Automates pharmacy stock management using OCR image recognition.

- Staff uploads an image of a medicine box
- `pharmacy_scan.py` (powered by EasyOCR) extracts: **Drug Name, Strength, Expiry Date, Inventory Status**
- Results appear in a **Scan Results** pending queue (saved in browser localStorage — survives page refresh)
- Staff reviews each item: click ✅ to accept into inventory, or 🗑️ to discard
- **Accept All** saves all pending scans to the MongoDB database at once

---

### 4. 🏠 Admin Dashboard
Real-time overview of the entire clinic:
- Active patient counts per room
- Room capacity alerts (triggers yellow warning when rooms are full)
- Quick navigation to all modules

---

### 5. 👥 Patient Management
Full patient lifecycle tracking:
- Create and update patient profiles
- Medical history and triage records per patient
- Assign patients to disease classes / rooms

---

### 6. 🏥 Disease Classes
Admin-controlled mapping of diseases to physical hospital rooms:
- Assign diseases (Malaria, Tuberculosis, AIDS, etc.) to room codes
- Set max patient capacity per room
- Used by the AI to auto-route patients after diagnosis

---

### 7. 🔴 Live Room Alerts
When all rooms for a specific disease are full:
- The triage screen shows a **yellow "Wait just few seconds"** warning instead of a room number
- A dashboard alert is logged and staff are notified

---

### 8. 📡 Real-Time Kiosk Bridge (SSE)
The `kioskRoutes.js` module acts as a live bridge between the Python kiosk and the web dashboard:
- `POST /api/result/progress` → receives each question/answer from Python → broadcasts to dashboard
- `POST /api/result` → receives final prediction from Python → triggers room assignment on dashboard
- `GET /api/result/stream` → SSE stream that the React frontend subscribes to

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Axios |
| **Backend** | Node.js, Express, MongoDB, Mongoose |
| **ML / AI** | Python 3, scikit-learn (Random Forest), EasyOCR, OpenCV 4 |
| **Voice Kiosk** | pyttsx3 (TTS), SpeechRecognition + Google STT, PyAudio |
| **Auth** | JWT (httpOnly cookies), bcryptjs |
| **Email** | Nodemailer (Gmail) |
| **Real-time** | Server-Sent Events (SSE) |
| **Hardware** | ESP32 presence sensor, Webcam, Microphone |

---

## 🔐 Role Capabilities

| Feature | Admin | Nurse | Triage | Pharmacy |
| :--- | :---: | :---: | :---: | :---: |
| Dashboard | ✅ | ✅ | 🚧 | 🚧 |
| Patients | ✅ Full | ✅ Read/Update | 🚧 | 🚧 |
| Detect Sickness | ✅ | ✅ | ✅ | ❌ |
| Pharmacy Monitor | ✅ | ✅ | ❌ | ✅ |
| Disease Classes | ✅ Manage | ✅ Read Only | ❌ | ❌ |
| Area Staff | ✅ | ✅ Read Only | ❌ | ❌ |

---

## ▶️ How to Run (Step by Step)

You will need **3 terminal windows** open simultaneously.

---

### Prerequisites

Before starting, make sure you have:
- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) running (local or Atlas)
- [Python 3.10+](https://www.python.org/)
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Eya-Kouki2/Medi_Smart.git
cd Medi_Smart
```

---

### Step 2 — Configure Environment Variables

Create a file named `.env` inside the `backend/` folder:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret_key
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_NAME=MediSmart Hub
```

---

### Step 3 — Install All Dependencies

**Backend (Node.js):**
```bash
cd backend
npm install
```

**Frontend (React):**
```bash
cd frontend
npm install
```

**Python AI (ML + Kiosk + Scanner):**
```bash
cd backend/ml
pip install opencv-contrib-python==4.10.0.84 pyttsx3 SpeechRecognition joblib requests flask scikit-learn PyAudio easyocr
```

> ⚠️ **Windows Note for PyAudio:** If `pip install PyAudio` fails, download the matching `.whl` from [Unofficial Windows Binaries](https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio) and run:
> `pip install PyAudio‑0.2.xx‑cpXX‑cpXX‑win_amd64.whl`

> ⚠️ **OpenCV Version:** Must be `4.10.x`. OpenCV 5 removed `CascadeClassifier` used by the face detection. Always use `opencv-contrib-python==4.10.0.84`.

---

### Step 4 — Start the Backend Server

> **Terminal 1**

```bash
cd backend
npm run dev
```

✅ Expected output: `Server is running on port 5000`

---

### Step 5 — Start the Frontend

> **Terminal 2**

```bash
cd frontend
npm run dev
```

✅ Open your browser at **http://localhost:5173**

---

### Step 6 — (Optional) Run the Physical AI Triage Kiosk

> **Terminal 3** — Only if you have the hardware (ESP32, webcam, microphone) or want to test manually

```bash
cd backend/ml
python triage_kiosk.py
```

✅ Expected output:
```
En attente d'une détection de présence (ESP32) sur le port 5001 (chemin /presence)...
* Serving Flask app 'triage_kiosk'
```

The kiosk is now waiting for a patient. To simulate hardware detection, open a **4th terminal**:

```powershell
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:5001/presence -Method POST -Body "1" -UseBasicParsing
```

```bash
# Linux / macOS
curl -X POST -d "1" http://localhost:5001/presence
```

**What happens next:**
1. Webcam opens → looks for a face
2. Voice says *"Bonjour, je suis votre assistant de triage médical..."*
3. Each question is asked out loud in French
4. Patient answers *"Oui"* or *"Non"*
5. **The Detect Sickness dashboard mirrors each answer live in real-time**
6. After all 25 questions → AI predicts disease → room number appears on dashboard

---

### Step 7 — Use the Web Voice Mode (No Hardware Needed)

If you don't have the ESP32/kiosk hardware, use the built-in browser voice mode:

1. Log in → go to **Detect Sickness**
2. Click **"🎤 Start with Voice (Oui / Non)"**
3. Allow microphone access in the browser
4. Say **"Oui"** or **"Non"** for each question — the button lights up and advances automatically
5. After all questions → room assignment appears

---

### Step 8 — Use the Pharmacy Scanner

1. Log in → go to **Pharmacy Monitor**
2. Drag & drop (or click to upload) a medicine box image
3. AI extracts: Drug Name, Strength, Expiry Date, Status
4. Results appear in **Scan Results** (persisted in browser, survives refresh)
5. Click ✅ on each row to accept, or **Accept All** to bulk-save to inventory

---

### Quick Reference

| Service | Command | Terminal |
| :--- | :--- | :--- |
| Backend | `cd backend && npm run dev` | 1 |
| Frontend | `cd frontend && npm run dev` | 2 |
| Kiosk (optional) | `cd backend/ml && python triage_kiosk.py` | 3 |
| Simulate sensor (Windows) | `Invoke-WebRequest -Uri http://localhost:5001/presence -Method POST -Body "1" -UseBasicParsing` | 4 |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/patients` | Get all patients |
| `POST` | `/api/patients` | Create a patient |
| `GET` | `/api/disease-classes` | Get all disease/room classes |
| `POST` | `/api/ml/predict` | Run ML prediction from symptom features array |
| `GET` | `/api/result/stream` | SSE stream for live kiosk updates to dashboard |
| `POST` | `/api/result` | Receive final prediction from `triage_kiosk.py` |
| `POST` | `/api/result/progress` | Receive per-question live progress from kiosk |
| `POST` | `/api/pharmacy/scan` | Upload image for AI medicine OCR scan |
| `GET` | `/api/pharmacy` | Get all saved inventory |
| `POST` | `/api/pharmacy/accept` | Save pending scans to inventory database |

---

## 📁 Project Structure

```
Medi_Smart/
├── backend/
│   ├── config/               # MongoDB connection
│   ├── controllers/          # Business logic for each route
│   ├── mailer/               # Email templates & Nodemailer config
│   ├── middleware/           # JWT auth & role guard middleware
│   ├── ml/                   # Python AI scripts
│   │   ├── triage_kiosk.py         # Physical voice kiosk (ESP32 + TTS/STT)
│   │   ├── pharmacy_scan.py        # Medicine box OCR scanner (EasyOCR)
│   │   ├── predict.py              # CLI wrapper for ML prediction
│   │   └── triage_rf_model_v2.pkl  # Trained Random Forest model
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── DiseaseClass.js
│   │   └── Medication.js
│   ├── routes/               # Express API routes
│   │   ├── authRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── diseaseClassRoutes.js
│   │   ├── mlRoutes.js             # ML prediction endpoint
│   │   ├── kioskRoutes.js          # SSE + kiosk progress bridge
│   │   └── pharmacyRoutes.js       # Pharmacy scan & inventory
│   └── server.js             # Express app entry point
├── frontend/
│   └── src/
│       ├── api/              # Axios client config
│       ├── components/       # Reusable UI (Sidebar, Layout)
│       ├── constants/        # Shared constants (maladies, etc.)
│       ├── hooks/            # Custom React hooks
│       ├── pages/
│       │   └── admin/
│       │       ├── DetectSickness.jsx  # AI triage (manual, voice, kiosk)
│       │       ├── PharmacyMonitor.jsx # Pharmacy scanner UI
│       │       ├── Patients.jsx
│       │       ├── DiseaseClasses.jsx
│       │       └── AdminHome.jsx
│       ├── routes/           # React Router (AppRoutes.jsx)
│       └── utils/            # Frontend helpers
└── README.md
```

---

*Built by the MediSmart Team — Eya Kouki & Fatma Lajmi*

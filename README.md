# MediSmart Hub 🏥

MediSmart Hub is a comprehensive clinical platform designed to streamline healthcare facility management. It features a **Python-powered AI triage kiosk**, a **pharmacy medicine scanner**, real-time dashboards, and role-based access for Administrators, Nurses, Triage staff, and Pharmacy personnel.

---

## 🌟 Features

- **Role-Based Access Control (RBAC):** Secure access for roles: `admin`, `nurses`, `triage`, `pharmacy`.
- **AI-Powered Detect Sickness:** A voice kiosk (powered by `triage_kiosk.py`) interviews patients in French using speech recognition and automatically sends results to the live dashboard via SSE.
- **Pharmacy Monitor (AI Scanner):** Upload an image of a medicine box; the AI (`pharmacy_scan.py`) extracts drug name, strength, expiry date, and inventory status automatically.
- **Smart Triage System:** Manually answer symptom questions to get an ML-powered room assignment.
- **Stock Inventory:** Scan results queue in a pending list. Accept them individually or all at once to save to the database.
- **Live Room Assignment:** When all rooms for a disease are full, the kiosk screen shows "Wait just few seconds" in yellow.
- **Patient Management:** Comprehensive patient profiles and medical history tracking.
- **Disease Classifications:** Map disease classes to physical hospital rooms (Admin only).
- **Secure Authentication:** Email verification, password reset, JWT (httpOnly cookies).
- **Modern UI/UX:** Premium, responsive design built with React and Vite.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Axios |
| **Backend** | Node.js, Express, MongoDB, Mongoose |
| **ML / AI** | Python 3, scikit-learn, OpenCV, pyttsx3, SpeechRecognition, EasyOCR |
| **Auth** | JWT (httpOnly cookies), bcryptjs |
| **Email** | Nodemailer (Gmail) |
| **Real-time** | Server-Sent Events (SSE) |

---

## 🔐 Role Capabilities

| Feature | Admin | Nurse | Triage | Pharmacy |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard** | ✅ | ✅ | 🚧 | 🚧 |
| **Patients** | ✅ Full | ✅ Read/Update | 🚧 | 🚧 |
| **Detect Sickness** | ✅ | ✅ | ✅ | ❌ |
| **Pharmacy Monitor** | ✅ | ✅ | ❌ | ✅ |
| **Disease Classes** | ✅ Manage | ✅ Read Only | ❌ | ❌ |
| **Area Staff** | ✅ | ✅ Read Only | ❌ | ❌ |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Python 3.10+](https://www.python.org/)
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for Nodemailer

---

## ▶️ How to Run the Project

You will need **3 terminal windows** open at the same time.

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Eya-Kouki2/Medi_Smart.git
cd Medi_Smart
```

---

### Step 2 — Set Up Environment Variables

Create a `.env` file inside the `backend/` folder with the following content:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
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

**Python AI (ML scripts):**
```bash
cd backend/ml
pip install opencv-contrib-python pyttsx3 SpeechRecognition joblib requests flask scikit-learn PyAudio easyocr
```

> **Windows Note:** If `PyAudio` fails, download the pre-compiled `.whl` for your Python version from [Unofficial Windows Binaries](https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio) and install with `pip install <filename>.whl`.

---

### Step 4 — Start the Backend Server

> **Terminal 1**

```bash
cd backend
npm run dev
```

✅ You should see: `Server is running on port 5000`

---

### Step 5 — Start the Frontend

> **Terminal 2**

```bash
cd frontend
npm run dev
```

✅ Open your browser at **http://localhost:5173**

---

### Step 6 — (Optional) Run the AI Triage Kiosk

> **Terminal 3** — Only needed if you want the voice kiosk hardware integration

```bash
cd backend/ml
python triage_kiosk.py
```

✅ You should see: `En attente d'une détection de présence (ESP32) sur le port 5001`

The kiosk is now waiting for a patient to be detected by the ESP32 sensor.

**To test without physical hardware**, open a 4th terminal and run:

```powershell
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:5001/presence -Method POST -Body "1"
```

```bash
# Linux / macOS
curl -X POST -d "1" http://localhost:5001/presence
```

The webcam will activate → voice assistant asks questions in French → result appears live on the **Detect Sickness** page automatically.

---

### Step 7 — Using the Pharmacy Scanner

1. Log in and navigate to **Pharmacy Monitor** in the sidebar.
2. Drag & drop (or click to upload) an image of a medicine box.
3. The AI will extract: Drug Name, Strength, Expiry Date, Inventory Status.
4. Results appear in the **Scan Results** table (pending, saved in your browser).
5. Click ✅ on individual rows to accept, or **Accept All** to save everything to the database.

---

### Quick Summary

| What | Command | Terminal |
| :--- | :--- | :--- |
| Start Backend | `cd backend && npm run dev` | Terminal 1 |
| Start Frontend | `cd frontend && npm run dev` | Terminal 2 |
| Start Kiosk (optional) | `cd backend/ml && python triage_kiosk.py` | Terminal 3 |
| Simulate Sensor (Windows) | `Invoke-WebRequest -Uri http://localhost:5001/presence -Method POST -Body "1"` | Terminal 4 |

---

## 🎙️ Hardware Triage Kiosk

The physical kiosk (`triage_kiosk.py`) uses an **ESP32 presence sensor**, **webcam** (face detection), and **microphone** (French voice AI) to fully automate the patient triage process. Results are sent to the dashboard in real-time.

### How It Works

1. Patient approaches the kiosk → ESP32 detects presence → triggers the script.
2. Webcam confirms a face is present.
3. Voice AI asks the patient symptom questions in French: *"Avez-vous de la toux ?"*
4. Patient answers **"Oui"** or **"Non"** out loud.
5. The ML model (`triage_rf_model_v2.pkl`) analyzes the answers and predicts the disease.
6. Result is sent via HTTP to `POST /api/result` on the Node.js backend.
7. The **Detect Sickness** page instantly shows the room assignment via SSE (no page refresh needed).

### Run the Kiosk

Make sure the backend server is running, then in a new terminal:

```bash
cd backend/ml
python triage_kiosk.py
```

The script will output: `En attente d'une détection de présence (ESP32) sur le port 5001`

### Simulate Without Hardware

To test the full flow without an ESP32 sensor, open a new terminal and trigger the presence manually:

**PowerShell (Windows):**
```powershell
Invoke-WebRequest -Uri http://localhost:5001/presence -Method POST -Body "1"
```

**Linux / macOS:**
```bash
curl -X POST -d "1" http://localhost:5001/presence
```

The webcam will activate, the voice assistant will ask questions, and results will appear on the dashboard!

---

## 💊 Pharmacy Monitor (AI Scanner)

The pharmacy scanner uses `pharmacy_scan.py` (backed by EasyOCR) to read medicine box images.

1. Navigate to **Pharmacy Monitor** in the sidebar.
2. Drag and drop (or upload) an image of a medicine box.
3. The AI extracts: **Drug Name**, **Strength**, **Expiry Date**, **Inventory Status**.
4. Results appear in the **Scan Results** table (pending queue, persisted in `localStorage`).
5. Review each result individually using the ✅ Accept or 🗑️ Discard buttons.
6. Or use **Accept All** to save all pending scans to the **Stock Inventory** database at once.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_NAME=MediSmart Hub
```

### Frontend (`frontend/.env`) — Optional

```env
VITE_API_URL=http://localhost:5000
```

---

## 📁 Project Structure

```
Medi_Smart/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Route handlers
│   ├── mailer/          # Email templates
│   ├── middleware/      # JWT & role guards
│   ├── ml/              # Python AI scripts
│   │   ├── triage_kiosk.py       # Hardware voice kiosk
│   │   ├── pharmacy_scan.py      # Medicine OCR scanner
│   │   ├── predict.py            # CLI ML prediction wrapper
│   │   └── triage_rf_model_v2.pkl
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express API routes
│   │   ├── kioskRoutes.js        # SSE + POST /api/result
│   │   ├── pharmacyRoutes.js     # Pharmacy scan & inventory
│   │   └── mlRoutes.js           # ML prediction
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/admin/
│       │   ├── DetectSickness.jsx  # Triage form + kiosk listener
│       │   └── PharmacyMonitor.jsx # Pharmacy scanner UI
│       └── ...
└── README.md
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/patients` | Get all patients |
| `POST` | `/api/ml/predict` | Run ML prediction from symptom features |
| `POST` | `/api/result` | Receive result from `triage_kiosk.py` |
| `GET` | `/api/result/stream` | SSE stream for live kiosk results |
| `POST` | `/api/pharmacy/scan` | Upload image for AI medicine scan |
| `GET` | `/api/pharmacy` | Get all saved inventory |
| `POST` | `/api/pharmacy/accept` | Save pending scans to inventory |

---

## 🛠️ Production Build

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` folder with any static host and update `CLIENT_URL` and `VITE_API_URL` to your production URLs.

---

*Built by the MediSmart Team.*

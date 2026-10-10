# ElderCare — Full Stack Elderly Care Management System

A complete full-stack Elderly Care Management Platform separated cleanly into **Frontend** and **Backend** directories.

---

## 📁 Project Directory Structure

```text
eldercare/
├── backend/
│   ├── config/                     # Database & mock store configuration
│   │   ├── db.js
│   │   └── mockStore.js
│   ├── controllers/                # MVC Controllers (Logic layer)
│   │   ├── auth/
│   │   │   └── authController.js   # User auth & session controller
│   │   ├── activitiesController.js
│   │   ├── appointmentsController.js
│   │   ├── careDependencyMapController.js
│   │   ├── carePlansController.js
│   │   ├── caregiversController.js
│   │   ├── chatbotController.js
│   │   ├── documentsController.js
│   │   ├── emergencyController.js
│   │   ├── healthController.js
│   │   ├── medicationsController.js
│   │   ├── notificationsController.js
│   │   ├── residentsController.js
│   │   ├── settingsController.js
│   │   └── specialistsController.js
│   ├── routes/                     # Express API Route handlers
│   │   ├── activities.js
│   │   ├── appointments.js
│   │   ├── auth.js
│   │   ├── careDependencyMap.js
│   │   ├── carePlans.js
│   │   ├── caregivers.js
│   │   ├── chatbot.js
│   │   ├── documents.js
│   │   ├── emergency.js
│   │   ├── health.js
│   │   ├── medications.js
│   │   ├── notifications.js
│   │   ├── residents.js
│   │   ├── settings.js
│   │   └── specialists.js
│   ├── services/                   # AI & Care Assistant Services
│   ├── scripts/                    # Database seeding and migration scripts
│   ├── .env                        # Backend environment variables
│   ├── index.js                    # Express app entry point
│   └── package.json                # Backend dependencies & scripts
│
├── frontend/
│   ├── public/                     # Static assets & icons
│   ├── src/                        # React application source code
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Route views & dashboards
│   │   ├── services/               # API clients
│   │   ├── context/                # Global React contexts
│   │   ├── styles/                 # CSS Design tokens & themes
│   │   ├── utils/                  # Helper utilities
│   │   ├── App.jsx                 # Main application component
│   │   └── main.jsx                # React DOM entry point
│   ├── index.html                  # HTML entry template
│   ├── vite.config.js              # Vite bundler & API proxy configuration
│   └── package.json                # Frontend dependencies & scripts
│
├── package.json                    # Root coordinator scripts
├── start.bat                       # One-click startup script (MySQL + Dev)
└── README.md
```

---

## 🚀 Quick Start

### 1. Run Everything (One Command)
From the `eldercare` directory:
```bash
npm run dev
```
*(Or double-click `start.bat`)*

This starts:
- **Backend API Server**: `http://localhost:5001`
- **Frontend Vite Client**: `http://localhost:5173`

### 2. Run Independently

**Backend only:**
```bash
cd backend
npm run dev
```

**Frontend only:**
```bash
cd frontend
npm run dev
```

---

## 🔑 Demo Login Accounts

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin` (or `Care@123`) |
| **Caregiver** | `caregiver` | `caregiver` (or `Care@123`) |
| **Family** | `family` | `family` (or `Care@123`) |
| **Patient** | `patient` | `patient` (or `Care@123`) |

---

## 🐳 Docker Deployment (Frontend)

### 1. Build Docker Image
```bash
cd frontend
docker build -t <your-dockerhub-username>/eldercare-frontend:latest .
```

### 2. Run Container Locally
```bash
docker run -d -p 80:80 --name eldercare_frontend <your-dockerhub-username>/eldercare-frontend:latest
```
Open `http://localhost` in your browser.

### 3. Push to Docker Hub
```bash
# Login to Docker Hub
docker login

# Push the image
docker push <your-dockerhub-username>/eldercare-frontend:latest
```


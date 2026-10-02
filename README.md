# 📦 LogixSense — AI-Powered Smart Supply Chain Command Center

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Oracle-F80000?style=for-the-badge&logo=oracle&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq_AI-000000?style=for-the-badge&logo=groq&logoColor=white" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" />
</p>

<p align="center">
  <b>A real-time, AI-driven logistics management platform for monitoring shipments, optimizing routes, assessing weather-based risks, and managing driver operations — all from a single futuristic dashboard.</b>
</p>

---

## ✨ Features

### 🗂️ Core Logistics
- **Shipment Tracking** — Real-time status monitoring (pending → in-transit → delivered) with live map visualization
- **Route Optimization** — AI-generated optimal routes with distance, ETA, and risk scoring
- **Alert & Disruption Management** — Automated risk alerts for weather, traffic, and road conditions
- **Stoppage Detection** — Track and analyze unplanned stops with geolocation data

### 🤖 AI-Powered Intelligence
- **Groq AI Integration** — Natural language logistics insights with Groq Compound AI (Gemini fallback)
- **Predictive Risk Analysis** — AI-driven route risk scoring and disruption prediction
- **Smart Notifications** — Context-aware alerts based on real-time conditions

### 🌦️ Weather Integration
- **OpenWeather API** — Real-time weather data for route corridors
- **Weather-Based Risk Scoring** — Automated risk level adjustment for monsoon, fog, and extreme conditions

### 👨‍✈️ Driver Management
- **Driver Score Dashboard** — Performance metrics (safety, punctuality, efficiency)
- **Trip Logging** — Complete trip history with behavior events
- **SOS Emergency System** — One-tap emergency alerts with GPS coordinates

### 🌐 Multi-Language Support
- **6 Languages** — English, हिन्दी (Hindi), தமிழ் (Tamil), తెలుగు (Telugu), ಕನ್ನಡ (Kannada), മലയാളം (Malayalam)
- Dynamic UI language switching with persistent preference

### 📱 Progressive Web App (PWA)
- Installable on mobile and desktop
- Offline-capable with service worker caching
- Native app-like experience

---

## 🏗️ Architecture

```
LogixSense/
├── index.html              # Single-page application (6,600+ lines)
├── dev-server.js           # Node.js HTTP server + REST API
├── db.js                   # Multi-driver DB manager (Oracle / SQLite / JSON)
├── oracle_schema.sql       # Full Oracle DDL schema & seed data
├── lang.js                 # i18n language module
├── service-worker.js       # PWA offline caching
├── manifest.json           # PWA manifest
├── seed.js                 # Database seeder script
├── logixsense_db.json      # Embedded JSON database (zero-dependency fallback)
├── icons/                  # PWA icons (192px, 512px, SVG)
├── locales/                # Translation files (en, hi, ta, te, kn, ml)
├── dist/                   # Production build output
├── .env.example            # Environment variable template
├── firebase.json           # Firebase Hosting config
├── vercel.json             # Vercel deployment config
├── render.yaml             # Render deployment config
├── Procfile                # Heroku deployment config
└── _redirects              # Netlify redirects
```

### Database Support

LogixSense uses a **tri-driver database architecture** that automatically selects the best available backend:

| Priority | Driver     | When Used                              |
|----------|------------|----------------------------------------|
| 1        | **Oracle** | `oracledb` npm package is installed    |
| 2        | **SQLite** | `sqlite3` npm package is installed     |
| 3        | **JSON**   | Default fallback — zero dependencies   |

> The JSON engine provides a fully functional SQL-like experience with no external database required.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (only required for the dev server)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/navaneethakrishnan-web/LogixSense.git
cd LogixSense

# 2. Copy environment variables
cp .env.example .env

# 3. Fill in your API keys in .env
#    - GROQ_API_KEY    → https://console.groq.com/keys
#    - OPENWEATHER_API_KEY → https://openweathermap.org/api

# 4. Start the dev server
npm start
```

The app will be live at **http://localhost:8888**

> **Note:** The app works out-of-the-box with zero dependencies using the built-in JSON database engine. No `npm install` required for basic usage.

### Optional: Use Oracle or SQLite

```bash
# For SQLite support
npm install sqlite3

# For Oracle support
npm install oracledb
# Then run the schema: sqlplus user/pass@db @oracle_schema.sql
```

---

## 🔌 API Endpoints

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/api/shipments`      | List all shipments                 |
| POST   | `/api/shipments`      | Create a new shipment              |
| GET    | `/api/alerts`         | List all risk alerts               |
| POST   | `/api/alerts`         | Create a new alert                 |
| GET    | `/api/stoppages`      | List all stoppages                 |
| POST   | `/api/stoppages`      | Create a new stoppage              |
| GET    | `/api/driver-scores`  | List driver performance scores     |
| GET    | `/api/trip-logs`      | List all trip logs                 |
| GET    | `/api/notifications`  | List all notifications             |
| POST   | `/api/notifications`  | Create a new notification          |
| POST   | `/api/sos`            | Trigger SOS emergency alert        |
| POST   | `/api/gemini`         | AI prompt (Groq → Gemini fallback) |
| GET    | `/api/weather`        | Weather data by lat/lon            |
| GET    | `/api/db/tables`      | Database inspector — list tables   |
| GET    | `/api/db/table?name=` | Database inspector — table data    |

---

## 🌍 Deployment

LogixSense includes ready-to-deploy configs for multiple platforms:

| Platform        | Config File       | Deploy Command                     |
|-----------------|-------------------|------------------------------------|
| **Netlify**     | `_redirects`      | `netlify deploy --prod`            |
| **Vercel**      | `vercel.json`     | `vercel --prod`                    |
| **Render**      | `render.yaml`     | Push to connected Git repo         |
| **Firebase**    | `firebase.json`   | `firebase deploy`                  |
| **Heroku**      | `Procfile`        | `git push heroku main`             |

> Remember to set `GROQ_API_KEY` and `OPENWEATHER_API_KEY` as environment variables on your hosting platform.

---

## 🛡️ Environment Variables

| Variable              | Required | Description                              |
|-----------------------|----------|------------------------------------------|
| `GROQ_API_KEY`        | Yes      | Groq API key for AI logistics insights   |
| `OPENWEATHER_API_KEY` | Yes      | OpenWeather API key for weather data      |
| `PORT`                | No       | Server port (defaults to `8888`)         |

> **⚠️ Never commit your `.env` file.** Use `.env.example` as a template.

---

## 📊 Data Flow Diagrams

The project includes detailed DFD documentation:

- **Level 0** — Context diagram (system boundary)
- **Level 1** — Major process decomposition
- **Level 2** — Detailed sub-process flows
- **ER Diagram** — Complete entity-relationship model

---

## 🛠️ Tech Stack

| Layer        | Technology                                    |
|--------------|-----------------------------------------------|
| **Frontend** | Vanilla HTML/CSS/JS, Leaflet.js, PWA          |
| **Backend**  | Node.js (zero-dependency HTTP server)         |
| **AI**       | Groq Compound AI, Google Gemini (fallback)    |
| **Weather**  | OpenWeather API                               |
| **Database** | Oracle DB / SQLite / Embedded JSON Engine     |
| **Maps**     | Leaflet.js with OpenStreetMap tiles           |
| **i18n**     | Custom language module (6 Indian languages)   |
| **Fonts**    | Google Fonts (Syne, Space Mono, Noto Sans)    |

---

## 📄 License

This project is private and proprietary.

---

<p align="center">
  Built with ❤️ for smarter logistics in India
</p>

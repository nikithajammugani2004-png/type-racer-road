# ⚡ ROAD TYPERACER — Cyber Edition 🏎️💨

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Render Deployment](https://img.shields.io/badge/Render-Live%20Demo-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://type-racer-road-k5q0.onrender.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A high-octane Cyberpunk arcade typing racer built with FastAPI and 60 FPS HTML5 Canvas.**  
*Overtake neon supercars on the speedway by typing approaching words before taking maximum damage!*

👉 **[PLAY LIVE NOW ON RENDER](https://type-racer-road-k5q0.onrender.com/)** 👈

</div>

---

## 🎮 Game Overview

**Road TypeRacer** blends the thrill of high-speed arcade highway driving with keyboard speed and precision training. Opponent vehicles zoom down multi-lane neon tracks carrying target words. Type each word accurately to fire your thrusters and overtake the competition!

---

## 🚀 Key Features

- 🏎️ **60 FPS Cyberpunk Canvas Speedway**: Animated multi-lane road featuring moving neon stripes, road shoulders, vehicle headlights, and high-speed motion line overlays.
- 🎯 **Dynamic Racing Classes (Difficulty Tiers)**:
  - 🟢 **Class Easy**: 3–5 letter vocabulary, relaxed cruise speed.
  - 🟡 **Class Medium**: 6–8 letter words, accelerated traffic flow.
  - 🔴 **Class Hard**: 9–12 letter technical words, hyper-velocity race.
- 📊 **Real-Time Racer HUD**:
  - Live Score accumulation.
  - Dynamic Typing Accuracy percentage calculation.
  - Damage Gauge: Tracks missed vehicles (Max damage: 25 missed).
- 🏆 **Hall of Fame Leaderboard**: Top 10 driver rankings saved across sessions with automated local storage failover.
- 📱 **Mobile & Tablet Optimized**: Adaptive virtual viewport handling and intelligent auto-capitalization detection for touchscreen keyboards.
- ⚡ **Instant-Play Engine**: Integrated fallback dictionaries ensure instantaneous gameplay with zero freeze or loading lag.

---

## 🕹️ Controls & Gameplay Rules

1. **Select Vehicle Class**: Pick your difficulty (**Easy**, **Medium**, or **Hard**).
2. **Press ENGINE START**: The traffic starts accelerating down the highway.
3. **Type to Overtake**: Type the word appearing on the closest target vehicle. Pressing the correct letters advances your car past the opponent.
4. **Damage Control**: Every word that drives off-screen counts as damage. Reaching **25 missed words** results in a total crash!
5. **Submit Callsign**: When the race concludes, enter your driver name to claim your spot in the Hall of Fame.

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com) (Python 3) | High-performance asynchronous API & static asset delivery |
| **Web Server** | [Uvicorn](https://www.uvicorn.org) | Lightning-fast ASGI web server |
| **Game Engine** | HTML5 Canvas 2D + ES6 JavaScript | Smooth 60 FPS physics, vehicle rendering, and particle effects |
| **Styling** | Cyberpunk CSS3 + Google Fonts | Neon glow aesthetics using `Orbitron` and `Rajdhani` typography |
| **Dictionary** | `english-words` | Curated clean vocabulary pools sorted by length |
| **Deployment** | [Render](https://render.com) + GitHub Actions | Cloud hosting with automated 24/7 keep-alive pings |

---

## ⚡ Instant Loading & 24/7 Keep-Alive Architecture

On free cloud hosting tiers like Render, web services automatically sleep after 15 minutes of inactivity, resulting in a 50–120 second "cold start" delay when clicking the link. 

This repository solves this through a multi-tier optimization strategy:

1. **Automated GitHub Actions Keep-Alive**:
   - A scheduled workflow ([`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml)) runs every 10 minutes to ping the `/health` endpoint.
   - Prevents the Render container from entering sleep mode so the game opens **instantly on the first click**.
2. **Lightweight `/health` & HEAD Endpoint**:
   - Zero-overhead FastAPI route that answers status queries in `< 5ms`.
3. **HTTP Cache-Control Headers**:
   - Static game assets (`style.css`, `app.js`, fonts) are cached by browsers for 24 hours (`max-age=86400`), eliminating repeat download overhead.
4. **Resilient Client-Side Standby**:
   - The frontend includes built-in offline vocabulary pools and localStorage persistence, allowing races to start instantly even if the server is still initializing.

> [!TIP]
> You can also add a free HTTP monitor on **[cron-job.org](https://cron-job.org)** or **[UptimeRobot](https://uptimerobot.com)** targeting `https://type-racer-road-k5q0.onrender.com/health` (every 10 minutes) for 100% redundant keep-alive coverage.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Python 3.10 or higher
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/nikithajammugani2004-png/type-racer-road.git
cd type-racer-road
```

### 3. Create and Activate Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Launch the Game Server
```bash
uvicorn main:app --reload --port 8000
```

### 6. Open in Browser
Visit **[http://localhost:8000](http://localhost:8000)** to start playing!

---

## 📁 Project Structure

```text
type-racer-road/
├── .github/
│   └── workflows/
│       └── keep-alive.yml      # Automated 10-minute Render keep-alive ping
├── static/
│   ├── app.js                  # Canvas game loop, input handling, and HUD logic
│   └── style.css               # Cyberpunk neon UI, animations, and modals
├── index.html                  # Main game interface and HUD elements
├── main.py                     # FastAPI server, /health endpoint, and word API
├── requirements.txt            # Python dependencies (fastapi, uvicorn, etc.)
└── README.md                   # Project documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
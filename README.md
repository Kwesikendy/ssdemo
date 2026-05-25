# SmartScript — AI Exam Marking Platform

An AI-powered exam script marking platform that uses **Groq LLM** to automatically mark student exam scripts against marking schemes.

![SmartScript](./public/logo.png)

## 📁 Project Structure

```
/                    ← React frontend (runs on port 3001)
/backend/            ← Node.js/Express API (runs on port 8080)
```

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env    # Fill in your Groq API key
npm run dev             # Starts on http://localhost:8080
```

### 2. Frontend
```bash
npm install
npm start               # Starts on http://localhost:3001
```

### 3. Open the app
Go to **http://localhost:3001** → choose **Live Demo** to connect to the real backend.

## ✨ Features

- 📄 **Upload exam scripts** — PDF or image files
- 📋 **Marking schemes** — create with AI parsing or paste text directly
- 🤖 **AI-powered marking** — Groq `llama-3.3-70b-versatile` marks each script
- 📊 **Results dashboard** — scores, grades, per-question feedback
- ⚠️ **Anomaly detection** — flags suspicious similarities or missing pages
- 📥 **CSV export** — download results for any group

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `PORT` | Server port (default: 8080) |
| `JWT_SECRET` | Secret for signing JWTs |
| `GROQ_API_KEY` | Your Groq API key from console.groq.com |

See `backend/.env.example` for a template.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express |
| AI Marking | Groq SDK (`llama-3.3-70b-versatile`) |
| Auth | JWT (in-memory, demo mode) |
| Storage | In-memory (demo — resets on restart) |

## 📝 Workflow

```
Create Group → Upload Marking Scheme → Upload Scripts → Start Marking → View Results
```

## ⚠️ Notes

- This is a **demo** build using in-memory storage. Data resets on server restart.
- The backend and frontend must both be running for Live Demo mode to work.
- For production use, replace the in-memory store with a real database.

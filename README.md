# Naftal Staff Connect

Staff management for Naftal gas stations: personnel records, station assignments (temporary and permanent), leave, absences and returns, time tracking, printable documents with tracked transmittal slips (bordereaux), cancellation requests, and real-time notifications.

## Stack

| | |
|---|---|
| `frontend/` | Next.js · React 19 · Tailwind CSS · Radix UI · Chart.js · socket.io-client |
| `backend/` | Express · MongoDB (Mongoose) · socket.io · node-cron · Multer · express-session |

## Getting started

### Backend

```bash
cd backend
npm install
npm run dev
```

`backend/.env`:

```
MONGO_URI=mongodb://localhost:27017/staffconnect
SESSION_SECRET=change_me
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

`frontend/.env.local`:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Open http://localhost:3000.

> Internal Naftal system, no public demo.

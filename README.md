# SafetyConnect — Crime Reporting App

Real-time crime & incident reporting for citizens and police dispatch —
**React (Vite) client** + **Express / MySQL / Socket.io server**.

```
crime-reporting-app/
├── client/          React SPA (Vite, port 5173, proxies /api → :5000)
└── server/          Express API + Socket.io (port 5000, MySQL via XAMPP)
```

## Prerequisites

- Node.js 18+
- **XAMPP with MySQL running** (MariaDB on `localhost:3306`, root / no password)

## Setup

### 1. Database

```bash
"C:/xampp/mysql/bin/mysql.exe" -u root < server/database.sql
```

(or paste `server/database.sql` into the XAMPP **phpMyAdmin → SQL** tab)

This creates the `safetyconnect` database, all 6 tables, and seeds demo data:
46 police stations across all 10 districts, 2 accounts, and 6 sample incidents.

### 2. Server

```bash
cd server
npm install
npm run dev        # or: npm start
```

Config lives in `server/.env` (port, DB credentials, JWT secret).

> On startup the server automatically adds `reports.station_id` (if missing) and
> syncs the full list of 46 police stations, so existing databases keep working
> without a re-import.

### 3. Client

```bash
cd client
npm install
npm run dev        # → http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`.

> **Single-port mode:** after `npm run build` in `client/`, the server serves the
> built app itself — just open **http://localhost:5000**.

## Demo accounts

| Role    | Login                | Password    |
| ------- | -------------------- | ----------- |
| Officer | `#4021` (or `j.doe@precinct12.gov`) | `officer123` |
| Citizen | `thabo@example.com`  | `citizen123` |

The dispatch portal (`/dashboard`) can also be opened via its demo gate — no
login required.

## Tracking tokens

Seeded reports use the tokens shown in the UI placeholder, e.g. **`REP-8921-X`**
— try it on the Track page.

## API reference

| Method | Route                        | Description |
| ------ | ---------------------------- | ----------- |
| GET    | `/api/health`                | Server + DB health check |
| POST   | `/api/auth/register`         | Citizen registration → `{ user, token }` |
| POST   | `/api/auth/login`            | Citizen/officer login (badge `#4021` or email) → `{ user, token }` |
| GET    | `/api/reports`               | Full dispatch feed (officer portal) |
| GET    | `/api/reports/public`        | Privacy-safe feed for the public map |
| GET    | `/api/reports/track/:token`  | Track a report by anonymous token (404 if unknown) |
| POST   | `/api/reports`               | Create report (`multipart/form-data`, field `media[]`, optional `Bearer` token) |
| POST   | `/api/reports/:id/dispatch`  | Dispatch a unit → status `In Progress` |
| POST   | `/api/reports/:id/resolve`   | Resolve a case |
| GET    | `/api/stations`              | Stations + patrol units |
| GET    | `/api/stations/nearest`      | `?lat=..&lng=..&limit=..` → closest stations first |

### Socket.io events (server → client)

| Event             | When |
| ----------------- | ---- |
| `incident:new`    | A report is submitted |
| `incident:update` | A unit is dispatched / a case is resolved |

The officer dashboard listens to both for its live queue.

## Database schema

`users` · `stations` · `station_units` · `reports` · `report_media` · `report_updates`
— see `server/database.sql` for the full definitions and seed data.

## Notes

- Evidence uploads: JPG/PNG/GIF/WEBP/MP4/WEBM/MOV/AVI, **25MB per file, max 8**
  → stored in `server/uploads/images|videos/`, served at `/uploads/...`
- Report tokens are generated server-side: `REP-<n>-<letter>`, refs `INC-<n>`.
- Anonymous reports have their description masked in the public/track responses.
- The client keeps offline demo fallbacks when the API is unreachable, so the UI
  still works with the server stopped.

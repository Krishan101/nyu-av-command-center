# Production Architecture Plan

This document outlines how the NYU AV Command Center prototype would evolve into a production system.

## Current State: Prototype

```
┌─────────────────────────────┐
│   index.html (GitHub Pages) │
│   ├─ Embedded mock data     │
│   ├─ Client-side auth       │
│   └─ In-memory state        │
└─────────────────────────────┘
```

Everything is self-contained for demo purposes. No backend, no database, no external APIs.

## Production Target

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Frontend   │────▶│  Backend API     │────▶│  Data Sources       │
│  (React/    │     │  (Node/Express   │     │  ├─ Google Sheets   │
│   Vite)     │◀────│   or Python/     │◀────│  │  (inventory,     │
│             │     │   FastAPI)       │     │  │   schedules)     │
└─────────────┘     │                  │     │  ├─ PostgreSQL      │
                    │  ├─ Auth (SSO)   │     │  │  (command log,   │
                    │  ├─ RBAC         │     │  │   audit trail)   │
                    │  ├─ WebSocket    │     │  └─ Device APIs     │
                    │  └─ Command queue│     │     (Crestron, QSC, │
                    └──────────────────┘     │      Biamp, Extron) │
                                            └─────────────────────┘
```

## Key Production Decisions

### Data Layer: Google Sheets vs. Database

**Google Sheets** works well as the source of truth for:
- Equipment inventory (managed by ops team in spreadsheets already)
- Staff shift schedules (familiar interface for managers)

The backend would use the **Google Sheets API** to read/sync this data, with a local cache (Redis or in-memory) to avoid hitting rate limits.

**PostgreSQL** would handle:
- Command audit log (append-only, needs indexing and retention)
- User sessions and auth tokens
- Real-time device status (polled from hardware APIs)

### Frontend/Backend Separation

| Concern | Frontend | Backend |
|---------|----------|---------|
| Rendering | React + Vite | — |
| Auth | Redirect to NYU SSO | Validate tokens, issue sessions |
| RBAC | Hide/show UI elements | **Enforce** on every API call |
| Commands | Build payload, preview | Validate, queue, dispatch to device |
| Sheets sync | — | Poll Google Sheets API, cache locally |
| WebSocket | Receive live status updates | Push device status changes |

### Authentication

Replace hardcoded credentials with **NYU SSO (Shibboleth/SAML)** via the backend. The frontend never sees passwords.

### Command Dispatch

In production, "Fire Command" would:
1. POST to `/api/commands` with the JSON payload
2. Backend validates RBAC, logs to PostgreSQL
3. Backend dispatches to the actual device API (Crestron, QSC, Biamp control protocol)
4. WebSocket pushes status update back to all connected dashboards

### Repo Structure (Production)

```
nyu-av-command-center/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/    # API client
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/   # auth, RBAC
│   │   ├── services/    # Sheets sync, device APIs
│   │   └── db/          # migrations, queries
│   ├── package.json
│   └── Dockerfile
├── docs/
│   └── ARCHITECTURE.md
└── docker-compose.yml
```

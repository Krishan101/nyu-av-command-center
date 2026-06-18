# Production Architecture — NYU AV Command Center

How this prototype would evolve into a production system for NYU AV & Media Services.

---

## Current State: Prototype

```
Browser → index.html (GitHub Pages)
           ├─ Embedded mock data (simulating Google Sheets)
           ├─ Client-side RBAC
           └─ In-memory session + command log
```

Single file, zero backend. Ships in 30 seconds. All data is hardcoded JS arrays mirroring what would come from two Google Sheets.

---

## Production Target

```
┌──────────────┐       ┌───────────────────┐       ┌────────────────────┐
│   Frontend   │       │   Backend API     │       │   Data Layer       │
│   React +    │◄─────►│   Node.js /       │◄─────►│                    │
│   Vite       │  REST │   Express         │       │ Google Sheets API  │
│              │  + WS │                   │       │  ├─ Equipment      │
│ Deployed:    │       │ ├─ Auth (NYU SSO) │       │  └─ Schedules     │
│ Vercel or    │       │ ├─ RBAC middleware │       │                    │
│ NYU hosting  │       │ ├─ Command queue  │       │ PostgreSQL         │
│              │       │ ├─ WebSocket hub  │       │  ├─ Command log   │
└──────────────┘       │ └─ Device proxy   │       │  ├─ Audit trail   │
                       └───────┬───────────┘       │  └─ Sessions      │
                               │                   │                    │
                               │ TCP/IP            │ Device Control     │
                               ▼                   │  ├─ Crestron API  │
                       ┌───────────────┐           │  ├─ QSC Q-SYS    │
                       │ AV Devices    │           │  ├─ Biamp Tesira  │
                       │ on 10.18.x.x  │           │  └─ Extron SIS   │
                       └───────────────┘           └────────────────────┘
```

---

## Data Layer Strategy

### Google Sheets (Source of Truth for Operational Data)

The operations team already manages equipment and schedules in spreadsheets. Rather than forcing a migration, we **keep Google Sheets as the primary interface** and sync via API.

**Equipment Inventory Sheet** → Backend polls every 60s via Sheets API v4, caches in Redis. Any edits by ops staff in the sheet propagate to the dashboard within a minute.

**Staff Schedules Sheet** → Same polling pattern. Shift changes appear on the dashboard without anyone touching the app.

**Why Sheets, not a database, for this data:**
- Ops team can edit without learning new tools
- Audit trail built into Google Sheets version history
- Easy to share, comment, and collaborate
- Export to CSV/PDF for reporting

### PostgreSQL (System-Generated Data)

Data the *system* produces (not humans editing) goes in Postgres:
- Command dispatch audit log (immutable, indexed by timestamp + device)
- User sessions and auth tokens
- Device heartbeat/ping history (for uptime dashboards)
- Alert history

### Redis (Ephemeral State)

- Cached Sheets data (equipment list, schedule)
- Active WebSocket connection registry
- Rate limiting for command dispatch
- Session tokens (with TTL)

---

## Authentication

Replace hardcoded credentials with **NYU SSO (Shibboleth/SAML 2.0)**:

1. Frontend redirects to NYU's IdP login page
2. SAML assertion returns to backend callback URL
3. Backend validates assertion, extracts NetID + group memberships
4. Backend issues JWT stored in httpOnly cookie
5. RBAC roles mapped from NYU directory groups (e.g., `nyu-av-managers`, `nyu-av-technicians`)

The frontend never handles passwords.

---

## Command Dispatch Flow (Production)

```
Manager clicks "Fire Command"
    │
    ▼
Frontend POST /api/commands { payload }
    │
    ▼
Backend: validate JWT → check RBAC → validate device exists
    │
    ▼
Write to PostgreSQL (audit log)
    │
    ▼
Push to command queue (Bull/Redis)
    │
    ▼
Worker: connect to device IP via manufacturer protocol
    ├─ Crestron: CIP (Crestron Internet Protocol)
    ├─ QSC: Q-SYS JSON-RPC over TCP
    ├─ Biamp: Tesira Text Protocol (TTP)
    └─ Extron: SIS (Simple Instruction Set) over TCP
    │
    ▼
Device responds → update command status → push via WebSocket
    │
    ▼
Dashboard updates in real-time: "dispatched" → "acknowledged" → "completed"
```

---

## Repo Structure (Production)

```
nyu-av-command-center/
├── frontend/
│   ├── src/
│   │   ├── components/       # Dashboard, Tables, Modal, CommandLog
│   │   ├── hooks/            # useAuth, useWebSocket, useCommands
│   │   ├── services/         # API client, WebSocket client
│   │   ├── stores/           # Zustand state management
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── routes/           # /auth, /equipment, /staff, /commands
│   │   ├── middleware/       # authMiddleware, rbacMiddleware
│   │   ├── services/
│   │   │   ├── sheets.js     # Google Sheets API sync
│   │   │   ├── devices/      # Crestron, QSC, Biamp, Extron drivers
│   │   │   └── websocket.js  # Real-time push
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── queries/
│   │   └── queue/            # Bull workers for command dispatch
│   ├── package.json
│   └── Dockerfile
├── data/
│   ├── equipment-inventory.csv
│   └── staff-schedules.csv
├── docs/
│   ├── ARCHITECTURE.md
│   └── API.md
├── docker-compose.yml
└── README.md
```

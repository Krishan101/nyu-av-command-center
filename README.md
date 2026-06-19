<div align="center">

# NYU AV Command Center

**Operational Dashboard for AV & Media Services**

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-57068C?style=for-the-badge&logo=github)](https://krishan101.github.io/nyu-av-command-center/)
[![Python](https://img.shields.io/badge/Flask-Mock_Server-3776AB?style=for-the-badge&logo=python&logoColor=white)](mock-device-server/)
[![Apps Script](https://img.shields.io/badge/Google-Apps_Script-34A853?style=for-the-badge&logo=google&logoColor=white)](apps-script/)

---

*A two-tier AV equipment management prototype — an instant GitHub Pages demo*
*and a full-stack Google Apps Script + Flask implementation with server-side RBAC,*
*real HTTP command dispatch, and audit logging.*

</div>

---

## Try It Now

> **No setup required.** Open the link, log in, start using it.

### [Launch Live Demo](https://krishan101.github.io/nyu-av-command-center/)

| Username | Password | Role | What You See |
|:--------:|:--------:|:----:|:------------|
| `manager` | `mgr456` | Manager | Full dashboard — equipment, staff, commands, audit log |
| `technician` | `tech123` | Technician | Personalized view — your shift, your devices, team availability |

---

## What It Does

```
┌──────────────────────────────────────────────────────────────┐
│                    NYU AV COMMAND CENTER                      │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  Equipment   │  Staff       │  Commands    │  Audit Log      │
│  Inventory   │  Shift       │  Builder +   │  Every attempt  │
│  10 devices  │  Schedule    │  JSON Preview│  tracked +      │
│  8 buildings │  8 staff     │  ACK/NACK    │  exportable     │
└──────────────┴──────────────┴──────────────┴─────────────────┘
```

- **Role-specific dashboards** — Managers see everything. Technicians see their shift, their assigned devices, and a team view via the burger menu.
- **Search and filter** — Instant filtering across equipment and staff tables by name, type, building, or IP. Press `/` to focus search.
- **Device detail panel** — Click any device row to expand firmware version, last ping, assigned tech, floor/room, and operational notes.
- **Command dispatch** — Build JSON payloads, preview live, fire to devices. Destructive commands (`power_off`, `reboot`) show a confirmation warning.
- **Notification alerts** — Red dot on the menu icon when devices are offline. Alert banners on the dashboard for offline equipment.
- **Audit log with export** — Every command logged with timestamp and full payload. Export as CSV for reporting.
- **Last activity timestamp** — Simulated system check indicator shows time since last poll.
- **Accessible** — ARIA labels, roles, live regions, keyboard shortcuts, focus management, screen reader support.

---

## Two Implementations

### 1. GitHub Pages Demo — `index.html`

Single-file, zero-dependency dashboard. Opens in a browser and works immediately.

### 2. Full-Stack — `apps-script/` + `mock-device-server/`

Production-oriented architecture with real HTTP communication:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Apps Script     │  POST   │  Flask Server     │  ACK/   │  Google Sheet   │
│  Web App         │────────>│  /device/command  │  NACK   │  CommandLog Tab │
│                  │<────────│                   │         │                 │
│  Auth.gs         │         │  Validates JSON   │         │  Audit trail    │
│  RBAC via        │         │  Returns ACK/NACK │         │  for every      │
│  Session.get     │         │  with tx ID       │         │  attempt        │
│  ActiveUser()    │         └──────────────────┘         └─────────────────┘
└─────────────────┘
```

---

## Project Structure

```
nyu-av-command-center/
│
├── index.html                         GitHub Pages demo (555 lines)
├── SUBMISSION.md                      Testing guide for reviewer
├── README.md
│
├── apps-script/                       Google Apps Script backend
│   ├── Code.gs                        Entry point + data join logic
│   ├── Auth.gs                        Server-side RBAC enforcement
│   ├── Commands.gs                    Build, validate, POST, log
│   ├── SeedData.gs                    Populate Sheet with mock data
│   ├── index.html                     Web App UI
│   └── appsscript.json                Manifest
│
├── mock-device-server/                Python Flask mock hardware
│   ├── mock_device_server.py          /device/command endpoint
│   ├── requirements.txt               flask, flask-cors, gunicorn
│   └── Procfile                       Render deployment
│
├── data/                              Mock spreadsheet sources
│   ├── equipment-inventory.csv        Spreadsheet A (17 columns)
│   └── staff-schedules.csv            Spreadsheet B (14 columns)
│
└── docs/
    └── ARCHITECTURE.md                Production scaling plan
```

---

## How RBAC Works

```
                    ┌──────────────────────────────┐
                    │     Client clicks button     │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │  triggerDeviceCommand()        │
                    │  ┌─────────────────────────┐  │
                    │  │ Check session.role       │  │
                    │  │ !== "manager" ? BLOCK    │  │
                    │  └─────────────────────────┘  │
                    └──────┬───────────────┬───────┘
                           │               │
                    ┌──────▼──────┐ ┌──────▼──────┐
                    │  Manager    │ │  Other      │
                    │  Proceed    │ │  Blocked    │
                    │  to build   │ │  (in logic, │
                    │  payload    │ │  not just   │
                    │             │ │  UI hiding) │
                    └─────────────┘ └─────────────┘
```

The client hides buttons for Technicians as a UX convenience. But the actual gate is in `fireCommand()` — it re-checks `session.role !== 'manager'` before executing. Even DOM manipulation won't bypass it.

In the Apps Script version, `Auth.requireRole("Manager")` re-checks the caller's email against the Users sheet tab via `Session.getActiveUser().getEmail()`, and denied attempts are logged.

---

## Command Flow

```
Manager clicks "Command"
       │
       ▼
  Modal opens: select command, preview JSON
       │
       ▼
  Destructive? (power_off, reboot) → confirmation warning
       │
       ▼
  "Fire Command" clicked
       │
       ▼
  RBAC re-check → build payload → log to command log
       │
       ▼
  Toast notification + log entry with expandable JSON
```

---

## Feature Comparison

| Feature | GitHub Pages Demo | Apps Script Version |
|:--------|:-----------------:|:-------------------:|
| Role-specific dashboards | Yes | Yes |
| Search and filter | Yes | Yes |
| Device detail panel | Yes | Yes |
| Destructive command confirmation | Yes | Yes |
| Notification dot (offline devices) | Yes | Yes |
| Command log export (CSV) | Yes | Yes (Sheet tab) |
| Last activity timestamp | Yes | — |
| RBAC | Client-side + JS logic | Server-side (Sheet lookup) |
| HTTP POST to device | Simulated in-memory | Real fetch to Flask |
| Device ACK/NACK response | — | From Flask server |
| Denied attempt logging | — | ACCESS_DENIED entries |
| Accessibility (ARIA, keyboard) | Yes | Yes |
| Light/Dark mode | Yes | — |

---

## Setup

### Flask Mock Device Server

```bash
cd mock-device-server
pip install -r requirements.txt
flask run --port 5050
```

**Test it:**
```bash
curl -X POST http://localhost:5050/device/command \
  -H "Content-Type: application/json" \
  -d '{"command":"power_on","device":"EQ-001","issued_by":"test@nyu.edu","timestamp":"2026-06-18T12:00:00Z"}'
```

**Deploy to Render (free):** Set root directory to `mock-device-server`, start command `gunicorn mock_device_server:app`.

### Google Apps Script

1. Create a new Google Sheet, open **Extensions > Apps Script**
2. Create files matching `apps-script/` and paste contents
3. Run `seedAllTabs()` to populate the 4 sheet tabs
4. Add your Google email to the **Users** tab as `Manager`
5. Update `CONFIG.DEVICE_SERVER_URL` in Code.gs
6. **Deploy > Web app** — access: "Anyone with Google account"

Full testing steps in [SUBMISSION.md](SUBMISSION.md).

---

## Design Decisions

1. **Role-specific dashboards** — Technicians see their shift and their assigned devices. Managers see everything. This mirrors how real ops teams work — techs care about their zone, managers care about the full picture.

2. **Server-side RBAC on every call** — Could cache client-side, but re-verifying on each privileged action is the correct security posture. Zero risk of stale or manipulated client escalation.

3. **Destructive command confirmation** — `power_off` and `reboot` show a warning before firing. You don't accidentally shut down a projector mid-lecture.

4. **Search at scale** — 10 devices is a demo. A real NYU deployment has hundreds. The search bar shows the thinking even if the dataset is small.

5. **Audit trail with export** — Every command logged with full payload. Exportable as CSV for compliance and incident reports.

6. **Accessibility** — ARIA labels, keyboard shortcuts, focus management, screen reader support. Most prototypes skip this — doing it right signals production-quality thinking.

---

## Scope Cuts

- No WebSocket for real-time device status — Apps Script doesn't support it
- Mock device server doesn't persist state between calls
- No automated tests (would add with more time)
- GitHub Pages demo uses in-memory session, not real auth

---

<div align="center">

**Built for NYU AV & Media Services**

*Operational tooling for the team that keeps every classroom, event space, and lecture hall running.*

</div>

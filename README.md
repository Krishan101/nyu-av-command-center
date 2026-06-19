<div align="center">

# 🟣 NYU AV Command Center

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

## ⚡ Try It Now

> **No setup required.** Open the link, log in, fire a command.

### 🔗 [**Launch Live Demo →**](https://krishan101.github.io/nyu-av-command-center/)

| Username | Password | Role | Access Level |
|:--------:|:--------:|:----:|:------------|
| `manager` | `mgr456` | 🟡 Manager | Full access — dispatch device commands |
| `technician` | `tech123` | 🔵 Technician | Read-only — commands blocked + logged |

---

## 🎯 What It Does

```
┌──────────────────────────────────────────────────────────────┐
│                    NYU AV COMMAND CENTER                      │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│ 📊 Equipment │ 👥 Staff     │ ⚡ Commands  │ 📋 Audit Log    │
│ Inventory    │ Shift        │ Builder +    │ Every attempt   │
│ 10 devices   │ Schedule     │ JSON Preview │ tracked         │
│ 8 buildings  │ 8 staff      │ ACK/NACK     │ (incl. denied)  │
└──────────────┴──────────────┴──────────────┴─────────────────┘
```

- **Equipment monitoring** — Crestron, QSC, Biamp, Extron, Shure, Sennheiser across 8 real NYU buildings
- **Staff scheduling** — Lead Technicians, AV Technicians, Event Support with shift times and location tracking
- **Command dispatch** — Build JSON payloads, preview live, fire to devices, see ACK/NACK responses
- **Role-based access** — Enforced server-side, not just hidden buttons
- **Audit trail** — Every command attempt logged (successful and denied)

---

## 🏗 Two Implementations

### 1️⃣ GitHub Pages Demo — `index.html`

Zero-dependency, single-file dashboard. NYU violet + white branding with dark mode toggle.

```
Open browser → Log in → Fire commands → See JSON in Command Log
```

### 2️⃣ Full-Stack — `apps-script/` + `mock-device-server/`

Production-oriented architecture with real HTTP communication:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Apps Script     │  POST   │  Flask Server     │  ACK/   │  Google Sheet   │
│  Web App         │────────▶│  /device/command  │  NACK   │  CommandLog Tab │
│                  │◀────────│                   │         │                 │
│  Auth.gs ────────┤         │  Validates JSON   │         │  Audit trail    │
│  RBAC check via  │         │  Returns ACK/NACK │         │  for every      │
│  Session.get     │         │  with tx ID       │         │  attempt        │
│  ActiveUser()    │         └──────────────────┘         └─────────────────┘
└─────────────────┘
```

---

## 📁 Project Structure

```
nyu-av-command-center/
│
├── 🌐 index.html                         GitHub Pages demo (481 lines)
├── 📋 SUBMISSION.md                      Testing guide for reviewer
├── 📖 README.md
│
├── 📂 apps-script/                       Google Apps Script backend
│   ├── Code.gs                           Entry point + data join logic
│   ├── Auth.gs                           Server-side RBAC enforcement
│   ├── Commands.gs                       Build → validate → POST → log
│   ├── SeedData.gs                       Populate Sheet with mock data
│   ├── index.html                        Web App UI
│   └── appsscript.json                   Manifest
│
├── 📂 mock-device-server/                Python Flask mock hardware
│   ├── mock_device_server.py             /device/command endpoint
│   ├── requirements.txt                  flask, flask-cors, gunicorn
│   └── Procfile                          Render deployment
│
├── 📂 data/                              Mock spreadsheet sources
│   ├── equipment-inventory.csv           Spreadsheet A (17 columns)
│   └── staff-schedules.csv               Spreadsheet B (14 columns)
│
└── 📂 docs/
    └── ARCHITECTURE.md                   Production scaling plan
```

---

## 🚀 Setup

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

**Deploy to Render (free):** Set root directory to `mock-device-server`, start command `gunicorn mock_device_server:app`

### Google Apps Script

1. Create a new Google Sheet → **Extensions > Apps Script**
2. Create files matching `apps-script/` and paste contents
3. Run `seedAllTabs()` to populate the 4 sheet tabs
4. Add your Google email to the **Users** tab as `Manager`
5. Update `CONFIG.DEVICE_SERVER_URL` in Code.gs
6. **Deploy > Web app** → access: "Anyone with Google account"

---

## 🔒 How RBAC Works

```
                    ┌──────────────────────────────┐
                    │     Client clicks button     │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │  google.script.run            │
                    │  .triggerDeviceCommand()       │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │  Auth.requireRole("Manager")  │
                    │  ┌─────────────────────────┐  │
                    │  │ Session.getActiveUser()  │  │
                    │  │ .getEmail()              │  │
                    │  │ → lookup in Users tab    │  │
                    │  └─────────────────────────┘  │
                    └──────┬───────────────┬───────┘
                           │               │
                    ┌──────▼──────┐ ┌──────▼──────┐
                    │  ✅ Manager  │ │  ❌ Other    │
                    │  Proceed    │ │  DENIED     │
                    │  to build   │ │  + logged   │
                    │  payload    │ │  to Sheet   │
                    └─────────────┘ └─────────────┘
```

| Layer | Security |
|:------|:---------|
| **Client** | Hides button for Technicians *(convenience, not security)* |
| **Server** | `Auth.requireRole()` re-checks email against Users tab on **every** call |
| **Audit** | Denied attempts written to CommandLog with `ACCESS_DENIED` status |

---

## 📡 Command Flow

```
Manager clicks ⚡ Command
       │
       ▼
┌─ Server-side ──────────────────────────────────┐
│                                                 │
│  1. Auth.requireRole("Manager")    ← RBAC      │
│  2. buildCommandPayload()          ← from Sheet │
│  3. validateCommandSchema()        ← schema     │
│  4. UrlFetchApp.fetch(FLASK_URL)   ← real HTTP  │
│  5. logCommandAttempt()            ← audit      │
│                                                 │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
              Flask returns ACK
      ┌───────────────────────────┐
      │ { "status": "ACK",       │
      │   "transaction_id": "…", │
      │   "command_executed":     │
      │     "power_on",          │
      │   "details": {           │
      │     "power_state": "ON", │
      │     "warm_up_seconds": 12│
      │   }                      │
      │ }                        │
      └───────────────────────────┘
```

---

## 🎨 Features

| Feature | GitHub Pages Demo | Apps Script Version |
|:--------|:-----------------:|:-------------------:|
| Equipment + Staff view | ✅ Side-by-side tables | ✅ Joined on location |
| RBAC | ✅ Client-side + JS logic | ✅ Server-side (Sheet lookup) |
| Command builder + JSON preview | ✅ | ✅ |
| HTTP POST to device | ❌ (simulated in-memory) | ✅ Real fetch to Flask |
| Device ACK/NACK response | ❌ | ✅ From Flask server |
| Audit log persistence | ❌ (session only) | ✅ Written to Sheet tab |
| Denied attempt logging | ❌ | ✅ ACCESS_DENIED entries |
| Light/Dark mode toggle | ✅ | — |
| NYU branding | ✅ | ✅ |

---

## 📐 Design Decisions

1. **Two-tier delivery** — The GitHub Pages demo gives a 30-second first impression. The Apps Script version proves the architecture works end-to-end with real HTTP and server-side auth.

2. **Server-side role lookup on every call** — Could cache client-side, but re-checking is the correct security posture. Small latency cost, zero risk of stale/manipulated client escalation.

3. **Equipment + Shifts joined on location** — Instead of two disconnected tables, we show who's on shift for each device's location. Operationally useful — you see at a glance who to call about a device.

4. **Audit log includes denied attempts** — Most dashboards only log successes. Logging denials creates an audit trail for investigating unauthorized access — critical for institutional compliance.

5. **Flask as a separate service** — Mirrors real topology where AV controllers sit on separate VLANs. Apps Script talks to Flask over HTTP, just like production would talk to Crestron/QSC/Biamp control APIs.

---

## 🔮 With More Time

- WebSocket push from Flask for real-time device status changes
- OAuth2 token exchange between Apps Script and Flask
- Stateful device simulator (power on/off persists between calls)
- Unit tests for payload validation and RBAC logic
- Google Sheets API polling with Redis cache layer

---

<div align="center">

**Built for NYU AV & Media Services**

*Operational tooling for the team that keeps every classroom, event space, and lecture hall running.*

</div>

# NYU AV Command Center

**AV Equipment & Staff Scheduling Dashboard with RBAC**

A two-tier prototype for NYU AV & Media Services: a zero-dependency GitHub Pages demo for instant review, and a full Google Apps Script + Flask implementation with server-side auth, real HTTP command dispatch, and audit logging.

---

## Quick Links

| Resource | Link |
|----------|------|
| **GitHub Pages Demo** | [krishan101.github.io/nyu-av-command-center](https://krishan101.github.io/nyu-av-command-center/) |
| **Source Code** | [github.com/Krishan101/nyu-av-command-center](https://github.com/Krishan101/nyu-av-command-center) |
| **Testing Instructions** | [SUBMISSION.md](SUBMISSION.md) |
| **Architecture Plan** | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |

---

## Two Implementations

### 1. GitHub Pages Demo (`index.html`)
Single-file prototype. Open in browser, log in, fire commands. No backend needed.

**Credentials:** `manager` / `mgr456` or `technician` / `tech123`

### 2. Full-Stack Version (`apps-script/` + `mock-device-server/`)
Production-oriented implementation with:
- **Google Apps Script Web App** — bound to a Google Sheet, server-side RBAC via `Session.getActiveUser().getEmail()`
- **Python Flask mock device server** — validates JSON payloads, returns simulated ACK/NACK
- **Real HTTP dispatch** — Apps Script calls Flask via `UrlFetchApp.fetch()`
- **Audit log** — every command attempt (including denied) logged to the CommandLog sheet tab

---

## Repo Structure

```
nyu-av-command-center/
├── index.html                         ← GitHub Pages demo (self-contained)
├── SUBMISSION.md                      ← Testing instructions
├── README.md
│
├── apps-script/                       ← Google Apps Script project
│   ├── Code.gs                        ← Entry point, doGet(), data functions
│   ├── Auth.gs                        ← Server-side RBAC enforcement
│   ├── Commands.gs                    ← Command build, validate, dispatch, log
│   ├── SeedData.gs                    ← Run once to populate Sheet tabs
│   ├── index.html                     ← Web App UI (HtmlService)
│   └── appsscript.json                ← Manifest
│
├── mock-device-server/                ← Flask mock AV device
│   ├── mock_device_server.py          ← /device/command endpoint
│   ├── requirements.txt
│   └── Procfile                       ← For Render deployment
│
├── data/                              ← Mock spreadsheet data (CSV exports)
│   ├── equipment-inventory.csv        ← Spreadsheet A
│   └── staff-schedules.csv            ← Spreadsheet B
│
└── docs/
    └── ARCHITECTURE.md
```

---

## Setup: Flask Mock Device Server

```bash
cd mock-device-server
pip install -r requirements.txt
flask run --port 5050
```

Test it:
```bash
curl -X POST http://localhost:5050/device/command \
  -H "Content-Type: application/json" \
  -d '{"command": "power_on", "device": "EQ-001", "issued_by": "test@nyu.edu", "timestamp": "2026-06-18T12:00:00Z"}'
```

**Deploy to Render (free tier):**
1. Push the `mock-device-server/` folder to a separate repo (or use Render's monorepo support with root directory set to `mock-device-server`)
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `gunicorn mock_device_server:app`
4. Copy the deployed URL into `Code.gs > CONFIG.DEVICE_SERVER_URL`

---

## Setup: Google Apps Script

1. Create a new Google Sheet
2. Open **Extensions > Apps Script**
3. Delete the default `Code.gs` content
4. Create files matching `apps-script/`: `Code.gs`, `Auth.gs`, `Commands.gs`, `SeedData.gs`, `index.html`
5. Copy each file's content from this repo
6. Run `seedAllTabs()` (Run menu) — this creates the 4 sheet tabs with mock data
7. **Add your test email(s)** to the Users tab:
   - Your Google account email → `Manager` (to test command dispatch)
   - A second account → `Technician` (to test read-only access)
8. Update `CONFIG.DEVICE_SERVER_URL` in `Code.gs` to your Flask server URL
9. Deploy: **Deploy > New deployment > Web app** → Execute as "User accessing the web app", access "Anyone with Google account"
10. Open the deployed URL

---

## How RBAC Works

| Layer | What Happens |
|-------|-------------|
| **Client (index.html)** | Hides the command button for Technicians. This is convenience, not security. |
| **Server (Auth.gs)** | `Auth.requireRole("Manager")` re-checks the caller's email against the Users sheet tab on every command attempt. Cannot be bypassed from the client. |
| **Audit (Commands.gs)** | Every attempt — including denied ones — is written to the CommandLog tab with timestamp, email, role, payload, and result. |

If a Technician's request somehow reaches `triggerDeviceCommand()`, it is:
1. Rejected before any payload is built
2. Logged as `ACCESS_DENIED` in CommandLog
3. An error is returned to the client

---

## How the Command Flow Works

```
Manager clicks "⚡ Command" in UI
    │
    ▼
google.script.run.triggerDeviceCommand(deviceId, command, params)
    │
    ▼
Auth.requireRole("Manager")          ← Re-checks email in Users tab
    │
    ▼
buildCommandPayload()                 ← Builds JSON from Sheet data
    │
    ▼
validateCommandSchema()               ← Validates required fields
    │
    ▼
UrlFetchApp.fetch(FLASK_URL)          ← Real HTTP POST to Flask
    │
    ▼
Flask validates JSON → returns ACK or NACK
    │
    ▼
logCommandAttempt()                   ← Writes to CommandLog tab
    │
    ▼
Returns { payload, deviceResponse } to UI for display
```

---

## Design Tradeoffs

1. **Apps Script over a standalone backend** — Chose Apps Script because the challenge specifies spreadsheet integration. Apps Script is the native way to bind business logic to Sheets without managing infrastructure. Tradeoff: limited runtime (6 min execution cap, no WebSockets).

2. **Server-side role lookup on every call** — Could cache the role client-side after first load, but re-checking on every privileged action is the correct security posture. The small latency cost is worth the guarantee that a stale or manipulated client can't escalate.

3. **Flask as a separate service, not embedded** — The mock device server runs independently to simulate real network topology (Apps Script talks to hardware over HTTP). This mirrors production where device controllers sit on separate VLANs.

4. **Joined view instead of two separate tables** — The challenge says "display in a unified interface." Rather than showing Equipment and Shifts as two disconnected tables, we join on location so each device row shows who's currently on shift there. This is operationally useful — you can see at a glance who to call about a specific device.

5. **Audit log includes denied attempts** — Most dashboards only log successful actions. Logging denials creates an audit trail for investigating unauthorized access attempts — critical for SOC2/institutional compliance.

---

## What I'd Do With More Time

- WebSocket connection from Flask to push real-time device status changes
- Google Sheets API polling (instead of direct Sheet reads) for better separation of concerns
- Unit tests for the payload validation and RBAC logic
- OAuth2 token exchange between Apps Script and Flask for authenticated device dispatch
- A proper device simulator that maintains state (power on/off persists between calls)

---

## AI Tooling Disclosure

Claude (Anthropic) was used as a development accelerator for:
- Scaffolding the initial file structure and CSS design system
- Generating realistic mock data (NYU buildings, AV equipment model numbers, IP ranges)
- Iterating on the command payload JSON schema
- Writing documentation (README, SUBMISSION, ARCHITECTURE)

All architectural decisions, RBAC design, and security logic were human-directed. The code was reviewed and tested manually before submission.

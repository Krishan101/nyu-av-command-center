# NYU AV Command Center

Operational dashboard for managing AV equipment, staff scheduling, and device command dispatch across NYU buildings. Built as a technical submission for the AV & Media Services team.

**[Live Demo](https://krishan101.github.io/nyu-av-command-center/)** · `manager` / `mgr456` · `technician` / `tech123`

---

## Overview

The project has two implementations:

**GitHub Pages demo** (`index.html`) — A self-contained single-file dashboard. Open the link, log in, fire commands. No setup needed.

**Full-stack version** (`apps-script/` + `mock-device-server/`) — Google Apps Script web app with server-side RBAC, a Python Flask endpoint simulating AV hardware, real HTTP dispatch via `UrlFetchApp.fetch()`, and an audit log written to the Google Sheet.

---

## Project Structure

```
nyu-av-command-center/
├── index.html                         GitHub Pages demo
├── SUBMISSION.md                      Testing instructions
│
├── apps-script/
│   ├── Code.gs                        Entry point, data join logic
│   ├── Auth.gs                        Server-side RBAC enforcement
│   ├── Commands.gs                    Build, validate, POST, log
│   ├── SeedData.gs                    Populate sheet with mock data
│   ├── index.html                     Web app UI
│   └── appsscript.json
│
├── mock-device-server/
│   ├── mock_device_server.py          /device/command endpoint
│   ├── requirements.txt
│   └── Procfile                       Render deployment
│
├── data/
│   ├── equipment-inventory.csv        Spreadsheet A — 10 devices
│   └── staff-schedules.csv            Spreadsheet B — 8 staff
│
└── docs/
    └── ARCHITECTURE.md                Production scaling plan
```

---

## RBAC

Authorization is enforced server-side, not by hiding buttons.

The client hides the command button for Technicians as a UX convenience. But the actual gate is in `Auth.gs` — every call to `triggerDeviceCommand()` re-checks the caller's email against the Users sheet tab via `Session.getActiveUser().getEmail()`. If a Technician's request reaches the server (e.g., via DOM manipulation), it's rejected and logged as `ACCESS_DENIED`.

---

## Command Flow

1. Manager clicks "Command" on a device row
2. Client calls `google.script.run.triggerDeviceCommand(deviceId, command, params)`
3. Server re-checks role from Users tab
4. Server builds JSON payload from Equipment sheet data
5. Server validates payload against schema (required fields, valid commands)
6. Server POSTs to Flask via `UrlFetchApp.fetch()`
7. Flask validates JSON, returns ACK (online device) or NACK (offline/malformed)
8. Server logs the attempt + result to CommandLog tab
9. Payload and device response returned to UI

---

## Setup

**Flask server** (local):
```bash
cd mock-device-server
pip install -r requirements.txt
flask run --port 5050
```

**Flask server** (Render): set root to `mock-device-server`, start command `gunicorn mock_device_server:app`.

**Apps Script**: create a Google Sheet, open Apps Script editor, paste the files from `apps-script/`, run `seedAllTabs()`, add your email to the Users tab, update `CONFIG.DEVICE_SERVER_URL` in Code.gs, deploy as web app.

Full setup details in [SUBMISSION.md](SUBMISSION.md).

---

## Design Decisions

**Two-tier delivery.** The Pages demo gives a 30-second first impression. The Apps Script version proves the architecture works end-to-end with real HTTP and server-side auth.

**Role re-check on every call.** Could cache client-side, but verifying on each privileged action is the correct security posture — zero risk of stale or manipulated client escalation.

**Equipment and Shifts joined on location.** Instead of two disconnected tables, the Apps Script version joins on location so each device row shows who's currently on shift there.

**Denied attempts logged.** The CommandLog tab records every attempt including blocked ones — useful for investigating unauthorized access.

**Flask as a separate service.** Mirrors real topology where AV controllers sit on separate network segments. Apps Script talks to Flask over HTTP, same as production would talk to Crestron/QSC/Biamp control APIs.

---

## Scope Cuts

- No WebSocket for real-time device status — Apps Script doesn't support it
- Mock device server doesn't persist state between calls
- No automated tests (would add with more time)
- GitHub Pages demo uses in-memory session, not real auth

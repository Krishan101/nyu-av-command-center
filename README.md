# NYU AV Command Center

**Operational dashboard prototype for NYU AV & Media Services**

A control-room-style single-page dashboard for managing AV equipment inventory, staff scheduling, and device command dispatch across NYU buildings.

## 🔗 Live Demo

**[https://krishan101.github.io/nyu-av-command-center/](https://krishan101.github.io/nyu-av-command-center/)**

| Username     | Password  | Role        | Access |
|-------------|-----------|-------------|--------|
| `manager`    | `mgr456`  | Manager     | Full — can dispatch device commands |
| `technician` | `tech123` | Technician  | Read-only — command dispatch blocked |

## What It Does

- **Equipment monitoring** — 10 real AV devices (Crestron, QSC, Biamp, Extron, Shure, etc.) across 8 NYU buildings with live status badges
- **Staff scheduling** — Shift schedules with role assignments and on-site tracking
- **Command dispatch** — Build and fire JSON commands to devices with live payload preview
- **Command log** — Terminal-style console with expandable JSON payloads
- **Role-based access control** — Manager/technician roles enforced in logic, not just UI

## Data Sources

Mock data is embedded in JS for this GitHub Pages prototype. The raw CSV sources that would back a production Google Sheets integration:

| Spreadsheet | File | Records |
|-------------|------|---------|
| Equipment Inventory | [`data/equipment-inventory.csv`](data/equipment-inventory.csv) | 10 devices |
| Staff Schedules | [`data/staff-schedules.csv`](data/staff-schedules.csv) | 8 staff entries |

## Repo Structure

```
nyu-av-command-center/
├── index.html              ← Complete app (single file, GitHub Pages)
├── SUBMISSION.md           ← Testing instructions for reviewer
├── README.md
├── data/
│   ├── equipment-inventory.csv   ← Spreadsheet A (mock Google Sheets)
│   └── staff-schedules.csv       ← Spreadsheet B (mock Google Sheets)
└── docs/
    └── ARCHITECTURE.md     ← Production scaling plan
```

## Production Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full plan including:
- Frontend/backend separation (React + Node.js)
- Google Sheets API integration for live data sync
- PostgreSQL for command audit log
- NYU SSO (Shibboleth) authentication
- WebSocket for real-time device status
- Actual hardware API dispatch (Crestron, QSC, Biamp protocols)

## Technical Details

- **494 lines** of vanilla HTML/CSS/JS — no frameworks, no build step
- System monospace for data, system sans-serif for UI
- CSS custom properties for full theme control
- `addEventListener` pattern throughout (zero inline handlers)
- RBAC validated in JS logic, not just button visibility
- Responsive: optimized for 1280px+, usable on tablet

# NYU AV Command Center

**Operational dashboard prototype for NYU AV & Media Services**

A single-page control-room-style dashboard for managing AV equipment inventory, staff scheduling, and device command dispatch across NYU buildings.

## Live Demo

**🔗 [https://krishan101.github.io/nyu-av-command-center/](https://krishan101.github.io/nyu-av-command-center/)**

### Demo Credentials

| Username     | Password  | Role        | Access Level |
|-------------|-----------|-------------|--------------|
| `technician` | `tech123` | Technician  | Read-only (no command dispatch) |
| `manager`    | `mgr456`  | Manager     | Full access (command dispatch enabled) |

## Features

- **Role-based access control (RBAC)** — Managers can dispatch device commands; technicians have read-only access with server-side validation (not just UI hiding)
- **Real-time command builder** — Select a device, choose a command, preview the JSON payload, and fire it to the command log
- **Equipment inventory** — 10 AV devices across 8 NYU buildings with live status indicators
- **Staff shift schedule** — 8 staff entries with shift times and on-site status
- **Command log terminal** — Console-style log with expandable JSON payloads and visual feedback

## Architecture

This prototype is intentionally a **single `index.html` file** — zero build step, zero dependencies, deploys instantly on GitHub Pages. Mock data is embedded in JS to simulate what would come from Google Sheets or a database in production.

For the production architecture plan, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tech Stack

- Vanilla JavaScript (ES6+)
- CSS Custom Properties for theming
- Zero external dependencies
- GitHub Pages deployment

## Code Quality

- All sections clearly commented
- `const`/`let` only (no `var`)
- No inline event handlers — `addEventListener` throughout
- RBAC enforced in JS logic, not just button visibility
- Under 1000 lines total

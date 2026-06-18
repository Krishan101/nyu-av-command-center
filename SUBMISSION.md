# Submission — NYU AV Command Center

**Applicant:** Krishan  
**Position:** AV & Media Services — Operations Technology  
**Supervisor:** Ben Vien, Senior Director  

---

## Application Files & Links

| Item | Link |
|------|------|
| **Live Demo** | [https://krishan101.github.io/nyu-av-command-center/](https://krishan101.github.io/nyu-av-command-center/) |
| **Source Code** | [https://github.com/Krishan101/nyu-av-command-center](https://github.com/Krishan101/nyu-av-command-center) |
| **Equipment Inventory (mock data)** | [`data/equipment-inventory.csv`](data/equipment-inventory.csv) |
| **Staff Schedules (mock data)** | [`data/staff-schedules.csv`](data/staff-schedules.csv) |
| **Architecture Plan** | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |

---

## Mock Data Sources

The dashboard consumes two data sources, embedded in JavaScript for this prototype. In production, these would be live Google Sheets (or a database) accessed via the Google Sheets API.

### Spreadsheet A — AV Equipment Inventory
**File:** [`data/equipment-inventory.csv`](data/equipment-inventory.csv)

10 AV devices across 8 real NYU buildings. Each record includes device name, manufacturer, type, building/room, IP address, firmware, status, assigned technician, and maintenance notes. Device names reference real industry equipment (Crestron, Biamp, QSC, Extron, Shure, Sennheiser, Epson, Christie, Samsung, LG).

### Spreadsheet B — Staff Shift Schedules
**File:** [`data/staff-schedules.csv`](data/staff-schedules.csv)

8 staff entries with roles (Lead Technician, AV Technician, Event Support), shift times, assigned locations, supervisor chain, certifications (CTS, manufacturer certs), and operational notes.

---

## How to Test

### Step 1 — Open the Live Demo
Go to **[https://krishan101.github.io/nyu-av-command-center/](https://krishan101.github.io/nyu-av-command-center/)**

No installation required. Works in any modern browser.

### Step 2 — Test Roles

#### Manager Role (full access)
1. Log in with username `manager` and password `mgr456`
2. You'll see the dashboard with a gold **MANAGER** badge
3. All "⚡ Command" buttons in the equipment table are active (amber)
4. Click any "⚡ Command" button to open the **Command Builder** modal

#### Technician Role (read-only)
1. Log out, then log in with username `technician` and password `tech123`
2. You'll see a blue **TECHNICIAN** badge
3. All command buttons are grayed out with a lock icon
4. Hovering shows "Manager access required" tooltip
5. Even if someone modifies the DOM to unhide a button, the fire-command function validates the role in JavaScript before executing

#### Invalid Login
1. Enter any wrong username/password combination
2. An inline error message "Invalid credentials" appears (no browser alert)
3. The password field clears automatically

### Step 3 — Fire a Device Command (Manager Role)

1. Log in as `manager`
2. Click "⚡ Command" on any device row (e.g., **Crestron DM-NVX-350**)
3. The **Command Builder** modal opens with the device name and IP pre-filled
4. Select a command from the dropdown (e.g., `power_on`, `reboot`, `set_volume`)
5. If you select `set_volume`, a slider appears (0–100); all other commands hide the slider
6. Watch the **Payload Preview** section — it live-updates as you change selections
7. Click **⚡ Fire Command**

### Step 4 — View the Generated JSON Payload

After firing a command:

1. A green **toast notification** appears in the top-right confirming dispatch
2. The **"Pending Commands"** counter increments in the stats row
3. Scroll down to the **Command Log** terminal panel
4. The newest entry appears at the top with an amber highlight animation
5. The green dot next to "Command Log" pulses briefly
6. **Click the log entry** to expand and see the full JSON payload

The JSON payload structure looks like this:

```json
{
  "api_version": "1.0",
  "timestamp": "2026-06-18T14:30:00.000Z",
  "issued_by": {
    "user": "manager",
    "role": "manager"
  },
  "target_device": {
    "device_id": "EQ-001",
    "device_name": "Crestron DM-NVX-350",
    "device_type": "Video Switcher",
    "ip_address": "10.18.4.101",
    "location": {
      "building": "Bobst Library",
      "room": "LL1-03"
    }
  },
  "command": {
    "action": "power_on",
    "parameters": {}
  },
  "status": "dispatched"
}
```

For `set_volume`, the parameters include the level:

```json
"parameters": {
  "level": 75,
  "unit": "percent"
}
```

### Step 5 — Test Edge Cases

| Scenario | What to do | Expected result |
|----------|-----------|-----------------|
| Offline device warning | Click "⚡ Command" on **Extron SW4** (Offline) or **LG LED Wall** (Offline) | Modal shows red warning: "Device is currently Offline — command will be queued" |
| Double-fire prevention | Click "⚡ Fire Command" rapidly | Button disables for 1 second after first click |
| Modal dismiss | Click outside the modal, or press Escape | Modal closes cleanly |
| Keyboard login | Type credentials and press Enter | Login submits without clicking the button |
| Live clock | Watch the top-right corner | Clock updates every second |

---

## Architecture Notes

This prototype is intentionally a **single HTML file** — zero dependencies, zero build step, instant deploy to GitHub Pages. It demonstrates:

- **RBAC enforcement** in application logic (not just CSS/visibility)
- **Realistic AV API payloads** matching industry control protocols
- **Clean, maintainable code** (commented sections, const/let, addEventListener pattern)
- **Responsive layout** (works at 1280px+ desktop, gracefully adapts to narrower)

For how this would evolve into a production system with a backend, Google Sheets API integration, real device control, and NYU SSO — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

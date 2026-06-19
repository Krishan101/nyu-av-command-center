# Submission — NYU AV Command Center

**Position:** AV & Media Services — Operations Technology
**Supervisor:** Ben Vien, Senior Director

---

## What's Included

| Deliverable | Location |
|-------------|----------|
| **Live demo (instant)** | [krishan101.github.io/nyu-av-command-center](https://krishan101.github.io/nyu-av-command-center/) |
| **Source code** | [github.com/Krishan101/nyu-av-command-center](https://github.com/Krishan101/nyu-av-command-center) |
| **Apps Script project** | `apps-script/` — Code.gs, Auth.gs, Commands.gs, SeedData.gs, index.html |
| **Flask mock device server** | `mock-device-server/` — mock_device_server.py + requirements.txt |
| **Mock data (Spreadsheet A)** | `data/equipment-inventory.csv` — 10 AV devices across 8 NYU buildings |
| **Mock data (Spreadsheet B)** | `data/staff-schedules.csv` — 8 staff shift entries |
| **Architecture plan** | `docs/ARCHITECTURE.md` |

---

## Two Ways to Test

### Option A — GitHub Pages Demo (30 seconds, no setup)

1. Open [krishan101.github.io/nyu-av-command-center](https://krishan101.github.io/nyu-av-command-center/)
2. Log in with one of these accounts:

| Username | Password | Role | What You Can Do |
|----------|----------|------|-----------------|
| `manager` | `mgr456` | Manager | View data + dispatch device commands |
| `technician` | `tech123` | Technician | View data only (commands blocked) |

3. As Manager: click **⚡ Command** on any device → select a command → see the live JSON preview → click **⚡ Fire Command**
4. Scroll down to the **Command Log** → click any entry to expand the full JSON payload
5. Toggle light/dark mode with the 🌙 button

### Option B — Full-Stack Version (Apps Script + Flask)

See the [README Setup Instructions](README.md#setup-flask-mock-device-server) for detailed steps. Summary:

1. Deploy the Flask server (`mock-device-server/`) to Render or run locally
2. Create a Google Sheet and set up the Apps Script project (`apps-script/`)
3. Run `seedAllTabs()` to populate the 4 sheet tabs
4. Add your test Google account emails to the Users tab
5. Deploy the web app and open the URL

---

## How to Test Roles

### Manager
- Sees all equipment and staff data in a joined view (equipment + who's on shift at that location)
- "⚡ Command" button is active on every device row
- Can open the Command Builder modal, select a command, and fire it
- After firing: sees the device's ACK/NACK response inline
- Can view the Command Audit Log panel at the bottom
- Command log shows every attempt with full JSON payload

### Technician
- Sees the same equipment + staff data
- Command buttons are locked (🔒) with a "Manager access required" tooltip
- A banner reads: "You are logged in as a Technician. Device command dispatch requires Manager access."
- **Server-side enforcement:** even if someone edits the HTML to show the button and calls `triggerDeviceCommand()`, the server rejects it and logs an ACCESS_DENIED entry

### Invalid Login (GitHub Pages demo)
- Enter wrong credentials → inline error "Invalid credentials"
- Password field clears, no browser alert

---

## How the Device Command Is Triggered

1. Manager clicks **⚡ Command** on a device row
2. The Command Builder modal opens with device name and ID pre-filled
3. Select a command from the dropdown: `power_on`, `power_off`, `reboot`, `mute_audio`, `unmute_audio`, `switch_input_hdmi`, `switch_input_vga`, `set_volume`
4. If `set_volume` is selected, a slider appears (0–100)
5. The **Payload Preview** section updates live as selections change
6. Click **⚡ Fire Command**

**Full-stack version flow:**
- Client calls `google.script.run.triggerDeviceCommand(deviceId, command, params)`
- Server re-checks RBAC via `Session.getActiveUser().getEmail()`
- Server builds and validates the JSON payload
- Server POSTs to Flask via `UrlFetchApp.fetch()`
- Flask validates the JSON schema and returns ACK or NACK
- Server logs everything to the CommandLog sheet tab
- Server returns the payload + device response to the UI

---

## Where to View the Generated JSON Payload

### GitHub Pages Demo
- **Before firing:** in the "Payload Preview" section of the Command Builder modal
- **After firing:** in the Command Log terminal at the bottom — click any entry to expand the full JSON

### Apps Script Version
- **Before firing:** same Payload Preview section in the modal
- **After firing:**
  - In the modal's result panel (shows ACK/NACK + device response JSON)
  - In the Command Audit Log panel (click any row to expand)
  - In the **CommandLog** tab of the Google Sheet (raw data, every field)

### Sample Payload

```json
{
  "command": "power_on",
  "device": "EQ-001",
  "device_name": "Crestron DM-NVX-350",
  "device_type": "Video Switcher",
  "location": "Bobst Library",
  "issued_by": "manager@nyu.edu",
  "role": "Manager",
  "timestamp": "2026-06-18T14:30:00.000Z"
}
```

### Sample Device ACK Response (from Flask)

```json
{
  "status": "ACK",
  "transaction_id": "A1B2C3D4",
  "device_id": "EQ-001",
  "device_name": "Crestron DM-NVX-350",
  "command_executed": "power_on",
  "message": "Command 'power_on' accepted by Crestron DM-NVX-350",
  "details": { "power_state": "ON", "warm_up_seconds": 12 },
  "timestamp": "2026-06-18T14:30:01.234Z"
}
```

---

## How the Audit Log Works

The CommandLog sheet tab records every action:

| Column | Description |
|--------|-------------|
| `timestamp` | ISO 8601 timestamp |
| `user_email` | Caller's Google account email |
| `role` | Manager or Technician (looked up server-side) |
| `device_id` | Target device, or "N/A" for denied attempts |
| `command` | The command, or "ACCESS_DENIED" for blocked attempts |
| `payload_json` | Full JSON payload that was sent (or attempted) |
| `result` | ACK, NACK, ERROR, or DENIED |

Denied attempts are logged too — if a Technician somehow triggers the server function, the log captures the attempt with the reason.

---

## Deliberate Scope Cuts

1. **No real Google Sheets API integration in the GitHub Pages demo** — The demo embeds data in JS for instant deployment. The Apps Script version reads from the actual Sheet.
2. **No persistent login sessions in the demo** — Session is in-memory (JS variable). The Apps Script version uses Google's built-in session management.
3. **No WebSocket for real-time updates** — Apps Script doesn't support WebSockets. In production, the Flask server would push device status changes via WebSocket to a React frontend.
4. **Mock device server doesn't persist state** — `power_on` doesn't change the device's stored state between calls. A production system would maintain device state in a database.
5. **No automated tests** — With more time, I'd add unit tests for payload validation and RBAC logic in both the Apps Script and Flask layers.

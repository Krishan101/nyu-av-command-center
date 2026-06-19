# Submission — NYU AV Command Center

**Position:** AV & Media Services — Operations Technology

---

## What's Included

| Deliverable | Location |
|-------------|----------|
| **Live demo** | [krishan101.github.io/nyu-av-command-center](https://krishan101.github.io/nyu-av-command-center/) |
| **Source code** | [github.com/Krishan101/nyu-av-command-center](https://github.com/Krishan101/nyu-av-command-center) |
| **Apps Script project** | `apps-script/` |
| **Flask mock device server** | `mock-device-server/` |
| **Mock data — Equipment** | `data/equipment-inventory.csv` |
| **Mock data — Staff** | `data/staff-schedules.csv` |
| **Architecture plan** | `docs/ARCHITECTURE.md` |

---

## How to Test

### Quick Start

Open [krishan101.github.io/nyu-av-command-center](https://krishan101.github.io/nyu-av-command-center/) — no install needed.

| Username | Password | Role |
|----------|----------|------|
| `manager` | `mgr456` | Manager — full access |
| `technician` | `tech123` | Technician — personalized read-only |

---

### Testing Manager Role

1. Log in as `manager` / `mgr456`
2. You see: stats row, equipment + staff tables side by side, command log at bottom
3. If any devices are offline, a red alert bar appears at the top
4. **Search:** type in the search bar to filter equipment by name, type, or building (or press `/`)
5. **Device detail:** click any equipment row — it expands to show firmware, last ping, assigned tech, notes
6. **Fire a command:** click "Command" on any device → select a command → see live JSON preview → click "Fire Command"
7. **Destructive commands:** selecting `power_off` or `reboot` shows an amber confirmation warning
8. **Offline devices:** clicking Command on an offline device shows a red warning in the modal
9. **Command log:** after firing, the log shows the entry with a pulse animation. Click to expand the full JSON payload.
10. **Export:** click "Export CSV" on the command log to download the log as a CSV file
11. **Burger menu:** open the sidebar to navigate between Dashboard, Staff Schedule, and Command Log views

### Testing Technician Role

1. Log out, log in as `technician` / `tech123`
2. You see a personalized dashboard — not the full inventory
3. **Shift card:** shows Alex Rivera's shift time, location, and status
4. **Assigned devices only:** shows 2 devices (Crestron DM-NVX-350 and QSC Q-SYS Core 110f) — not all 10
5. **Alert banner:** green if all devices are online, red if any are offline
6. **Device detail:** click a device row to expand details (same as manager)
7. **No command buttons** anywhere — read-only view
8. **Burger menu:** "Staff On Shift" shows today's staff with search. "All Equipment" shows the full read-only inventory with search.
9. **Notification dot:** if any assigned devices are offline, a red dot appears on the burger menu icon

### Testing RBAC

Even if someone edits the HTML to show a command button, `fireCommand()` checks `session.role !== 'manager'` before executing. The gate is in the logic, not just the UI.

### Testing Edge Cases

| Scenario | Expected |
|----------|----------|
| Wrong login | "Invalid credentials" inline, password clears |
| Double-fire | Button disables for 1 second after click |
| Escape key | Closes modal and sidebar |
| `/` key | Focuses the search bar on the active page |
| Click outside modal | Modal closes |
| Offline device command | Red warning in modal, command still fires (queued) |
| `power_off` or `reboot` | Amber warning: "This is a destructive command" |
| Light/dark toggle | Moon/sun button in top bar |

---

### Where to View the JSON Payload

- **Before firing:** in the modal's "Payload Preview" section (updates live as you change selections)
- **After firing:** in the Command Log — click any entry to expand the full JSON
- **Downloaded:** click "Export CSV" to get a file with all dispatched commands

### Sample Payload

```json
{
  "api_version": "1.0",
  "timestamp": "2026-06-18T14:30:00.000Z",
  "issued_by": { "user": "manager", "role": "manager" },
  "target_device": {
    "device_id": "EQ-001",
    "device_name": "Crestron DM-NVX-350",
    "device_type": "Video Switcher",
    "ip_address": "10.18.4.101",
    "location": { "building": "Bobst Library", "room": "LL1-03" }
  },
  "command": { "action": "power_on", "parameters": {} },
  "status": "dispatched"
}
```

---

### Full-Stack Version (Apps Script + Flask)

See [README.md](README.md#setup) for setup instructions. Summary:

1. Deploy `mock-device-server/` to Render or run locally with `flask run --port 5050`
2. Create a Google Sheet, add the Apps Script files from `apps-script/`
3. Run `seedAllTabs()` to populate sheet tabs, add your email to Users tab
4. Deploy as web app

---

## Accessibility

- Skip-to-content link for keyboard navigation
- `aria-label` on all interactive elements (buttons, inputs, dialog)
- `aria-live="polite"` on toast notifications and error messages
- `role="dialog"` and `aria-modal="true"` on command builder modal
- Focus management: modal focuses first interactive element on open, returns focus on close
- `role="menuitem"` on sidebar navigation items
- Screen reader text on status badges (`sr-only` class)
- Keyboard shortcut: `/` to focus search bar

## Scope Cuts

- No persistent sessions (in-memory JS variable)
- No WebSocket for real-time device status
- Mock device server doesn't persist state between calls
- No automated tests
- GitHub Pages demo simulates command dispatch in-memory (full-stack version does real HTTP)

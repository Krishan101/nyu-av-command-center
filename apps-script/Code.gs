/**
 * NYU AV Command Center — Google Apps Script Backend
 * ====================================================
 * Main entry point. Serves the web app and provides
 * data access functions called from the client via
 * google.script.run.
 *
 * Sheet tabs: Equipment, Shifts, Users, CommandLog
 */

// === CONFIGURATION ===
const CONFIG = {
  // URL of the Flask mock device server
  // Update this after deploying to Render/Replit
  DEVICE_SERVER_URL: "https://nyu-av-mock-device.onrender.com",

  // Sheet tab names
  SHEET_EQUIPMENT: "Equipment",
  SHEET_SHIFTS: "Shifts",
  SHEET_USERS: "Users",
  SHEET_COMMAND_LOG: "CommandLog",

  // How many log entries to show in the UI
  LOG_DISPLAY_LIMIT: 25
};


/**
 * Serves the web app HTML.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("NYU AV Command Center")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * Returns session data for the current user: email, role,
 * and role-appropriate dashboard data.
 * Called by client on page load.
 */
function getSessionData() {
  const email = Session.getActiveUser().getEmail();
  const role = Auth.getUserRole(email);

  const data = {
    email: email,
    role: role,              // "Manager" | "Technician" | "Unknown"
    equipment: getEquipmentWithStaff(),
    stats: getDashboardStats()
  };

  // Only managers see the command log
  if (role === "Manager") {
    data.commandLog = getRecentCommandLog();
  }

  return data;
}


/**
 * Joins Equipment and Shifts on location to produce
 * a unified view: each equipment row includes the
 * staff currently assigned to that location.
 */
function getEquipmentWithStaff() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Read Equipment tab ---
  const eqSheet = ss.getSheetByName(CONFIG.SHEET_EQUIPMENT);
  const eqData = eqSheet.getDataRange().getValues();
  const eqHeaders = eqData[0];
  const eqRows = eqData.slice(1).map(row => {
    const obj = {};
    eqHeaders.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // --- Read Shifts tab ---
  const shiftSheet = ss.getSheetByName(CONFIG.SHEET_SHIFTS);
  const shiftData = shiftSheet.getDataRange().getValues();
  const shiftHeaders = shiftData[0];
  const shiftRows = shiftData.slice(1).map(row => {
    const obj = {};
    shiftHeaders.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // --- Join on location ---
  // Build a lookup: location -> array of staff on shift
  const staffByLocation = {};
  shiftRows.forEach(shift => {
    const loc = shift.assigned_location;
    if (!staffByLocation[loc]) staffByLocation[loc] = [];
    staffByLocation[loc].push({
      staff_name: shift.staff_name,
      role: shift.role,
      shift_start: shift.shift_start,
      shift_end: shift.shift_end
    });
  });

  // Attach staff to each equipment row
  return eqRows.map(eq => ({
    device_id: eq.device_id,
    device_name: eq.device_name,
    device_type: eq.device_type,
    location: eq.location,
    status: eq.status,
    assigned_staff: staffByLocation[eq.location] || []
  }));
}


/**
 * Dashboard summary statistics.
 */
function getDashboardStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const eqSheet = ss.getSheetByName(CONFIG.SHEET_EQUIPMENT);
  const eqData = eqSheet.getDataRange().getValues().slice(1);
  const total = eqData.length;
  const online = eqData.filter(r => r[4] === "Online").length;
  const offline = eqData.filter(r => r[4] === "Offline").length;

  const shiftSheet = ss.getSheetByName(CONFIG.SHEET_SHIFTS);
  const shiftData = shiftSheet.getDataRange().getValues().slice(1);
  const activeStaff = shiftData.length;

  const logSheet = ss.getSheetByName(CONFIG.SHEET_COMMAND_LOG);
  const logData = logSheet.getDataRange().getValues();
  const totalCommands = Math.max(0, logData.length - 1); // exclude header

  return { total, online, offline, activeStaff, totalCommands };
}


/**
 * Returns the most recent command log entries.
 * Manager-only — caller's role is checked.
 */
function getRecentCommandLog() {
  const email = Session.getActiveUser().getEmail();
  const role = Auth.getUserRole(email);

  if (role !== "Manager") {
    return []; // Silently return empty for non-managers
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(CONFIG.SHEET_COMMAND_LOG);
  const logData = logSheet.getDataRange().getValues();

  if (logData.length <= 1) return []; // Only header row

  const headers = logData[0];
  const rows = logData.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // Return newest first, limited
  return rows.reverse().slice(0, CONFIG.LOG_DISPLAY_LIMIT);
}

/**
 * NYU AV Command Center — Seed Data
 * ====================================
 * Run seedAllTabs() once to populate the Google Sheet
 * with the 4 required tabs and mock data.
 *
 * Menu: Run > seedAllTabs
 */

function seedAllTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  seedEquipment(ss);
  seedShifts(ss);
  seedUsers(ss);
  seedCommandLog(ss);

  SpreadsheetApp.getUi().alert("All 4 tabs seeded successfully.");
}


function seedEquipment(ss) {
  let sheet = ss.getSheetByName("Equipment");
  if (!sheet) sheet = ss.insertSheet("Equipment");
  sheet.clear();

  const data = [
    ["device_id", "device_name", "device_type", "location", "status"],
    ["EQ-001", "Crestron DM-NVX-350",     "Video Switcher",    "Bobst Library",               "Online"],
    ["EQ-002", "Biamp Tesira SERVER-IO",   "DSP",               "Kimmel Center",               "Online"],
    ["EQ-003", "Epson Pro L1755U",         "Projector",         "Stern School of Business",    "Standby"],
    ["EQ-004", "QSC Q-SYS Core 110f",     "DSP",               "Tandon School of Engineering","Online"],
    ["EQ-005", "Extron SW4 HD 4K PLUS",   "Video Switcher",    "Silver Center",               "Offline"],
    ["EQ-006", "Samsung QM85R-B",          "Display",           "Courant Institute",           "Online"],
    ["EQ-007", "Shure MXA920 Ceiling Mic", "Microphone System", "Tisch School of the Arts",    "Online"],
    ["EQ-008", "Christie DWU850-GS",       "Projector",         "Palladium Athletic Facility", "Standby"],
    ["EQ-009", "Sennheiser TeamConnect",   "Microphone System", "Bobst Library",               "Online"],
    ["EQ-010", "LG LSAB012-M4 LED Wall",  "Display",           "Kimmel Center",               "Offline"]
  ];

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  sheet.getRange(1, 1, 1, data[0].length).setFontWeight("bold");
  sheet.setFrozenRows(1);
}


function seedShifts(ss) {
  let sheet = ss.getSheetByName("Shifts");
  if (!sheet) sheet = ss.insertSheet("Shifts");
  sheet.clear();

  const data = [
    ["staff_name", "role", "shift_start", "shift_end", "assigned_location"],
    ["Alex Rivera",   "Lead Technician", "07:00", "15:00", "Bobst Library"],
    ["Sam Patel",     "AV Technician",   "08:00", "16:00", "Kimmel Center"],
    ["Jordan Lee",    "Lead Technician", "09:00", "17:00", "Stern School of Business"],
    ["Priya Nair",    "AV Technician",   "10:00", "18:00", "Silver Center"],
    ["Casey Lin",     "AV Technician",   "12:00", "20:00", "Tisch School of the Arts"],
    ["Morgan Diaz",   "Event Support",   "14:00", "22:00", "Palladium Athletic Facility"],
    ["Taylor Brooks", "Event Support",   "06:00", "14:00", "Tandon School of Engineering"],
    ["Riley Chen",    "AV Technician",   "08:00", "16:00", "Courant Institute"]
  ];

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  sheet.getRange(1, 1, 1, data[0].length).setFontWeight("bold");
  sheet.setFrozenRows(1);
}


function seedUsers(ss) {
  let sheet = ss.getSheetByName("Users");
  if (!sheet) sheet = ss.insertSheet("Users");
  sheet.clear();

  // IMPORTANT: Replace these with real Google account emails for testing.
  // The email must match Session.getActiveUser().getEmail().
  const data = [
    ["email", "role"],
    ["manager@nyu.edu",    "Manager"],
    ["technician@nyu.edu", "Technician"],
    // Add your own test emails below:
    // ["your.email@gmail.com", "Manager"],
  ];

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  sheet.getRange(1, 1, 1, data[0].length).setFontWeight("bold");
  sheet.setFrozenRows(1);
}


function seedCommandLog(ss) {
  let sheet = ss.getSheetByName("CommandLog");
  if (!sheet) sheet = ss.insertSheet("CommandLog");
  sheet.clear();

  const headers = [
    ["timestamp", "user_email", "role", "device_id", "command", "payload_json", "result"]
  ];

  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

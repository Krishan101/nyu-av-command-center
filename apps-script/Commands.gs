/**
 * NYU AV Command Center — Command Dispatch
 * ==========================================
 * Handles the full command lifecycle:
 *   1. RBAC check (server-side, re-verified every call)
 *   2. Build JSON payload
 *   3. Validate against schema
 *   4. POST to Flask mock device server via UrlFetchApp
 *   5. Log attempt + result to CommandLog tab
 *   6. Return payload + device response to UI
 *
 * This function is called from the client via:
 *   google.script.run.triggerDeviceCommand(deviceId, command, params)
 */


// === VALID COMMANDS — enforced server-side ===
const VALID_COMMANDS = [
  "power_on", "power_off", "reboot",
  "mute_audio", "unmute_audio",
  "switch_input_hdmi", "switch_input_vga",
  "set_volume"
];


/**
 * Main entry point for command dispatch.
 * Called by the client — but ALL authorization is re-checked here.
 *
 * @param {string} deviceId - e.g. "EQ-001"
 * @param {string} command  - e.g. "power_on"
 * @param {Object} params   - e.g. { level: 75 } for set_volume
 * @returns {Object} { payload, deviceResponse, logEntry }
 */
function triggerDeviceCommand(deviceId, command, params) {
  // --- STEP 1: Server-side RBAC check ---
  // This re-verifies the caller's role from the Users tab.
  // If the caller is a Technician, this throws and logs a DENIED entry.
  const caller = Auth.requireRole("Manager");

  // --- STEP 2: Validate inputs ---
  if (!deviceId || typeof deviceId !== "string") {
    throw new Error("Invalid device ID");
  }
  if (!command || !VALID_COMMANDS.includes(command)) {
    throw new Error(
      "Invalid command '" + command + "'. " +
      "Valid: " + VALID_COMMANDS.join(", ")
    );
  }

  // Validate set_volume parameters
  if (command === "set_volume") {
    if (!params || typeof params.level !== "number" || params.level < 0 || params.level > 100) {
      throw new Error("set_volume requires params.level (0-100)");
    }
  }

  // --- STEP 3: Build JSON payload ---
  const payload = buildCommandPayload(deviceId, command, params, caller);

  // --- STEP 4: Validate payload against schema ---
  const schemaErrors = validateCommandSchema(payload);
  if (schemaErrors.length > 0) {
    throw new Error("Payload validation failed: " + schemaErrors.join("; "));
  }

  // --- STEP 5: POST to Flask mock device server ---
  let deviceResponse;
  let result;
  try {
    deviceResponse = dispatchToDevice(payload);
    result = deviceResponse.status === "ACK" ? "ACK" : "NACK";
  } catch (e) {
    deviceResponse = { status: "ERROR", message: e.message };
    result = "ERROR";
  }

  // --- STEP 6: Log to CommandLog tab ---
  logCommandAttempt(caller, deviceId, command, payload, deviceResponse, result);

  // --- STEP 7: Return everything to the UI ---
  return {
    payload: payload,
    deviceResponse: deviceResponse,
    result: result,
    timestamp: new Date().toISOString()
  };
}


/**
 * Build the JSON payload for a device command.
 */
function buildCommandPayload(deviceId, command, params, caller) {
  // Look up device info from the Equipment sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eqSheet = ss.getSheetByName(CONFIG.SHEET_EQUIPMENT);
  const eqData = eqSheet.getDataRange().getValues();
  const headers = eqData[0];

  let device = null;
  for (let i = 1; i < eqData.length; i++) {
    if (eqData[i][0] === deviceId) {
      device = {};
      headers.forEach((h, j) => device[h] = eqData[i][j]);
      break;
    }
  }

  if (!device) {
    throw new Error("Device not found: " + deviceId);
  }

  const payload = {
    command: command,
    device: deviceId,
    device_name: device.device_name,
    device_type: device.device_type,
    location: device.location,
    issued_by: caller.email,
    role: caller.role,
    timestamp: new Date().toISOString()
  };

  // Add command-specific parameters
  if (command === "set_volume" && params) {
    payload.parameters = {
      level: params.level,
      unit: "percent"
    };
  }

  return payload;
}


/**
 * Validate a command payload against the required schema.
 * Returns an array of error strings (empty = valid).
 */
function validateCommandSchema(payload) {
  const errors = [];

  const required = ["command", "device", "issued_by", "timestamp"];
  required.forEach(field => {
    if (!payload[field]) {
      errors.push("Missing required field: " + field);
    }
  });

  if (payload.command && !VALID_COMMANDS.includes(payload.command)) {
    errors.push("Unknown command: " + payload.command);
  }

  if (payload.command === "set_volume") {
    if (!payload.parameters || typeof payload.parameters.level !== "number") {
      errors.push("set_volume requires parameters.level");
    }
  }

  // Validate timestamp format (ISO 8601)
  if (payload.timestamp && isNaN(Date.parse(payload.timestamp))) {
    errors.push("Invalid timestamp format");
  }

  return errors;
}


/**
 * POST the command payload to the Flask mock device server.
 * Uses UrlFetchApp.fetch() for real HTTP communication.
 */
function dispatchToDevice(payload) {
  const url = CONFIG.DEVICE_SERVER_URL + "/device/command";

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true  // Don't throw on 4xx/5xx — we handle it
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();
  const body = response.getContentText();

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    parsed = { raw_response: body };
  }

  parsed._http_status = statusCode;

  return parsed;
}


/**
 * Write a command attempt to the CommandLog tab.
 * Logs both successful and failed/denied attempts.
 */
function logCommandAttempt(caller, deviceId, command, payload, response, result) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(CONFIG.SHEET_COMMAND_LOG);

  logSheet.appendRow([
    new Date().toISOString(),             // timestamp
    caller.email,                         // user_email
    caller.role,                          // role
    deviceId,                             // device_id
    command,                              // command
    JSON.stringify(payload),              // payload_json
    result + " — " + JSON.stringify(response)  // result
  ]);
}

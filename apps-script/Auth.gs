/**
 * NYU AV Command Center — Authentication & RBAC
 * ================================================
 * All role checks happen HERE on the server side.
 * The client NEVER sends a role claim — we always
 * look it up from the Users tab using the session email.
 *
 * SECURITY MODEL:
 * - Session.getActiveUser().getEmail() is the sole identity source
 * - Role is looked up in the Users sheet, never trusted from client
 * - Every privileged action re-checks role before executing
 * - Denied attempts are logged to CommandLog for audit
 */

// Namespace to avoid global collisions
const Auth = {

  /**
   * Look up the current user's role from the Users tab.
   * Returns "Manager", "Technician", or "Unknown".
   *
   * IMPORTANT: This uses Session.getActiveUser().getEmail()
   * which is server-side and cannot be spoofed by the client.
   */
  getUserRole: function(email) {
    if (!email) return "Unknown";

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
    const data = usersSheet.getDataRange().getValues();

    // Skip header row, find matching email
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase().trim() === email.toLowerCase().trim()) {
        return data[i][1].toString().trim(); // "Manager" or "Technician"
      }
    }

    return "Unknown";
  },


  /**
   * Enforce that the current caller has the required role.
   * Throws an error (caught by google.script.run.withFailureHandler)
   * if the role doesn't match.
   *
   * Usage in any server function:
   *   Auth.requireRole("Manager");
   */
  requireRole: function(requiredRole) {
    const email = Session.getActiveUser().getEmail();
    const actualRole = Auth.getUserRole(email);

    if (actualRole !== requiredRole) {
      // Log the denied attempt for audit trail
      Auth.logDeniedAttempt(email, actualRole, requiredRole);

      throw new Error(
        `Access denied. Your role '${actualRole}' does not have ` +
        `'${requiredRole}' permissions. This attempt has been logged.`
      );
    }

    return { email: email, role: actualRole };
  },


  /**
   * Log a denied access attempt to the CommandLog tab.
   * This creates an audit trail even for blocked actions.
   */
  logDeniedAttempt: function(email, actualRole, requiredRole) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(CONFIG.SHEET_COMMAND_LOG);

    logSheet.appendRow([
      new Date().toISOString(),       // timestamp
      email,                          // user_email
      actualRole,                     // role
      "N/A",                          // device_id
      "ACCESS_DENIED",                // command
      JSON.stringify({
        attempted_action: "triggerDeviceCommand",
        required_role: requiredRole,
        actual_role: actualRole
      }),                             // payload_json
      "DENIED"                        // result
    ]);
  }
};

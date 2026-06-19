"""
NYU AV Command Center — Mock Device Server
============================================
Simulates a network-connected AV device control endpoint.
This is NOT real hardware — it fabricates ACK/NACK responses
to validate the end-to-end command dispatch flow.

Run locally:   flask run --port 5050
Deploy:        Render (see README), Replit, or any Python host
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Apps Script UrlFetchApp needs CORS headers

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s [%(levelname)s] %(message)s')

# === JSON SCHEMA — required fields for a valid device command ===
REQUIRED_FIELDS = {"command", "device"}
VALID_COMMANDS = {
    "power_on", "power_off", "reboot",
    "mute_audio", "unmute_audio",
    "switch_input_hdmi", "switch_input_vga",
    "set_volume"
}

# === Simulated device registry (mirrors Sheet data) ===
KNOWN_DEVICES = {
    "EQ-001": "Crestron DM-NVX-350",
    "EQ-002": "Biamp Tesira SERVER-IO",
    "EQ-003": "Epson Pro L1755U",
    "EQ-004": "QSC Q-SYS Core 110f",
    "EQ-005": "Extron SW4 HD 4K PLUS",
    "EQ-006": "Samsung QM85R-B",
    "EQ-007": "Shure MXA920 Ceiling Mic",
    "EQ-008": "Christie DWU850-GS",
    "EQ-009": "Sennheiser TeamConnect",
    "EQ-010": "LG LSAB012-M4 LED Wall",
}

# === Devices that will simulate failure (for testing NACK path) ===
OFFLINE_DEVICES = {"EQ-005", "EQ-010"}


def validate_payload(data):
    """Validate incoming JSON against the command schema."""
    errors = []

    if not isinstance(data, dict):
        return ["Payload must be a JSON object"]

    missing = REQUIRED_FIELDS - set(data.keys())
    if missing:
        errors.append(f"Missing required fields: {', '.join(sorted(missing))}")

    if "command" in data and data["command"] not in VALID_COMMANDS:
        errors.append(
            f"Unknown command '{data['command']}'. "
            f"Valid: {', '.join(sorted(VALID_COMMANDS))}"
        )

    if "command" in data and data["command"] == "set_volume":
        params = data.get("parameters", {})
        level = params.get("level") if isinstance(params, dict) else None
        if level is None or not isinstance(level, (int, float)) or not (0 <= level <= 100):
            errors.append("set_volume requires parameters.level (0-100)")

    return errors


@app.route("/", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "service": "NYU AV Mock Device Server",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "endpoints": {
            "POST /device/command": "Send a device control command",
            "GET /device/status/<device_id>": "Query device status"
        }
    })


@app.route("/device/command", methods=["POST"])
def device_command():
    """
    POST /device/command
    Accepts a JSON command payload, validates it, and returns
    a simulated ACK (success) or NACK (failure) response.

    Expected payload:
    {
        "command": "power_on",
        "device": "EQ-001",
        "issued_by": "manager@nyu.edu",
        "timestamp": "2026-06-18T14:30:00Z"
    }
    """
    # --- Parse JSON body ---
    if not request.is_json:
        return jsonify({
            "status": "error",
            "error_code": "INVALID_CONTENT_TYPE",
            "message": "Content-Type must be application/json"
        }), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({
            "status": "error",
            "error_code": "MALFORMED_JSON",
            "message": "Could not parse JSON body"
        }), 400

    # --- Validate against schema ---
    errors = validate_payload(data)
    if errors:
        logging.warning(f"NACK — validation failed: {errors}")
        return jsonify({
            "status": "NACK",
            "error_code": "VALIDATION_FAILED",
            "errors": errors,
            "received_payload": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 400

    # --- Simulate device response ---
    device_id = data["device"]
    command = data["command"]
    transaction_id = str(uuid.uuid4())[:8].upper()

    # Offline devices return NACK
    if device_id in OFFLINE_DEVICES:
        logging.info(f"NACK — device {device_id} offline, command: {command}")
        return jsonify({
            "status": "NACK",
            "transaction_id": transaction_id,
            "device_id": device_id,
            "device_name": KNOWN_DEVICES.get(device_id, "Unknown"),
            "error_code": "DEVICE_UNREACHABLE",
            "message": f"Device {device_id} is not responding on the network",
            "command_received": command,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 503

    # Online devices return ACK
    device_name = KNOWN_DEVICES.get(device_id, "Unknown Device")
    response_data = {
        "status": "ACK",
        "transaction_id": transaction_id,
        "device_id": device_id,
        "device_name": device_name,
        "command_executed": command,
        "message": f"Command '{command}' accepted by {device_name}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    # Add command-specific response details
    if command == "set_volume":
        level = data.get("parameters", {}).get("level", 50)
        response_data["details"] = {"volume_set_to": level, "unit": "percent"}
    elif command in ("switch_input_hdmi", "switch_input_vga"):
        input_type = "HDMI" if "hdmi" in command else "VGA"
        response_data["details"] = {"active_input": input_type}
    elif command == "power_on":
        response_data["details"] = {"power_state": "ON", "warm_up_seconds": 12}
    elif command == "power_off":
        response_data["details"] = {"power_state": "STANDBY", "cool_down_seconds": 30}

    logging.info(f"ACK — {command} -> {device_id} ({device_name}) [tx: {transaction_id}]")
    return jsonify(response_data), 200


@app.route("/device/status/<device_id>", methods=["GET"])
def device_status(device_id):
    """GET /device/status/<device_id> — query a device's current state."""
    if device_id not in KNOWN_DEVICES:
        return jsonify({
            "status": "error",
            "error_code": "DEVICE_NOT_FOUND",
            "message": f"No device registered with ID '{device_id}'"
        }), 404

    is_online = device_id not in OFFLINE_DEVICES
    return jsonify({
        "device_id": device_id,
        "device_name": KNOWN_DEVICES[device_id],
        "online": is_online,
        "power_state": "ON" if is_online else "UNREACHABLE",
        "last_heartbeat": datetime.now(timezone.utc).isoformat() if is_online else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=True)

"""
pharmacy_scan.py
A thin CLI wrapper around pharmacy.py that:
    1. Receives an image path as argv[1]
    2. Runs the medicine extraction pipeline
    3. Prints a single JSON line to stdout (consumed by pharmacyRoutes.js)
"""
import sys
import json
import os

# ── Guard: require exactly one argument (the image path) ─────────
if len(sys.argv) < 2:
    print(json.dumps({"error": "Usage: pharmacy_scan.py <image_path>"}))
    sys.exit(1)

image_path = sys.argv[1]

if not os.path.exists(image_path):
    print(json.dumps({"error": f"Image not found: {image_path}"}))
    sys.exit(1)

# ── Silence the easyocr / torch loading chatter so stdout stays clean ──
import io, contextlib

try:
    # Add the ml/ directory to sys.path so pharmacy is importable
    sys.path.insert(0, os.path.dirname(__file__))
    from pharmacy import analyze_medicine_image

    # Redirect stdout so pipeline print() calls don't pollute JSON output
    with contextlib.redirect_stdout(io.StringIO()):
        result = analyze_medicine_image(image_path)

    if not result or result.get("error"):
        raise RuntimeError(result.get("error") if isinstance(result, dict) else "Failed to analyze image")

    print(json.dumps({
        "drug_name":        result.get("drug_name", "UNKNOWN"),
        "strength":         result.get("strength", "N/A"),
        "expiry_date":      result.get("expiry_date", "UNKNOWN"),
        "inventory_status": result.get("inventory_status", "UNKNOWN"),
    }))

except Exception as exc:
    print(json.dumps({"error": str(exc)}))
    sys.exit(1)

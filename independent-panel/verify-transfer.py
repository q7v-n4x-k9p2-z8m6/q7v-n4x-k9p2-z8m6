#!/usr/bin/env python3
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
manifest_path = ROOT / "TRANSFER-MANIFEST.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

checked = 0
missing = []
mismatched = []

for entry in manifest.get("files", []):
    target = ROOT / entry["target_path"].removeprefix("independent-panel/")
    if not target.is_file():
        missing.append(entry["target_path"])
        continue
    data = target.read_bytes()
    checked += 1
    actual_size = len(data)
    actual_sha = hashlib.sha256(data).hexdigest()
    if actual_size != entry["size_bytes"] or actual_sha != entry["sha256"]:
        mismatched.append({
            "path": entry["target_path"],
            "expected_size": entry["size_bytes"],
            "actual_size": actual_size,
            "expected_sha256": entry["sha256"],
            "actual_sha256": actual_sha,
        })

print(json.dumps({
    "manifest_entries": len(manifest.get("files", [])),
    "checked": checked,
    "missing_count": len(missing),
    "mismatch_count": len(mismatched),
    "missing": missing,
    "mismatched": mismatched,
}, ensure_ascii=False, indent=2))

sys.exit(1 if missing or mismatched or checked != len(manifest.get("files", [])) else 0)

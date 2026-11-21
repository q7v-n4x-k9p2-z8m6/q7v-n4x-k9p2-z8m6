#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$ROOT/source/reference/A1-extracted-source-temp" "$ROOT/source/reference/A1-source-package"
cat "$ROOT/binary-parts/file_000000002f3c81f4b97d0bd855cf9e8f.png.b64.part001" "$ROOT/binary-parts/file_000000002f3c81f4b97d0bd855cf9e8f.png.b64.part002" "$ROOT/binary-parts/file_000000002f3c81f4b97d0bd855cf9e8f.png.b64.part003" | base64 --decode > "$ROOT/source/reference/A1-extracted-source-temp/file_000000002f3c81f4b97d0bd855cf9e8f.png"
cat "$ROOT/binary-parts/01-full-source-main.zip.b64.part001" "$ROOT/binary-parts/01-full-source-main.zip.b64.part002" "$ROOT/binary-parts/01-full-source-main.zip.b64.part003" "$ROOT/binary-parts/01-full-source-main.zip.b64.part004" "$ROOT/binary-parts/01-full-source-main.zip.b64.part005" "$ROOT/binary-parts/01-full-source-main.zip.b64.part006" "$ROOT/binary-parts/01-full-source-main.zip.b64.part007" | base64 --decode > "$ROOT/source/reference/A1-source-package/01-full-source-main.zip"
echo "Binary files reconstructed. Verify SHA-256 against TRANSFER-MANIFEST.json."

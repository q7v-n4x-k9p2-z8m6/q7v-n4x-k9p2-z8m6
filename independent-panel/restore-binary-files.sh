#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PNG="$ROOT/source/reference/A1-extracted-source-temp/file_000000002f3c81f4b97d0bd855cf9e8f.png"
ZIP="$ROOT/source/reference/A1-source-package/01-full-source-main.zip"

mkdir -p "$(dirname "$PNG")" "$(dirname "$ZIP")"

cat "$ROOT/binary-parts/file_000000002f3c81f4b97d0bd855cf9e8f.png.b64.part001" \
    "$ROOT/binary-parts/file_000000002f3c81f4b97d0bd855cf9e8f.png.b64.part002" \
    "$ROOT/binary-parts/file_000000002f3c81f4b97d0bd855cf9e8f.png.b64.part003" \
    | base64 --decode > "$PNG"

cat "$ROOT/binary-parts/01-full-source-main.zip.b64.part001" \
    "$ROOT/binary-parts/01-full-source-main.zip.b64.part002" \
    "$ROOT/binary-parts/01-full-source-main.zip.b64.part003" \
    "$ROOT/binary-parts/01-full-source-main.zip.b64.part004" \
    "$ROOT/binary-parts/01-full-source-main.zip.b64.part005" \
    "$ROOT/binary-parts/01-full-source-main.zip.b64.part006" \
    "$ROOT/binary-parts/01-full-source-main.zip.b64.part007" \
    | base64 --decode > "$ZIP"

echo "Checking reconstructed binary SHA-256 values..."
printf '%s  %s\n' "d16d25ba060cd881ac02f40de9478ceea9977d35ca6218a66840325b0210c81b" "$PNG" | sha256sum -c -
printf '%s  %s\n' "ecc32b0da09370c398dcca54e15df5c67cff2f71c3cadd7e41d973025e0d06c4" "$ZIP" | sha256sum -c -

echo "Checking ZIP structure..."
unzip -tq "$ZIP"

echo "Checking all 1,295 manifest entries..."
python3 "$ROOT/verify-transfer.py"

echo "Transfer verification completed successfully."

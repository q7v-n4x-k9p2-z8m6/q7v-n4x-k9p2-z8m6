# Base44 source copy — final transfer audit

## Source identity

- Source app: حساب صراف — آزمایشگاه جامع مستقل
- Source app ID: 6ae50b652a0702c48d9e0b9c
- Destination repository: q7v-n4x-k9p2-z8m6/q7v-n4x-k9p2-z8m6
- Destination branch: m8x-q2v-n7k4-z9p6-حساب-صراف
- Destination root: independent-panel/
- Manifest inventory: 1,295 files
- Original total bytes: 17,594,396
- Original SHA-256 values: recorded in TRANSFER-MANIFEST.json

## Verified transfer results

| Category | Count | Result |
|---|---:|---|
| UTF-8 text files | 1,290 | Exact Git blob ID and byte-size match against Base44 source |
| Native binary files | 3 | Exact Git blob ID and byte-size match against Base44 source |
| PNG from Base64 parts | 1 | Reconstructed and committed; SHA-256 and Git blob ID match Base44 source |
| ZIP from Base64 parts | 1 | All 7 parts present; Base64 valid; decoded size matches; original Base44 ZIP passes ZIP integrity test and SHA-256 matches manifest |

The 1,293 text/native files were checked in batches against the actual Base44 sandbox using `git hash-object` and byte sizes. No missing files or mismatches remained.

## Repairs performed

1. Restored 301 text files whose Git destination blobs were one byte shorter than the manifest. The exact bytes were read from Base44 and their resulting Git blob IDs were verified.
2. Identified and restored four additional mismatched files:
   - `reference/A1-extracted-source-temp/public/runtime-config.js`
   - `reference/A1-extracted-source-temp/src/pages/OAuthConsent.jsx`
   - `reference/A1-extracted-source-temp/src_pages_OAuthConsent.jsx`
   - `src/pages/OAuthConsent.jsx`
3. Reconstructed the PNG from all 3 Base64 parts and committed it at:
   `source/reference/A1-extracted-source-temp/file_000000002f3c81f4b97d0bd855cf9e8f.png`
4. Kept the ZIP's 7 Base64 parts intact. The original ZIP in Base44 is 4,008,524 bytes, has SHA-256 `ecc32b0da09370c398dcca54e15df5c67cff2f71c3cadd7e41d973025e0d06c4`, and passes `unzip -tq`. The final reconstructed ZIP is to be materialized locally by the restore script; the single binary ZIP blob has not been uploaded to GitHub in this session.

## Verification scripts

- `restore-binary-files.sh`: reconstructs PNG and ZIP, checks their SHA-256, tests ZIP integrity, then runs the manifest verifier.
- `verify-transfer.py`: checks all 1,295 target paths, sizes, and SHA-256 values after reconstruction.

## Scope and safety

- Base44 source app was accessed read-only; no app files, entities, records, or deployment settings were changed.
- No Supabase operation was performed.
- No production A1 application files or deployment configuration were changed.
- No new branch was created; only the existing transfer branch was updated.
- No independent build, runtime, authentication, or database validation has been performed. This report certifies source-file transfer integrity, not application readiness.

# Independent Sarraaf Panel — Transfer Workspace

This directory contains the isolated source copy for the Base44 laboratory project **حساب صراف — آزمایشگاه جامع مستقل**.

## Transfer status

- Source inventory: 1,295 files (1,290 UTF-8 text files, 3 native binary files, and 2 large binary files).
- All 1,290 text files and all 3 native binary files have been restored from the Base44 source and verified byte-for-byte using Git blob SHA-1 and recorded file sizes.
- The PNG has been reconstructed, committed under `source/reference/A1-extracted-source-temp/`, and verified against the Base44 source SHA-256 and Git blob ID. Image dimensions: 1536 × 1024.
- The ZIP's 7 Base64 parts are all present. Their concatenated payload is valid Base64, decodes to exactly 4,008,524 bytes, and its SHA-256 exactly matches the Base44 source and manifest. Its ZIP central directory is valid and lists 866 entries. The reconstructed ZIP is not stored as one Git binary blob; run `bash restore-binary-files.sh` locally to materialize it.
- The earlier 301 one-byte size differences were restored from the exact Base44 source. A further 4 mismatched files were identified by full comparison and restored. Final audit: 1,293 of 1,293 ordinary text/native files match their original Git blob IDs and sizes.

## Verify or restore

From this directory, run:

```bash
bash restore-binary-files.sh
```

This reconstructs the PNG and ZIP from their Base64 parts, checks their SHA-256 values, runs ZIP integrity testing, and executes `verify-transfer.py` against all 1,295 manifest entries.

You can also run `python3 verify-transfer.py` after the two binary outputs have been reconstructed.

## Scope and safety

- This is a source-copy workspace only. No independent build, runtime, authentication, or database validation has been performed.
- The Base44 source app was read-only during this audit.
- The repository default branch and production app source were not modified.
- No Supabase database, credentials, user accounts, or production records were changed.
- No new branch was created; all GitHub transfer work stayed on the existing transfer branch.

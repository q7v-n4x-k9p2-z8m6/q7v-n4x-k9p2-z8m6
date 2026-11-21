# Independent Sarraaf Panel — Transfer Workspace

This directory contains the isolated source copy for the Base44 laboratory project **حساب صراف — آزمایشگاه جامع مستقل**.

## Transfer status

- Source inventory: 1,295 files (1,290 text, 3 native binary, 2 chunked binary).
- The 1,290 text files and 3 native binary files are present under `source/`.
- The PNG image has been reconstructed from its 3 Base64 parts and placed at `source/reference/A1-extracted-source-temp/file_000000002f3c81f4b97d0bd855cf9e8f.png`.
- The ZIP package remains stored as 7 Base64 parts. Run `bash restore-binary-files.sh` from this directory in a local clone to reconstruct it.
- A size audit found 301 UTF-8 text files whose Git tree size is one byte smaller than the original sizes recorded in the manifest. These files have not been changed blindly; their exact original bytes must be recovered or verified against the manifest SHA-256 values before calling the text transfer lossless.
- This is a source-copy workspace only. It has not been built or runtime-validated.

## Safety and isolation

- The production app and the repository's default branch are not modified by this transfer.
- No Supabase database, credentials, user accounts, or production records were changed.
- Do not connect this workspace to production services or deploy it until the source-integrity audit and independent build review are complete.

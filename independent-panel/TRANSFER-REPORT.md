# Base44 source copy — transfer report

- Source app: حساب صراف — آزمایشگاه جامع مستقل
- Source app ID: 6ae50b652a0702c48d9e0b9c
- Source files inventoried: 1,295
- Text files inventoried: 1,290
- Native binary files inventoried: 3
- Large binary files stored as Base64 parts: 2
- Total original bytes: 17,594,396
- Original SHA-256 values: recorded for all 1,295 source files in TRANSFER-MANIFEST.json

## Completed in this continuation

- Re-read the manifest, transfer report, restore script, branch tree, and all 10 Base64 parts.
- Confirmed all 3 PNG Base64 parts and all 7 ZIP Base64 parts are present.
- Reconstructed the PNG binary blob from its three parts and added it at:
  `source/reference/A1-extracted-source-temp/file_000000002f3c81f4b97d0bd855cf9e8f.png`
- Confirmed the PNG payload has a valid Base64 alphabet/length, the PNG signature, dimensions 1536 × 1024, and PNG IEND trailer.
- Confirmed the ZIP Base64 payload has a valid Base64 alphabet/length and decodes to the manifest's expected 4,008,524 bytes. The ZIP has not yet been committed as a reconstructed binary file.

## Remaining integrity work

- 301 of the 1,290 UTF-8 text files have a Git tree byte-size exactly one byte below the original size recorded in the manifest; the other 989 match their recorded byte sizes. The three native binary files match their recorded sizes.
- The one-byte differences must not be repaired by blindly appending a newline. The exact original final byte and SHA-256 must be checked against the original source/export. Until that comparison is available, these 301 files remain unverified.
- Reconstruct the ZIP package from the seven parts, then run ZIP integrity testing and compare its SHA-256 with the manifest.
- Run a complete per-file SHA-256 verification for all 1,295 entries when the original source/export or a local verification environment is available.

## Scope and safety

- This is a source copy only; no independent build, runtime, authentication, or database validation has been performed.
- No Supabase operation was performed.
- No production app files were changed.
- No branch was created; work is confined to the existing transfer branch.

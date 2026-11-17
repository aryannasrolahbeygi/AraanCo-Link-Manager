# Security policy

## Reporting security issues

Please **do not publicly disclose** an exploitable issue before maintainers have had a chance to investigate. Use the repository's **Security → Report a vulnerability** option if available, or contact the repository maintainer privately.

## Privacy considerations

- This extension does not require a backend, extension-specific account, or analytics.
- Link records are kept in Chrome local storage. Optional Chrome Sync sends link records (including any private/intranet URLs) through the Google account's Chrome Sync service.
- Do not save passwords, bearer tokens, session IDs, or other credentials in URLs.
- Exported JSON files contain your links in plaintext. Protect backups appropriately.
- `manifest.json` includes a **public** extension key to keep the ID stable for unpacked installs. It is not a private signing key.

## Scope

The extension is distributed **as-is** under the MIT License. Only install releases downloaded from the official repository and review changes before installing manually.

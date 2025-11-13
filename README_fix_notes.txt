Fixes and safety wrappers applied automatically:
- Added helper functions safeGet, sanitizeAndSet, safeSetHTML at top of JS files.
- Replaced JSON.parse(localStorage.getItem(...)) with safeGet(...)
- Replaced localStorage.setItem(..., JSON.stringify(...)) with sanitizeAndSet(...)
  which strips 'password' and 'token' fields before storing.
- Replaced direct .innerHTML assignments with safeSetHTML(...) that strips <script> tags.
- Removed console.log(...) lines.
Notes:
- These are automated, best-effort fixes to improve safety and prevent runtime JSON errors.
- Further manual review recommended for app-specific logic and server-side auth.

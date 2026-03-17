## [ERR-20260318-001] moonshot_pdf_file_part

**Logged**: 2026-03-18T00:00:00+08:00
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
Moonshot chat completions does not accept PDF content as a `file` part in this integration path.

### Error
```text
Invalid request: the message at position 1 with role 'user' contains an invalid part type: file
```

### Context
- Operation attempted: `POST /api/extract-text` with `application/pdf`
- Previous implementation sent PDF directly to Moonshot vision model as a chat `file` part
- Reproduced locally with a minimal sample PDF via `curl`

### Suggested Fix
Parse PDF text locally first. If the PDF is scanned and has no extractable text, render pages to PNG and send those images to the vision model instead of sending the PDF binary directly.

### Metadata
- Reproducible: yes
- Related Files: app/api/extract-text/route.ts

---

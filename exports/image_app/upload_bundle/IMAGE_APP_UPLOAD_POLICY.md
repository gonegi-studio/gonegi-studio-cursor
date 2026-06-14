# Image App Upload Policy (PHASE-EXPORT-001)

`exports/image_app/latest/` is the **only** folder Image App users should upload from.

## Allowed in `latest/`

- `cinematic-dna-library-import.json`
- `image-app-brain-ingestion-package.json`
- `living-world-core-v1-package.json`
- `living-world-image-adapter.json`
- `music-drama-image-adapter.json`
- `location-lighting-image-adapter.json`
- `indoor-location-anchor-adapter.json`
- `lighting-anchor-adapter.json`
- Future: `shot-grammar-adapter.json`, `emotion-acting-adapter.json`

## Forbidden in `latest/`

- `rkb-*`, `qa-*`, `audit-*`
- `*-report.*`, `*-scorecard.*`, `*-visual-comparison.*`, `*-test-batch.*`
- `verification-*`, `validation-*`

## Other folders

| Folder | Purpose |
| --- | --- |
| `adapters/` | Canonical adapter JSON (synced into `latest/` for upload) |
| `test_batches/` | RKB / QA validation generation specs |
| `reports/` | Adapter and export audit reports |
| `archive/` | Previous versions of published assets |
| `upload_bundle/` | Upload manifest and policy |
| `datasets/render_feedback/` | RKB scorecards, reports, knowledge-base entries |

Verify: `npm run verify:image-app-export-governance`

# V1 P0–P2 maintenance

Baseline: `v1-final`. Work branch: `maintenance/v1-quality`.

## Implemented

- Production Pages base is `/`; README now documents hanb1ng.com and the current physical card interaction.
- Added favicon, canonical/OG/Twitter metadata, 1200×630 PNG and a repeatable local rendering script.
- Avatar has a static loading surface and initials on network failure. QR loading/failure behavior remains available.
- Empty social entries expose a disabled control instead of an empty dialog.
- Clipboard denial also attempts the legacy fallback and restores focus. The deprecated fallback is intentionally documented.
- Extracted SocialGrid, SharePanel, AvatarImage, preference composable and translation module. The card's interconnected entrance/flip/pressure logic remains together for this maintenance phase.
- Split CSS into ordered base/card/entrance files and formatted source for review. Removed hidden decorations, unused shadow writes and duplicate poster raster draws.
- Named effect cleanup, a shared reduced-motion media query, runtime change handling, and guaranteed header completion when entry is interrupted by reduced motion.
- Enabled noUnusedLocals, noUnusedParameters and noFallthroughCasesInSwitch.
- Added geometry and browser regression suites plus a GitHub check workflow.

## Verification

Local Node 22: `npm test` (4 tests), `npm run build` (TypeScript + Vite), `npm run test:e2e` (5 scenarios with installed Google Chrome).

Browser scenarios cover reload/continuous turns and pressure, avatar failure, clipboard fallback, QR/poster, dialog focus, saved language/theme, runtime reduced motion, empty contact configuration, and English long-account layout at 390/760/820/1051/1180/1280 CSS px. No horizontal overflow was found, so grid columns were retained. Page, poster and OG image were visually inspected.

## Boundaries

No P3 visual redesign. No deletion of local work snapshots. `.idea` and `dist` are ignored and untracked; no index cleanup was necessary. GitHub Actions and the public domain have not been validated for this branch; merging main and checking its deployment remain separate steps. Social crawlers may need to refresh cached previews after deployment.

# Strong motion development

This branch starts from the published `baseline-2026-10-30` tag. The live `main` branch and `hanb1ng.com` stay on the saved baseline until this work is reviewed and merged.

## Motion changes

- Large identity card enters with a clear overshoot and settling motion.
- Share card visibly slides out from behind, rises to the front, then settles with a spring effect. Mouse exit reverses that path.
- Pointer movement controls card tilt, highlight and shadow direction.
- The stage adds slow orbital motion, soft light and six small particles.
- Social cards lift and scale further, with a moving sheen and stronger icon feedback.
- Mobile uses a shorter card travel distance and touch feedback.
- `prefers-reduced-motion: reduce` suppresses animations while keeping the card and sharing actions usable.

## Review

Run `npm ci && npm run dev`, then test at desktop and phone widths. The branch is not published to the main domain. Run `npm run build` before merging.

## Floating volume study

The card now has a front face, back plate, and thin right/bottom sides. A separate floating rig moves the card while its ground shadow and backlight change in sync. The foreground and background orbit segments frame the card. Hover waits 500 ms before opening the share card; the existing copy hint appears after one second.

Each card is composited independently within the stack to prevent tilted faces from intersecting and cutting through the QR code. The foreground orbit moves behind the cards while sharing. Local browser verification confirmed an intact QR card, pointer-exit reset, and no page errors. Reduced-motion fallback remains available.

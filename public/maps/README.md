# Static London map: original CARTO design

These are genuine CARTO Positron (`light_all`) responses captured on 2026-10-04,
not an AI-generated or hand-drawn approximation. The original Leaflet 1.9.4 map
from `f4582ce` is restored: center `[51.49, -0.06]`, zoom 10, marker
`[51.4805, -0.005]`, `saturate(0.3) brightness(1.08)` filter and 36px pulsing pin.
Visible © CARTO / © OpenStreetMap attribution is the intentional addition.

32 checked-in PNGs cover x 510–513 and y 339–342 at zoom 10, in both native
256×256 and retina 512×512 resolution (~1.3 MB total). Leaflet selects `@2x`
on high-density displays exactly as before. Tiles remain at native CSS scale
instead of stretching a single screenshot. Above DPR 2, the same original
retina source is used; this is not a claim of unlimited raster resolution.

The runtime, production build and CI never need a Carto key or contact CARTO.
A provider outage, new API rule or revoked key cannot alter this snapshot.
`light_all/manifest.json` records byte counts and SHA-256 hashes. Tests decode
all PNGs, check completeness/hashes and reject the HTTP-200 “API KEY REQUIRED”
placeholder that caused the old widget to fail. Attribution links only navigate
when clicked; no fonts, imagery or location information come from third parties.

## Optional manual refresh

Run from the repository root in Bash with a masked terminal prompt:

```bash
read -rsp 'CARTO authoring key: ' CARTO_AUTHORING_KEY
printf '\n'
printf '%s' "$CARTO_AUTHORING_KEY" | node scripts/cache-map-tiles.mjs
unset CARTO_AUTHORING_KEY
npm test
npm run test:browser
```

Do not store a key in source, manifests, shell arguments or CI. The authoring-only
script reads stdin and never logs the key or credential-bearing URL. Refreshing
is manual and is never a build/deployment step.

## Regression proof

Both CI and deployment run tests. The browser matrix contains 114 configurations:
Chromium/Firefox/WebKit; widths 320/380/381/390/640/641/768/1024/1025/1440/2560;
portrait/landscape; DPR 1/2/3, plus fractional DPR 1.25/1.5 at phone/desktop widths
and DPR 4 at phone width. Two checks per configuration cover:

1. Cross-origin traffic blocked, correct density asset dimensions, successful
   visible tile loading, layout/label/attribution, original pulse animation,
   and repeated live resizing with full coverage and projected marker position.
2. Reconstruction of the original `f4582ce` options and frozen original CSS,
   with captured genuine responses replayed into the original Carto URL template
   offline. **Exact DOM geometry and computed design styles** are required at each DPR.
   Capture freezes both CSS animations and transitions before measuring or moving
   the card. Each comparison deliberately starts a long-running transform transition
   and verifies that capture cancels it completely. This prevents timing-dependent
   geometry drift without widening either the geometry or pixel allowance; the
   production hover/entrance/pulse animations remain unchanged.
   Screenshot position/crop is normalized to integer coordinates at the actual
   card size. The new attribution is excluded from the old-design comparison;
   its visibility is asserted separately in every normal-layout test. CSS-pixel screenshots minimize Chromium's fractional raster-decoder
   interpolation seams; normal layout evidence includes full-device-density
   screenshots. Pixelmatch uses threshold 0.1 with anti-alias detection and an explicit
   maximum of five differing CSS pixels for decoder seams; raw/perceptual counts
   are attached. This is not a claim of byte-identical native-DPR screenshots. This proves the original rendering with the current
   Carto snapshot, not inaccessible historical Carto geography.

CI retains screenshots, pixel counts and the JSON report as `browser-evidence`.
The implementation uses one ResizeObserver and resets the fixed center on real
size changes; Leaflet's competing window handler is disabled, and redundant
initial resets are skipped to avoid cancelling initial tile loads.

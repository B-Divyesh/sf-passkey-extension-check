# Design thesis: the passkey safety desk

## Direction

The product uses a **paper-cut diorama**: a small, calm inspection desk where layered browser windows, credential keys, and a check lamp make an invisible extension conflict tangible. Overlapping paper layers are the visual metaphor for providers competing for the same passkey ceremony. It is deliberately tactile and editorial—not a glossy security dashboard—because the job is preparation and recovery, not fear.

## Palette

- `paper` #F4EBDD — warm uncoated stock, the primary light background.
- `paper-raised` #FFF9EF — lifted sheets and controls.
- `ink` #182D2B — deep pine text (12.5:1 on paper).
- `ink-muted` #36504B — secondary copy (7.4:1 on paper).
- `teal` #064842 — action/verified ink (8.8:1 on paper).
- `teal-deep` #064842 — pressed/focus companion.
- `saffron` #A46300 — caution tabs and focus ink, always paired with a label/icon.
- `rust` #A53A29 — conflict/danger (6.0:1 on paper).
- `sage` #D7E5CF — safe-state paper.
- Dark treatment: `night-paper` #122321, `night-raised` #1C3330, `night-ink` #F7ECDD, `night-muted` #B9CBC5, with teal #71D2C4 and saffron #F2BD52. The same stock-and-ink metaphor is retained rather than inverted into neon.

## Typography

No remote fonts. Headings use `Georgia, Cambria, Times New Roman, serif` for the feel of an annotated field guide; interface and body copy use `Inter, ui-sans-serif, system-ui, sans-serif` for legible diagnostics. The scale is 16 / 18 / 22 / 30 / clamp(40–64) px, with 1.5 body leading and a 68-character reading measure. Numeric findings use tabular figures.

## Spacing and shape

An 8 px base rhythm with 4 px micro-spacing. Primary gaps are 16, 24, 32, 48, and 80 px. Paper layers use asymmetric 14–22 px radii and 2–4 px offset ink shadows; inner diagnostic rows remain mostly unboxed and group by proximity. Buttons and inputs are at least 44 px high. Mobile stacks the inspection scene below the copy and removes nonessential decorative tabs.

## Interaction grammar

- The single primary action is “Run readiness check.” It reads like stamping an inspection sheet.
- Scan stages enter as paper slips from the originating button; findings unfold directly beneath the summary.
- Severity is conveyed by icon, label, sentence, and color—not color alone.
- Manual provider selection is a documented fallback and uses large checkbox rows. Results are immediately recomputed and announced.
- Export creates a plain-text local report; reset is confirmed and erases only local preferences/results.

## Motion

Transitions last 160–240 ms and use only opacity and transform: small lifts on press, a one-time sheet reveal, and no looping animation. With `prefers-reduced-motion: reduce`, all transforms and smooth scrolling are removed and state changes are instant. Depth remains through physical shadows and paper edges.

## Asset plan and provenance

One original raster hero is generated for the landing site: a wide paper-cut browser/passkey inspection diorama with open space for copy. Extension icons and status marks are hand-authored SVG/CSS geometry, because they must be crisp at toolbar sizes. The generated scene is explanatory, never a depiction of actual scan results.

Prompt sheet:

> Use case: stylized-concept. Asset type: wide landing-page hero illustration. Scene: a tabletop paper-cut diorama of three overlapping browser-window sheets being inspected for passkey compatibility; a small teal key-shaped paper cutout, two provider cards overlapping at one credential doorway, and a warm saffron inspection lamp revealing the overlap. Style: handcrafted layered cut paper, visible fibrous edges, subtle offset shadows, editorial miniature, no photorealism. Composition: landscape 3:2, scene concentrated to the right and center with calm negative space at upper left, simple silhouette readable at small size. Lighting: warm directional studio light, reassuring rather than alarming. Palette: warm oat paper, deep pine ink, oxidized teal, saffron, restrained rust. Constraints: no people, no real brands, no UI text, no letters, no logos, no watermark, no gradients, no glassmorphism, no padlock cliché, no illegible symbols.

Generated with the factory image deployment through `/opt/fleet/lib/gen-image.sh` on 2026-08-27. The output is original project artwork. Source PNG and prompt sidecar are retained in `assets/src/`; optimized WebP is shipped in the site. The 1200×630 social preview is a reviewed 2026-09-06 crop of that original artwork, made with Sharp; it adds no text or external artwork.

## Why it fits

Passkey failures are normally invisible until the moment of authentication. The layered paper windows expose coexistence as a physical overlap, while the inspection desk frames the product as a preflight checklist. Warm stock and precise dark ink keep the utility trustworthy without borrowing the visual language of a password manager or making security guarantees.

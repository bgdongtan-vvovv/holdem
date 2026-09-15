# Holdem Visual System

## Reference inventory

The skill contains 23 source screenshots in `assets/reference-screens/`:

- `KakaoTalk_20260826_143455837.png` through `_08.png`: desktop landscape table states, betting, showdown, emoji panel, felt selection, breaks, and sparse tables.
- `KakaoTalk_20260902_155622655.jpg`: cinematic WSOP loading artwork.
- `KakaoTalk_20260902_160401081.jpg`: portrait lobby/home screen.
- `KakaoTalk_20260902_173449706.jpg` through `_11.jpg`: portrait table states, action controls, squeeze/open-card interaction, settings drawer, tutorial, player statistics, registration sheet, and tournament detail.

Never delete, rename, recompress, crop, recolor, or overwrite these sources. Add new references as new files and update this inventory.

## Visual thesis

Create a dense, tactile poker room rather than a generic modern dashboard. The dominant impression is cinematic darkness, warm hospitality, physical table materials, bright cards, metallic accents, and immediate numerical clarity. The interface may feel playful through avatars and emoji, but money, actions, and turn state remain serious and legible.

## Palette and materials

- Background: near-black with warm brown ambient lighting and deep vignette.
- Table rail: layered walnut/brown leather with visible grain, highlights, and inset shadow.
- Felt: distressed charcoal or selected colored felt; preserve subtle wear and stitched oval line.
- Panels: #111–#292929 family with gentle vertical gradients, thin borders, and compact shadows.
- Money/pot/primary metrics: muted gold to warm yellow.
- Stack values: cyan to light blue.
- Positive online/countdown status: saturated green.
- Destructive, fold, all-in, or registration urgency: deep red.
- Text: white for primary, cool gray for secondary, near-black on gold plaques.

Avoid pure flat fills over large areas. Use restrained texture, bevel, rim light, and shadow to separate layers.

## Composition

### Desktop table

- Use a wide oval occupying most of the viewport with the local player centered at the bottom.
- Distribute opponents evenly around the perimeter; keep the center available for board, pot, bets, and status.
- Keep tournament status compact in the upper-left and window controls separate from game controls.
- Place primary Fold/Call/Raise controls in the lower-right near the local seat.

### Portrait table

- Stretch the oval vertically and place six to eight seats around its perimeter.
- Place the local player in the lower-left/lower-center region and reserve the bottom area for large action controls or drawers.
- Center pot, board, and tournament summary vertically in descending priority.
- Allow bottom sheets and control trays to cover the lower table while dimming the play area.

### Lobby and information screens

- Begin with a cinematic promotional banner, then horizontal card rails and dense content lists.
- Use persistent bottom navigation with an enlarged central poker action.
- Tournament detail favors information density, clear tabs, gold monetary values, green live counts, and dark row separators.

## Component anatomy

### Player seat

Compose avatar, level/bounty badge, country flag, beveled nameplate, username, stack value, and optional cards. Use a white rim and bright green timer bar for the active player. Dim folded or inactive seats without losing identity. The local username may use orange while stack values stay blue.

### Cards and chips

Cards are high-white with large corner rank and suit. Red and black suits must remain unambiguous. Community cards are the strongest object after the table. Chips use multiple colors, visible edge markings, and grounded shadows. Pair chip stacks with numeric capsules when exact value matters.

### Actions

Use large, beveled, high-contrast buttons. Keep Fold neutral/dark or red by context, Call information-forward, and Raise visually strongest. On narrow screens, stack preset raise amounts vertically and keep the core Fold/Call actions thumb-sized. Gold numeric values outrank labels.

### Sheets, dialogs, and tutorials

Use a nearly black scrim over the live table. Bottom sheets use rounded top corners, a drag handle, and charcoal surfaces. Registration has two equal-width bottom actions. Tutorials use clear staged illustrations and one dominant full-width confirmation button.

## Type and numbers

Use a condensed sans-serif voice with tall numerals. Primary values should be large, tabular, and high contrast. Keep labels smaller and muted. Do not use decorative display faces for live play data. Preserve currency symbols, thousands separators, BB units, and decimal precision.

## Responsive rules

- Recompose; do not uniformly scale. Desktop and portrait use different seat distributions and control placement.
- Protect cards, current pot, local stack, active action, and turn state before secondary tournament metadata.
- Keep touch targets at least 44 CSS pixels where platform constraints allow.
- Test clipping with long usernames, five-digit stacks, currency values, flags, badges, and translated labels.

## Fidelity review

Compare the final render with the closest source at the same orientation. Check in order:

1. Table silhouette and viewport occupancy.
2. Seat count, spacing, and local-player prominence.
3. Board, pot, bet, and action hierarchy.
4. Dark/warm palette and material depth.
5. Card, chip, and numeric legibility.
6. Overlay behavior and bottom safe area.
7. Texture restraint, borders, shadows, and active-state glow.

Resolve visible mismatches before polishing micro-details.

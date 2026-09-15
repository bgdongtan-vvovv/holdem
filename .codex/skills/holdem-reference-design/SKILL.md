---
name: holdem-reference-design
description: Use when designing, implementing, reviewing, or generating any poker, Texas Hold'em, tournament, lobby, table, player-seat, betting-control, modal, tutorial, or promotional interface in this repository where visual consistency with the bundled Prime Poker and mobile poker reference screenshots must be preserved.
---

# Preserve the Holdem Reference Design

Treat the bundled screenshots as the visual source of truth. Read `references/design-system.md` completely before proposing or changing UI.

## Required workflow

1. Inventory every file in `assets/reference-screens/`; do not infer the system from a subset.
2. Classify the requested screen as table, lobby, tournament detail, modal/sheet, tutorial, or promotional.
3. Inspect at least one desktop and one mobile reference when the component exists in both forms. Inspect every directly relevant state.
4. Extract the relevant layout, hierarchy, color, material, type, spacing, and interaction rules before implementation.
5. Reuse existing project components and assets where suitable. Generate new raster art only when necessary; keep it original and stylistically compatible.
6. Render the finished result at its target viewport. Compare it side by side with the closest bundled reference.
7. Correct material, proportion, hierarchy, legibility, clipping, overlap, and state differences before reporting completion.

Time pressure never removes steps 1, 3, 6, or 7. If rendering or reference inspection is unavailable, report the limitation and do not claim visual fidelity.

## Output contract

Report the reference category used, target viewport, material and color decisions, responsive behavior, and visual verification performed. Distinguish intentional product differences from fidelity defects.

## Quick reference

| Area | Required character |
|---|---|
| Environment | Near-black casino setting, warm wood, leather, charcoal felt |
| Emphasis | Muted gold/yellow for money and pot; cyan-blue for chip counts; red for destructive or all-in actions |
| Table | Dominant oval, strong wood rail, subtle felt wear, uncluttered center |
| Seats | Circular avatar over a beveled dark nameplate with flag, level/bounty, name, and stack |
| Cards/chips | Bright, oversized, tactile, readable under compression |
| Controls | Large thumb-safe beveled controls anchored near the local player |
| Overlays | Dimmed backdrop, dark raised panel or bottom sheet, clear primary action |
| Typography | Condensed, high-contrast, tabular numerals where values update |

## Common mistakes

- Replacing tactile casino materials with generic flat SaaS cards.
- Using a clean green-felt stereotype when the relevant reference uses charcoal felt.
- Shrinking cards, chip values, or actions to make room for secondary information.
- Moving the local player's controls away from the thumb zone.
- Applying desktop density directly to portrait mobile.
- Claiming similarity without a rendered comparison.

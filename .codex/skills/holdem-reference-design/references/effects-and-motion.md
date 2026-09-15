# Holdem Effects and Motion System

## Contents

1. Product evidence and interpretation
2. Operating principle
3. Designer handoff contract
4. Presentation event contract
5. Layer and priority model
6. Motion timing
7. Effect recipes
8. Audio and haptics
9. Reduced motion and performance
10. Verification

## Product evidence and interpretation

Use the bundled Prime Poker/GGPoker screenshots for exact composition and state appearance. Use gameplay video to confirm ordering and emphasis, not to copy proprietary artwork or claim frame-exact timings.

Verified product references:

- GGPoker Games & Features Guide: Smart HUD, PokerCraft, EV Cashout, Run It Multiple Times, Rabbit Hunt, Squeeze, table customization.
- GGPoker Smart HUD: avatar press opens tournament/player statistics; hot/cold indicators are visual state.
- GGPoker Bounty Hunters: progressive knockout tournaments and persistent bounty values at seats.
- GGPoker mobile guide: quick actions, pre-actions, bet sizing, action sounds, and high-contrast mobile tables.
- GGPoker Clips, `TryTime Epic Final Table Run`: board streets, chip commits, action labels, showdown, WIN badge, and next-hand reset remain fast and table-centered.
- GGPoker, `2020 WSOP Super Circuit Online Series`: WSOP partnership presentation and tournament branding.

These sources establish product behavior. The timing values below are this project's production targets, derived from observed ordering, the bundled screenshots, and the current implementation. They are not asserted as proprietary GGPoker constants.

## Operating principle

Render effects as a projection of immutable authoritative events:

```text
server event -> state commit -> presentation queue -> visual/audio/haptic effect
                                      -> cancel/fast-forward -> current state
```

Never delay or mutate authoritative state to finish an animation. A reconnect, newer sequence number, app background transition, orientation change, or reduced-motion preference may cancel or fast-forward presentation. The final rendered state must always match the newest server snapshot.

Preserve comprehension in this order:

1. Legal action and current actor
2. Hole cards, board, pot, and committed amounts
3. Winner and award destination
4. Bounty or tournament consequence
5. Celebration and social reactions

## Designer handoff contract

Accept each Atlas/designer-agent delivery with this manifest:

```ts
type PokerEffectAsset = {
  assetId: string;
  event: "deal" | "fold" | "bet" | "all-in" | "board" | "showdown" | "win" | "bounty" | "elimination";
  variant: "portrait" | "landscape" | "shared";
  atlas: { image: string; metadata: string; frameWidth: number; frameHeight: number; frameCount: number; fps: number };
  loop: "none" | "hold-last" | "bounded";
  anchor: { target: "table" | "seat" | "board" | "pot"; x: number; y: number };
  safeArea: { top: number; right: number; bottom: number; left: number };
  blendMode: "normal" | "screen" | "add";
  audioCue?: string;
  reducedMotionFrame: number;
  maxTextureSize: 2048 | 4096;
  sourceRevision: string;
};
```

Require transparent padding consistency, a stable anchor, no baked player names or amounts, and readable center space. Use original branding; do not reproduce WSOP, GGPoker, Prime Poker, or third-party character assets.

Pack production frame sequences into texture/sprite atlases. Preserve source frames separately for audit. Split an atlas when it exceeds the device texture limit; never downscale text-bearing cards or values until illegible.

## Presentation event contract

Every presentation event must carry `eventId`, `handId`, `serverSequence`, `occurredAt`, and semantic payload. Deduplicate by `eventId`. Ignore sequences older than the committed snapshot. Group effects by hand and cancel the old group on table migration or snapshot replacement.

Use three queues:

- `critical`: turn start, time warning, legal-action change, reconnect, error.
- `gameplay`: deal, chip commit, fold, board reveal, showdown, pot award.
- `decorative`: glow, particles, emoji, GIF, ambient loops.

Critical effects preempt decorative effects. Gameplay effects may shorten but must retain their final readable pose. Decorative effects never block input or the next hand.

## Layer and priority model

| Layer | Content |
|---|---|
| 0 | Room background and vignette |
| 10 | Rail, felt, stitched line, table branding |
| 20 | Seats, avatars, flags, stacks, bounty plaques |
| 30 | Hole cards, board cards, chip piles, dealer button |
| 40 | Action labels, actor glow, timer, pot values |
| 50 | Local legal-action controls and bet controls |
| 60 | Showdown, winner, bounty, elimination effects |
| 70 | HUD sheets, menus, tutorials, registration dialogs |
| 80 | Reconnect, clock-critical warning, blocking error |

Social reactions render between 40 and 50 and must not cover local cards, board ranks, pot value, timer, or action buttons.

## Motion timing

| Motion | Target duration | Easing / cadence |
|---|---:|---|
| Tap acknowledgement | 80-120 ms | fast ease-out |
| Action label | 180-260 ms in; 500-900 ms hold | scale 0.94 -> 1, fade |
| Hole-card flight | 360-520 ms/card | ease-out; 70-110 ms seat stagger |
| Card flip | 220-320 ms | two half-turns; swap face at midpoint |
| Bet chip flight | 280-420 ms | arced ease-in-out |
| Fold cards to muck | 180-260 ms | accelerate inward; fade last 35% |
| Flop reveal | 650-900 ms total | three cards, 100-150 ms stagger |
| Turn/river reveal | 300-480 ms | single flip |
| Showdown expose | 450-750 ms | contenders in table order |
| Pot to winner | 650-950 ms | converge, travel, settle |
| WIN emphasis | 900-1,500 ms | one entrance, short hold, clean exit |
| Bounty award | 1,000-1,600 ms | seat -> winner -> bounty plaque |
| Next-hand reset | 280-500 ms | clear awards before deal |

Keep a normal non-all-in action below 700 ms perceived latency. Never use a 2+ second full-table blocker for routine showdown. Reserve longer celebration for tournament elimination, final table, or tournament victory, and allow tap-to-skip after the result becomes readable.

## Effect recipes

### Deal

Trigger after `hand.started` and blind/ante values are committed. Play one restrained shuffle cue, then fly cards clockwise from the dealer/deck origin in two rounds. Keep opponents face-down; flip only local cards. Finish with the local cards readable and controls enabled from authoritative legal actions.

### Check, call, bet, and raise

Show the semantic label immediately. Move a representative chip stack from the acting seat to its committed-bet anchor, then update the numeric capsule. Do not animate every chip unit. Check uses no chip motion. Raise must communicate the final total, not only the added amount.

### Fold

Dim the seat only after cards begin moving to the muck. Pull cards toward the dealer/center, rotate slightly, fade, then show `Fold`. Keep identity, stack, flag, and bounty readable. Remove the active glow immediately so the next actor is unambiguous.

### All-in

Commit chips first, set stack to zero, then land a red `ALL-IN` badge on the seat. Use a single impact pulse and short low-frequency haptic for the local player. Do not use victory fireworks or imply a winner. When betting closes, transition directly to showdown or the next board reveal.

### Board reveal

Keep reserved board slots stable. Reveal the flop left-to-right with a tight stagger; turn and river each use one flip. Update pot and hand-strength text only after the card face becomes visible. Squeeze is optional presentation: it cannot pause the server clock, and must auto-complete before the local action deadline.

### Showdown

Reveal eligible hands in deterministic table order. Highlight only cards contributing to each best five-card hand. Place the hand name near the relevant seat or board without covering ranks. The Atlas/designer SHOWDOWN effect may frame the moment, but must leave cards and pot readable and must resolve to a static fallback frame.

### Win and pot award

Lock the displayed result to the authoritative award list. Move each main/side pot separately to its winner. For ties, divide visually and animate simultaneous destinations. Land the `WIN` badge as the first pot reaches the seat, update stack totals, then fade the glow. Do not infer winners from client hand evaluation.

### Bounty and elimination

After the last pot award, show elimination first, then bounty transfer. Move the bounty token/value from the eliminated seat to the winner, show the cash portion, and update the winner's bounty plaque with the retained portion. Split-bounty visuals must follow the server-provided allocation. Bounty effects never precede pot settlement.

### Turn timer and time bank

Drive the ring/bar from server deadline timestamps, not local decrement counters. Enter green, cross to amber at 35%, and red at 15%. Play one warning sound/haptic on threshold crossing, not on every render. Preserve a text or numeric deadline cue for accessibility. On clock correction, animate toward the new fraction within 120 ms unless time has expired, then snap to zero.

### Reconnect and resynchronization

Show a non-destructive top overlay after transport loss while leaving the last table visible. Disable stale action controls. On snapshot receipt, cancel obsolete presentation groups, apply the snapshot, then fade the overlay in 180-260 ms. Never replay old deal, bet, win, or bounty effects after resync; show their settled state.

### Break, seat move, and next hand

Breaks use a dimmed central status overlay with server countdown. Seat moves preserve player identity and suppress celebration. Before the next hand, remove result overlays, return board and pot to empty state, rotate the dealer marker, then start the deal sequence.

## Audio and haptics

Use one cue per semantic event and duck decorative audio under critical alerts. Keep chip, card, and action-voice cues short. Avoid stacking voice, win, showdown, and bounty cues simultaneously; order them action -> showdown -> pot -> award.

| Event | Audio | Local haptic |
|---|---|---|
| Your turn | concise alert | light |
| Time warning | sharper single alert | medium once |
| Bet/call | chip contact | light on submit |
| Raise/all-in | chip impact + optional voice | medium |
| Fold | card/muck swipe | none/light |
| Card reveal | card flip | none |
| Pot award | chips collect/push | success-light |
| Bounty/tournament win | distinct award cue | success-medium |
| Reconnect failure | neutral warning | warning-medium |

Respect sound, voice, music, and haptic settings independently. Never use sound alone to convey legal action, winner, or connection state.

## Reduced motion and performance

For reduced motion, preserve semantic order with opacity and color changes under 180 ms. Replace flight paths, rotation, scale bounce, particle loops, screen shake, and repeated glow with settled poses and one static Atlas frame. Do not remove timer or actor-state changes.

Performance requirements:

- Target 60 fps; accept 30 fps for decorative atlases only.
- Keep input and countdown animation on the native/UI path.
- Preload the next required atlas and audio cue before its likely event.
- Limit simultaneous full-screen particles to one system.
- Pause ambient/decorative loops while backgrounded or covered by a blocking sheet.
- Provide a low-effects mode that disables particles, social GIFs, and long celebrations without changing gameplay information.
- Test a mid-tier Android device, thermal throttling, packet loss, reconnect, and rapid consecutive hands.

## Verification

Verify each effect with a deterministic replay containing event IDs and timestamps. Capture portrait and landscape renders at start, peak, readable hold, and settled end.

For every effect, record:

```text
trigger | authoritative payload | visual phases | duration | layers
audio | haptic | cancellation | reduced motion | settled state
```

Reject completion when:

- the effect can display a winner or amount not present in server data;
- controls accept input while legal actions are stale;
- cards, pot, timer, or action controls are obscured;
- a reconnect replays obsolete celebration;
- animation completion is required for engine progress;
- portrait safe areas clip controls or sheets;
- the Atlas/designer asset lacks a manifest or static fallback;
- only a still screenshot was compared when motion was changed.

Compare a screen recording side by side with the closest reference/video sequence. Verify ordering and readability at normal speed, 0.25x speed, reduced motion, and low-effects mode.

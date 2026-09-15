---
name: visual-first-multi-agent-development
description: Use when developing UI-heavy applications, games, dashboards, or interactive products where visual quality, frontend architecture, and implementation should be split across specialized agents.
---

# Visual-First Multi-Agent Development

## Overview

This skill defines a cost-conscious multi-agent workflow for UI-heavy software projects.

Core rule:

**Astra owns visual creation and visual direction.
Claude owns complex frontend architecture and interaction design.
Codex owns implementation, iteration, testing, and routine fixes.
Gemini owns research and analysis over large amounts of context.**

The goal is to preserve Astra-level visual quality while preventing expensive agents from being used for work that Codex can perform efficiently.

---

## Agent Roles

### Astra — Visual Director / Graphic Designer

Use Astra when the task requires visual judgment, visual invention, or asset creation.

Astra is responsible for:

- Overall visual direction
- UI look and feel
- Poker table appearance
- Cards, chips, buttons, badges, icons
- Backgrounds, lighting, materials, textures
- Graphic composition
- Image concepts and generated visual assets
- Color and typography direction
- Screen mockups
- Visual hierarchy
- Final visual review
- Identifying when the current implementation looks cheap, generic, flat, or visually inconsistent

Astra should NOT be used for:

- Routine coding
- Simple CSS changes
- Basic refactoring
- Repetitive implementation
- Unit tests
- Standard bug fixes
- Build errors
- Small spacing adjustments

### Claude — Frontend Architect / Interaction Designer

Use Claude when the task requires system-level frontend reasoning.

Claude is responsible for:

- Frontend architecture
- Component boundaries
- State management
- Screen and navigation flow
- Complex interaction rules
- Animation behavior and sequencing
- Responsive layout strategy
- Data flow between frontend modules
- UI state machines
- Refactoring plans for complex frontend code
- Translating Astra's visual direction into implementation-ready specifications

Claude should NOT automatically redesign visuals already approved by Astra.

### Gemini — Research / Large-Context Analyst

Use Gemini when a task requires reading or reasoning over a large amount of context before a decision can safely be made.

Gemini is responsible for:

- Surveying the whole codebase or many files for a cross-cutting concern
- Summarizing long external docs, RFCs, or third-party API references
- Analyzing large logs or long game-history/session data for patterns
- Comparing multiple large design/spec documents for consistency
- Surveying external libraries/approaches before Claude or Codex commits to one
- Producing a research brief that Claude or Codex can act on

Gemini should NOT be used for:

- Visual creation, invention, or judgment (that is Astra)
- Architecture or interaction-design decisions (that is Claude)
- Writing or editing production code (that is Codex)
- Small, single-file lookups Codex can grep itself

Gemini's output is a research brief or analysis summary, never code or visual direction. Hand the brief to Claude (architecture) or Codex (implementation) to act on.

### Codex — Implementation / Test / Iteration

Codex is the default development agent.

Codex is responsible for:

- Implementing approved designs
- Writing frontend and backend code
- Translating Astra mockups into code
- Translating Claude architecture into code
- CSS implementation
- Canvas / SVG / WebGL implementation
- Component creation
- Bug fixes
- Refactoring
- Tests
- Build and runtime fixes
- Performance improvements
- Repetitive visual adjustments
- Pixel-level tuning that does not require new design judgment

Codex should always attempt routine implementation before escalating.

---

## Escalation Rules

### Codex → Astra

Escalate to Astra ONLY when one or more of these are true:

- A new visual concept is required
- A new graphic asset is required
- The current screen looks visually weak or generic
- The user asks for a more premium, dramatic, realistic, elegant, casino-like, game-like, or branded visual result
- Several possible visual directions exist and choosing one requires design judgment
- A poker table, card face, chip, button system, background, icon family, or decorative visual needs to be created
- Codex cannot improve the result without inventing a new design language
- The user explicitly requests Astra for visual work

Do NOT escalate for:

- Move element 8 px
- Increase card size 10%
- Change border radius
- Reduce shadow
- Fix alignment
- Adjust font size
- Implement an already approved visual
- Correct responsive breakpoints

### Codex → Gemini

Escalate to Gemini when:

- The task requires reading/comparing many files, long docs, or large logs before implementation is safe
- Codex would otherwise need to spend a large amount of effort just gathering context, not writing code
- A decision depends on understanding patterns across the whole codebase or session/game-history data
- An unfamiliar external library or API needs to be surveyed before Claude or Codex commits to an approach

Do NOT escalate for:

- A single-file or single-function lookup Codex can grep/read directly
- Anything already answered in an existing research brief

### Codex → Claude

Escalate to Claude when:

- Component responsibilities are unclear
- State management is becoming tangled
- Interactions affect many screens or components
- Animation/state sequencing is complex
- A large frontend refactor is required
- Architecture decisions may affect future extensibility
- The same bug is caused by unclear frontend structure rather than local code

### Claude → Astra

Claude may request Astra input when architecture depends on unresolved visual hierarchy or screen composition.

### Astra → Claude

Astra may request Claude input when a visual concept needs complex interaction logic or responsive behavior.

### Claude/Codex → Gemini

Claude or Codex may request Gemini when a design or implementation decision depends on understanding a large amount of existing context first (whole codebase, long docs, large logs).

### Gemini → Claude / Codex

Gemini does not make architecture, visual, or implementation decisions. It hands its research brief back to Claude or Codex to act on.

---

## Default Workflow

1. **Codex starts first** for normal development work.
2. If the task is purely implementation, Codex completes it.
3. If Codex needs large-context research before it can implement safely, send only that part to Gemini.
4. Gemini returns a research brief.
5. If Codex encounters a visual invention/design decision, send only that part to Astra.
6. Astra returns:
   - visual direction
   - mockup/asset guidance
   - reusable design rules
7. If the result requires complex interaction or frontend restructuring, Claude converts the design (and any Gemini research brief) into an implementation plan.
8. Codex implements.
9. Codex tests and performs routine visual iteration.
10. Astra is called again only for major visual review or when quality is clearly insufficient.
11. Claude is called again only when architecture or interaction complexity demands it.
12. Gemini is called again only when new large-context research is genuinely needed.

---

## Credit-Efficiency Rules

The orchestrator must minimize unnecessary expensive-agent calls.

### Mandatory rules

- Codex is the default worker.
- Do not use Astra for routine coding.
- Do not use Claude for trivial fixes.
- Do not use Gemini for a lookup Codex can grep/read itself.
- Do not ask all four agents the same question unless there is a genuine disagreement or high-risk decision.
- Reuse previously approved design rules before asking Astra again.
- Reuse existing architecture decisions before asking Claude again.
- Reuse existing research briefs before asking Gemini again.
- Bundle related visual questions into one Astra request whenever possible.
- Bundle related architectural questions into one Claude request whenever possible.
- Bundle related research questions into one Gemini request whenever possible.
- Prefer one high-quality Astra design pass over many small visual prompts.
- Prefer implementation checklists over repeated agent conversations.

---

## Design Memory

After Astra approves a visual direction, Codex must record the decision in the project design guide.

Record:

- Color palette
- Typography
- Spacing scale
- Border radii
- Shadow rules
- Card dimensions
- Chip style
- Poker table style
- Seat layout
- Button styles
- Icon style
- Animation feel
- Background treatment
- Lighting/material rules
- Approved screen references

Before escalating to Astra, Codex must check whether the required decision already exists in the design guide.

If it already exists, Codex must implement it directly.

After Gemini delivers a research brief, Codex or Claude must record the key findings (in `docs/RESEARCH_LOG.md` or the relevant decision log) so the same research is not re-run later.

Before escalating to Gemini, Codex must check whether the needed information already exists in a prior research brief or decision log.

---

## Hold'em Game Specific Guidance

For poker / hold'em projects, Astra should own visual decisions involving:

- Poker table shape and material
- Felt, rail, wood, metallic, neon, glass, leather, or casino materials
- Player seat frames
- Dealer button
- Betting chips
- Pot visualization
- Hole cards
- Community cards
- Card backs
- Win/lose highlights
- Turn indicator
- Timer graphics
- Action buttons
- Buy-in / stack display
- Lobby hero area
- Tournament branding
- Match result presentation
- Celebration effects
- Background ambiance

Claude should own:

- Table state model
- Player seat state
- Betting action flow
- Turn lifecycle
- Animation sequencing
- Responsive behavior
- Spectator/player modes
- Reconnection UI logic
- Lobby-to-table transition
- Tournament screen structure

Codex should own:

- Implementing table components
- Rendering positions
- CSS
- Canvas/SVG/WebGL integration
- Card/chip animation implementation
- Button logic
- Responsive fixes
- API binding
- Test automation
- Runtime debugging
- Performance tuning

Gemini should own, when needed:

- Surveying existing socket protocol / server TODOs / handoff docs before a large change
- Analyzing hand-history or session logs for behavioral patterns or bugs
- Comparing external poker-engine or socket-library approaches before Claude/Codex commits to one

---

## Visual Quality Gate

Before considering a UI feature complete, check:

- Does it look intentionally designed rather than default-framework generated?
- Is the visual hierarchy clear?
- Are cards, chips, buttons, and information visually balanced?
- Does it preserve the approved brand/design language?
- Does it work at target resolutions?
- Are animations smooth and meaningful?
- Are active states obvious?
- Does the table remain readable under many-player conditions?
- Are important game states visible immediately?
- Is the result visually strong enough that Astra does not need to redesign it?

If the last answer is "no", escalate to Astra for review.

---

## Interaction Quality Gate

Before considering a complex feature complete, check:

- Is the state flow deterministic?
- Can the user understand what action is available?
- Are disabled states correct?
- Do animations match state transitions?
- Can reconnect/reload recover correctly?
- Does responsive layout preserve usability?
- Are frontend responsibilities clean enough to maintain?

If not, ask Claude for architectural review.

---

## Implementation Quality Gate

Codex must verify:

- Build succeeds
- Relevant tests pass
- No obvious console/runtime errors
- Layout works at target sizes
- Existing features are not broken
- Approved design rules were followed
- No unnecessary design changes were invented during implementation

---

## Orchestrator Decision Table

| Situation | Primary Agent |
|---|---|
| New screen visual concept | Astra |
| New graphic asset | Astra |
| Existing design implementation | Codex |
| Minor visual adjustment | Codex |
| Complex component architecture | Claude |
| Complex state / interaction flow | Claude |
| Routine frontend coding | Codex |
| Backend coding | Codex |
| Tests / debugging | Codex |
| Large-context research / analysis | Gemini |
| Comparing external libraries/approaches | Gemini |
| Major visual quality review | Astra |
| Major frontend architecture review | Claude |
| Repeated implementation iteration | Codex |

---

## Final Principle

**Do not spend premium-agent credits on work that can be executed from an already-approved decision or existing research brief.**

Gemini researches the context so decisions are well-informed.
Astra decides how it should look.
Claude decides how complex frontend behavior should be structured.
Codex builds it, tests it, and iterates on it.

# ORCA Development Workflow

## Purpose

This file is the project-level operating guide for Orca orchestration.

It is designed for visually demanding software projects such as the Hold'em game, where graphic quality matters as much as code quality.

The orchestration model is:

**Astra → Visual Director / Graphic Designer**  
**Claude → Frontend Architect / Interaction Designer**  
**Codex → Main Implementation / Test / Iteration Agent**

---

## 1. Default Rule

Always start with Codex unless the task is clearly a new visual-design task or a high-complexity frontend architecture task.

Do not automatically ask multiple agents to solve the same problem.

---

## 2. When to Use Astra

Use Astra when we need to CREATE or JUDGE visuals.

Examples:

- Design a new poker table
- Create card backs
- Design chip styles
- Make a screen look more premium
- Create a tournament lobby visual direction
- Redesign buttons
- Create a casino-like visual identity
- Produce image concepts
- Review whether a screen looks cheap or polished
- Decide between multiple visual directions

After Astra creates a direction, save that result into the project design guide so it can be reused without spending Astra credits again.

### Astra output should include

Whenever possible, request:

1. Visual concept
2. Layout direction
3. Color palette
4. Typography
5. Material/texture direction
6. Component styling
7. Reusable rules
8. Optional visual asset or mockup
9. Implementation notes for Codex

---

## 3. When to Use Claude

Use Claude when frontend behavior becomes structurally complex.

Examples:

- Table state architecture
- Betting interaction flow
- Animation state machine
- Responsive strategy
- Shared component architecture
- Complex player-seat behavior
- Tournament UI structure
- Frontend refactor plan

Claude should produce a clear technical specification that Codex can implement.

---

## 4. When to Use Codex

Codex is the main worker.

Use Codex for:

- Implementing approved screens
- Coding components
- Backend work
- CSS
- Canvas/SVG/WebGL
- Connecting APIs
- Debugging
- Tests
- Refactoring
- Responsive fixes
- Performance work
- Minor visual changes
- Repeated iteration

If Codex reaches a design decision that has not been defined, it should stop inventing visual direction and escalate that part to Astra.

---

## 5. Escalation Examples

### Example A — Minor change

Request:
"Move the bet button lower and make it slightly larger."

Action:
Codex only.

### Example B — New visual concept

Request:
"The table looks boring. Make it feel like a premium live casino."

Action:
Astra defines the visual direction.
Codex implements it.

### Example C — Complex interaction

Request:
"When a player raises, update chip movement, pot state, active seat, timer, and action buttons with smooth animation."

Action:
Claude designs the interaction/state structure.
Codex implements and tests.

### Example D — Both visual and structural

Request:
"Create a new all-in showdown experience."

Action:
Astra defines the showdown visual style.
Claude defines the state/animation sequence.
Codex implements and tests.

---

## 6. Credit-Saving Policy

### Never do this by default

- Ask Astra, Claude, and Codex the same coding question
- Use Astra for every CSS tweak
- Use Claude for every component
- Re-run Astra because a 5px adjustment looks wrong
- Let agents repeatedly rediscover decisions already made

### Do this instead

- Reuse design decisions
- Reuse architecture decisions
- Batch visual questions
- Batch architecture questions
- Keep Codex as the default execution agent
- Call Astra only for visual invention/review
- Call Claude only for frontend complexity

---

## 7. Design Decision Log

Maintain a file such as:

`docs/DESIGN_SYSTEM.md`

Store all approved Astra decisions there.

Recommended sections:

- Brand mood
- Main palette
- Table materials
- Card style
- Chip style
- Button system
- Typography
- Seat UI
- Timer
- Pot display
- Lobby style
- Tournament branding
- Animations
- Shadows
- Radius
- Spacing
- Responsive rules
- Approved screenshots

Codex should read this file before requesting Astra.

---

## 8. Architecture Decision Log

Maintain a file such as:

`docs/FRONTEND_ARCHITECTURE.md`

Store Claude-approved decisions there.

Recommended sections:

- Component hierarchy
- State management
- Game-state model
- Animation system
- Responsive strategy
- Socket/realtime flow
- Error/reconnect handling
- Table lifecycle
- Tournament/lobby navigation

Codex should read this file before requesting Claude.

---

## 9. Hold'em Development Priority

For this project, development priority is:

1. Game correctness
2. Visual clarity
3. Premium graphic quality
4. Smooth interaction
5. Stability
6. Performance
7. Maintainability

Do not sacrifice game-state correctness for animation or appearance.

Do not accept visually generic output when the feature is a major player-facing screen.

---

## 10. Orca Coordinator Prompt

Use the following as a coordinator rule:

> Use Codex as the default implementation agent.  
> Use Astra only when visual creation, visual direction, image generation, or high-level visual review is required.  
> Use Claude only when complex frontend architecture, state flow, animation flow, or interaction design requires deeper structural reasoning.  
> Do not call premium agents for routine implementation.  
> Before escalating, check existing project design and architecture documentation.  
> If a decision already exists, instruct Codex to implement it directly.  
> For UI-heavy features, Astra defines the visual target, Claude defines complex interaction architecture only when necessary, and Codex performs implementation, testing, debugging, and iteration.

---

## 11. Recommended Workflow for a New Major UI Feature

### Stage 1 — Visual target
Astra

Only if the feature needs a new look.

Deliver:
- visual direction
- mockup/asset guidance
- reusable styling rules

### Stage 2 — Interaction architecture
Claude

Only if interaction/state behavior is complex.

Deliver:
- state diagram
- component plan
- animation sequence
- responsive logic

### Stage 3 — Implementation
Codex

Deliver:
- working code
- tests
- responsive behavior
- implemented visuals

### Stage 4 — Verification
Codex first.

If visually weak:
Astra reviews only the visual gaps.

If structurally weak:
Claude reviews only the architecture gaps.

---

## 12. Golden Rule

**Astra creates the look.  
Claude structures complex behavior.  
Codex does the work.**

The system should escalate only when the next level of specialist judgment is actually needed.

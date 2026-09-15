# Orca Hold'em Development Skill Pack

This pack contains two files:

- `SKILL.md` — reusable multi-agent development skill
- `ORCA_DEV_WORKFLOW.md` — project-level operating rules for Orca

Suggested use:

1. Add `SKILL.md` to the skill location used by your Orca environment.
2. Add `ORCA_DEV_WORKFLOW.md` to the root of the Hold'em project or the project documentation folder.
3. Tell the Orca coordinator to read both files before dispatching agents.
4. Keep Astra-generated design decisions in `docs/DESIGN_SYSTEM.md`.
5. Keep Claude architecture decisions in `docs/FRONTEND_ARCHITECTURE.md`.

Main agent policy:

- Astra = visual creation / visual review
- Claude = complex frontend architecture / interaction
- Codex = implementation / testing / debugging / iteration

---
name: kaplay-core
description: KAPLAY gameplay engineering guidance for scenes, sprites, events, optimization, and runtime architecture.
argument-hint: [task]
allowed-tools: Read, Glob, Grep
user-invocable: true
---

# KAPLAY Core

Use this skill whenever working in `src/game/**` or touching KAPLAY entities, scenes, or rendering behavior.

## Workflow

1. Read `references/` files relevant to the requested change.
2. Apply project conventions from `recipes/`.
3. Keep implementation aligned with current code architecture (`assets.ts`, `entities/`, `scenes/`).

## Required references

- `references/scenes.mdc`
- `references/sprites.mdc`
- `references/events.mdc`
- `references/optimization.mdc`

## Rules

- Scene entry points must use `scene()` and transitions must use `go()`.
- Sprite sheets must define deterministic `sliceX/sliceY/anims`.
- Prefer object-local handlers (`obj.onUpdate`, local timers) when behavior belongs to an object lifecycle.
- Avoid unnecessary object churn in high-frequency systems.

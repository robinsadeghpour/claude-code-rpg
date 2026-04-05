---
name: asset-baseline-gate
description: Define and enforce a reusable baseline quality standard for visual assets via manifest-driven validation and status reports.
argument-hint: [manifest-path] [profile-path]
allowed-tools: Read, Glob, Bash(python3:*)
disable-model-invocation: false
user-invocable: true
---

# Asset Baseline Gate

Use this skill to make asset quality explicit and repeatable across projects.

## Workflow

1. Generate or prepare a baseline manifest (required assets + file paths).
2. Configure project quality profile thresholds.
3. Run baseline evaluation script.
4. Review markdown/json status output.
5. Treat report errors as release blockers for visual assets.

## Rules

- Every runtime asset key must map to an existing file.
- Every file must pass technical constraints (size, alpha, occupancy).
- Tile assets should pass seam checks.
- Baseline is complete only when report has zero errors.

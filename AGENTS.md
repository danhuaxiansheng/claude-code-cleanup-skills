# Repository Instructions

This repository contains portable agent skills for code cleanup.

- Keep each skill in `skills/<skill-name>/SKILL.md`.
- Keep frontmatter valid YAML with `name` and `description`.
- Prefer concise, evidence-driven cleanup workflows over broad redesign.
- Preserve real runtime, domain, loading, empty, error, permission, and external-input constraints.
- Update `.claude-plugin/marketplace.json` when adding, removing, or renaming skills.
- Validate changed skills with `quick_validate.py` before publishing.

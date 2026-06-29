# AGENTS.md

## Cursor Cloud specific instructions

- This repository is currently a **placeholder**: the only tracked file is `README.md` (containing `# Music`). There is no application code, dependency manifest, lockfile, Dockerfile/devcontainer, or services yet.
- Because there is no manifest, environment setup is intentionally a **no-op**. The startup update script is guarded and will only install dependencies once a manifest appears:
  - Node: detects `package-lock.json` (npm), `pnpm-lock.yaml` (pnpm), `yarn.lock` (yarn), or a bare `package.json` (npm).
  - Python: detects `requirements.txt` (pip) or `pyproject.toml` (pip editable install).
- Toolchain available on the VM: Node `v22`, npm, pnpm, yarn (classic), Python `3.12`, pip. There is no `uv`.
- Once real project scaffolding is added, update this section with the actual services, plus how to lint/test/build/run them (or point to README/`package.json` scripts/Makefile instead of duplicating).

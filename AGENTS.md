# CLK0 / TGS Saudi Website

A static client-side single-page marketing site for TGS Saudi, built with Vite + React 19 + TypeScript and React Router. Supports EN/AR with RTL. There is no backend, database, or API — the contact form uses a `mailto:` link and images load from the Unsplash CDN.

## Cursor Cloud specific instructions

- The application code lives on feature branches (e.g. `cursor/tgs-saudi`), not on `main`. The `main` branch may only contain a placeholder `README.md`. Run and develop the app from a branch that contains `package.json`/`src`.
- Standard commands are defined in `package.json` scripts (`dev`, `build`, `preview`). Setup and run steps are documented in `README.md` — refer to those rather than duplicating them.
- The Vite dev server runs on port `5173` with `host: true`, and the app is served under the base path `/CLK0/` (see `vite.config.ts`). Open `http://localhost:5173/CLK0/` — the bare root `/` returns 404 because of the base path.
- `npm run build` runs `tsc -b && vite build`, so it doubles as the TypeScript type-check. There is no separate lint or test script and no test framework configured.
- The committed `docs/` directory is a prebuilt GitHub Pages build artifact, not source. Regenerate it via the "Rebuild docs" steps in `README.md`; do not hand-edit it.

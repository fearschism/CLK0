# TGS Saudi Website

Saudi member-firm site aligned with [TGS Global](https://tgs-global.com/) branding.

## Stack

- Vite + React + TypeScript
- React Router
- EN / AR + RTL

## Pages

- Home · Services · **Clients** · About · Contact

## Run locally

```bash
npm install
npm run dev
```

## GitHub Pages (fix the main.tsx 404)

The live site must serve the **built** files, not the Vite source.

**Recommended (this branch):**

1. Open **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **`cursor/tgs-saudi`**
4. Folder: **`/docs`** ← not `/` (root)
5. Save

URL: **https://fearschism.github.io/CLK0/**

Why: root `index.html` points at `/src/main.tsx` (dev only).  
`docs/index.html` points at `/CLK0/assets/...` (production).

**Alternative:** Branch **`gh-pages`** / folder **`/`** (also has the production build).

### Rebuild docs after changes

```bash
npm run build
rm -rf docs && mkdir docs && cp -r dist/* docs/ && cp dist/index.html docs/404.html
git add docs && git commit -m "Update Pages build" && git push
```

## Design

- TGS Global orange `#F58025`, dark nav/footer
- Poppins + Noto Sans
- Saudi specialisations + Clients portfolio tab

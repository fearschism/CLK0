# TGS Saudi Website

Modern bilingual (EN/AR) marketing site for **TGS Saudi** — a Riyadh-based professional services firm in the TGS global network.

## Stack

- Vite + React + TypeScript
- React Router
- Custom CSS design system (no UI kit)

## Pages

- **Home** — brand hero, featured services, about, stats, CTA
- **Services** — full service catalogue with details
- **About** — firm story, vision, values
- **Contact** — office details + inquiry form (mailto)

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## GitHub Pages

Live URL after deploy:

**https://fearschism.github.io/CLK0/**

Pushing to `main` (or this feature branch) runs `.github/workflows/deploy-pages.yml` and publishes the `dist` build.

## Design notes

- Forest green + sand palette (professional KSA feel)
- Display type: Cormorant Garamond · Body: Manrope
- Language toggle switches EN/AR and RTL layout

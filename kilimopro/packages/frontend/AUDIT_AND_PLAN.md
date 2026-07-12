# KilimoPRO — Deep Audit & Phased Improvement Plan

**Date**: July 12, 2026

## Critical Finding: Two Disconnected Apps

The repo contains **TWO parallel applications** that are not connected:

| App | Location | Stack | Has | Missing |
|-----|----------|-------|-----|---------|
| **v1** (Vite) | `client/` | Vite + React + wouter + shadcn/ui | 8 rich UI pages, i18n, theme, tRPC backend | Real data (uses mock/hardcoded data everywhere) |
| **v2** (Next.js) | `kilimopro/packages/frontend/` | Next.js 14 + Pages Router | 9 real API endpoints (FAOSTAT, ICPAC, Open-Meteo, World Bank) | Only 1 page (climate dashboard) |

**Solution**: Port v1's rich pages into v2's Next.js app, replacing mock data with real API calls. Result: one Vercel-deployable app with real data + great UI.

## Phases

### Phase 1: Foundation (Next.js App Shell)
- Shared layout with navbar + footer
- Language context (Swahili + English)
- Theme context (light/dark)
- Route: `/` (Hero landing page)

### Phase 2: Core Pages with Real Data
- `/weather` — 7-day forecast from Open-Meteo (real, free)
- `/alerts` — ICPAC hazard alerts (real)
- `/market` — FAOSTAT market prices (real, with charts)
- `/climate` — Climate map + agriculture watch

### Phase 3: Interactive Features
- `/chat` — Ask KilimoPRO (connect to LLM)
- `/disease` — Crop disease detection (image upload + TFLite)
- `/education` — Educational content hub
- `/profile` — Farmer profile + farm management

### Phase 4: Polish
- Loading skeletons, error boundaries
- Responsive mobile-first design
- PWA (installable + offline)
- Accessibility (WCAG AA)

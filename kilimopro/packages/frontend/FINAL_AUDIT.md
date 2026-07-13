# KilimoPRO — Complete Audit & Improvement Plan (Final)

## Current State Summary
- **12 pages** (all live on Vercel)
- **10 API endpoints** (all working)
- **6,863 lines** of code
- **4 data sources** (all free)
- **8 IGAD countries** supported

## ALL Issues Found (Ranked by Impact)

### TIER 1 — CRITICAL (Breaks Demo / Loses Hackathon)

| # | Issue | Fix |
|---|-------|-----|
| 1 | **Chat doesn't persist** — refreshing loses all messages | Save to localStorage |
| 2 | **No Error Boundary** — one crash kills the whole app | Wrap _app in ErrorBoundary |
| 3 | **No SEO meta tags** — no Open Graph, no Twitter cards | Add Head meta to _app + each page |
| 4 | **No skeleton loaders** — pages flash blank then pop | Add skeleton states |
| 5 | **i18n barely used** — Swahili translations exist but pages use hardcoded English | Use t() in all page titles |
| 6 | **Climate Map component never used** — built but dead code | Wire into alerts page |
| 7 | **No production data page** — API exists but no page | Build /production page |
| 8 | **No page transitions** — pages pop in abruptly | Add AnimatePresence in _app |

### TIER 2 — IMPORTANT (Hurts Quality)

| # | Issue | Fix |
|---|-------|-----|
| 9 | No PWA/offline support | Add manifest + service worker |
| 10 | Market page doesn't show price trends over time | Add line chart with historical data |
| 11 | Weather page too heavy (102KB) | Lazy-load Recharts |
| 12 | No search across all data | Add global search |
| 13 | No share/export on disease results | Add share buttons |
| 14 | No notification badge on alerts in navbar | Show alert count |
| 15 | No dark mode | Add theme toggle |
| 16 | No loading progress bar | Add top progress bar |
| 17 | Chat suggestions are static | Make context-aware based on current page |

### TIER 3 — POLISH (Nice to Have)

| # | Issue | Fix |
|---|-------|-----|
| 18 | No favicon | Create SVG favicon |
| 19 | No app icons for PWA | Generate icons |
| 20 | No keyboard shortcuts | Add cmd+k search |
| 21 | No analytics | Add Vercel Analytics |
| 22 | No sitemap | Add sitemap.xml |
| 23 | No robots.txt | Add robots.txt |

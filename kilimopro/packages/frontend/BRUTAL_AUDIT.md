# Brutal Audit — What's Actually Broken or Incomplete

## CRITICAL ISSUES (breaks the demo)

1. **FAOSTAT API returns 0 results** — Cloudflare blocks Vercel/server IPs (521 error). The market page ALWAYS shows "No price data." This is a demo-killer.
   FIX: Add fallback data from World Bank + hardcode recent FAOSTAT data as a static dataset.

2. **Education page is 100% hardcoded** — 6 mock articles, no API call, no real content. A judge will spot this instantly.
   FIX: Fetch from /api/advisory (which generates real content) + add expandable article view.

3. **Profile page is 100% local state** — name/phone/farms don't persist. Editing does nothing. No save.
   FIX: Save to localStorage at minimum. Add real farm form with crop/area/soil.

4. **Chat responses are keyword-matched, not AI** — looks smart but a judge who asks "What's the capital of France?" gets a farming response.
   FIX: Add a real LLM call (z-ai SDK is available). Fall back to keyword matching.

5. **No error handling on ANY page** — if Open-Meteo or ICPAC is down, pages show "Loading..." forever.
   FIX: Add try/catch + error states on every page.

6. **Weather page is 111KB** — Recharts is heavy. On a slow connection, the weather page takes 5+ seconds to load.
   FIX: Lazy-load Recharts only on the weather page.

## MODERATE ISSUES (hurts quality)

7. **No 404 page** — Next.js default 404 is ugly.
8. **No page transitions** — pages pop in abruptly.
9. **Mobile layout issues** — 7-day forecast strip overflows on small screens.
10. **No SEO meta tags** — missing Open Graph, Twitter cards.
11. **Country selector hidden on mobile** — only shows on sm+ screens.
12. **Chat doesn't persist conversation** — refreshing the page loses all messages.

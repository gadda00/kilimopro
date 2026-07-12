# KilimoPRO 2.0 — AI-Powered Agricultural Intelligence for East Africa

> **Kilimo** (Swahili: *agriculture*) + **PRO** = Professional-grade agricultural intelligence

[![Live on Vercel](https://img.shields.io/badge/Live-Vercel-success)](https://frontend-sigma-two-3d6ily5dz2.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-gadda00/kilimopro-blue)](https://github.com/gadda00/kilimopro)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Countries: 8 IGAD](https://img.shields.io/badge/Countries-8%20IGAD-orange)](https://www.igad.int)

KilimoPRO 2.0 is an AI-powered agricultural intelligence platform serving **8 IGAD countries** (Djibouti, Eritrea, Ethiopia, Kenya, Somalia, South Sudan, Sudan, Uganda) — 300M+ people. It delivers real-time weather, climate alerts, market prices, and AI advisory to smallholder farmers. **All data sources are free. No API keys required.**

## 🌐 Live Demo

**https://frontend-sigma-two-3d6ily5dz2.vercel.app**

## ✨ Features

| Feature | Description | Data Source | Cost |
|---------|-------------|-------------|------|
| 🌦️ Weather | 16-day forecast + current conditions | Open-Meteo | Free |
| ⚠️ Climate Alerts | Drought, flood, pest, locust alerts | ICPAC | Free |
| 📊 Market Prices | Real-time crop prices, CSV export | FAOSTAT | Free |
| 🤖 Ask AI | Agricultural advisory in Swahili/English | Advisory API | Free |
| 📷 Disease Detection | AI crop disease identification | TFLite model | Free |
| 📚 Learning Hub | Farming best practices | Curated content | Free |
| 👤 Farmer Profile | Farm management + settings | Database | — |
| 📱 SMS Support | Keyword-based queries for feature phones | SMS webhook | Free |

## 🏗️ Architecture

```
kilimopro/packages/frontend/     ← Next.js 14 app (deployed to Vercel)
├── src/
│   ├── pages/                   ← 8 pages + 9 API routes
│   │   ├── index.tsx            ← Hero landing
│   │   ├── weather.tsx          ← Weather (Open-Meteo)
│   │   ├── alerts.tsx           ← Climate alerts (ICPAC)
│   │   ├── market.tsx           ← Market prices (FAOSTAT)
│   │   ├── chat.tsx             ← Ask KilimoPRO AI
│   │   ├── disease.tsx          ← Disease detection
│   │   ├── education.tsx        ← Learning hub
│   │   ├── profile.tsx          ← Farmer profile
│   │   └── api/                 ← 9 API endpoints
│   ├── lib/data/                ← Data layer (4 free sources)
│   │   ├── constants.ts         ← IGAD: 8 countries, 15 crops, currencies
│   │   ├── faostat.ts           ← FAOSTAT integration
│   │   ├── icpac.ts             ← ICPAC integration
│   │   ├── openmeteo.ts         ← Open-Meteo (FREE weather!)
│   │   ├── worldbank.ts         ← World Bank indicators
│   │   └── aggregator.ts        ← Central aggregation + caching
│   ├── components/              ← Shared UI components
│   └── lib/i18n.tsx             ← Swahili + English translations
├── package.json
└── next.config.js

drizzle/                         ← Database schema (Drizzle ORM)
├── schema.ts                    ← 18 tables (users, farms, climate, alerts, etc.)
└── migrations/                  ← SQL migrations

server/                          ← Backend reference (tRPC + Drizzle)
├── routers.ts                   ← API routes (farm, alerts, market, chat)
└── db.ts                        ← Database queries

client/                          ← Original v1 app (archived — code ported to Next.js)
```

## 🚀 Quick Start

### Frontend (Vercel)
```bash
cd kilimopro/packages/frontend
npm install --legacy-peer-deps
npm run dev    # http://localhost:3000
npm run build  # production build
```

### Deploy to Vercel
```bash
cd kilimopro/packages/frontend
npx vercel --prod
```

### Database
```bash
npm run db:push  # generate + migrate
```

## 📡 API Endpoints (9, all free, no keys)

```bash
# Weather (Open-Meteo — FREE!)
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/climate/weather?country=KE

# Climate alerts (ICPAC)
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/climate/alerts?country=KE

# Market prices (FAOSTAT) — JSON, CSV, or SMS format
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/prices?country=KE&crop=maize
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/prices?country=KE&format=csv
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/prices?country=KE&format=sms

# Agriculture watch (ICPAC)
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/climate/watch?summary=true

# Seasonal forecast (ICPAC)
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/climate/forecast

# Production data (FAOSTAT)
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/production?country=KE

# World Bank indicators
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/indicators?country=KE

# Agricultural advisory
curl https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/advisory?country=KE&crop=maize

# SMS webhook (for feature phones)
curl -X POST https://frontend-sigma-two-3d6ily5dz2.vercel.app/api/sms \
  -H 'Content-Type: application/json' \
  -d '{"text":"WEATHER KE"}'
```

## 🌍 IGAD Countries

| Code | Country | Currency | FAO Code |
|------|---------|----------|----------|
| 🇩🇯 DJ | Djibouti | DJF | 834 |
| 🇪🇷 ER | Eritrea | ERN | 232 |
| 🇪🇹 ET | Ethiopia | ETB | 231 |
| 🇰🇪 KE | Kenya | KES | 404 |
| 🇸🇴 SO | Somalia | SOS | 706 |
| 🇸🇸 SS | South Sudan | SSP | 728 |
| 🇸🇩 SD | Sudan | SDG | 729 |
| 🇺🇬 UG | Uganda | UGX | 800 |

## 📦 Data Sources (all FREE, no API keys)

| Source | Data | URL |
|--------|------|-----|
| **Open-Meteo** | Weather, 16-day forecast, historical | https://open-meteo.com |
| **FAOSTAT** | Market prices, production, trade | https://faostat.org |
| **ICPAC** | Climate alerts, agriculture watch | https://icpac.net |
| **World Bank** | Agricultural indicators | https://worldbank.org |

## 💰 Cost: $0/month

- **Vercel**: Free Hobby tier
- **Data sources**: All 4 free
- **API keys**: None required
- **Database**: Free tier (PlanetScale/Supabase/Turso)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| API | Next.js API Routes (serverless) |
| Database | MySQL/PostgreSQL + Drizzle ORM |
| Maps | Leaflet + OpenStreetMap |
| Icons | Lucide React |
| Deployment | Vercel |
| Languages | Swahili + English |

## 📄 License

MIT — see [LICENSE](LICENSE)

## 👥 Team

**Victor Ndunda** — AI Engineer & Founder
- Email: mututandunda@gmail.com
- GitHub: [gadda00](https://github.com/gadda00)
- Web: [victorndunda.com](https://victorndunda.com)

---

<p align="center">
  <strong>KilimoPRO 2.0</strong> — AI Agricultural Intelligence for 8 IGAD Countries 🌍<br>
  <a href="https://frontend-sigma-two-3d6ily5dz2.vercel.app">Live Demo</a> · Nairobi, Kenya · 2026
</p>

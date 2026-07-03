# 🌱 KilimoPRO — AI-Powered Agricultural Intelligence Platform

> **Kilimo** (Swahili: *agriculture*) + **PRO** = Professional-grade agricultural intelligence

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20%7C%20API-blue)](https://kilimo.pro)
[![Made in Kenya](https://img.shields.io/badge/Made%20in-Kenya%20🇰🇪-success)](https://github.com/gadda00/kilimopro)

KilimoPRO is an AI-powered agricultural intelligence platform built for Kenyan and African farmers. It delivers personalized crop advisory, hyperlocal weather forecasting, on-device crop disease detection, market price intelligence, and financial services access through a mobile-first application (Android) and web platform (kilimo.pro).

## 🎯 The Problem

- Kenya's maize yields: **1.4-1.8 t/ha** (global average: 5.8 t/ha)
- Post-harvest losses: **30-40%** of food produced
- Extension worker to farmer ratio: **1:785** (FAO recommends 1:400)
- Less than **5%** of arable land is irrigated
- Agriculture contributes **22% of GDP** but operates far below potential

## 💡 The Solution

KilimoPRO bridges the gap between national-scale agricultural policy (NASIP 2026-2030) and farmer-level action by delivering data-driven intelligence directly to farmers' phones.

### Core Modules

| Module | What It Does | Data Sources |
|--------|-------------|--------------|
| 🌦️ Weather Intelligence | Hyperlocal 7-day forecasts with actionable farming recommendations | KAOP, CHIRPS, OpenWeatherMap |
| 🌿 Crop Disease Detection | On-device AI identifies 26+ crop diseases from a photo | PlantVillage dataset, TFLite MobileNetV3 |
| 📊 Market Intelligence | Real-time prices from 100+ markets, price forecasting | AIRC bulletins, FAOSTAT, crowdsourced |
| 🌱 Soil Health | Soil type, fertility score, amendment recommendations | KALRO soil survey, farmer-reported tests |
| 💧 Irrigation Scheduler | Optimal irrigation scheduling based on crop water needs | Weather data, Penman-Monteith ET model |
| 💳 Financial Services | Digital credit scoring + loan/insurance matching | Farm performance data, OLS regression |
| 🦟 Pest Early Warning | Community-driven pest outbreak detection | Farmer reports, anomaly detection ensemble |
| 🤖 Advisory Engine | Personalized crop management recommendations | KALRO crop calendars, ML models |
| 🌍 Climate Risk | Long-term climate risk assessment + adaptation options | Satellite NDVI, ARDC, climate models |
| 💬 Ask KilimoPRO | Natural language Q&A in Swahili & English | LLM + agricultural knowledge base |

## 🏗️ Architecture

```
kilimopro/
├── packages/
│   ├── backend/          # Node.js + TypeScript microservices API
│   │   ├── src/
│   │   │   ├── services/     # 8 microservices (weather, market, soil, etc.)
│   │   │   ├── connectors/   # Data source connectors (KilimoSTAT, FAOSTAT, etc.)
│   │   │   ├── middleware/   # Auth, rate limiting, error handling
│   │   │   ├── models/       # Database models (Prisma)
│   │   │   ├── routes/       # API route handlers
│   │   │   └── utils/        # Shared utilities
│   │   └── prisma/           # Database schema
│   ├── frontend/         # kilimo.pro web platform (Next.js 15)
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/        # Next.js pages
│   │   │   └── lib/          # API client, utilities
│   │   └── public/           # Static assets
│   ├── mobile/           # KilimoPRO Android app (Flutter)
│   │   ├── lib/
│   │   │   ├── screens/      # App screens
│   │   │   ├── widgets/      # Reusable widgets
│   │   │   ├── models/       # Data models
│   │   │   └── services/     # API, cache, notification services
│   │   └── assets/           # TFLite models, images, fonts
│   ├── ml/               # Machine learning models
│   │   ├── models/           # Trained model definitions
│   │   ├── training/         # Training scripts
│   │   ├── inference/        # Inference pipelines
│   │   └── datasets/         # Dataset preparation
│   └── data-pipeline/    # Data ingestion & ETL
│       ├── connectors/       # Source-specific connectors
│       ├── processors/       # Data transformation
│       └── validators/       # Data quality checks
├── infra/
│   ├── docker/           # Dockerfiles for each service
│   └── k8s/              # Kubernetes manifests
├── docs/                 # Documentation
└── scripts/              # Build & deployment scripts
```

## 🔌 Data Sources (19 verified & operational)

### Kenyan Government
| Source | Data | URL |
|--------|------|-----|
| KilimoSTAT | Production stats, crops, livestock | statistics.kilimo.go.ke |
| KALRO Platform | Soil, land, crop, weather | keep.kalro.org |
| KAOP | Ward-level weather forecasts | via KALRO partnership |
| KADP | Agricultural research data | via KALRO |
| ASDG Portal | Cross-agency agriculture data | agdata.go.ke |
| AIRC | Market prices, info bulletins | airc.kilimo.go.ke |
| KMD | Weather, climate data | meteo.go.ke |
| KNBS | Economic surveys, census | knbs.or.ke |

### International
| Source | Data | Access |
|--------|------|--------|
| FAOSTAT API | Global ag stats, trade, production | REST API (SDMX) |
| Google Earth Engine | Satellite imagery, NDVI | JS/Python API |
| Sentinel-2 (Copernicus) | 10m optical imagery | Free access |
| Landsat (NASA) | 30m satellite imagery | Free access |
| ARDC / Digital Earth Africa | Analysis-ready satellite data for Kenya | Open Data Cube |
| CHIRPS | Daily rainfall, 5km resolution | FTP/API |
| OpenWeatherMap | Current weather, forecasts | REST API |
| World Bank Data API | GDP, population, indicators | REST API |

### Communications
| Source | Service | Coverage |
|--------|---------|----------|
| Africa's Talking | SMS, USSD, Voice API | All 54 African countries |
| PlantVillage Dataset | 54K+ crop disease images | Open dataset (Penn State) |

## 🛠️ Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Mobile App** | Flutter + Dart | Cross-platform, offline-first, TFLite support |
| **Web Platform** | Next.js 15 + React 19 + Tailwind CSS | SSR, PWA, type-safe |
| **Backend API** | Node.js + TypeScript + Fastify | Type safety, performance, shared types |
| **ML Pipeline** | Python + TensorFlow + ONNX | Best ML ecosystem, model portability |
| **Database** | PostgreSQL (Supabase) | Relational, managed, row-level security |
| **Cache/Queue** | Redis | Fast caching, pub/sub, task queues |
| **SMS/USSD** | Africa's Talking API | Pan-African coverage, developer-friendly |
| **Satellite** | Google Earth Engine | Free tier, Sentinel-2/Landsat access |
| **Containers** | Docker | Reproducible builds, isolation |
| **Orchestration** | Kubernetes | Auto-scaling, self-healing |
| **CDN/DNS** | Cloudflare | Global CDN, DDoS protection, free SSL |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Flutter 3.16+
- Docker & Docker Compose
- PostgreSQL 15+

### Backend
```bash
cd packages/backend
npm install
cp .env.example .env  # Configure your environment variables
npx prisma generate
npx prisma db push
npm run dev  # Starts on http://localhost:3001
```

### Frontend (kilimo.pro)
```bash
cd packages/frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

### Mobile (Android)
```bash
cd packages/mobile
flutter pub get
flutter run  # Connect your Android device or emulator
```

### ML Models
```bash
cd packages/ml
pip install -r requirements.txt
python training/train_disease_model.py  # Train crop disease model
python inference/export_tflite.py       # Export to TensorFlow Lite
```

### Data Pipeline
```bash
cd packages/data-pipeline
pip install -r requirements.txt
python connectors/sync_all.py  # Sync all data sources
```

### Docker (Full Stack)
```bash
docker-compose up -d  # Starts all services
```

## 📱 Key Features

### For Farmers (Free)
- Personalized crop calendar based on location & soil
- Weather alerts with actionable recommendations
- AI crop disease detection (works offline!)
- Real-time market prices from 100+ markets
- Soil health assessment
- Irrigation scheduling
- Credit score & loan matching
- Natural language Q&A in Swahili & English
- Daily farm report via push notification

### For Cooperatives (KES 5,000/mo)
- All farmer features
- Aggregate analytics across members
- Production planning tools
- Bulk market intelligence

### For Agribusinesses (KES 25,000/mo)
- Farmer insights & demand forecasting
- Supply chain traceability
- Custom analytics dashboards

### For Government & NGOs (Custom)
- Sector-wide analytics
- Impact monitoring
- Policy intelligence dashboards

## 🌍 NASIP 2026-2030 Alignment

KilimoPRO directly supports 7 of 9 NASIP flagship programs:

| Flagship | Budget | KilimoPRO Contribution |
|----------|--------|----------------------|
| F1: Production & Productivity | KES 90B | Personalized crop advisory, soil analysis |
| F2: Targeted Input E-Voucher | KES 51B | Digital farmer identity, e-voucher delivery |
| F3: Irrigation & Mechanization | KES 175B | Irrigation scheduling intelligence |
| F5: Food Safety & Waste Reduction | KES 55B | Harvest timing optimization |
| F6: Climate Resilience | KES 85B | Climate risk assessment, early warning |
| F7: Data & Digital Infrastructure | KES 45B | Farmer-facing interface for National Data Hub |
| F8: Blended Finance | KES 300B | Farmer Financial Passport credit scoring |

## 📊 Projected Impact (Year 3)

| Metric | Target |
|--------|--------|
| Registered farmers | 2,000,000 |
| Average yield increase | 15-20% |
| Average income increase | KES 30,000/year |
| Additional agricultural output | KES 60B/year |
| Post-harvest loss reduction | 25% |
| Farmers with crop insurance | 300,000 |

## 📄 Documentation

- [White Paper (Implementation Guide)](docs/white-paper.pdf)
- [API Documentation](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Data Sources Inventory](docs/DATA_SOURCES.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🤝 Partnerships

KilimoPRO is designed to partner with:
- **Ministry of Agriculture (MoALD)** — National Agriculture Data Hub integration
- **KALRO** — Crop calendars, soil data, weather (KAOP)
- **County Governments** — Extension service integration
- **Africa's Talking** — SMS/USSD gateway
- **Financial Institutions** — Credit scoring & loan matching
- **Google Earth Engine** — Satellite imagery

## 📝 License

MIT License — see [LICENSE](LICENSE)

## 👥 Team

**Victor Ndunda** — AI Engineer & Founder
- Email: mututandunda@gmail.com
- Phone/WhatsApp: +254 724 346 971
- Web: [victorndunda.com](https://victorndunda.com) | [busaraai.com](https://busaraai.com)
- GitHub: [github.com/gadda00](https://github.com/gadda00)

## 🙏 Acknowledgments

- NASIP 2026-2030 (Ministry of Agriculture, Kenya)
- KALRO (Kenya Agricultural and Livestock Research Organization)
- FAO (Food and Agriculture Organization)
- PlantVillage (Penn State University)
- Africa's Talking
- Google Earth Engine
- Digital Earth Africa

---

<p align="center">
  <strong>KilimoPRO</strong> — AI-Powered Agricultural Intelligence for Kenya & Africa<br>
  <a href="https://kilimo.pro">kilimo.pro</a> · Nairobi, Kenya · 2026
</p>

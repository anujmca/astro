# AstroVerse - Premium Single-Tenant SaaS Astrology Platform

AstroVerse is a production-grade, premium Single-Tenant SaaS Astrology Platform designed for individuals seeking Vedic insights and professional astrologers managing client consultations. 

---

## 🌟 Key Features

- **Centralized Family Astro Vault**: Store birth profiles for unlimited family members, including interactive SVG birth charts, matching histories, and timelines.
- **Vedic Chart Calculations**: Local calculations for Lagna (Birth) Chart, Navamsa (D9) Chart, Nakshatra, Rashi, Ascendant, planetary coordinates, Vimshottari Dashas, Yogas, and Doshas.
- **Matchmaking Engine (Guna Milan)**: 36-point compatibility engine checking Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, and Nadi.
- **AI Astrology Assistant**: Speech-enabled, context-aware chatbot capable of referencing family members' profiles for personalized recommendations.
- **Muhurat Planner & Baby Name Generator**: Calculates auspicious event timings and filters Vedic names based on Nakshatra Charan.
- **Consultation Marketplace**: Direct bookings with professional astrologers with slot-picking calendars.
- **Dynamic Localization**: Core system supporting 20 languages including RTL layouts (Arabic, Urdu) and translation matrices.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS.
- **Backend API**: .NET 9 Web API (C#).
- **Database**: PostgreSQL.
- **Caching**: Redis.

---

## 📁 Repository Structure

```text
/
├── docs/                             # Architecture, Database, API, and QA specifications
├── src/
│   ├── AstroVerse.Core/              # Entities, Astrology Engine, and business interfaces
│   ├── AstroVerse.Infrastructure/    # DBContext, Redis Cache, Storage, and Integrations
│   └── AstroVerse.Api/               # ASP.NET Web API controllers and Program setup
├── frontend/                         # Next.js client application
├── docker/                           # Containers, Docker Compose, and CI/CD pipelines
└── README.md                         # Project launch instructions (this file)
```

---

## 🚀 Quick Start (Local Run)

### Prerequisites
- .NET 9.0 SDK
- Node.js (v18+) & NPM

### Step 1: Run the Backend
1. Go to the API directory:
   ```bash
   cd src/AstroVerse.Api
   ```
2. Run the application (this automatically creates a SQLite/local DB fallback if PostgreSQL is not active):
   ```bash
   dotnet run
   ```
3. Open `http://localhost:5080/swagger` to inspect the OpenAPI docs.

### Step 2: Run the Frontend
1. Go to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access `http://localhost:3000` in your web browser.

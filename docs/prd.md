# AstroVerse - Product Requirements Document (PRD)

## 1. Document Overview
This document specifies the complete product requirements for **AstroVerse**, a premium production-grade Single-Tenant SaaS Astrology Platform. AstroVerse provides individual users with comprehensive Vedic astrology insights and professional astrologers with client management tools, supported by a scalable, multi-lingual, and AI-enabled infrastructure.

---

## 2. Target Users & Roles
AstroVerse serves two primary user categories, divided into five system roles:

| Role | Target Group | Key System Capabilities |
| :--- | :--- | :--- |
| **User** | Individuals | Generate personal reports (Kundli, Matchmaking, Muhurats), search astrologers, purchase subscriptions, chat with the AI assistant. |
| **Astrologer** | Professionals | Manage client logs, set consultation fees, customize slots, conduct video/audio/chat consultations. |
| **Premium Astrologer** | Highlighted Professionals | Priority listing in the marketplace, custom branding on generated PDF reports, advanced client analytics. |
| **Admin** | Operations | Manage translations, approve astrologer profiles, manage marketplace disputes, view feature metrics. |
| **Super Admin** | Platform Owner | Global configurations, database backups, system integration settings, revenue auditing. |

---

## 3. Functional Modules

### Module 1: User Management & Authentication
- **Multi-method Authentication**: Email/password, OTP login (SMS/Email), and OAuth2 Social Sign-In (Google, Apple, Facebook).
- **Security Protocols**: Multi-Factor Authentication (MFA) via TOTP, session validation, password complexity rules.
- **Profile Management**: Custom user profile, avatar upload, and individual dashboard.

### Module 2: Kundli Generation
- **Inputs**: Full Name, Gender, Date of Birth, Time of Birth, Place of Birth (resolving to exact Latitude, Longitude, and Time Zone).
- **Core Charts**: 
  - Lagna (Birth) Chart, Navamsa (D9) Chart.
  - Multi-style layouts: North Indian (Diamond), South Indian (Grid), East Indian (Square).
- **Astrological Calcs**: Nakshatra, Rashi, Ascendant, planetary coordinates, Dasha periods (Vimshottari Mahadasha/Antardasha), Yogas, and Doshas (Manglik, Kaal Sarp, Sade Sati).
- **Outputs**: High-fidelity interactive SVG rendering on web, downloadable PDF report, shareable link.

### Module 3: Horoscope Predictions
- **Timeframes**: Daily, Weekly, Monthly, Yearly predictions.
- **Categories**: Career, Finance, Marriage, Health, Education, Business, Relationships, Property, Travel, Investments.
- **Multilingual**: Auto-translated or human-localized versions across 20 languages.

### Module 4: Kundli Matching (Matchmaking)
- **Guna Milan (36 Points)**: System evaluates 8 parameters: Varna (1), Vashya (2), Tara (3), Yoni (4), Maitri (5), Gana (6), Bhakoot (7), Nadi (8).
- **Dosha Analysis**: Manglik comparison and Nadi/Bhakoot dosha cancellations.
- **Recommendations**: Comprehensive written compatibility summary, strengths, weaknesses, and astrological remedies.

### Module 5: Baby Name Generator
- **Inputs**: Date, Time, and Place of Birth, Gender.
- **Vedic Selection**: Recommends syllable/letter suggestions based on Nakshatra Charan.
- **Details**: Name suggestions, cultural origins, linguistic meaning, numerological score (expression number), and popularity score.
- **Categories**: Traditional, Sanskrit, Modern, Hindu, Muslim, Sikh, Christian, Jain, Buddhist, Regional, and International.

### Module 6: Baby Planning Module
- **Inputs**: Target Expected Birth Date Range, Birth Location.
- **Calculations**: Foresees future Nakshatras, planetary configurations, and suggests optimal days/times (Muhurats) for planning a child with associated predictions.

### Module 7: Family Astro Vault (Central Core Feature)
- **Profile Storage**: Store birth profiles of self, spouse, children, parents, siblings, relatives, and friends.
- **Data Association**: Save generated Kundlis, matchmaking tests, Muhurat selections, and PDF reports directly under each profile.
- **Features**: Visual family tree visualization (nodes linking family members), search by tag/relationship, historical timelines, and notes history.

### Module 8: Family Compatibility Engine
- **Cross-Relationship Analysis**: Provides compatibility scoring and relationship dynamics for Husband/Wife, Parent/Child, Siblings, Friends, and Business Partners.

### Module 9: Transit Analysis
- **Current Transit Impact**: Dynamic chart overlay showing transit positions against natal planetary coordinates.
- **Timeline**: Sade Sati tracking, upcoming major transits (Jupiter, Saturn, Rahu/Ketu), and current Dasha impact levels.

### Module 10: Life Events & Muhurat Planner
- **Events**: Marriage, Housewarming, Naming, Property Purchase, Business Launch, Travel, Investments.
- **Output**: Ranked auspicious dates, specific time ranges (Choghadiya/Hora details), and PDF reports saved to the Family Vault.

### Module 11: Astrology Calendar
- **Overview**: Monthly/weekly calendar showing local festivals, planetary transit dates, family birthdays, and customized auspicious hours.
- **Sync**: Direct integration via iCal format with Google Calendar and MS Outlook.

### Module 12: AI Astrology Assistant
- **Vedic Chatbot**: Large Language Model contextually aware of the user, their role, and the selected family member's chart.
- **Voice Support**: Web Speech API for voice inputs and text-to-speech output synthesis.

### Module 13: Consultation Marketplace
- **Astrologer Directory**: Search by language, specialty, hourly rate, and user reviews.
- **Booking Flow**: Slot picker, meeting calendar sync, and simulated secure video/audio/chat chatrooms.

### Module 14: Subscription Management
- **Tiers**: Free, Basic, Premium, Professional.
- **Features**: Recurring billing, free trials, coupon code validation, usage tracking (e.g. limit of 3 family members on Free plan, unlimited on Premium).

---

## 4. Non-Functional Requirements & Security
1. **Performance**: API responses under 200ms (excluding AI text generation), sub-second page rendering, and lazy-loading of astrological SVG charts.
2. **Security**: Encryption of all sensitive user details (Birth parameters) at rest via AES-256 and HTTPS/TLS 1.3 in transit. Fully compliant with OWASP Top 10.
3. **Data Protection**: GDPR compliance allowing profile deletion, data export (JSON format), and cookie consent management.
4. **Reliability**: Single-tenant setup designed with high availability, database replication configuration, and Redis caching layers.

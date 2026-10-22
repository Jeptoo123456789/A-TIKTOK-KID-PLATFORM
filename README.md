# KinVid: Child-Friendly Short-Video Social Platform

KinVid is a secure, responsive, full-stack short-video social platform designed specifically for children, parents, and authorized educators. Inspired by the vertical video engagement of modern social media, KinVid enforces strict child safety principles, server-side parental controls, verifiable consent under Kenya's Data Protection Act (DPA 2019) & COPPA, and mandatory multi-stage moderation before any content can be viewed by children.

---

## 1. Core Architecture & Highlights

- **Age-Appropriate Video Feed**: Full vertical short-video feed playing only administrator-approved content matching the child profile's age suitability rating and permitted categories.
- **Server-Enforced Role-Based Access Control (RBAC)**: Distinct permissions for `parent`, `child`, `creator`, `moderator`, and `admin`. Hiding a button in the frontend is never treated as security.
- **Parental Authority**: Parents create pseudonymous child profiles, set daily screen-time limits, configure bedtime curfews, restrict categories, and approve/reject child-uploaded drafts.
- **Safety-First Moderation Pipeline**: Explicit state machine (`DRAFT` → `UPLOADED` → `PROCESSING` → `PENDING_PARENT_APPROVAL` → `PENDING_MODERATION` → `APPROVED` → `REJECTED` → `BLOCKED` → `REMOVED`). Unapproved videos are cryptographically isolated and never exposed in feeds or search.
- **Privacy by Design**: No child's real name, school, or precise geolocation is collected. No behavioral tracking, retargeting pixels, or dark patterns.
- **Full-Stack Express + React Vite Integration**: Single port 3000 architecture mounting OpenAPI v1 endpoints alongside the Vite development middleware.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 SPA with TypeScript.
- **Build Tool**: Vite 8 with Tailwind CSS.
- **Icons & Motion**: Lucide React, Motion.
- **Responsive Layouts**: Touch-first mobile viewport ($375\text{px}$–$430\text{px}$) seamlessly expanding to desktop ($1440\text{px}$) with thumb-zone ergonomics.

### Backend & API
- **Server**: Express with TypeScript running on Node.js 22.
- **API Standard**: RESTful JSON endpoints versioned under `/api/v1` with RFC 7807 structured error responses.
- **Validation**: Zod schema validation on all inputs.
- **Authentication**: Salted `scrypt` password hashing and HMAC-SHA256 session tokens with expiration.

### Database & Storage
- **Engine**: Persistent ACID-compliant database with Write-Ahead Logging (`.tmp` write + atomic filesystem rename) and migration versioning.
- **Entity Models**: 18 normalized tables covering accounts, child profiles, consent records, categories, videos, processing jobs, reactions, favorites, parental settings, screen time, reports, moderation decisions, and audit logs.
- **Production PostgreSQL Compatibility**: Ready to connect via `DATABASE_URL`.

---

## 3. Preconfigured Seed Accounts

For evaluation and testing, the database is pre-seeded with accounts covering all platform roles:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@kinvid.local` | `AdminPass123!` | System statistics, categories, global audit logs |
| **Safety Moderator**| `moderator@kinvid.local` | `ModPass123!` | Moderation queue, report triage, approval decisions |
| **Verified Parent** | `parent@kinvid.local` | `ParentPass123!` | 2 child profiles (Leo age 8, Maya age 6), screen time settings |
| **Approved Creator**| `creator@kinvid.local` | `CreatorPass123!` | Educational video submission and draft status |

---

## 4. Setup and Startup Commands

### Prerequisites
- Node.js (v20+ or v22+)
- npm or bun

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Key environment variables:
- `PORT`: `3000` (required for AI Studio and production containers)
- `NODE_ENV`: `development` or `production`
- `DATABASE_DRIVER`: `local` (or `postgres` if using `DATABASE_URL`)
- `DATABASE_PATH`: `./data/kinvid.db.json`
- `JWT_SECRET`: Secret key for session tokens

### 3. Start Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000`. In development, Express automatically mounts Vite middleware to serve the React application and API routes under `/api/v1`.

### 4. Run Automated Tests
```bash
npm test
```
Executes the comprehensive Milestone 1 automated test suite covering database persistence, schema migrations, cryptographic hashing, RBAC enforcement, seed accounts, and feed isolation.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 5. API Documentation (V1 Endpoints)

### System & Diagnostics
- `GET /api/v1/health`: System status, uptime, database metrics, and service checks.

### Authentication & Consent
- `POST /api/v1/auth/register`: Register parent/guardian account with verifiable consent record.
- `POST /api/v1/auth/login`: Authenticate and receive session token.
- `GET /api/v1/auth/me`: Retrieve authenticated account details.
- `POST /api/v1/auth/logout`: End session.

### Content Categories
- `GET /api/v1/categories`: List active categories (Science, Math, Nature, Art, Storytime, Music, Safe Comedy).
- `POST /api/v1/categories`: Create new category (Admin only).

### Videos & Social
- `GET /api/v1/videos/feed`: Retrieve approved videos. Supports `childProfileId` to apply age suitability and parental restrictions.
- `GET /api/v1/videos/:id`: Fetch authorized video details.
- `POST /api/v1/videos/:id/react`: Add/toggle like or reaction (respects parental social permissions).
- `POST /api/v1/videos/:id/favorite`: Save video to favorites.

### Child Profiles & Parental Controls
- `GET /api/v1/profiles`: List child profiles for authenticated parent.
- `POST /api/v1/profiles`: Create new child profile with screen-time limits and bedtime curfews.
- `GET /api/v1/profiles/:childId`: Retrieve child profile and settings (enforces ownership).

### Administration & Safety
- `GET /api/v1/admin/stats`: Operational metrics and queue counts (Admin & Moderator).
- `GET /api/v1/admin/audit-logs`: Immutable platform audit trail (Admin only).

---

## 6. Milestone Progress

- [x] **Milestone 1: Foundation (COMPLETED)**
  - Repository inspected and architecture established.
  - Full-stack Express + Vite server integrated on port 3000.
  - Persistent ACID database with schema migrations runner.
  - Seeded accounts, categories, and approved educational demonstration videos.
  - Live `/api/v1/health` diagnostics and safe error handling.
  - 22 automated verification tests passing with 0 errors.
- [ ] **Milestone 2: Authentication and Profiles** (Parent registration, child profile creation, verifiable consent UI).
- [ ] **Milestone 3: Video Feed** (Vertical swipe player, sound controls, captions, like & favorite persistence).
- [ ] **Milestone 4: Video Uploads** (Secure upload, FFmpeg background processing, thumbnail extraction).
- [ ] **Milestone 5: Parental Controls** (Screen-time enforcement, category blocking, bedtime locks).
- [ ] **Milestone 6: Moderation and Reporting** (Moderator queue, report resolution, escalation).
- [ ] **Milestone 7: Search and Discovery** (Safe keyword search, category browsing, transparent recommendation).
- [ ] **Milestone 8: Quality and Deployment** (E2E testing, privacy audit, production containerization).

# Health Plan Admin Dashboard

A full-stack health plan administration platform for self-funded employers, built with Next.js 16, React 19, and Claude AI. Manage claims, employees, providers, and plan designs with AI-powered anomaly detection, conversational claim analysis, and plain-English benefits summaries.

**[Live Demo](https://health-plan-admin-dashboard.vercel.app)**

## Features

### Claims Management
- Full claim lifecycle tracking (pending, in review, approved, denied, appealed, paid)
- Claim detail view with service codes, cost breakdowns, and audit trail
- Bulk claim upload and review queue
- Filterable claims list by status and service category
- CSV export with applied filters

### AI-Powered Analysis
- **Conversational Claim Chat** — Ask questions about any claim in natural language. Streaming responses with full claim context including CPT/ICD codes, cost comparisons, and provider data.
- **Anomaly Detection** — Batch analysis of claims to flag billing anomalies, duplicate billing, coding inconsistencies, and unusual cost patterns. Flagged claims are persisted with explanations and audit trail entries.
- **EOB Summary Generation** — Generates plain-English Explanation of Benefits summaries with structured sections, color-coded icons, and key metric highlights. Gracefully falls back to deterministic summaries when no API key is configured.
- **Claim Categorization** — Auto-assigns service categories and validates CPT/ICD codes against known reference data.

### Employee & Provider Management
- Employee directory with coverage tier, enrollment status, and plan assignment
- Individual employee profiles with claims history and benefits summary
- Provider network directory with quality ratings, cost indices, and network status
- Provider detail pages with associated claims

### Analytics
- Dashboard with KPIs: total spend, claim count, anomaly rate, pending claims
- Spending trends by service category with interactive charts
- Category breakdown and provider cost analysis

### Platform
- Authentication and role-based access via Clerk (admin, analyst, reviewer)
- Dark mode with system preference detection
- Global search across claims, employees, and providers with keyboard navigation
- Responsive sidebar navigation
- Loading states, error boundaries, and skeleton screens

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript (strict mode) |
| Database | SQLite (local) / Turso (production), Drizzle ORM |
| AI | Claude API via Vercel AI SDK, structured output with Zod validation |
| Auth | Clerk |
| UI | shadcn/ui, Tailwind CSS v4, Recharts, Lucide icons |
| Validation | Zod schemas at all trust boundaries |

## Architecture

```
src/
├── app/
│   ├── (auth)/              # Auth layout wrapper
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── claims/          # Claims list, detail, upload, review
│   │   ├── employees/       # Employee directory and profiles
│   │   ├── providers/       # Provider network
│   │   ├── plans/           # Plan design management
│   │   └── analytics/       # Spending trends, anomaly detection
│   └── api/
│       ├── ai/              # AI endpoints (chat, eob-summary, anomaly-detection, categorize)
│       ├── claims/          # Claim CRUD and export
│       ├── analytics/       # Spending data
│       └── search/          # Global search
├── components/
│   ├── ai/                  # AI feature components
│   ├── analytics/           # Charts and tables
│   ├── claims/              # Claims UI (filters, actions, export)
│   ├── dashboard/           # Layout (sidebar, header, stats)
│   └── ui/                  # shadcn/ui primitives
├── db/
│   ├── schema.ts            # 7 tables: companies, plans, employees, providers, claims, audit trail, users
│   ├── seed.ts              # Realistic sample data generator
│   └── index.ts             # DB connection (SQLite or Turso)
└── lib/
    ├── ai/                  # Prompts, schemas, context builders
    ├── constants.ts         # CPT/ICD codes, statuses, categories, formatters
    └── schemas.ts           # Zod validation schemas
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account (free tier works)
- Optional: [Anthropic API key](https://console.anthropic.com) for AI features

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

Add your keys to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
ANTHROPIC_API_KEY=sk-ant-...          # Optional — AI features fall back to deterministic output without this
```

```bash
# Seed the database with sample data
npm run seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

The app uses SQLite locally (`data/health-plan.db`) and supports [Turso](https://turso.tech) for production deployment. To use Turso, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in your environment.

```bash
# Push schema to Turso
npm run push-to-turso

# Run Drizzle migrations
npx drizzle-kit push
```

## AI Features Deep Dive

All AI features use Claude via the Vercel AI SDK with Zod-validated structured output. Each feature works without an API key by falling back to deterministic logic.

**Claim Chat** — The `/api/ai/chat` endpoint builds full claim context server-side (claim data, employee info, provider details, plan terms, audit history, CPT/ICD reference data) and streams responses. The frontend uses `useChat` with `TextStreamChatTransport` for real-time display.

**Anomaly Detection** — Claims are batched (up to 20 per request) and analyzed against CPT code average costs, billing patterns, and coding consistency. Results are validated with Zod, persisted to the claims table, and logged in the audit trail.

**EOB Summaries** — Claude generates structured JSON with four themed sections (coverage, payments, deductible, safety net). The response is parsed with Zod before rendering as color-coded cards with metric highlights. No raw markdown is ever displayed.

## Deployment

The app is deployed on Vercel. For your own deployment:

```bash
# Build for production
npm run build

# Or deploy to Vercel
npx vercel
```

Set all environment variables in your Vercel project settings. If using Turso, add the database URL and auth token there as well.

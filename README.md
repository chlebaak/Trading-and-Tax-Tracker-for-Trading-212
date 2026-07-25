# T212 Portfolio Dashboard

A Next.js dashboard for Trading 212 investments with **real-time Czech tax compliance tracking** — hodnotový test (value test) and časový test (time test) according to §4 of the Czech Income Tax Act.

## Features

### Portfolio Tracking

- Live positions table with **search, sort, and P/L filtering**
- **Portfolio summary** with top holdings bar chart + best/worst performer cards
- Realized and unrealized P/L tracking
- Responsive: desktop table + mobile card layout

### Czech Tax Monitoring

- **Value Test (Hodnotový test)** — 100 000 Kč annual sale limit. Semi-circular gauge visualization.
- **Time Test (Časový test)** — 3-year holding period. FIFO lot accounting per ticker.
- **Tax Timeline** — Gantt-style chart showing every lot and when it becomes tax-free
- **Ticker breakdown** — expandable detail per ticker with progress bars for each buy lot
- "Do 90 dní" filter highlights soon-to-be tax-free lots

### Technical

- **In-memory cache** (60s TTL) to avoid Trading 212 API rate limits
- **Debug mode** — `?debug=1` returns raw API response summaries
- API route auth guard via `x-internal-api-key` header
- Loading skeletons and error boundaries

## Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Framework | Next.js 16 (App Router)      |
| Runtime   | React 19 (Server Components) |
| Styling   | Tailwind CSS v4              |
| Language  | TypeScript                   |
| Data      | Trading 212 REST API (live)  |

## Architecture

```
page.tsx (Server Component)
  └─► getDashboardData()
        └─► buildPortfolioSnapshot()
              ├─► Trading212Client.getPortfolioPositions()
              ├─► Trading212Client.getHistoricalOrders()
              ├─► calculateValueTest()
              ├─► buildTimeTestFifo()
              └─► computeRealizedPL()

DashboardShell (Client Component)
  ├─► Navbar with Portfolio | Daně tabs
  ├─► KPI ribbon (6 cards)
  └─► Active tab content

/api/portfolio (Route Handler)
  └─► Auth guard → buildPortfolioSnapshot → JSON
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Server component — data fetching + layout
│   ├── layout.tsx            # Root layout with ambient background
│   ├── loading.tsx           # Skeleton UI
│   ├── error.tsx             # Error boundary
│   └── api/portfolio/route.ts # GET endpoint with debug mode
├── components/
│   ├── DashboardShell.tsx    # Navbar, tabs, KPI ribbon
│   ├── PortfolioPositions.tsx # Searchable, sortable positions table
│   ├── PortfolioSummary.tsx  # Top holdings bars + best/worst cards
│   ├── TaxBreakdown.tsx      # Per-ticker FIFO lot detail
│   ├── TaxTimeline.tsx       # Gantt chart of all lots → tax-free dates
│   └── ValueTestGauge.tsx    # Semi-circular speedometer gauge
└── lib/
    ├── trading212/
    │   ├── client.ts         # T212 API client (pagination, errors, debug)
    │   └── types.ts          # TypeScript types
    ├── portfolio.ts          # Snapshot builder + position normalization
    ├── cz-tax.ts             # Czech tax calculations (FIFO, value test)
    ├── dashboard.ts          # Orchestrator
    └── internal-access.ts    # API route auth guard
```

## Setup

### 1. Environment Variables

Copy `.env.example` (or create `.env`) with:

```env
T212_API_KEY=your_api_key
T212_API_SECRET=your_api_secret
T212_BASE_URL=https://live.trading212.com   # optional, default
T212_ACCOUNT_CURRENCY=CZK                    # optional, default
PORTFOLIO_ROUTE_KEY=your_route_key           # optional, falls back to T212_API_SECRET
T212_CACHE_TTL_SEC=60                        # optional, default 60
```

### 2. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

### `GET /api/portfolio`

Returns positions, value test, and time test FIFO data.

**Headers:** `x-internal-api-key: <token>` or `Authorization: Bearer <token>`

**Query params:**

- `?ticker=AAPL` — filter tax data by ticker
- `?debug=1` — return raw API response structure for debugging

## FX Rates

(Might change in the future cause the taxes have some rules for currency exchange)
Hardcoded approximate rates used for tax calculations:

| Currency | Rate (CZK) |
| -------- | ---------- |
| EUR      | 25.3       |
| USD      | 23.4       |

## License

Private

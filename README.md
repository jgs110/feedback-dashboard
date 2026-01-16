# Feedback Intelligence Dashboard

A full-stack dashboard for aggregating and analyzing product feedback from multiple sources (X, GitHub, Discord, Support, Email, Forum) with AI-powered insights.

**Live Demo:** https://feedback-dashboard.jgs110.workers.dev

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Cloudflare Workers + Hono router
- **Database:** Cloudflare D1 (serverless SQLite)
- **AI:** Workers AI (Llama 3 8B Instruct)
- **Cache:** Cloudflare KV (10-min TTL for insights)

## Features

- **Multi-source aggregation** - Combines feedback from 6 different sources
- **AI enrichment** - Workers AI generates sentiment, themes, and summaries
- **Real-time insights** - Recommended focus areas and 24h change detection
- **Interactive charts** - Trend lines, heatmaps, and Sankey diagrams
- **Mock/Live toggle** - Switch between mock data and live D1 database
- **Responsive design** - Works on desktop and mobile

## Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler`

### Local Development

```bash
# Install dependencies
npm install

# Run with mock data (no backend needed)
npm run dev
```

Open http://localhost:5173

### Deploy to Cloudflare

```bash
# 1. Authenticate
wrangler login

# 2. Create D1 database
wrangler d1 create feedback-db
# Copy the database_id to wrangler.toml

# 3. Run migrations
wrangler d1 migrations apply feedback-db --remote

# 4. Create KV namespace
wrangler kv namespace create CACHE
# Copy the id to wrangler.toml

# 5. Deploy
npm run deploy

# 6. Seed initial data
curl -X POST https://YOUR-WORKER.workers.dev/api/seed
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feedback` | List feedback with filters |
| POST | `/api/feedback` | Create new feedback item |
| POST | `/api/feedback/:id/enrich` | Enrich with Workers AI |
| POST | `/api/seed` | Seed database with sample data |
| GET | `/api/themes` | Top themes aggregation |
| GET | `/api/metrics/trend` | Feedback trend over time |
| GET | `/api/metrics/heatmap` | Theme x Sentiment heatmap |
| GET | `/api/metrics/sankey` | Source → Theme → Sentiment flow |
| GET | `/api/insights/recommended` | Top 3 recommended focus areas |
| GET | `/api/insights/deltas` | 24h change detection |
| GET | `/api/health` | Health check |

### Query Parameters

Most endpoints support these filters:
- `source` - Filter by source (x, github, discord, support, email, forum)
- `sentiment` - Filter by sentiment (positive, negative, neutral)
- `theme` - Filter by theme
- `q` - Search in content/title
- `days` - Time window (default: 30)
- `limit` / `offset` - Pagination

## Project Structure

```
src/
├── components/
│   ├── charts/          # ECharts visualizations
│   ├── ui/              # shadcn/ui components
│   ├── Dashboard.tsx    # Legacy dashboard
│   ├── UnifiedDashboard.tsx  # Main dashboard with tabs
│   └── FeedbackCard.tsx # Feedback item card
├── lib/
│   ├── api.ts           # API client
│   ├── provider.ts      # Mock/Live data provider
│   └── mockData.ts      # Mock feedback items
├── types/
│   └── feedback.ts      # TypeScript types
└── worker.ts            # Cloudflare Worker entrypoint
```

## Configuration

### wrangler.toml

```toml
name = "feedback-dashboard"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "feedback-db"
database_id = "YOUR_D1_DATABASE_ID"

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"

[ai]
binding = "AI"

[build]
command = "npm run build"

[assets]
directory = "./dist"
```

### Environment Variables

For local development with a remote Worker:
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8787
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (mock mode) |
| `npm run build` | Build for production |
| `npm run deploy` | Build and deploy to Cloudflare |
| `npm run cf:dev` | Run Wrangler dev server locally |
| `npm run cf:tail` | Stream live Worker logs |

## Workers AI Integration

The `/api/feedback/:id/enrich` endpoint uses Llama 3 to analyze feedback:

```bash
# Enrich a feedback item
curl -X POST https://YOUR-WORKER.workers.dev/api/feedback/ITEM_ID/enrich
```

The AI extracts:
- **Sentiment:** positive, negative, neutral, or mixed
- **Theme:** performance, pricing, features, usability, support, etc.
- **Summary:** 1-2 sentence summary of the feedback

## License

MIT

import { FeedbackItem } from "@/types/feedback";

// Helper to generate timestamps relative to now for demo purposes
// This ensures delta detection works properly
function getTimestamp(hoursAgo: number): string {
  const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return date.toISOString();
}

export const mockFeedback: FeedbackItem[] = [
  {
    id: "1",
    source: "x",
    externalId: "1745123456789",
    url: "https://x.com/dev/status/1745123456789",
    title: undefined,
    content: "Workers AI is incredible but the cold start times are killing my use case. Need sub-100ms response times for real-time applications.",
    authorHandle: "@clouddev",
    createdAt: getTimestamp(5), // 5 hours ago (current window)
    ingestedAt: getTimestamp(5),
    sentiment: "negative",
    themes: ["performance", "latency", "workers-ai"],
    summary: "User experiencing high cold start latency with Workers AI affecting real-time application performance",
    urgency: 4,
    status: "new",
    productArea: "Workers AI",
    tags: ["cold-start", "latency"]
  },
  {
    id: "2",
    source: "github",
    externalId: "cloudflare/workers-sdk#4521",
    url: "https://github.com/cloudflare/workers-sdk/issues/4521",
    title: "D1 query performance degradation with large datasets",
    content: "After migrating our database to D1, we're seeing significant slowdowns with tables over 100k rows. Simple SELECT queries that took 50ms in SQLite now take 2-3 seconds. This is blocking our production migration.",
    authorHandle: "techstartup",
    createdAt: getTimestamp(10), // 10 hours ago (current window)
    ingestedAt: getTimestamp(10),
    sentiment: "negative",
    themes: ["database", "performance", "d1", "scalability"],
    summary: "D1 experiencing poor query performance with datasets >100k rows, blocking production adoption",
    urgency: 5,
    status: "triaged",
    productArea: "D1",
    tags: ["performance", "scaling", "production-blocker"]
  },
  {
    id: "3",
    source: "discord",
    externalId: "discord-msg-998877665544",
    url: undefined,
    title: undefined,
    content: "Just deployed my first Worker and the DX is amazing! The local dev experience with wrangler is so smooth compared to other platforms.",
    authorHandle: "newbie_dev",
    createdAt: getTimestamp(2), // 2 hours ago (current window)
    ingestedAt: getTimestamp(2),
    sentiment: "positive",
    themes: ["developer-experience", "wrangler", "onboarding"],
    summary: "Positive feedback on Wrangler local development experience and overall DX",
    urgency: 1,
    status: "new",
    productArea: "Wrangler",
    tags: ["dx", "tooling"]
  },
  {
    id: "4",
    source: "support",
    externalId: "TICKET-89234",
    url: undefined,
    title: "Unable to bind multiple D1 databases to Worker",
    content: "We have a multi-tenant architecture and need to bind different D1 databases per tenant. The current limitation of binding databases in wrangler.toml doesn't support dynamic binding based on request context. Is there a workaround?",
    authorHandle: undefined,
    createdAt: getTimestamp(36), // 36 hours ago (previous window)
    ingestedAt: getTimestamp(36),
    sentiment: "neutral",
    themes: ["architecture", "d1", "multi-tenancy", "bindings"],
    summary: "Enterprise customer needs dynamic D1 database binding for multi-tenant architecture",
    urgency: 3,
    status: "triaged",
    productArea: "D1",
    tags: ["enterprise", "multi-tenant", "bindings"]
  },
  {
    id: "5",
    source: "github",
    externalId: "cloudflare/workers-sdk#4589",
    url: "https://github.com/cloudflare/workers-sdk/issues/4589",
    title: "Feature request: TypeScript types for Workers AI models",
    content: "Would love to have generated TypeScript types for all the AI model inputs/outputs. Currently having to manually type everything which is error-prone.",
    authorHandle: "typescript_fan",
    createdAt: getTimestamp(8), // 8 hours ago (current window)
    ingestedAt: getTimestamp(8),
    sentiment: "neutral",
    themes: ["developer-experience", "typescript", "workers-ai", "types"],
    summary: undefined, // Testing missing summary
    urgency: 2,
    status: "new",
    productArea: "Workers AI",
    tags: ["typescript", "dx"]
  },
  {
    id: "6",
    source: "x",
    externalId: "1745234567890",
    url: "https://x.com/saas_founder/status/1745234567890",
    title: undefined,
    content: "Cloudflare Pages deployment took 3 minutes. Vercel takes 30 seconds for the same Next.js app. What's going on?",
    authorHandle: "@saas_founder",
    createdAt: getTimestamp(3), // 3 hours ago (current window) - performance spike
    ingestedAt: getTimestamp(3),
    sentiment: "negative",
    themes: ["pages", "deployment", "performance", "nextjs"],
    summary: "User reporting slow Pages deployment times compared to competitors",
    urgency: 3,
    status: "new",
    productArea: "Pages",
    tags: ["deployment-speed", "nextjs"]
  },
  {
    id: "7",
    source: "discord",
    externalId: "discord-msg-887766554433",
    url: undefined,
    title: undefined,
    content: "The new Cloudflare Images API is exactly what we needed. Automatic format optimization and resizing on the edge = chef's kiss",
    authorHandle: "imagery_app",
    createdAt: getTimestamp(30), // 30 hours ago (previous window)
    ingestedAt: getTimestamp(30),
    sentiment: "positive",
    themes: ["images", "cdn", "optimization"],
    summary: "Very positive feedback on Images API features and edge optimization",
    urgency: 1,
    status: "new",
    productArea: "Images",
    tags: ["positive"]
  },
  {
    id: "8",
    source: "forum",
    externalId: "forum-post-12389",
    url: "https://community.cloudflare.com/t/12389",
    title: "R2 pricing confusion",
    content: "I'm trying to understand R2 pricing for our use case. We'll have ~500TB storage with high read volume. The pricing page says no egress fees but I'm seeing charges. Can someone clarify?",
    authorHandle: "confused_customer",
    createdAt: getTimestamp(40), // 40 hours ago (previous window)
    ingestedAt: getTimestamp(40),
    sentiment: "neutral",
    themes: ["r2", "pricing", "documentation", "billing"],
    summary: "Customer confusion about R2 pricing model and unexpected charges",
    urgency: 3,
    status: "triaged",
    productArea: "R2",
    tags: ["pricing", "documentation"]
  },
  {
    id: "9",
    source: "email",
    externalId: undefined,
    url: undefined,
    title: "Workers Analytics data retention",
    content: "Our compliance team needs analytics data retained for 2 years minimum. Currently Workers Analytics only shows 30 days. Is there an enterprise option for longer retention?",
    authorHandle: undefined,
    createdAt: getTimestamp(42), // 42 hours ago (previous window)
    ingestedAt: getTimestamp(42),
    sentiment: "neutral",
    themes: ["analytics", "compliance", "data-retention", "enterprise"],
    summary: "Enterprise compliance requirement for extended analytics data retention",
    urgency: 4,
    status: "triaged",
    productArea: "Workers",
    tags: ["enterprise", "compliance"]
  },
  {
    id: "10",
    source: "github",
    externalId: "cloudflare/workers-sdk#4612",
    url: "https://github.com/cloudflare/workers-sdk/issues/4612",
    title: "Wrangler dev doesn't support websockets properly",
    content: "Testing websockets locally with wrangler dev but connections keep dropping. Works fine when deployed. This makes local development really painful.",
    authorHandle: "realtime_dev",
    createdAt: getTimestamp(6), // 6 hours ago (current window)
    ingestedAt: getTimestamp(6),
    sentiment: "negative",
    themes: ["developer-experience", "wrangler", "websockets", "local-dev"],
    summary: "Local development pain point: WebSocket support broken in wrangler dev mode",
    urgency: 3,
    status: "new",
    productArea: "Wrangler",
    tags: ["dx", "websockets", "local-dev"]
  },
  {
    id: "11",
    source: "x",
    externalId: "1745345678901",
    url: "https://x.com/ai_builder/status/1745345678901",
    title: undefined,
    content: "Vectorize just saved us $2k/month vs Pinecone. Same performance, way better pricing. This is huge for our AI startup.",
    authorHandle: "@ai_builder",
    createdAt: getTimestamp(12), // 12 hours ago (current)
    ingestedAt: getTimestamp(12),
    sentiment: "positive",
    themes: ["vectorize", "pricing", "ai", "cost-savings"],
    summary: "Strong positive sentiment on Vectorize pricing and competitive positioning",
    urgency: 1,
    status: "new",
    productArea: "Vectorize",
    tags: ["competitive-win", "pricing"]
  },
  {
    id: "12",
    source: "support",
    externalId: "TICKET-89456",
    url: undefined,
    title: "Worker CPU time limits blocking ML inference",
    content: "We're running inference with Workers AI and hitting CPU time limits on complex models. Even with paid plans the 50ms limit is too restrictive. Need at least 200ms for our use case.",
    authorHandle: undefined,
    createdAt: getTimestamp(4), // 4 hours ago (current) - performance spike
    ingestedAt: "2026-01-14T13:42:18Z",
    sentiment: "negative",
    themes: ["workers-ai", "limits", "ml-inference", "performance"],
    summary: "CPU time limits preventing ML inference use cases on Workers AI",
    urgency: 5,
    status: "new",
    productArea: "Workers AI",
    tags: ["limits", "ml", "blocker"]
  },
  {
    id: "13",
    source: "discord",
    externalId: "discord-msg-776655443322",
    url: undefined,
    title: undefined,
    content: "Anyone else getting intermittent 500 errors from KV? Happening maybe 1-2% of requests to us-east region.",
    authorHandle: "worried_dev",
    createdAt: getTimestamp(15), // 15 hours ago (current) - new billing theme
    ingestedAt: getTimestamp(15),
    sentiment: "negative",
    themes: ["kv", "reliability", "errors"],
    summary: undefined, // Testing missing summary
    urgency: 4,
    status: "new",
    productArea: "KV",
    tags: ["reliability", "errors"]
  },
  {
    id: "14",
    source: "forum",
    externalId: "forum-post-12456",
    url: "https://community.cloudflare.com/t/12456",
    title: "How to implement rate limiting per user?",
    content: "I need to rate limit API requests per authenticated user. The rate limiting docs only show examples for IP-based limiting. How do I use custom keys?",
    authorHandle: "api_developer",
    createdAt: getTimestamp(32), // 32 hours ago (previous)
    ingestedAt: "2026-01-13T16:32:40Z",
    sentiment: "neutral",
    themes: ["rate-limiting", "documentation", "authentication"],
    summary: "Documentation gap: custom key-based rate limiting examples needed",
    urgency: 2,
    status: "new",
    productArea: "Workers",
    tags: ["documentation", "rate-limiting"]
  },
  {
    id: "15",
    source: "github",
    externalId: "cloudflare/workers-sdk#4701",
    url: "https://github.com/cloudflare/workers-sdk/issues/4701",
    title: "D1 migrations don't support transactions",
    content: "Running migrations with multiple ALTER TABLE statements and one fails halfway through. Now database is in inconsistent state. Need transaction support for migrations.",
    authorHandle: "backend_eng",
    createdAt: getTimestamp(18), // 18 hours ago (current) - billing theme
    ingestedAt: "2026-01-15T10:17:25Z",
    sentiment: "negative",
    themes: ["d1", "migrations", "reliability", "database"],
    summary: "Critical issue: D1 migrations lack transaction support causing data inconsistency",
    urgency: 5,
    status: "new",
    productArea: "D1",
    tags: ["migrations", "data-integrity", "critical"]
  }
];

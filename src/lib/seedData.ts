import { CreateFeedbackRequest } from "./api";

// Sample data to seed the database
export const seedFeedback: CreateFeedbackRequest[] = [
  {
    source: "x",
    url: "https://x.com/dev/status/1745123456789",
    content: "Workers AI is incredible but the cold start times are killing my use case. Need sub-100ms response times for real-time applications.",
    authorHandle: "@clouddev",
    createdAt: "2026-01-14T10:30:00Z",
    productArea: "Workers AI",
    tags: ["cold-start", "latency"]
  },
  {
    source: "github",
    externalId: "cloudflare/workers-sdk#4521",
    url: "https://github.com/cloudflare/workers-sdk/issues/4521",
    title: "D1 query performance degradation with large datasets",
    content: "After migrating our database to D1, we're seeing significant slowdowns with tables over 100k rows. Simple SELECT queries that took 50ms in SQLite now take 2-3 seconds. This is blocking our production migration.",
    authorHandle: "techstartup",
    createdAt: "2026-01-13T15:22:00Z",
    productArea: "D1",
    tags: ["performance", "scaling", "production-blocker"]
  },
  {
    source: "discord",
    content: "Just deployed my first Worker and the DX is amazing! The local dev experience with wrangler is so smooth compared to other platforms.",
    authorHandle: "newbie_dev",
    createdAt: "2026-01-14T08:15:00Z",
    productArea: "Wrangler",
    tags: ["dx", "tooling"]
  },
  {
    source: "support",
    externalId: "TICKET-89234",
    title: "Unable to bind multiple D1 databases to Worker",
    content: "We have a multi-tenant architecture and need to bind different D1 databases per tenant. The current limitation of binding databases in wrangler.toml doesn't support dynamic binding based on request context. Is there a workaround?",
    createdAt: "2026-01-12T11:05:00Z",
    productArea: "D1",
    tags: ["enterprise", "multi-tenant", "bindings"]
  },
  {
    source: "github",
    externalId: "cloudflare/workers-sdk#4589",
    url: "https://github.com/cloudflare/workers-sdk/issues/4589",
    title: "Feature request: TypeScript types for Workers AI models",
    content: "Would love to have generated TypeScript types for all the AI model inputs/outputs. Currently having to manually type everything which is error-prone.",
    authorHandle: "typescript_fan",
    createdAt: "2026-01-14T14:20:00Z",
    productArea: "Workers AI",
    tags: ["typescript", "dx"]
  }
];

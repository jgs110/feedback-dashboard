import { FeedbackItem, FeedbackSource, Sentiment } from "@/types/feedback";

// API configuration
// Production uses same-origin (""), local dev can override with VITE_API_BASE_URL
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// Transform D1 response format to frontend FeedbackItem format
function transformD1Item(item: any): FeedbackItem {
  return {
    id: item.id,
    source: item.source as FeedbackSource,
    externalId: item.external_id,
    url: item.url,
    title: item.title,
    content: item.content,
    authorHandle: item.author_handle,
    createdAt: item.created_at,
    ingestedAt: item.ingested_at || item.created_at,
    sentiment: (item.sentiment as Sentiment) || 'unknown',
    themes: item.theme ? item.theme.split(',').map((t: string) => t.trim()) : [],
    summary: item.summary,
    urgency: item.urgency,
    status: item.status || 'new',
    productArea: item.product_area,
    tags: item.tags ? (typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()) : item.tags) : [],
  };
}

export type CreateFeedbackRequest = {
  source: FeedbackSource;
  externalId?: string;
  url?: string;
  title?: string;
  content: string;
  authorHandle?: string;
  createdAt?: string;
  productArea?: string;
  tags?: string[];
};

export type FeedbackFilters = {
  source?: string;
  sentiment?: string;
  status?: string;
  theme?: string;
  q?: string;
  days?: number;
  limit?: number;
  offset?: number;
};

export type ThemeCount = {
  theme: string;
  count: number;
};

export type ThemesResponse = {
  windowDays: number;
  totalItemsConsidered: number;
  themes: ThemeCount[];
};

export type FeedbackResponse = {
  items: FeedbackItem[];
  total: number;
};

export type TrendPoint = {
  date: string;
  count: number;
  isSpike?: boolean;
};

export type TrendResponse = {
  points: TrendPoint[];
  windowDays: number;
  totalItemsConsidered: number;
};

export type HeatmapResponse = {
  themes: string[];
  sentiments: string[];
  matrix: number[][];
  totalItemsConsidered: number;
};

export type SankeyNode = {
  name: string;
};

export type SankeyLink = {
  source: string;
  target: string;
  value: number;
};

export type SankeyResponse = {
  nodes: SankeyNode[];
  links: SankeyLink[];
  totalItemsConsidered: number;
};

// GET /api/feedback
export async function getFeedback(filters?: FeedbackFilters): Promise<FeedbackResponse> {
  const url = new URL(`${API_BASE}/api/feedback`, window.location.origin);

  if (filters) {
    if (filters.source) url.searchParams.set('source', filters.source);
    if (filters.sentiment) url.searchParams.set('sentiment', filters.sentiment);
    if (filters.status) url.searchParams.set('status', filters.status);
    if (filters.theme) url.searchParams.set('theme', filters.theme);
    if (filters.q) url.searchParams.set('q', filters.q);
    if (filters.days !== undefined) url.searchParams.set('days', filters.days.toString());
    if (filters.limit) url.searchParams.set('limit', filters.limit.toString());
    if (filters.offset) url.searchParams.set('offset', filters.offset.toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(error.error || 'Failed to fetch feedback');
  }

  const data = await response.json() as any;
  return {
    items: (data.items || []).map(transformD1Item),
    total: data.total || 0
  };
}

// POST /api/feedback
export async function createFeedback(request: CreateFeedbackRequest): Promise<FeedbackItem> {
  const response = await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(error.error || 'Failed to create feedback');
  }

  const data = await response.json() as any;
  return transformD1Item(data.item);
}

// POST /api/feedback/:id/enrich
export async function enrichFeedback(id: string): Promise<FeedbackItem> {
  const response = await fetch(`${API_BASE}/api/feedback/${id}/enrich`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(error.error || 'Failed to enrich feedback');
  }

  const data = await response.json() as any;
  return transformD1Item(data.item);
}

// GET /api/themes
export async function getTopThemes(filters?: Omit<FeedbackFilters, 'theme' | 'offset'>): Promise<ThemesResponse> {
  const url = new URL(`${API_BASE}/api/themes`, window.location.origin);

  if (filters) {
    if (filters.source) url.searchParams.set('source', filters.source);
    if (filters.sentiment) url.searchParams.set('sentiment', filters.sentiment);
    if (filters.status) url.searchParams.set('status', filters.status);
    if (filters.q) url.searchParams.set('q', filters.q);
    if (filters.days !== undefined) url.searchParams.set('days', filters.days.toString());
    if (filters.limit) url.searchParams.set('limit', filters.limit.toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(error.error || 'Failed to fetch themes');
  }

  const data = await response.json() as any;
  return data;
}

// GET /api/metrics/trend
export async function getTrend(filters?: Omit<FeedbackFilters, "limit" | "offset">): Promise<TrendResponse> {
  const url = new URL(`${API_BASE}/api/metrics/trend`, window.location.origin);

  if (filters) {
    if (filters.source) url.searchParams.set("source", filters.source);
    if (filters.sentiment) url.searchParams.set("sentiment", filters.sentiment);
    if (filters.status) url.searchParams.set("status", filters.status);
    if (filters.theme) url.searchParams.set("theme", filters.theme);
    if (filters.q) url.searchParams.set("q", filters.q);
    if (filters.days !== undefined) url.searchParams.set("days", filters.days.toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" })) as any;
    throw new Error(error.error || "Failed to fetch trend");
  }

  return response.json();
}

// GET /api/metrics/heatmap
export async function getHeatmap(filters?: Omit<FeedbackFilters, "theme" | "limit" | "offset">): Promise<HeatmapResponse> {
  const url = new URL(`${API_BASE}/api/metrics/heatmap`, window.location.origin);

  if (filters) {
    if (filters.source) url.searchParams.set("source", filters.source);
    if (filters.sentiment) url.searchParams.set("sentiment", filters.sentiment);
    if (filters.status) url.searchParams.set("status", filters.status);
    if (filters.q) url.searchParams.set("q", filters.q);
    if (filters.days !== undefined) url.searchParams.set("days", filters.days.toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" })) as any;
    throw new Error(error.error || "Failed to fetch heatmap");
  }

  return response.json();
}

// GET /api/metrics/sankey
export async function getSankey(filters?: Omit<FeedbackFilters, "theme" | "limit" | "offset">): Promise<SankeyResponse> {
  const url = new URL(`${API_BASE}/api/metrics/sankey`, window.location.origin);

  if (filters) {
    if (filters.source) url.searchParams.set("source", filters.source);
    if (filters.sentiment) url.searchParams.set("sentiment", filters.sentiment);
    if (filters.status) url.searchParams.set("status", filters.status);
    if (filters.q) url.searchParams.set("q", filters.q);
    if (filters.days !== undefined) url.searchParams.set("days", filters.days.toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" })) as any;
    throw new Error(error.error || "Failed to fetch sankey");
  }

  return response.json();
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json() as any;
    return data.ok === true;
  } catch {
    return false;
  }
}

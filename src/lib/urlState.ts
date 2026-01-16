import { FeedbackFilters } from "./api";

export type ViewMode = "inbox" | "insights";

// Convert URL search params to FeedbackFilters
export function getFiltersFromSearchParams(params: URLSearchParams): FeedbackFilters {
  const filters: FeedbackFilters = {};
  const source = params.get("source");
  const sentiment = params.get("sentiment");
  const status = params.get("status");
  const theme = params.get("theme");
  const q = params.get("q");
  const days = params.get("days");

  if (source) filters.source = source;
  if (sentiment) filters.sentiment = sentiment;
  if (status) filters.status = status;
  if (theme) filters.theme = theme;
  if (q) filters.q = q;
  if (days) filters.days = parseInt(days);

  return filters;
}

// Convert FeedbackFilters to URL search params
export function setFiltersInSearchParams(
  filters: FeedbackFilters,
  currentParams: URLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(currentParams);

  // Preserve view param
  const view = params.get("view");

  // Clear all filter params
  params.delete("source");
  params.delete("sentiment");
  params.delete("status");
  params.delete("theme");
  params.delete("q");
  params.delete("days");

  // Set new filter params
  if (filters.source) params.set("source", filters.source);
  if (filters.sentiment) params.set("sentiment", filters.sentiment);
  if (filters.status) params.set("status", filters.status);
  if (filters.theme) params.set("theme", filters.theme);
  if (filters.q) params.set("q", filters.q);
  if (filters.days !== undefined) params.set("days", filters.days.toString());

  // Restore view param
  if (view) params.set("view", view);

  return params;
}

// Get current view from URL
export function getViewFromSearchParams(params: URLSearchParams): ViewMode {
  const view = params.get("view");
  if (view === "insights") return "insights";
  return "inbox"; // default
}

// Set view in URL
export function setViewInSearchParams(
  view: ViewMode,
  currentParams: URLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(currentParams);
  params.set("view", view);
  return params;
}

// Build complete URL with filters and view
export function buildURL(
  filters: FeedbackFilters,
  view: ViewMode,
  basePath: string = window.location.pathname
): string {
  const params = new URLSearchParams();

  if (filters.source) params.set("source", filters.source);
  if (filters.sentiment) params.set("sentiment", filters.sentiment);
  if (filters.status) params.set("status", filters.status);
  if (filters.theme) params.set("theme", filters.theme);
  if (filters.q) params.set("q", filters.q);
  if (filters.days !== undefined) params.set("days", filters.days.toString());

  params.set("view", view);

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

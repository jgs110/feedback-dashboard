import { useState, useEffect, useMemo, useCallback } from "react";
import { FeedbackItem } from "@/types/feedback";
import { FeedbackCard } from "@/components/FeedbackCard";
import { TopThemes } from "@/components/TopThemes";
import { FilterBar } from "@/components/FilterBar";
import { TrendChart } from "@/components/charts/TrendChart";
import { ImpactHeatmap } from "@/components/charts/ImpactHeatmap";
import { SourceThemeSankey } from "@/components/charts/SourceThemeSankey";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/ThemeProvider";
import { mockFeedback } from "@/lib/mockData";
import { getFeedback, createFeedback, FeedbackFilters } from "@/lib/api";
import { seedFeedback } from "@/lib/seedData";
import { Moon, Sun } from "lucide-react";

// URL query param sync utilities
function filtersToURLParams(filters: FeedbackFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.source) params.set("source", filters.source);
  if (filters.sentiment) params.set("sentiment", filters.sentiment);
  if (filters.status) params.set("status", filters.status);
  if (filters.theme) params.set("theme", filters.theme);
  if (filters.q) params.set("q", filters.q);
  if (filters.days !== undefined) params.set("days", filters.days.toString());
  return params;
}

function urlParamsToFilters(params: URLSearchParams): FeedbackFilters {
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

export function Dashboard() {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Read initial filters from URL
  const [filters, setFilters] = useState<FeedbackFilters>(() => {
    const params = new URLSearchParams(window.location.search);
    return urlParamsToFilters(params);
  });

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [useMockData, setUseMockData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Sync filters to URL
  useEffect(() => {
    const params = filtersToURLParams(filters);
    const newURL = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newURL);
  }, [filters]);

  // Load data based on mode (mock vs API)
  useEffect(() => {
    if (useMockData) {
      // Apply filters to mock data in JS
      let filtered = mockFeedback;

      if (filters.source) {
        filtered = filtered.filter((item) => item.source === filters.source);
      }
      if (filters.sentiment) {
        filtered = filtered.filter((item) => item.sentiment === filters.sentiment);
      }
      if (filters.status) {
        filtered = filtered.filter((item) => item.status === filters.status);
      }
      if (filters.theme) {
        filtered = filtered.filter((item) =>
          item.themes?.includes(filters.theme!)
        );
      }
      if (filters.q) {
        const query = filters.q.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title?.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query)
        );
      }
      // Note: days filter not applied to mock data (all mock data is recent)

      setFeedbackItems(filtered);
      setTotalCount(filtered.length);
      setError(null);
    } else {
      loadFromAPI();
    }
  }, [useMockData, filters]);

  const loadFromAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFeedback(filters);
      setFeedbackItems(response.items);
      setTotalCount(response.total);
    } catch (err: any) {
      setError(err.message || "Failed to load feedback");
      console.error("Error loading feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      // Create each seed item
      for (const item of seedFeedback) {
        await createFeedback(item);
      }
      // Reload from API
      await loadFromAPI();
      showToast(
        `Successfully seeded ${seedFeedback.length} feedback items!`,
        "success"
      );
    } catch (err: any) {
      showToast("Failed to seed data: " + err.message, "error");
    } finally {
      setSeeding(false);
    }
  };

  // Handle when a feedback item is enriched
  const handleItemEnriched = (enrichedItem: FeedbackItem) => {
    setFeedbackItems((items) =>
      items.map((item) => (item.id === enrichedItem.id ? enrichedItem : item))
    );
  };

  // Filter handlers
  const handleFilterChange = useCallback((newFilters: FeedbackFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSourceClick = useCallback((source: string) => {
    setFilters((prev) => ({ ...prev, source }));
  }, []);

  const handleSentimentClick = useCallback((sentiment: string) => {
    setFilters((prev) => ({ ...prev, sentiment }));
  }, []);

  const handleThemeClick = useCallback((theme: string) => {
    setFilters((prev) => {
      // Toggle theme filter
      if (prev.theme === theme) {
        const { theme: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, theme };
    });
  }, []);

  // Simple stats for dashboard header
  const stats = {
    total: totalCount,
    new: feedbackItems.filter((f) => f.status === "new").length,
    highUrgency: feedbackItems.filter((f) => f.urgency && f.urgency >= 4)
      .length,
    negative: feedbackItems.filter((f) => f.sentiment === "negative").length,
  };

  // Build filter description for empty state
  const filterDescription = useMemo(() => {
    const parts: string[] = [];
    if (filters.source) parts.push(`source=${filters.source}`);
    if (filters.sentiment) parts.push(`sentiment=${filters.sentiment}`);
    if (filters.status) parts.push(`status=${filters.status}`);
    if (filters.theme) parts.push(`theme=${filters.theme}`);
    if (filters.q) parts.push(`search="${filters.q}"`);
    return parts.length > 0 ? parts.join(", ") : "all filters";
  }, [filters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                Feedback Intelligence Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Aggregated insights from X, GitHub, Discord, Support, and more
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="px-3 py-2 text-sm rounded-md border hover:bg-accent transition-colors"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setUseMockData(!useMockData)}
                className="px-4 py-2 text-sm rounded-md border hover:bg-accent transition-colors"
              >
                {useMockData ? "📦 Mock Data" : "🌐 Live API"}
              </button>
              {!useMockData && (
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {seeding ? "Seeding..." : "🌱 Seed Data"}
                </button>
              )}
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">CF</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-background rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">Total Feedback</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">New Items</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {stats.new}
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">High Urgency</p>
              <p className="text-2xl font-bold text-orange-500 mt-1">
                {stats.highUrgency}
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">
                Negative Sentiment
              </p>
              <p className="text-2xl font-bold text-red-500 mt-1">
                {stats.negative}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <FilterBar filters={filters} onFilterChange={handleFilterChange} />
        </div>
      </header>

      {/* Feedback List */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {error}
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-1">
              {window.location.hostname === 'localhost'
                ? 'Make sure the Worker is running on http://localhost:8787'
                : 'API request failed. Verify deployed Worker routes are reachable.'}
            </p>
          </div>
        )}

        {/* Top Themes Panel (only in Live API mode) */}
        {!useMockData && !loading && !error && (
          <div className="mb-6">
            <TopThemes
              filters={filters}
              onThemeClick={handleThemeClick}
              activeTheme={filters.theme}
            />
          </div>
        )}

        {/* Insights Section (visible in both modes) */}
        {!loading && !error && (
          <div className="space-y-6 mb-8">
            {/* Trend Chart (full width) */}
            <TrendChart filters={filters} useMockData={useMockData} />

            {/* Heatmap and Sankey (side by side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ImpactHeatmap
                filters={filters}
                useMockData={useMockData}
                onFilterChange={(partialFilters) =>
                  handleFilterChange({ ...filters, ...partialFilters })
                }
              />
              <SourceThemeSankey
                filters={filters}
                useMockData={useMockData}
                onFilterChange={(partialFilters) =>
                  handleFilterChange({ ...filters, ...partialFilters })
                }
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading feedback...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {feedbackItems.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                onEnriched={handleItemEnriched}
                onSourceClick={handleSourceClick}
                onSentimentClick={handleSentimentClick}
                onThemeClick={handleThemeClick}
              />
            ))}
          </div>
        )}

        {!loading && feedbackItems.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">
              No feedback items found for {filterDescription}
            </p>
            {!useMockData && Object.keys(filters).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Click "Seed Data" to add sample feedback items
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

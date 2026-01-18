import { useState, useEffect, useCallback } from "react";
import { FeedbackItem } from "@/types/feedback";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FilterBar } from "@/components/FilterBar";
import { TrendChart } from "@/components/charts/TrendChart";
import { ImpactHeatmap } from "@/components/charts/ImpactHeatmap";
import { SourceThemeSankey } from "@/components/charts/SourceThemeSankey";
import { RecommendedFocus } from "@/components/RecommendedFocus";
import { CurrentFocusStrip } from "@/components/CurrentFocusStrip";
import { DeltaView } from "@/components/DeltaView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/ThemeProvider";
import { FeedbackFilters, createFeedback } from "@/lib/api";
import { seedFeedback } from "@/lib/seedData";
import { Moon, Sun, Inbox, BarChart3 } from "lucide-react";
import {
  getProvider,
  DataMode,
  Provider,
  TrendResponse,
  HeatmapResponse,
  SankeyResponse,
  FocusItem,
  DeltaItem,
} from "@/lib/provider";
import {
  getFiltersFromSearchParams,
  setFiltersInSearchParams,
  getViewFromSearchParams,
  setViewInSearchParams,
  ViewMode,
} from "@/lib/urlState";

export function UnifiedDashboard() {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Data mode from env var (with runtime toggle option)
  // Default to "live" in production, "mock" only if explicitly set
  const envMode = (import.meta.env.VITE_DATA_MODE as DataMode) || "live";
  const [dataMode, setDataMode] = useState<DataMode>(envMode);

  // Read initial state from URL
  const [filters, setFilters] = useState<FeedbackFilters>(() => {
    const params = new URLSearchParams(window.location.search);
    return getFiltersFromSearchParams(params);
  });

  const [view, setView] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    return getViewFromSearchParams(params);
  });

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Insights data
  const [trendData, setTrendData] = useState<TrendResponse | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null);
  const [sankeyData, setSankeyData] = useState<SankeyResponse | null>(null);
  const [focusData, setFocusData] = useState<FocusItem[]>([]);
  const [deltaData, setDeltaData] = useState<DeltaItem[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const provider: Provider = getProvider(dataMode);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newParams = setFiltersInSearchParams(filters, params);
    const newURL = newParams.toString()
      ? `${window.location.pathname}?${newParams.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newURL);
  }, [filters]);

  // Sync view to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newParams = setViewInSearchParams(view, params);
    const newURL = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, "", newURL);
  }, [view]);

  // Load feedback for Inbox view
  useEffect(() => {
    if (view === "inbox") {
      const currentProvider = getProvider(dataMode);
      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          const [response, focus] = await Promise.all([
            currentProvider.listFeedback(filters),
            currentProvider.getRecommendedFocus(filters),
          ]);
          setFeedbackItems(response.items);
          setTotalCount(response.total);
          setFocusData(focus);
        } catch (err: any) {
          setError(err.message || "Failed to load feedback");
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [view, filters, dataMode]);

  // Load insights data for Insights view
  // IMPORTANT: Only reload when manually changing filters or data mode changes,
  // NOT when clicking a focus card (to prevent recommendations from disappearing)
  useEffect(() => {
    if (view === "insights") {
      loadInsights();
    }
  }, [view, filters, dataMode]);

  const loadFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load feedback items and focus recommendations in parallel
      const [response, focus] = await Promise.all([
        provider.listFeedback(filters),
        provider.getRecommendedFocus(filters),
      ]);
      setFeedbackItems(response.items);
      setTotalCount(response.total);
      setFocusData(focus);
    } catch (err: any) {
      setError(err.message || "Failed to load feedback");
      console.error("Error loading feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setInsightsLoading(true);
    setError(null);
    try {
      const [trend, heatmap, sankey, focus, deltas] = await Promise.all([
        provider.getTrend(filters),
        provider.getHeatmap(filters),
        provider.getSankey(filters),
        provider.getRecommendedFocus(filters),
        provider.getRecentDeltas(filters),
      ]);
      setTrendData(trend);
      setHeatmapData(heatmap);
      setSankeyData(sankey);
      setFocusData(focus);
      setDeltaData(deltas);
    } catch (err: any) {
      setError(err.message || "Failed to load insights");
      console.error("Error loading insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (dataMode !== "live") {
      showToast("Seeding only available in live mode", "error");
      return;
    }

    setSeeding(true);
    try {
      for (const item of seedFeedback) {
        await createFeedback(item);
      }

      // Reload current view
      if (view === "inbox") {
        await loadFeedback();
      } else {
        await loadInsights();
      }

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

  const handleFilterChange = useCallback((newFilters: FeedbackFilters) => {
    setFilters(newFilters);
  }, []);

  const handleViewChange = (newView: string) => {
    setView(newView as ViewMode);
  };

  const handleSourceClick = useCallback((source: string) => {
    setFilters((prev) => ({ ...prev, source }));
  }, []);

  const handleSentimentClick = useCallback((sentiment: string) => {
    setFilters((prev) => ({ ...prev, sentiment }));
  }, []);

  const handleThemeClick = useCallback((clickedTheme: string) => {
    setFilters((prev) => {
      if (prev.theme === clickedTheme) {
        const { theme, ...rest } = prev;
        return rest;
      }
      return { ...prev, theme: clickedTheme };
    });
  }, []);

  const handleItemEnriched = (enrichedItem: FeedbackItem) => {
    setFeedbackItems((items) =>
      items.map((item) => (item.id === enrichedItem.id ? enrichedItem : item))
    );
  };

  const handleFocusClick = useCallback((partialFilters: Partial<FeedbackFilters>) => {
    setFilters((prev) => ({ ...prev, ...partialFilters }));
  }, []);

  const handleDeltaClick = useCallback((theme: string) => {
    setFilters((prev) => ({ ...prev, theme }));
    setView("inbox"); // Switch to Inbox to see filtered results
  }, []);

  // Stats for header
  const stats = {
    total: totalCount,
    new: feedbackItems.filter((f) => f.status === "new").length,
    highUrgency: feedbackItems.filter((f) => f.urgency && f.urgency >= 4).length,
    negative: feedbackItems.filter((f) => f.sentiment === "negative").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 sm:mb-2">
                <img
                  src="/cloudflare-logo.svg"
                  alt="Cloudflare"
                  className="h-6 sm:h-8 w-auto"
                />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                Feedback Intelligence Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Aggregated insights from X, GitHub, Discord, Support, and more
              </p>
            </div>

            {/* Controls - wrap on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={toggleTheme}
                className="p-2 sm:px-3 sm:py-2 text-sm rounded-md border hover:bg-accent transition-colors"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>

              {/* Data mode toggle */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-muted/50 border">
                <span className={`text-xs font-medium ${dataMode === "mock" ? "text-foreground" : "text-muted-foreground"}`}>
                  Mock
                </span>
                <button
                  onClick={() => setDataMode(dataMode === "mock" ? "live" : "mock")}
                  className={`relative w-10 sm:w-11 h-5 sm:h-6 rounded-full transition-colors ${
                    dataMode === "live"
                      ? "bg-orange-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  title="Toggle data mode"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full shadow transition-transform ${
                      dataMode === "live" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${dataMode === "live" ? "text-foreground" : "text-muted-foreground"}`}>
                  Live
                </span>
              </div>

              {dataMode === "live" && (
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {seeding ? "..." : "🌱 Seed"}
                </button>
              )}
            </div>
          </div>

          {/* Stats Row (only show for inbox view) */}
          {view === "inbox" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
              <div className="bg-background rounded-lg p-3 sm:p-4 border">
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3 sm:p-4 border">
                <p className="text-xs sm:text-sm text-muted-foreground">New</p>
                <p className="text-xl sm:text-2xl font-bold text-primary mt-0.5 sm:mt-1">
                  {stats.new}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3 sm:p-4 border">
                <p className="text-xs sm:text-sm text-muted-foreground">Urgent</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-500 mt-0.5 sm:mt-1">
                  {stats.highUrgency}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3 sm:p-4 border">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Negative
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-500 mt-0.5 sm:mt-1">
                  {stats.negative}
                </p>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            variant={view === "insights" ? "compact" : "default"}
          />
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="container mx-auto px-4 py-4 sm:py-8">
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-xs sm:text-sm">
              <strong>Error:</strong> {error}
            </p>
            {dataMode === "live" && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                {window.location.hostname === 'localhost'
                  ? 'Make sure the Worker is running on http://localhost:8787'
                  : 'API request failed. Verify deployed Worker routes are reachable.'}
              </p>
            )}
          </div>
        )}

        <Tabs value={view} onValueChange={handleViewChange}>
          <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto">
            <TabsTrigger value="inbox" className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Inbox Tab */}
          <TabsContent value="inbox">
            {/* Current Focus Strip (shows when a focus is active) */}
            {focusData.length > 0 && (
              <CurrentFocusStrip focusItems={focusData} currentFilters={filters} />
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
                    isLiveMode={dataMode === "live"}
                  />
                ))}
              </div>
            )}

            {!loading && feedbackItems.length === 0 && !error && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">
                  No feedback items found for current filters
                </p>
                {dataMode === "live" && Object.keys(filters).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Click "Seed Data" to add sample feedback items
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            {insightsLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading insights...</p>
              </div>
            )}

            {!insightsLoading && !error && trendData && heatmapData && sankeyData && (
              <div className="space-y-6">
                {/* Delta View (what changed) */}
                <DeltaView
                  items={deltaData}
                  loading={insightsLoading}
                  onDeltaClick={handleDeltaClick}
                />

                {/* Recommended Focus */}
                <RecommendedFocus
                  items={focusData}
                  loading={insightsLoading}
                  onFocusClick={handleFocusClick}
                  currentFilters={filters}
                />

                {/* Trend Chart (full width) */}
                <TrendChart
                  filters={filters}
                  useMockData={dataMode === "mock"}
                />

                {/* Heatmap and Sankey (side by side) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ImpactHeatmap
                    filters={filters}
                    useMockData={dataMode === "mock"}
                    onFilterChange={(partialFilters) =>
                      handleFilterChange({ ...filters, ...partialFilters })
                    }
                  />
                  <SourceThemeSankey
                    filters={filters}
                    useMockData={dataMode === "mock"}
                    onFilterChange={(partialFilters) =>
                      handleFilterChange({ ...filters, ...partialFilters })
                    }
                  />
                </div>
              </div>
            )}

            {!insightsLoading &&
              !error &&
              (!trendData || !heatmapData || !sankeyData) && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">
                    No insights data available for current filters
                  </p>
                  {dataMode === "live" && (
                    <p className="text-sm text-muted-foreground">
                      Try seeding sample data or adjusting your filters
                    </p>
                  )}
                </div>
              )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

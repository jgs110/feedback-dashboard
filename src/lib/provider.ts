import { FeedbackFilters } from "./api";
import { mockFeedback } from "./mockData";
import {
  getFeedback,
  getTrend as apiGetTrend,
  getHeatmap as apiGetHeatmap,
  getSankey as apiGetSankey,
} from "./api";
import type { FeedbackItem as FeedbackItemType } from "@/types/feedback";

export type FeedbackItem = FeedbackItemType;

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

export type SankeyNode = { name: string };
export type SankeyLink = { source: string; target: string; value: number };

export type SankeyResponse = {
  nodes: SankeyNode[];
  links: SankeyLink[];
  totalItemsConsidered: number;
};

export type FocusItem = {
  id: string;
  title: string;
  theme: string;
  source?: string;
  score: number;
  signal: "low" | "medium" | "high";
  explanation: string;
  suggestedAction: "Investigate" | "Monitor" | "Ignore";
  confidence: "low" | "medium" | "high";
  coverageText: string;
  supportingStats: {
    itemCount: number;
    sourceCount: number;
    negativeCount: number;
    windowDays: number;
    recentShare: number;
  };
};

export type DeltaItem = {
  kind: "spike" | "drop" | "new";
  theme: string;
  source?: string;
  countCurrent: number;
  countPrevious: number;
  delta: number;
  label: string;
};

export interface Provider {
  listFeedback(filters: FeedbackFilters): Promise<{ items: FeedbackItem[]; total: number }>;
  getTrend(filters: Omit<FeedbackFilters, "limit" | "offset">): Promise<TrendResponse>;
  getHeatmap(filters: Omit<FeedbackFilters, "theme" | "limit" | "offset">): Promise<HeatmapResponse>;
  getSankey(filters: Omit<FeedbackFilters, "theme" | "limit" | "offset">): Promise<SankeyResponse>;
  getRecommendedFocus(filters: FeedbackFilters): Promise<FocusItem[]>;
  getRecentDeltas(filters: FeedbackFilters): Promise<DeltaItem[]>;
}

// Mock Provider Implementation
function createMockProvider(): Provider {
  return {
    async listFeedback(filters: FeedbackFilters) {
      let filtered = [...mockFeedback];

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
        filtered = filtered.filter((item) => item.themes?.includes(filters.theme!));
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

      return { items: filtered, total: filtered.length };
    },

    async getTrend(filters) {
      const dateCounts: Record<string, number> = {};
      const days = filters.days || 7;

      // Apply filters to mockFeedback
      let filtered = [...mockFeedback];
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
        filtered = filtered.filter((item) => item.themes?.includes(filters.theme!));
      }
      if (filters.q) {
        const query = filters.q.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title?.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query)
        );
      }

      filtered.forEach((item) => {
        const date = item.ingestedAt.split("T")[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      });

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      const points: TrendPoint[] = [];

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        points.push({
          date: dateStr,
          count: dateCounts[dateStr] || 0,
        });
      }

      // Spike detection
      const counts = points.map((p) => p.count);
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 0) {
        points.forEach((point) => {
          const zScore = (point.count - mean) / stdDev;
          if (zScore > 2 && point.count > 0) {
            point.isSpike = true;
          }
        });
      }

      return {
        points,
        windowDays: days,
        totalItemsConsidered: filtered.length,
      };
    },

    async getHeatmap(filters) {
      const themeCounts: Record<string, number> = {};
      const sentiments = ["negative", "neutral", "positive", "unknown"];

      // Apply filters to mockFeedback
      let filtered = [...mockFeedback];
      if (filters.source) {
        filtered = filtered.filter((item) => item.source === filters.source);
      }
      if (filters.sentiment) {
        filtered = filtered.filter((item) => item.sentiment === filters.sentiment);
      }
      if (filters.status) {
        filtered = filtered.filter((item) => item.status === filters.status);
      }
      if (filters.q) {
        const query = filters.q.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title?.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query)
        );
      }

      filtered.forEach((item) => {
        if (item.themes) {
          item.themes.forEach((theme) => {
            themeCounts[theme] = (themeCounts[theme] || 0) + 1;
          });
        }
      });

      const themes = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([theme]) => theme);

      const matrix: number[][] = [];
      for (const theme of themes) {
        const row: number[] = [];
        for (const sent of sentiments) {
          let count = 0;
          for (const item of filtered) {
            if (item.sentiment === sent && item.themes?.includes(theme)) {
              count++;
            }
          }
          row.push(count);
        }
        matrix.push(row);
      }

      return {
        themes,
        sentiments,
        matrix,
        totalItemsConsidered: filtered.length,
      };
    },

    async getSankey(filters) {
      const themeCounts: Record<string, number> = {};
      const sourceThemeCounts: Record<string, Record<string, number>> = {};

      // Apply filters to mockFeedback
      let filtered = [...mockFeedback];
      if (filters.source) {
        filtered = filtered.filter((item) => item.source === filters.source);
      }
      if (filters.sentiment) {
        filtered = filtered.filter((item) => item.sentiment === filters.sentiment);
      }
      if (filters.status) {
        filtered = filtered.filter((item) => item.status === filters.status);
      }
      if (filters.q) {
        const query = filters.q.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title?.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query)
        );
      }

      filtered.forEach((item) => {
        if (item.themes) {
          item.themes.forEach((theme) => {
            themeCounts[theme] = (themeCounts[theme] || 0) + 1;

            if (!sourceThemeCounts[item.source]) {
              sourceThemeCounts[item.source] = {};
            }
            sourceThemeCounts[item.source][theme] =
              (sourceThemeCounts[item.source][theme] || 0) + 1;
          });
        }
      });

      const topThemes = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([theme]) => theme);

      const sources = ["x", "github", "discord", "support", "email", "forum"];
      const nodes = [
        ...sources.map((s) => ({ name: s })),
        ...topThemes.map((t) => ({ name: t })),
      ];

      const links: SankeyLink[] = [];
      for (const source of sources) {
        if (sourceThemeCounts[source]) {
          for (const theme of topThemes) {
            const count = sourceThemeCounts[source][theme] || 0;
            if (count > 0) {
              links.push({ source, target: theme, value: count });
            }
          }
        }
      }

      return {
        nodes,
        links,
        totalItemsConsidered: filtered.length,
      };
    },

    /**
     * Recommended Focus: Heuristic-based prioritization (no ML)
     *
     * Logic:
     * 1. Group feedback by theme
     * 2. For each theme, calculate:
     *    - volume: total items
     *    - negativeRatio: negative items / total items
     *    - recencyScore: 1.5 if majority recent (last 7 days), else 1.0
     * 3. score = volume * (1 + negativeRatio) * recencyScore
     * 4. Return top 3 themes ranked by score
     *
     * Goal: Help PMs prioritize what to investigate first
     * This is decision support, not prediction
     */
    async getRecommendedFocus(filters: FeedbackFilters) {
      // Apply filters to mockFeedback (same logic as other methods)
      let filtered = [...mockFeedback];

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
        filtered = filtered.filter((item) => item.themes?.includes(filters.theme!));
      }
      if (filters.q) {
        const query = filters.q.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title?.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query)
        );
      }

      // Group by theme
      const themeGroups: Record<string, FeedbackItem[]> = {};
      filtered.forEach((item) => {
        if (item.themes) {
          item.themes.forEach((theme) => {
            if (!themeGroups[theme]) {
              themeGroups[theme] = [];
            }
            themeGroups[theme].push(item);
          });
        }
      });

      // Calculate scores for each theme
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const focusItems: FocusItem[] = Object.entries(themeGroups).map(([theme, items]) => {
        // Volume
        const volume = items.length;

        // Negative ratio
        const negativeCount = items.filter((item) => item.sentiment === "negative").length;
        const negativeRatio = volume > 0 ? negativeCount / volume : 0;

        // Recency score
        const recentCount = items.filter((item) => {
          const itemDate = new Date(item.ingestedAt);
          return itemDate >= sevenDaysAgo;
        }).length;
        const isRecentMajority = recentCount / volume > 0.5;
        const recencyMultiplier = isRecentMajority ? 1.5 : 1.0;

        // Combined score
        const score = volume * (1 + negativeRatio) * recencyMultiplier;

        // Determine signal level
        let signal: "low" | "medium" | "high";
        if (score >= 10) signal = "high";
        else if (score >= 5) signal = "medium";
        else signal = "low";

        // Determine suggested action
        let suggestedAction: "Investigate" | "Monitor" | "Ignore";
        if (signal === "high") suggestedAction = "Investigate";
        else if (signal === "medium") suggestedAction = "Monitor";
        else suggestedAction = "Ignore";

        // Build explanation
        const negativePercent = Math.round(negativeRatio * 100);
        const recentPercent = Math.round((recentCount / volume) * 100);
        const explanation = `${volume} items, ${negativePercent}% negative, ${recentPercent}% recent`;

        // Find most common source for this theme
        const sourceCounts: Record<string, number> = {};
        items.forEach((item) => {
          sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
        });
        const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const sourceCount = Object.keys(sourceCounts).length;

        // Calculate recentShare (what portion of items are recent)
        const recentShare = volume > 0 ? recentCount / volume : 0;

        // Calculate confidence (heuristic-based)
        // High: Large sample, multiple sources, stable signal (not just a burst)
        // Medium: Moderate sample, at least one source, reasonably recent
        // Low: Small sample, single source, or mostly old data
        let confidence: "low" | "medium" | "high";
        if (volume >= 10 && sourceCount >= 2 && recentShare >= 0.6) {
          confidence = "high";
        } else if (volume >= 5 && sourceCount >= 1 && recentShare >= 0.4) {
          confidence = "medium";
        } else {
          confidence = "low";
        }

        // Build coverage text
        const windowDays = 7; // Fixed to 7 days for now
        const coverageText = `${volume} items • ${sourceCount} ${
          sourceCount === 1 ? "source" : "sources"
        } • last ${windowDays} days`;

        return {
          id: `focus-${theme}`,
          title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} feedback`,
          theme,
          source: topSource,
          score,
          signal,
          explanation,
          suggestedAction,
          confidence,
          coverageText,
          supportingStats: {
            itemCount: volume,
            sourceCount,
            negativeCount,
            windowDays,
            recentShare,
          },
        };
      });

      // Sort by score and return top 3
      return focusItems.sort((a, b) => b.score - a.score).slice(0, 3);
    },

    /**
     * Mock mode: Compute deltas between last 24h and previous 24h (24-48h ago)
     */
    async getRecentDeltas(filters: FeedbackFilters) {
      // Apply filters first
      let filtered = [...mockFeedback];

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
        filtered = filtered.filter((item) => item.themes?.includes(filters.theme!));
      }
      if (filters.q) {
        const query = filters.q.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title?.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query)
        );
      }

      // Define time windows
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Separate into current and previous windows
      const currentWindow = filtered.filter((item) => {
        const itemDate = new Date(item.ingestedAt);
        return itemDate >= oneDayAgo && itemDate <= now;
      });

      const previousWindow = filtered.filter((item) => {
        const itemDate = new Date(item.ingestedAt);
        return itemDate >= twoDaysAgo && itemDate < oneDayAgo;
      });

      // Group by theme for both windows
      const currentThemeCounts: Record<string, number> = {};
      const previousThemeCounts: Record<string, number> = {};

      currentWindow.forEach((item) => {
        if (item.themes) {
          item.themes.forEach((theme) => {
            currentThemeCounts[theme] = (currentThemeCounts[theme] || 0) + 1;
          });
        }
      });

      previousWindow.forEach((item) => {
        if (item.themes) {
          item.themes.forEach((theme) => {
            previousThemeCounts[theme] = (previousThemeCounts[theme] || 0) + 1;
          });
        }
      });

      // Calculate deltas
      const allThemes = new Set([
        ...Object.keys(currentThemeCounts),
        ...Object.keys(previousThemeCounts),
      ]);

      const deltas: Array<{
        theme: string;
        countCurrent: number;
        countPrevious: number;
        delta: number;
      }> = [];

      allThemes.forEach((theme) => {
        const countCurrent = currentThemeCounts[theme] || 0;
        const countPrevious = previousThemeCounts[theme] || 0;
        const delta = countCurrent - countPrevious;

        deltas.push({ theme, countCurrent, countPrevious, delta });
      });

      // Find top spike, drop, and new theme
      const results: DeltaItem[] = [];

      // Top spike (delta >= +2)
      const spike = deltas
        .filter((d) => d.delta >= 2)
        .sort((a, b) => b.delta - a.delta)[0];

      if (spike) {
        results.push({
          kind: "spike",
          theme: spike.theme,
          countCurrent: spike.countCurrent,
          countPrevious: spike.countPrevious,
          delta: spike.delta,
          label: `🔺 ${spike.theme.charAt(0).toUpperCase() + spike.theme.slice(1)} feedback increased (+${spike.delta})`,
        });
      }

      // Top drop (delta <= -2)
      const drop = deltas
        .filter((d) => d.delta <= -2)
        .sort((a, b) => a.delta - b.delta)[0];

      if (drop) {
        results.push({
          kind: "drop",
          theme: drop.theme,
          countCurrent: drop.countCurrent,
          countPrevious: drop.countPrevious,
          delta: drop.delta,
          label: `🔻 ${drop.theme.charAt(0).toUpperCase() + drop.theme.slice(1)} feedback decreased (${drop.delta})`,
        });
      }

      // New theme (countCurrent >= 2, countPrevious = 0)
      const newTheme = deltas
        .filter((d) => d.countCurrent >= 2 && d.countPrevious === 0)
        .sort((a, b) => b.countCurrent - a.countCurrent)[0];

      if (newTheme) {
        results.push({
          kind: "new",
          theme: newTheme.theme,
          countCurrent: newTheme.countCurrent,
          countPrevious: newTheme.countPrevious,
          delta: newTheme.delta,
          label: `🆕 New theme detected: ${newTheme.theme.charAt(0).toUpperCase() + newTheme.theme.slice(1)} (${newTheme.countCurrent} items)`,
        });
      }

      return results;
    },
  };
}

// Live Provider Implementation
function createLiveProvider(): Provider {
  // Production uses same-origin (""), local dev can override with VITE_API_BASE_URL
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

  return {
    async listFeedback(filters: FeedbackFilters) {
      return await getFeedback(filters);
    },

    async getTrend(filters) {
      return await apiGetTrend(filters);
    },

    async getHeatmap(filters) {
      return await apiGetHeatmap(filters);
    },

    async getSankey(filters) {
      return await apiGetSankey(filters);
    },

    /**
     * Live mode: Call Worker API for recommended focus (with KV caching)
     */
    async getRecommendedFocus(filters: FeedbackFilters) {
      const url = new URL(`${API_BASE}/api/insights/recommended`, window.location.origin);

      if (filters.source) url.searchParams.set('source', filters.source);
      if (filters.sentiment) url.searchParams.set('sentiment', filters.sentiment);
      if (filters.status) url.searchParams.set('status', filters.status);
      if (filters.theme) url.searchParams.set('theme', filters.theme);
      if (filters.q) url.searchParams.set('q', filters.q);
      if (filters.days !== undefined) url.searchParams.set('days', filters.days.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
        throw new Error(error.error || 'Failed to fetch recommended focus');
      }

      return await response.json();
    },

    /**
     * Live mode: Call Worker API for deltas (with KV caching)
     */
    async getRecentDeltas(filters: FeedbackFilters) {
      const url = new URL(`${API_BASE}/api/insights/deltas`, window.location.origin);

      if (filters.source) url.searchParams.set('source', filters.source);
      if (filters.sentiment) url.searchParams.set('sentiment', filters.sentiment);
      if (filters.status) url.searchParams.set('status', filters.status);
      if (filters.theme) url.searchParams.set('theme', filters.theme);
      if (filters.q) url.searchParams.set('q', filters.q);
      if (filters.days !== undefined) url.searchParams.set('days', filters.days.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;
        throw new Error(error.error || 'Failed to fetch deltas');
      }

      return await response.json();
    },
  };
}

export type DataMode = "mock" | "live";

export function getProvider(mode: DataMode): Provider {
  if (mode === "mock") {
    return createMockProvider();
  }
  return createLiveProvider();
}

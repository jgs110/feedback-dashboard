import { useState, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSankey, FeedbackFilters, SankeyResponse } from "@/lib/api";
import { mockFeedback } from "@/lib/mockData";
import { GitBranch } from "lucide-react";

interface SourceThemeSankeyProps {
  filters?: Omit<FeedbackFilters, "theme" | "limit" | "offset">;
  useMockData?: boolean;
  onFilterChange?: (filters: Partial<FeedbackFilters>) => void;
}

// Generate mock Sankey data from mockFeedback with filters applied
function generateMockSankey(filters: Omit<FeedbackFilters, "theme" | "limit" | "offset">): SankeyResponse {
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

  // Count theme frequencies and source-theme relationships from filtered data
  filtered.forEach(item => {
    if (item.themes) {
      item.themes.forEach(theme => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;

        if (!sourceThemeCounts[item.source]) {
          sourceThemeCounts[item.source] = {};
        }
        sourceThemeCounts[item.source][theme] = (sourceThemeCounts[item.source][theme] || 0) + 1;
      });
    }
  });

  // Get top 15 themes
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([theme]) => theme);

  // Build nodes: sources + themes
  const sources = ["x", "github", "discord", "support", "email", "forum"];
  const nodes = [
    ...sources.map(s => ({ name: s })),
    ...topThemes.map(t => ({ name: t })),
  ];

  // Build links: source -> theme connections
  const links: { source: string; target: string; value: number }[] = [];
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
}

export function SourceThemeSankey({ filters, useMockData = false, onFilterChange }: SourceThemeSankeyProps) {
  const [data, setData] = useState<SankeyResponse | null>(null);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  // Define constants and helpers before any returns
  const sources = ["x", "github", "discord", "support", "email", "forum"];

  const getComputedColor = (variable: string) => {
    if (typeof window === 'undefined') return '#000';
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(variable).trim();
    return value ? `hsl(${value})` : '#000';
  };

  useEffect(() => {
    if (useMockData) {
      const mockData = generateMockSankey(filters || {});
      setData(mockData);
      setError(null);
    } else {
      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getSankey(filters);
          setData(result);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [useMockData, filters?.source, filters?.sentiment, filters?.status, filters?.q, filters?.days]);

  const option = useMemo(() => {
    if (!data) return {};

    return {
      series: [
        {
          type: "sankey",
          layout: "none",
          emphasis: {
            focus: "adjacency",
          },
          data: data.nodes.map((node) => {
            const isSource = sources.includes(node.name);
            return {
              ...node,
              itemStyle: {
                color: isSource ? "rgba(160, 160, 160, 0.9)" : "#FF6633",
                borderColor: getComputedColor('--border'),
                borderWidth: 2,
              },
              label: {
                color: getComputedColor('--foreground'),
                fontWeight: 600,
                fontSize: 13,
              },
            };
          }),
          links: data.links.map((link) => ({
            ...link,
            lineStyle: {
              color: "source",
              opacity: 0.4,
            },
          })),
          lineStyle: {
            color: "source",
            curveness: 0.5,
            opacity: 0.4,
          },
        },
      ],
      tooltip: {
        trigger: "item",
        backgroundColor: getComputedColor('--popover'),
        borderColor: getComputedColor('--border'),
        textStyle: {
          color: getComputedColor('--popover-foreground'),
        },
        formatter: (params: any) => {
          if (params.dataType === "edge") {
            return `<div style="font-weight: 500;">${params.data.source} → ${params.data.target}</div><div>${params.data.value} feedback items</div>`;
          } else {
            return `<div style="font-weight: 500;">${params.data.name}</div>`;
          }
        },
      },
    };
  }, [data, sources]);

  const onChartClick = (params: any) => {
    if (params.dataType === "node") {
      const nodeName = params.data.name;
      const isSource = sources.includes(nodeName);

      if (isSource) {
        // Clicked on a source node
        onFilterChange?.({ source: nodeName });
      } else {
        // Clicked on a theme node
        onFilterChange?.({ theme: nodeName });
      }
    }
  };


  if (!data || data.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Source → Theme Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available for the selected filters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-sm sm:text-base">Source Flow</span>
          </div>
          <span className="text-xs font-normal text-muted-foreground">
            {data.totalItemsConsidered} items
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <ReactECharts
          option={option}
          style={{ height: "280px" }}
          className="sm:!h-[400px]"
          onEvents={{ click: onChartClick }}
        />
      </CardContent>
    </Card>
  );
}

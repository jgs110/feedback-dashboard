import { useState, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getHeatmap, FeedbackFilters, HeatmapResponse } from "@/lib/api";
import { mockFeedback } from "@/lib/mockData";
import { Grid } from "lucide-react";

interface ImpactHeatmapProps {
  filters?: Omit<FeedbackFilters, "theme" | "limit" | "offset">;
  useMockData?: boolean;
  onFilterChange?: (filters: Partial<FeedbackFilters>) => void;
}

// Generate mock heatmap from mockFeedback with filters applied
function generateMockHeatmap(filters: Omit<FeedbackFilters, "theme" | "limit" | "offset">): HeatmapResponse {
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

  // Count themes from filtered data
  filtered.forEach(item => {
    if (item.themes) {
      item.themes.forEach(theme => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    }
  });

  // Get top themes
  const themes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([theme]) => theme);

  // Build matrix from filtered data
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
}

export function ImpactHeatmap({ filters, useMockData = false, onFilterChange }: ImpactHeatmapProps) {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  // Define helper function before any returns
  const getComputedColor = (variable: string) => {
    if (typeof window === 'undefined') return '#000';
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(variable).trim();
    return value ? `hsl(${value})` : '#000';
  };

  useEffect(() => {
    if (useMockData) {
      const mockData = generateMockHeatmap(filters || {});
      setData(mockData);
      setError(null);
    } else {
      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getHeatmap(filters);
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

    // Convert matrix to ECharts heatmap format: [[x, y, value], ...]
    const heatmapData: any[] = [];
    data.themes.forEach((_theme, themeIndex) => {
      data.sentiments.forEach((_sentiment, sentimentIndex) => {
        heatmapData.push([sentimentIndex, themeIndex, data.matrix[themeIndex][sentimentIndex]]);
      });
    });

    return {
      grid: {
        left: "80px",
        right: "10px",
        top: "10px",
        bottom: "50px",
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: data.sentiments,
        axisLabel: {
          color: getComputedColor('--muted-foreground'),
          rotate: 0,
        },
        axisLine: {
          lineStyle: {
            color: getComputedColor('--border'),
          },
        },
      },
      yAxis: {
        type: "category",
        data: data.themes,
        axisLabel: {
          color: getComputedColor('--muted-foreground'),
        },
        axisLine: {
          lineStyle: {
            color: getComputedColor('--border'),
          },
        },
      },
      visualMap: {
        min: 0,
        max: Math.max(...heatmapData.map((d) => d[2]), 1),
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "0px",
        inRange: {
          color: ["rgba(128, 128, 128, 0.2)", "rgba(255, 102, 51, 0.5)", "#FF6633"],
        },
        textStyle: {
          color: getComputedColor('--muted-foreground'),
        },
      },
      series: [
        {
          type: "heatmap",
          data: heatmapData,
          label: {
            show: true,
            color: getComputedColor('--foreground'),
          },
          emphasis: {
            itemStyle: {
              borderColor: "#FF6633",
              borderWidth: 2,
            },
          },
        },
      ],
      tooltip: {
        position: "top",
        backgroundColor: getComputedColor('--popover'),
        borderColor: getComputedColor('--border'),
        textStyle: {
          color: getComputedColor('--popover-foreground'),
        },
        formatter: (params: any) => {
          const sentiment = data.sentiments[params.data[0]];
          const theme = data.themes[params.data[1]];
          const count = params.data[2];
          return `<div style="font-weight: 500;">${theme}</div><div>${sentiment}: ${count}</div>`;
        },
      },
    };
  }, [data]);

  const onChartClick = (params: any) => {
    if (params.componentType === "series" && data) {
      const sentiment = data.sentiments[params.data[0]];
      const theme = data.themes[params.data[1]];
      onFilterChange?.({ theme, sentiment });
    }
  };


  if (!data || data.themes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5 text-primary" />
            Theme × Sentiment Impact Matrix
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
            <Grid className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-sm sm:text-base">Impact Matrix</span>
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

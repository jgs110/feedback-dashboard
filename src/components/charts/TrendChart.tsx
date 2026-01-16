import { useState, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getTrend, FeedbackFilters, TrendResponse } from "@/lib/api";
import { mockFeedback } from "@/lib/mockData";
import { TrendingUp } from "lucide-react";

interface TrendChartProps {
  filters?: Omit<FeedbackFilters, "limit" | "offset">;
  useMockData?: boolean;
}

// Generate mock trend data from mockFeedback with filters applied
function generateMockTrend(filters: Omit<FeedbackFilters, "limit" | "offset">): TrendResponse {
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

  const dateCounts: Record<string, number> = {};

  filtered.forEach(item => {
    const date = item.ingestedAt.split('T')[0];
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  const points: { date: string; count: number; isSpike?: boolean }[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    points.push({
      date: dateStr,
      count: dateCounts[dateStr] || 0,
    });
  }

  // Simple spike detection
  const counts = points.map(p => p.count);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev > 0) {
    points.forEach(point => {
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
}

export function TrendChart({ filters, useMockData = false }: TrendChartProps) {
  const [data, setData] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get computed CSS variables for dark mode compatibility - define before any returns
  const getComputedColor = (variable: string) => {
    if (typeof window === 'undefined') return '#000';
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(variable).trim();
    return value ? `hsl(${value})` : '#000';
  };

  useEffect(() => {
    if (useMockData) {
      // Use mock data with filters
      const mockData = generateMockTrend(filters || {});
      setData(mockData);
      setError(null);
    } else {
      // Fetch from API
      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getTrend(filters);
          setData(result);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [useMockData, filters?.source, filters?.sentiment, filters?.status, filters?.theme, filters?.q, filters?.days]);

  const option = useMemo(() => {
    if (!data) return {};

    return {
      grid: {
        left: "50px",
        right: "20px",
        top: "40px",
        bottom: "40px",
      },
      xAxis: {
        type: "category",
        data: data.points.map((p) => p.date),
        axisLabel: {
          rotate: 45,
          color: getComputedColor('--muted-foreground'),
        },
        axisLine: {
          lineStyle: {
            color: getComputedColor('--border'),
          },
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: getComputedColor('--muted-foreground'),
        },
        axisLine: {
          lineStyle: {
            color: getComputedColor('--border'),
          },
        },
        splitLine: {
          lineStyle: {
            color: getComputedColor('--border'),
            type: "dashed",
          },
        },
      },
      series: [
        {
          type: "line",
          data: data.points.map((p) => p.count),
          smooth: true,
          lineStyle: {
            color: "#FF6633", // Cloudflare orange (fixed color works in both modes)
            width: 2,
          },
          itemStyle: {
            color: "#FF6633",
          },
          markPoint: {
            data: data.points
              .map((p, index) => (p.isSpike ? { coord: [index, p.count], value: p.count } : null))
              .filter(Boolean),
            symbol: "pin",
            symbolSize: 50,
            itemStyle: {
              color: "#FF6633",
            },
            label: {
              show: true,
              formatter: "{c}",
              color: "#fff",
            },
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(255, 102, 51, 0.3)" },
                { offset: 1, color: "rgba(255, 102, 51, 0.05)" },
              ],
            },
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        backgroundColor: getComputedColor('--popover'),
        borderColor: getComputedColor('--border'),
        textStyle: {
          color: getComputedColor('--popover-foreground'),
        },
        formatter: (params: any) => {
          const param = params[0];
          const point = data.points[param.dataIndex];
          let content = `<div style="font-weight: 500;">${param.axisValue}</div>`;
          content += `<div>Feedback: ${param.value}</div>`;
          if (point.isSpike) {
            content += `<div style="color: #FF6633;">⚠ Spike detected</div>`;
          }
          return content;
        },
      },
    };
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Feedback Volume Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null; // Silently fail if API isn't available
  }

  if (!data || data.points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Feedback Volume Trend
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Feedback Volume Trend
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {data.totalItemsConsidered} items, {data.windowDays}d window
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: "300px" }} />
      </CardContent>
    </Card>
  );
}

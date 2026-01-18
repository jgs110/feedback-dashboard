import { FocusItem } from "@/lib/provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, AlertCircle, Eye } from "lucide-react";
import { FeedbackFilters } from "@/lib/api";
import { isFocusActive } from "@/lib/focusHelpers";

interface RecommendedFocusProps {
  items: FocusItem[];
  loading?: boolean;
  onFocusClick: (filters: Partial<FeedbackFilters>) => void;
  currentFilters?: FeedbackFilters;
}

export function RecommendedFocus({ items, loading, onFocusClick, currentFilters }: RecommendedFocusProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recommended Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recommended Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Not enough data to recommend focus areas yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "high":
        return "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900";
      case "medium":
        return "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-900";
      case "low":
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "Investigate":
        return <AlertCircle className="h-4 w-4" />;
      case "Monitor":
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-900";
      case "medium":
        return "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-900";
      case "low":
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-sm sm:text-base">Recommended Focus</span>
          </div>
          <span className="text-xs font-normal text-muted-foreground sm:ml-auto">
            Based on volume, sentiment, and recency
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item, index) => {
            const isActive = currentFilters ? isFocusActive(item, currentFilters) : false;
            return (
            <button
              key={item.id}
              onClick={() => onFocusClick({ theme: item.theme, sentiment: "negative" })}
              className={`text-left p-3 sm:p-4 rounded-lg border transition-colors ${
                isActive
                  ? "bg-muted/50 opacity-75 cursor-default"
                  : "bg-card hover:bg-accent cursor-pointer"
              }`}
            >
              {/* Rank badge */}
              <div className="flex items-start justify-between mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {index + 1}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full border ${getSignalColor(
                    item.signal
                  )}`}
                >
                  {getActionIcon(item.suggestedAction)}
                  <span className="hidden sm:inline">{item.suggestedAction}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">{item.title}</h3>

              {/* Explanation */}
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{item.explanation}</p>

              {/* Badges row: Active State + Confidence + Source */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                {isActive && (
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-md border bg-primary/10 text-primary border-primary/20">
                    Active
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-md border ${getConfidenceColor(
                    item.confidence
                  )}`}
                >
                  {item.confidence.charAt(0).toUpperCase() + item.confidence.slice(1)}
                </span>
                {item.source && (
                  <span className="hidden sm:inline-block px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground">
                    {item.source}
                  </span>
                )}
              </div>

              {/* Coverage text */}
              <p className="text-xs text-muted-foreground line-clamp-1">{item.coverageText}</p>
            </button>
          );
          })}
        </div>

        {/* Help text - hidden on mobile */}
        <div className="hidden sm:block mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>How this works:</strong> Recommendations use simple heuristics (not ML) to
            prioritize themes based on feedback volume, negative sentiment ratio, and recency.
            <strong> Confidence</strong> reflects sample size, source diversity, and signal stability—helping
            you avoid overreacting to small or single-channel spikes. Click any card to filter the
            dashboard and investigate further. <strong>Focus items persist</strong> after clicking to provide
            stable guidance—active items are visually de-emphasized but remain visible.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { DeltaItem } from "@/lib/provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface DeltaViewProps {
  items: DeltaItem[];
  loading?: boolean;
  onDeltaClick: (theme: string) => void;
}

export function DeltaView({ items, loading, onDeltaClick }: DeltaViewProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What Changed in the Last 24 Hours?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading recent changes...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What Changed in the Last 24 Hours?
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              Compared to the previous 24 hours
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No meaningful changes detected in the last 24 hours for the current filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (kind: string) => {
    switch (kind) {
      case "spike":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "drop":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case "new":
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getKindColor = (kind: string) => {
    switch (kind) {
      case "spike":
        return "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30";
      case "drop":
        return "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30";
      case "new":
        return "border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30";
      default:
        return "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          What Changed in the Last 24 Hours?
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            Compared to the previous 24 hours
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={`${item.kind}-${item.theme}`}
              onClick={() => onDeltaClick(item.theme)}
              className={`w-full text-left p-3 rounded-lg border transition-colors hover:opacity-90 cursor-pointer ${getKindColor(
                item.kind
              )}`}
            >
              <div className="flex items-start gap-3">
                {getIcon(item.kind)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {item.countCurrent} items • Previous: {item.countPrevious} items
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Help text */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>How this works:</strong> This section compares feedback volume in the last 24 hours
            against the previous 24 hours (24–48h ago). It highlights spikes (≥+2 items), drops (≥–2 items),
            and newly detected themes (≥2 items with no prior activity). Click any item to investigate that
            theme in the Inbox.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

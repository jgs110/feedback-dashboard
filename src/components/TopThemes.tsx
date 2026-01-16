import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getTopThemes, FeedbackFilters, ThemesResponse } from "@/lib/api";
import { Hash } from "lucide-react";

interface TopThemesProps {
  filters?: Omit<FeedbackFilters, "theme" | "offset">;
  onThemeClick?: (theme: string) => void;
  activeTheme?: string;
}

export function TopThemes({ filters, onThemeClick, activeTheme }: TopThemesProps) {
  const [themesData, setThemesData] = useState<ThemesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTopThemes(filters);
      setThemesData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThemes();
  }, [filters?.source, filters?.sentiment, filters?.status, filters?.q, filters?.days]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5" />
            Top Themes
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

  if (!themesData || themesData.themes.length === 0) {
    return null; // Don't show if no themes
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hash className="h-5 w-5 text-primary" />
          Top Themes
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {themesData.totalItemsConsidered} items, {themesData.windowDays}d window
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {themesData.themes.map(({ theme, count }) => (
            <button
              key={theme}
              onClick={() => onThemeClick?.(theme)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeTheme === theme
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <span className="font-medium">{theme}</span>
              <span className={activeTheme === theme ? "opacity-90" : "text-muted-foreground"}>
                ({count})
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

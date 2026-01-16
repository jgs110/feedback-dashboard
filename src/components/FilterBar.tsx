import { FeedbackFilters } from "@/lib/api";
import { Search, X } from "lucide-react";

interface FilterBarProps {
  filters: FeedbackFilters;
  onFilterChange: (filters: FeedbackFilters) => void;
  variant?: "default" | "compact";
}

export function FilterBar({ filters, onFilterChange, variant = "default" }: FilterBarProps) {
  const isCompact = variant === "compact";
  const updateFilter = (key: keyof FeedbackFilters, value: string | number | undefined) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof FeedbackFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFilterChange(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const selectClass = isCompact
    ? "px-2 py-1 text-xs rounded border bg-muted/30 hover:bg-muted/50 transition-colors"
    : "px-3 py-2 text-sm rounded-md border bg-background hover:bg-accent transition-colors";

  const searchClass = isCompact
    ? "w-full pl-7 pr-2 py-1 text-xs rounded border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
    : "w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  const buttonClass = isCompact
    ? "px-2 py-1 text-xs rounded border hover:bg-muted/50 transition-colors flex items-center gap-1"
    : "px-3 py-2 text-sm rounded-md border hover:bg-accent transition-colors flex items-center gap-1.5";

  return (
    <div className={isCompact ? "space-y-2" : "space-y-3"}>
      {/* Filter Controls */}
      <div className={isCompact ? "flex flex-wrap gap-2" : "flex flex-wrap gap-3"}>
        {/* Source Filter */}
        <select
          value={filters.source || ""}
          onChange={(e) => updateFilter("source", e.target.value || undefined)}
          className={selectClass}
        >
          <option value="">All Sources</option>
          <option value="x">X</option>
          <option value="github">GitHub</option>
          <option value="discord">Discord</option>
          <option value="support">Support</option>
          <option value="email">Email</option>
          <option value="forum">Forum</option>
        </select>

        {/* Sentiment Filter */}
        <select
          value={filters.sentiment || ""}
          onChange={(e) => updateFilter("sentiment", e.target.value || undefined)}
          className={selectClass}
        >
          <option value="">All Sentiment</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
          <option value="positive">Positive</option>
          <option value="unknown">Unscored</option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.status || ""}
          onChange={(e) => updateFilter("status", e.target.value || undefined)}
          className={selectClass}
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="triaged">Triaged</option>
          <option value="ignored">Ignored</option>
        </select>

        {/* Time Window Filter */}
        <select
          value={filters.days !== undefined ? filters.days.toString() : "7"}
          onChange={(e) => updateFilter("days", parseInt(e.target.value))}
          className={selectClass}
        >
          <option value="1">Last 24h</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="0">All time</option>
        </select>

        {/* Search Input */}
        <div className={isCompact ? "relative flex-1 min-w-[180px]" : "relative flex-1 min-w-[200px]"}>
          <Search className={isCompact ? "absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" : "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"} />
          <input
            type="text"
            placeholder={isCompact ? "Search..." : "Search feedback..."}
            value={filters.q || ""}
            onChange={(e) => updateFilter("q", e.target.value || undefined)}
            className={searchClass}
          />
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className={buttonClass}
          >
            <X className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {!isCompact && "Clear All"}
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {(filters.theme) && (
        <div className="flex flex-wrap gap-2">
          {filters.theme && (
            <div className={isCompact ? "inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20" : "inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full bg-primary/10 text-primary border border-primary/20"}>
              <span className="font-medium">theme:</span>
              <span>{filters.theme}</span>
              <button
                onClick={() => clearFilter("theme")}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className={isCompact ? "h-2.5 w-2.5" : "h-3 w-3"} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

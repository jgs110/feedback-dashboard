import { FocusItem } from "@/lib/provider";
import { FeedbackFilters } from "@/lib/api";
import { isFocusActive } from "@/lib/focusHelpers";
import { Target } from "lucide-react";

interface CurrentFocusStripProps {
  focusItems: FocusItem[];
  currentFilters: FeedbackFilters;
}

export function CurrentFocusStrip({ focusItems, currentFilters }: CurrentFocusStripProps) {
  // Find the active focus item
  const activeFocus = focusItems.find((item) => isFocusActive(item, currentFilters));

  // Don't render if no active focus
  if (!activeFocus) {
    return null;
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "text-green-700 dark:text-green-400";
      case "medium":
        return "text-blue-700 dark:text-blue-400";
      case "low":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="mb-3 sm:mb-4 px-3 sm:px-4 py-2 rounded-lg border bg-primary/5 border-primary/20">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
        <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
        <span className="font-medium text-foreground">Focus:</span>
        <span className="text-foreground">{activeFocus.title}</span>
        <span className="hidden sm:inline text-muted-foreground">•</span>
        <span className={`hidden sm:inline font-medium ${getConfidenceColor(activeFocus.confidence)}`}>
          {activeFocus.confidence.charAt(0).toUpperCase() + activeFocus.confidence.slice(1)}
        </span>
        <span className="text-muted-foreground ml-auto text-xs hidden sm:inline">{activeFocus.coverageText}</span>
      </div>
    </div>
  );
}

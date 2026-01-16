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
    <div className="mb-4 px-4 py-2 rounded-lg border bg-primary/5 border-primary/20">
      <div className="flex items-center gap-2 text-sm">
        <Target className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">Current focus:</span>
        <span className="text-foreground">{activeFocus.title}</span>
        <span className="text-muted-foreground">•</span>
        <span className={`font-medium ${getConfidenceColor(activeFocus.confidence)}`}>
          {activeFocus.confidence.charAt(0).toUpperCase() + activeFocus.confidence.slice(1)} confidence
        </span>
        <span className="text-muted-foreground ml-auto text-xs">{activeFocus.coverageText}</span>
      </div>
    </div>
  );
}

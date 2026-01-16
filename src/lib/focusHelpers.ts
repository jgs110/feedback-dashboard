import { FocusItem } from "./provider";
import { FeedbackFilters } from "./api";

/**
 * Determines if a focus item is currently "active" based on applied filters
 *
 * A focus is active when current filters match:
 * - theme === focus.theme
 * - sentiment === "negative" (if applicable to focus)
 * - source === focus.source (if focus has a primary source)
 *
 * @param focus The focus item to check
 * @param filters Current dashboard filters
 * @returns true if the focus item is currently active
 */
export function isFocusActive(focus: FocusItem, filters: FeedbackFilters): boolean {
  // Check theme match
  if (filters.theme !== focus.theme) {
    return false;
  }

  // Check sentiment (negative is expected for focus items)
  if (filters.sentiment !== "negative") {
    return false;
  }

  // Check source if focus has a primary source
  if (focus.source && filters.source !== focus.source) {
    return false;
  }

  return true;
}

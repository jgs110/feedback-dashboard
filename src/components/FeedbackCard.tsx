import { useState } from "react";
import { FeedbackItem, Sentiment } from "@/types/feedback";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Github,
  Hash,
  Mail,
  Headphones,
  ExternalLink,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { enrichFeedback } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

// Source icon mapping
const sourceIcons = {
  x: MessageSquare,
  github: Github,
  discord: Hash,
  support: Headphones,
  email: Mail,
  forum: MessageSquare,
};

// Sentiment variant mapping for badges
const sentimentVariants: Record<Sentiment, "positive" | "negative" | "neutral" | "unknown"> = {
  positive: "positive",
  negative: "negative",
  neutral: "neutral",
  unknown: "unknown",
};

// Urgency colors (using Tailwind classes)
const urgencyColors = {
  1: "text-gray-400",
  2: "text-blue-500",
  3: "text-yellow-500",
  4: "text-orange-500",
  5: "text-red-500",
};

interface FeedbackCardProps {
  item: FeedbackItem;
  onEnriched?: (enrichedItem: FeedbackItem) => void;
  onSourceClick?: (source: string) => void;
  onSentimentClick?: (sentiment: string) => void;
  onThemeClick?: (theme: string) => void;
}

export function FeedbackCard({ item, onEnriched, onSourceClick, onSentimentClick, onThemeClick }: FeedbackCardProps) {
  const { showToast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [localItem, setLocalItem] = useState(item);

  const SourceIcon = sourceIcons[localItem.source];
  const urgencyColor = localItem.urgency ? urgencyColors[localItem.urgency] : "text-gray-400";

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const enrichedItem = await enrichFeedback(localItem.id);
      setLocalItem(enrichedItem);
      if (onEnriched) {
        onEnriched(enrichedItem);
      }
      showToast('Feedback analyzed successfully!', 'success');
    } catch (error: any) {
      showToast('Failed to analyze: ' + error.message, 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const needsAnalysis = !localItem.summary;

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5">
              <SourceIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge
                  variant="outline"
                  className="capitalize cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onSourceClick?.(localItem.source)}
                >
                  {localItem.source}
                </Badge>
                <Badge
                  variant={sentimentVariants[localItem.sentiment]}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSentimentClick?.(localItem.sentiment)}
                >
                  {localItem.sentiment}
                </Badge>
                {localItem.status === "new" && (
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                    New
                  </Badge>
                )}
                {localItem.urgency && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className={`h-3.5 w-3.5 ${urgencyColor}`} />
                    <span className={`text-xs font-medium ${urgencyColor}`}>
                      P{localItem.urgency}
                    </span>
                  </div>
                )}
              </div>
              {localItem.title && (
                <h3 className="font-semibold text-base mb-1 line-clamp-1">
                  {localItem.title}
                </h3>
              )}
              {localItem.authorHandle && (
                <p className="text-sm text-muted-foreground">
                  {localItem.authorHandle} · {formatRelativeTime(localItem.createdAt)}
                </p>
              )}
              {!localItem.authorHandle && (
                <p className="text-sm text-muted-foreground">
                  {formatRelativeTime(localItem.createdAt)}
                </p>
              )}
            </div>
          </div>
          {localItem.url && (
            <a
              href={localItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Analyze Button */}
        {needsAnalysis && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {analyzing ? 'Analyzing...' : 'Analyze with AI'}
          </button>
        )}

        {/* AI Summary - with graceful handling for missing summaries */}
        {localItem.summary ? (
          <div className="bg-orange-50 rounded-md p-3 border border-orange-200">
            <div className="flex items-start gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-orange-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-900 uppercase tracking-wide">
                AI Summary
              </span>
            </div>
            <p className="text-sm text-orange-950 leading-relaxed ml-5">
              {localItem.summary}
            </p>
          </div>
        ) : !needsAnalysis ? (
          <div className="bg-muted/30 rounded-md p-3 border-l-2 border-gray-300">
            <p className="text-sm text-muted-foreground italic">
              Not analyzed yet
            </p>
          </div>
        ) : null}

        {/* Original Content */}
        <p className="text-sm text-foreground/90 line-clamp-3">
          {localItem.content}
        </p>

        {/* Themes - with graceful handling for empty themes */}
        {localItem.themes && localItem.themes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {localItem.themes.map((theme) => (
              <Badge
                key={theme}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => onThemeClick?.(theme)}
              >
                {theme}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              No themes detected
            </Badge>
          </div>
        )}

        {/* Product Area & Tags */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          {localItem.productArea && (
            <span className="font-medium text-foreground">
              {localItem.productArea}
            </span>
          )}
          {localItem.tags && localItem.tags.length > 0 && (
            <>
              {localItem.productArea && <span>·</span>}
              {localItem.tags.map((tag, idx) => (
                <span key={tag}>
                  #{tag}
                  {idx < localItem.tags!.length - 1 && ","}
                </span>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export type FeedbackSource = "x" | "github" | "discord" | "support" | "email" | "forum";
export type Sentiment = "positive" | "neutral" | "negative" | "unknown";
export type FeedbackStatus = "new" | "triaged" | "ignored";

export type FeedbackItem = {
  id: string;
  source: FeedbackSource;
  externalId?: string;
  url?: string;
  title?: string;
  content: string;
  authorHandle?: string;
  createdAt: string;
  ingestedAt: string;
  sentiment: Sentiment;
  themes: string[];
  summary?: string;
  urgency?: 1 | 2 | 3 | 4 | 5;
  status: FeedbackStatus;
  productArea?: string;
  tags?: string[];
};

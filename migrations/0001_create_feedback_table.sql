-- Create feedback table for storing user feedback from multiple sources
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  url TEXT,
  sentiment TEXT,
  theme TEXT,
  summary TEXT,
  enriched_at TEXT
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_theme ON feedback(theme);

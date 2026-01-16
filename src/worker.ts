import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Type definitions for Cloudflare bindings
type Bindings = {
  DB: any; // D1Database type from @cloudflare/workers-types
  CACHE: any; // KVNamespace type from @cloudflare/workers-types
  AI: any;
  ASSETS: { fetch: typeof fetch }; // Modern Wrangler Assets binding
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
app.use('*', cors());

// API Routes
app.get('/api/feedback', async (c) => {
  const db = c.env.DB;
  const { source, theme, sentiment, q, from, to, limit = '50', offset = '0' } = c.req.query();

  let query = 'SELECT * FROM feedback WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM feedback WHERE 1=1';
  const params: any[] = [];
  const countParams: any[] = [];

  if (source) {
    query += ' AND source = ?';
    countQuery += ' AND source = ?';
    params.push(source);
    countParams.push(source);
  }
  if (theme) {
    query += ' AND theme LIKE ?';
    countQuery += ' AND theme LIKE ?';
    params.push(`%${theme}%`);
    countParams.push(`%${theme}%`);
  }
  if (sentiment) {
    query += ' AND sentiment = ?';
    countQuery += ' AND sentiment = ?';
    params.push(sentiment);
    countParams.push(sentiment);
  }
  if (q) {
    query += ' AND (title LIKE ? OR content LIKE ?)';
    countQuery += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
    countParams.push(`%${q}%`, `%${q}%`);
  }
  if (from) {
    query += ' AND created_at >= ?';
    countQuery += ' AND created_at >= ?';
    params.push(from);
    countParams.push(from);
  }
  if (to) {
    query += ' AND created_at <= ?';
    countQuery += ' AND created_at <= ?';
    params.push(to);
    countParams.push(to);
  }

  query += ' ORDER BY created_at DESC';
  query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

  const { results } = await db.prepare(query).bind(...params).all();
  const countResult = countParams.length > 0
    ? await db.prepare(countQuery).bind(...countParams).first()
    : await db.prepare(countQuery).first();

  return c.json({
    items: results,
    total: countResult?.total || 0
  });
});

app.post('/api/seed', async (c) => {
  const db = c.env.DB;

  // Deterministic seed data spanning last 48 hours
  const now = Date.now();
  const seedData = [
    {
      id: 'seed-1',
      source: 'github',
      created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      title: 'Workers AI cold start latency',
      content: 'Workers AI is incredible but the cold start times are killing my use case.',
      url: 'https://github.com/cloudflare/workers-sdk/issues/1',
      sentiment: 'negative',
      theme: 'performance,workers-ai',
      summary: 'User experiencing high cold start latency with Workers AI'
    },
    {
      id: 'seed-2',
      source: 'github',
      created_at: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
      title: 'D1 query performance degradation',
      content: 'After migrating our database to D1, we are seeing significant slowdowns with tables over 100k rows.',
      url: 'https://github.com/cloudflare/workers-sdk/issues/2',
      sentiment: 'negative',
      theme: 'database,performance,d1',
      summary: 'D1 experiencing poor query performance with large datasets'
    },
    {
      id: 'seed-3',
      source: 'discord',
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      title: null,
      content: 'Just deployed my first Worker and the DX is amazing!',
      url: null,
      sentiment: 'positive',
      theme: 'developer-experience,wrangler',
      summary: 'Positive feedback on Wrangler local development experience'
    },
    {
      id: 'seed-4',
      source: 'support',
      created_at: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
      title: 'Unable to bind multiple D1 databases',
      content: 'We have a multi-tenant architecture and need to bind different D1 databases per tenant.',
      url: null,
      sentiment: 'neutral',
      theme: 'architecture,d1,multi-tenancy',
      summary: 'Enterprise customer needs dynamic D1 database binding'
    },
    {
      id: 'seed-5',
      source: 'x',
      created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      title: null,
      content: 'Cloudflare Pages deployment took 3 minutes. What is going on?',
      url: 'https://x.com/user/status/1',
      sentiment: 'negative',
      theme: 'pages,deployment,performance',
      summary: 'User reporting slow Pages deployment times'
    },
    {
      id: 'seed-6',
      source: 'discord',
      created_at: new Date(now - 30 * 60 * 60 * 1000).toISOString(),
      title: null,
      content: 'The new Cloudflare Images API is exactly what we needed.',
      url: null,
      sentiment: 'positive',
      theme: 'images,cdn',
      summary: 'Very positive feedback on Images API features'
    },
    {
      id: 'seed-7',
      source: 'github',
      created_at: new Date(now - 15 * 60 * 60 * 1000).toISOString(),
      title: 'New theme: Billing confusion',
      content: 'I am trying to understand R2 pricing for our use case. We will have 500TB storage with high read volume.',
      url: 'https://github.com/cloudflare/workers-sdk/issues/3',
      sentiment: 'neutral',
      theme: 'billing,pricing,r2',
      summary: 'Customer confusion about R2 pricing model'
    },
    {
      id: 'seed-8',
      source: 'github',
      created_at: new Date(now - 18 * 60 * 60 * 1000).toISOString(),
      title: 'Another billing question',
      content: 'How does billing work for Workers AI inference requests?',
      url: 'https://github.com/cloudflare/workers-sdk/issues/4',
      sentiment: 'neutral',
      theme: 'billing,workers-ai',
      summary: 'Questions about Workers AI billing'
    },
    {
      id: 'seed-9',
      source: 'github',
      created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      title: 'Performance regression in Workers',
      content: 'After latest deployment, our Workers are responding 50ms slower on average.',
      url: 'https://github.com/cloudflare/workers-sdk/issues/5',
      sentiment: 'negative',
      theme: 'performance,workers',
      summary: 'Performance regression detected in Workers runtime'
    },
    {
      id: 'seed-10',
      source: 'x',
      created_at: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      title: null,
      content: 'Cloudflare Workers is the fastest edge runtime I have used.',
      url: 'https://x.com/user/status/2',
      sentiment: 'positive',
      theme: 'performance,workers',
      summary: 'Praise for Workers performance'
    }
  ];

  // Clear existing data
  await db.prepare('DELETE FROM feedback').run();

  // Insert seed data
  for (const item of seedData) {
    await db.prepare(
      `INSERT INTO feedback (id, source, created_at, title, content, url, sentiment, theme, summary, enriched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      item.id,
      item.source,
      item.created_at,
      item.title,
      item.content,
      item.url,
      item.sentiment,
      item.theme,
      item.summary,
      new Date().toISOString()
    ).run();
  }

  return c.json({ success: true, count: seedData.length });
});

app.post('/api/feedback', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  const id = body.id || crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO feedback (id, source, created_at, title, content, url, sentiment, theme, summary, enriched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.source,
    body.created_at || now,
    body.title || null,
    body.content,
    body.url || null,
    body.sentiment || null,
    body.theme || null,
    body.summary || null,
    null
  ).run();

  // Fetch the created item to return full data
  const item = await db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();

  return c.json({ item });
});

// AI Enrichment endpoint
app.post('/api/ai/enrich/:id', async (c) => {
  const db = c.env.DB;
  const ai = c.env.AI;
  const id = c.req.param('id');

  // Load feedback item
  const item = await db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();

  if (!item) {
    return c.json({ error: 'Item not found' }, 404);
  }

  // Call Workers AI to generate sentiment, theme, and summary
  const prompt = `Analyze this customer feedback and provide:
1. Sentiment (positive/negative/neutral)
2. Themes (comma-separated keywords like: performance, billing, workers-ai, d1, etc.)
3. A brief one-sentence summary

Feedback: "${item.content}"

Respond in this exact format:
Sentiment: [positive/negative/neutral]
Themes: [comma,separated,themes]
Summary: [one sentence]`;

  try {
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 200
    });

    // Parse AI response
    const text = response.response || '';
    const sentimentMatch = text.match(/Sentiment:\s*(positive|negative|neutral)/i);
    const themesMatch = text.match(/Themes:\s*([^\n]+)/i);
    const summaryMatch = text.match(/Summary:\s*([^\n]+)/i);

    const sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral';
    const theme = themesMatch ? themesMatch[1].trim() : 'general';
    const summary = summaryMatch ? summaryMatch[1].trim() : item.content.substring(0, 100);

    // Update feedback item
    await db.prepare(
      'UPDATE feedback SET sentiment = ?, theme = ?, summary = ?, enriched_at = ? WHERE id = ?'
    ).bind(sentiment, theme, summary, new Date().toISOString(), id).run();

    return c.json({ id, sentiment, theme, summary });
  } catch (error: any) {
    return c.json({ error: 'AI enrichment failed', details: error.message }, 500);
  }
});

// Insights endpoints with KV caching
app.get('/api/insights/recommended', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const filters = c.req.query();

  // Create cache key from filters
  const cacheKey = `recommended:${JSON.stringify(filters)}`;

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  // Query D1 for all feedback
  let query = 'SELECT * FROM feedback WHERE 1=1';
  const params: any[] = [];

  if (filters.source) {
    query += ' AND source = ?';
    params.push(filters.source);
  }
  if (filters.sentiment) {
    query += ' AND sentiment = ?';
    params.push(filters.sentiment);
  }

  const { results } = await db.prepare(query).bind(...params).all();

  // Compute recommended focus using heuristic
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Group by theme
  const themeGroups: Record<string, any[]> = {};
  (results as any[]).forEach(item => {
    if (item.theme) {
      const themes = item.theme.split(',');
      themes.forEach((t: string) => {
        const theme = t.trim();
        if (!themeGroups[theme]) themeGroups[theme] = [];
        themeGroups[theme].push(item);
      });
    }
  });

  // Calculate scores
  const focusItems = Object.entries(themeGroups).map(([theme, items]) => {
    const volume = items.length;
    const negativeCount = items.filter(i => i.sentiment === 'negative').length;
    const negativeRatio = volume > 0 ? negativeCount / volume : 0;

    const recentCount = items.filter(i => new Date(i.created_at) >= sevenDaysAgo).length;
    const recencyMultiplier = recentCount / volume > 0.5 ? 1.5 : 1.0;

    const score = volume * (1 + negativeRatio) * recencyMultiplier;

    // Determine signal
    let signal: 'low' | 'medium' | 'high' = 'low';
    if (score >= 10) signal = 'high';
    else if (score >= 5) signal = 'medium';

    const suggestedAction = signal === 'high' ? 'Investigate' : 'Monitor';

    // Confidence heuristic
    const sourceCounts: Record<string, number> = {};
    items.forEach(i => {
      sourceCounts[i.source] = (sourceCounts[i.source] || 0) + 1;
    });
    const sourceCount = Object.keys(sourceCounts).length;
    const recentShare = volume > 0 ? recentCount / volume : 0;

    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (volume >= 10 && sourceCount >= 2 && recentShare >= 0.6) confidence = 'high';
    else if (volume >= 5 && sourceCount >= 1 && recentShare >= 0.4) confidence = 'medium';

    const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      id: `focus-${theme}`,
      title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} feedback`,
      theme,
      source: topSource,
      score,
      signal,
      explanation: `${volume} items, ${Math.round(negativeRatio * 100)}% negative, ${Math.round(recentShare * 100)}% recent`,
      suggestedAction,
      confidence,
      coverageText: `${volume} items • ${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'} • last 7 days`,
      supportingStats: {
        itemCount: volume,
        sourceCount,
        negativeCount,
        windowDays: 7,
        recentShare
      }
    };
  });

  const result = focusItems.sort((a, b) => b.score - a.score).slice(0, 3);

  // Cache for 10 minutes
  await cache.put(cacheKey, JSON.stringify(result), { expirationTtl: 600 });

  return c.json(result);
});

app.get('/api/insights/deltas', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const filters = c.req.query();

  const cacheKey = `deltas:${JSON.stringify(filters)}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  // Query all feedback
  let query = 'SELECT * FROM feedback WHERE 1=1';
  const params: any[] = [];

  if (filters.source) {
    query += ' AND source = ?';
    params.push(filters.source);
  }
  if (filters.sentiment) {
    query += ' AND sentiment = ?';
    params.push(filters.sentiment);
  }

  const { results } = await db.prepare(query).bind(...params).all();

  // Calculate deltas
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const currentWindow = (results as any[]).filter(i => new Date(i.created_at) >= oneDayAgo);
  const previousWindow = (results as any[]).filter(i => {
    const date = new Date(i.created_at);
    return date >= twoDaysAgo && date < oneDayAgo;
  });

  // Group by theme
  const currentThemeCounts: Record<string, number> = {};
  const previousThemeCounts: Record<string, number> = {};

  currentWindow.forEach(item => {
    if (item.theme) {
      item.theme.split(',').forEach((t: string) => {
        const theme = t.trim();
        currentThemeCounts[theme] = (currentThemeCounts[theme] || 0) + 1;
      });
    }
  });

  previousWindow.forEach(item => {
    if (item.theme) {
      item.theme.split(',').forEach((t: string) => {
        const theme = t.trim();
        previousThemeCounts[theme] = (previousThemeCounts[theme] || 0) + 1;
      });
    }
  });

  // Calculate deltas
  const allThemes = new Set([...Object.keys(currentThemeCounts), ...Object.keys(previousThemeCounts)]);
  const deltas: any[] = [];

  allThemes.forEach(theme => {
    const countCurrent = currentThemeCounts[theme] || 0;
    const countPrevious = previousThemeCounts[theme] || 0;
    const delta = countCurrent - countPrevious;
    deltas.push({ theme, countCurrent, countPrevious, delta });
  });

  const result: any[] = [];

  // Top spike
  const spike = deltas.filter(d => d.delta >= 2).sort((a, b) => b.delta - a.delta)[0];
  if (spike) {
    result.push({
      kind: 'spike',
      theme: spike.theme,
      countCurrent: spike.countCurrent,
      countPrevious: spike.countPrevious,
      delta: spike.delta,
      label: `🔺 ${spike.theme.charAt(0).toUpperCase() + spike.theme.slice(1)} feedback increased (+${spike.delta})`
    });
  }

  // Top drop
  const drop = deltas.filter(d => d.delta <= -2).sort((a, b) => a.delta - b.delta)[0];
  if (drop) {
    result.push({
      kind: 'drop',
      theme: drop.theme,
      countCurrent: drop.countCurrent,
      countPrevious: drop.countPrevious,
      delta: drop.delta,
      label: `🔻 ${drop.theme.charAt(0).toUpperCase() + drop.theme.slice(1)} feedback decreased (${drop.delta})`
    });
  }

  // New theme
  const newTheme = deltas.filter(d => d.countCurrent >= 2 && d.countPrevious === 0).sort((a, b) => b.countCurrent - a.countCurrent)[0];
  if (newTheme) {
    result.push({
      kind: 'new',
      theme: newTheme.theme,
      countCurrent: newTheme.countCurrent,
      countPrevious: newTheme.countPrevious,
      delta: newTheme.delta,
      label: `🆕 New theme detected: ${newTheme.theme.charAt(0).toUpperCase() + newTheme.theme.slice(1)} (${newTheme.countCurrent} items)`
    });
  }

  // Cache for 10 minutes
  await cache.put(cacheKey, JSON.stringify(result), { expirationTtl: 600 });

  return c.json(result);
});

// GET /api/themes - Top themes aggregation
app.get('/api/themes', async (c) => {
  const db = c.env.DB;
  const { source, sentiment, q, days = '30', limit = '10' } = c.req.query();

  let query = 'SELECT theme, COUNT(*) as count FROM feedback WHERE theme IS NOT NULL';
  const params: any[] = [];

  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }
  if (sentiment) {
    query += ' AND sentiment = ?';
    params.push(sentiment);
  }
  if (q) {
    query += ' AND (content LIKE ? OR title LIKE ?)';
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm);
  }
  if (days) {
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
    query += ' AND created_at >= ?';
    params.push(daysAgo);
  }

  query += ' GROUP BY theme ORDER BY count DESC LIMIT ?';
  params.push(parseInt(limit));

  const result = await db.prepare(query).bind(...params).all();

  const totalQuery = 'SELECT COUNT(*) as total FROM feedback WHERE theme IS NOT NULL' +
    (days ? ' AND created_at >= ?' : '');
  const totalParams = days ? [new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString()] : [];
  const totalResult = await db.prepare(totalQuery).bind(...totalParams).first();

  return c.json({
    windowDays: parseInt(days),
    totalItemsConsidered: totalResult?.total || 0,
    themes: result.results || []
  });
});

// GET /api/metrics/trend - Trend data over time
app.get('/api/metrics/trend', async (c) => {
  const db = c.env.DB;
  const { source, sentiment, theme, q, days = '30' } = c.req.query();

  let query = 'SELECT DATE(created_at) as date, COUNT(*) as count FROM feedback WHERE 1=1';
  const params: any[] = [];

  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }
  if (sentiment) {
    query += ' AND sentiment = ?';
    params.push(sentiment);
  }
  if (theme) {
    query += ' AND theme = ?';
    params.push(theme);
  }
  if (q) {
    query += ' AND (content LIKE ? OR title LIKE ?)';
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm);
  }
  if (days) {
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
    query += ' AND created_at >= ?';
    params.push(daysAgo);
  }

  query += ' GROUP BY DATE(created_at) ORDER BY date ASC';

  const result = await db.prepare(query).bind(...params).all();

  const totalQuery = 'SELECT COUNT(*) as total FROM feedback WHERE 1=1' +
    (days ? ' AND created_at >= ?' : '');
  const totalParams = days ? [new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString()] : [];
  const totalResult = await db.prepare(totalQuery).bind(...totalParams).first();

  return c.json({
    windowDays: parseInt(days),
    totalItemsConsidered: totalResult?.total || 0,
    points: result.results || []
  });
});

// GET /api/metrics/heatmap - Theme x Sentiment heatmap
app.get('/api/metrics/heatmap', async (c) => {
  const db = c.env.DB;
  const { source, q, days = '30' } = c.req.query();

  let query = 'SELECT theme, sentiment, COUNT(*) as count FROM feedback WHERE theme IS NOT NULL AND sentiment IS NOT NULL';
  const params: any[] = [];

  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }
  if (q) {
    query += ' AND (content LIKE ? OR title LIKE ?)';
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm);
  }
  if (days) {
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
    query += ' AND created_at >= ?';
    params.push(daysAgo);
  }

  query += ' GROUP BY theme, sentiment';

  const result = await db.prepare(query).bind(...params).all();

  const themes = [...new Set((result.results || []).map((r: any) => r.theme))];
  const sentiments = [...new Set((result.results || []).map((r: any) => r.sentiment))];

  const matrix: number[][] = themes.map(theme =>
    sentiments.map(sentiment => {
      const item = (result.results || []).find((r: any) => r.theme === theme && r.sentiment === sentiment);
      return item ? item.count : 0;
    })
  );

  const totalQuery = 'SELECT COUNT(*) as total FROM feedback WHERE theme IS NOT NULL AND sentiment IS NOT NULL' +
    (days ? ' AND created_at >= ?' : '');
  const totalParams = days ? [new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString()] : [];
  const totalResult = await db.prepare(totalQuery).bind(...totalParams).first();

  return c.json({
    themes,
    sentiments,
    matrix,
    totalItemsConsidered: totalResult?.total || 0
  });
});

// GET /api/metrics/sankey - Source to Theme to Sentiment flow
app.get('/api/metrics/sankey', async (c) => {
  const db = c.env.DB;
  const { source, sentiment, q, days = '30' } = c.req.query();

  let query = 'SELECT source, theme, sentiment, COUNT(*) as count FROM feedback WHERE theme IS NOT NULL AND sentiment IS NOT NULL';
  const params: any[] = [];

  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }
  if (sentiment) {
    query += ' AND sentiment = ?';
    params.push(sentiment);
  }
  if (q) {
    query += ' AND (content LIKE ? OR title LIKE ?)';
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm);
  }
  if (days) {
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
    query += ' AND created_at >= ?';
    params.push(daysAgo);
  }

  query += ' GROUP BY source, theme, sentiment';

  const result = await db.prepare(query).bind(...params).all();

  const sources = [...new Set((result.results || []).map((r: any) => r.source))];
  const themes = [...new Set((result.results || []).map((r: any) => r.theme))];
  const sentiments = [...new Set((result.results || []).map((r: any) => r.sentiment))];

  const nodes = [
    ...sources.map(s => ({ name: s })),
    ...themes.map(t => ({ name: t })),
    ...sentiments.map(s => ({ name: s }))
  ];

  const links: any[] = [];

  // Source -> Theme links
  const sourceToTheme: any = {};
  (result.results || []).forEach((r: any) => {
    const key = `${r.source}->${r.theme}`;
    sourceToTheme[key] = (sourceToTheme[key] || 0) + r.count;
  });
  Object.entries(sourceToTheme).forEach(([key, value]) => {
    const [source, theme] = key.split('->');
    links.push({ source, target: theme, value });
  });

  // Theme -> Sentiment links
  const themeToSentiment: any = {};
  (result.results || []).forEach((r: any) => {
    const key = `${r.theme}->${r.sentiment}`;
    themeToSentiment[key] = (themeToSentiment[key] || 0) + r.count;
  });
  Object.entries(themeToSentiment).forEach(([key, value]) => {
    const [theme, sentiment] = key.split('->');
    links.push({ source: theme, target: sentiment, value });
  });

  const totalQuery = 'SELECT COUNT(*) as total FROM feedback WHERE theme IS NOT NULL AND sentiment IS NOT NULL' +
    (days ? ' AND created_at >= ?' : '');
  const totalParams = days ? [new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString()] : [];
  const totalResult = await db.prepare(totalQuery).bind(...totalParams).first();

  return c.json({
    nodes,
    links,
    totalItemsConsidered: totalResult?.total || 0
  });
});

// Alias /api/feedback/:id/enrich to /api/ai/enrich/:id for frontend compatibility
app.post('/api/feedback/:id/enrich', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  const ai = c.env.AI;

  const item = await db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();

  if (!item) {
    return c.json({ error: 'Feedback not found' }, 404);
  }

  const prompt = `Analyze this user feedback and provide:
1. Sentiment (positive/negative/neutral/mixed)
2. Primary theme (performance/pricing/features/usability/support/integration/docs/security)
3. Brief summary (1-2 sentences)

Feedback: "${item.content}"

Respond in JSON format:
{
  "sentiment": "...",
  "theme": "...",
  "summary": "..."
}`;

  const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
    messages: [{ role: 'user', content: prompt }]
  });

  let analysis;
  try {
    const text = response.response || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      sentiment: 'neutral',
      theme: 'general',
      summary: item.content.substring(0, 100)
    };
  } catch {
    analysis = {
      sentiment: 'neutral',
      theme: 'general',
      summary: item.content.substring(0, 100)
    };
  }

  await db.prepare(
    'UPDATE feedback SET sentiment = ?, theme = ?, summary = ?, enriched_at = ? WHERE id = ?'
  ).bind(
    analysis.sentiment,
    analysis.theme,
    analysis.summary,
    new Date().toISOString(),
    id
  ).run();

  const enrichedItem = await db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();

  return c.json({ item: enrichedItem });
});

// Health check endpoint
app.get('/api/health', async (c) => {
  return c.json({ ok: true });
});

// Serve static assets using modern Wrangler Assets
// All non-API routes are forwarded to the ASSETS fetcher
app.get('*', async (c) => {
  // Forward the request to the Assets binding
  // This automatically serves files from dist/ with proper content types and caching
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;

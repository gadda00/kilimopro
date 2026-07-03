/**
 * Research Routes — Agricultural Research Integration
 * GET /api/research/crop/:crop — Latest research for a crop
 * GET /api/research/pest/:pest — Pest management research
 * GET /api/research/climate — Climate-smart agriculture research
 * GET /api/research/soil — Soil health research
 * POST /api/research/recommendations — Personalized research recommendations
 * 
 * GET /api/council/deliberate — Multi-LLM council deliberation
 * 
 * GET /api/market/advanced-forecast — Quant-based price forecast with risk metrics
 * 
 * GET /api/videos/search — Search agricultural training videos
 * GET /api/videos/channels/:channel — List videos from curated channels
 * POST /api/videos/download — Download video for offline access
 * GET /api/videos/local — List locally downloaded videos
 * 
 * GET /api/content/news — Agricultural news (via Firecrawl)
 * GET /api/content/alerts — Weather/climate alerts (via Firecrawl)
 */

import { FastifyInstance } from 'fastify';
import { semanticScholar } from '../connectors/semantic-scholar.js';
import { council } from '../services/council.js';
import { quantForecasting } from '../services/quant-forecasting.js';
import { videoConnector } from '../connectors/video.js';
import { firecrawl } from '../connectors/firecrawl.js';
import { market } from '../connectors/market.js';

export async function researchRoutes(app: FastifyInstance) {
  // ─── Research (Semantic Scholar) ─────────────────────────────
  
  app.get('/crop/:crop', async (request) => {
    const { crop } = request.params as { crop: string };
    const { problem } = request.query as { problem?: string };
    const papers = await semanticScholar.getCropResearch(crop, problem);
    return { crop, papers, count: papers.length };
  });

  app.get('/pest/:pest', async (request) => {
    const { pest } = request.params as { pest: string };
    const { crop } = request.query as { crop?: string };
    const papers = await semanticScholar.getPestResearch(pest, crop);
    return { pest, crop, papers, count: papers.length };
  });

  app.get('/climate', async (request) => {
    const { crop } = request.query as { crop?: string };
    const papers = await semanticScholar.getClimateSmartResearch(crop);
    return { papers, count: papers.length };
  });

  app.get('/soil', async (request) => {
    const { topic } = request.query as { topic?: string };
    const papers = await semanticScholar.getSoilResearch(topic);
    return { papers, count: papers.length };
  });

  app.post('/recommendations', async (request) => {
    const { crops, county, challenges } = request.body as {
      crops: string[]; county?: string; challenges?: string[];
    };
    const recommendations = await semanticScholar.getFarmerResearchRecommendations({
      crops, county, challenges,
    });
    return { recommendations };
  });

  // ─── Council (Multi-LLM Deliberation) ────────────────────────

  app.post('/council/deliberate', async (request) => {
    const { question, farmerName, county, crops, farmSize, soilType, irrigationType } = request.body as any;
    
    if (!question) return { error: 'Question is required' };
    
    const deliberation = await council.deliberate(question, {
      farmerName, county, crops, farmSize, soilType, irrigationType,
    });
    
    return deliberation;
  });

  // ─── Advanced Market Forecast (Quant Models) ────────────────

  app.get('/market/advanced-forecast', async (request) => {
    const { commodity, market: marketName, horizon } = request.query as {
      commodity: string; market?: string; horizon?: string;
    };
    
    if (!commodity) return { error: 'commodity parameter required' };
    
    const history = await market.getPriceHistory(commodity, marketName, 180);
    
    if (history.length < 10) {
      return {
        error: 'Insufficient price history. Need at least 10 data points.',
        dataPoints: history.length,
      };
    }
    
    const forecast = await quantForecasting.forecast(
      history.map(h => ({ date: h.date, price: h.price })),
      parseInt(horizon || '14'),
    );
    
    return {
      commodity,
      market: marketName || 'all',
      currentPrice: history[history.length - 1].price,
      dataPoints: history.length,
      ...forecast,
    };
  });

  // ─── Educational Videos (yt-dlp) ─────────────────────────────

  app.get('/videos/search', async (request) => {
    const { q } = request.query as { q: string };
    if (!q) return { error: 'Search query (q) required' };
    const videos = await videoConnector.searchVideos(q);
    return { query: q, videos, count: videos.length };
  });

  app.get('/videos/channels/:channel', async (request) => {
    const { channel } = request.params as { channel: string };
    const videos = await videoConnector.listChannelVideos(channel as any);
    return { channel, videos, count: videos.length };
  });

  app.post('/videos/download', async (request) => {
    const { url, subtitles, subtitleLang } = request.body as {
      url: string; subtitles?: boolean; subtitleLang?: string;
    };
    if (!url) return { error: 'Video URL required' };
    const video = await videoConnector.downloadVideo(url, { subtitles, subtitleLang });
    return video || { error: 'Download failed' };
  });

  app.get('/videos/local', async () => {
    const videos = videoConnector.getLocalVideos();
    return { videos, count: videos.length };
  });

  // ─── Content (Firecrawl web scraping) ────────────────────────

  app.get('/content/news', async () => {
    const news = await firecrawl.getAgNews();
    return { articles: news, count: news.length };
  });

  app.get('/content/alerts', async () => {
    const alerts = await firecrawl.getWeatherAlerts();
    return { alerts, count: alerts.length };
  });

  app.post('/content/scrape', async (request) => {
    const { url } = request.body as { url: string };
    if (!url) return { error: 'URL required' };
    const content = await firecrawl.scrapeUrl(url);
    return content || { error: 'Scraping failed' };
  });

  app.post('/content/search', async (request) => {
    const { query, limit } = request.body as { query: string; limit?: number };
    if (!query) return { error: 'Query required' };
    const results = await firecrawl.searchAgContent(query, limit || 10);
    return { query, results, count: results.length };
  });
}

/**
 * Firecrawl Connector — Web Scraping for Agricultural Intelligence
 * 
 * Uses Firecrawl (github.com/firecrawl/firecrawl) to scrape agricultural
 * websites and convert them to LLM-ready markdown/JSON.
 * 
 * Applications in KilimoPRO:
 * 1. Scrape daily market price bulletins from county websites
 * 2. Scrape agricultural news and weather alerts from Kenyan media
 * 3. Scrape extension service content for the knowledge base
 * 4. Scrape commodity exchange prices for benchmarking
 * 
 * Firecrawl API: https://www.firecrawl.dev/
 * GitHub: https://github.com/firecrawl/firecrawl
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';
const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';

// Agricultural websites to scrape for KilimoPRO
const AG_SOURCES = {
  // Kenyan agricultural news and alerts
  kilimoNews: 'https://kilimo.go.ke/news/',
  kalroUpdates: 'https://kalro.org/news/',
  faoKenya: 'https://www.fao.org/kenya/news/',
  
  // Market price sources
  aircPrices: 'https://airc.kilimo.go.ke/market-prices/',
  farmgainPrices: 'https://www.farmgainafrica.org/prices/',
  
  // Weather and climate alerts
  meteoAlerts: 'https://meteo.go.ke/weather-alerts/',
  ndmaAlerts: 'https://www.ndma.go.ke/alerts/',
  
  // Extension content
  kalroExtension: 'https://kalro.org/extension-materials/',
  infonirmo: 'https://www.infonirmo.com/kenya/',
};

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;       // Markdown-formatted content
  publishedAt?: string;
  source: string;
  metadata?: Record<string, any>;
}

export class FirecrawlConnector {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || FIRECRAWL_API_KEY;
  }

  /**
   * Scrape a single URL and return LLM-ready markdown
   */
  async scrapeUrl(url: string): Promise<ScrapedContent | null> {
    if (!this.apiKey) {
      console.warn('[Firecrawl] No API key configured. Set FIRECRAWL_API_KEY.');
      return null;
    }

    try {
      const response = await fetch(`${FIRECRAWL_BASE}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        url,
        title: data.metadata?.title || data.metadata?.ogTitle || url,
        content: data.markdown || '',
        publishedAt: data.metadata?.publishedDate || data.metadata?.modifiedDate,
        source: this.getSourceName(url),
        metadata: data.metadata,
      };
    } catch (error) {
      console.error(`[Firecrawl] Failed to scrape ${url}:`, error);
      return null;
    }
  }

  /**
   * Crawl an entire website (e.g., KALRO extension materials)
   */
  async crawlSite(baseUrl: string, maxPages: number = 50): Promise<ScrapedContent[]> {
    if (!this.apiKey) return [];

    try {
      // Start crawl job
      const startResponse = await fetch(`${FIRECRAWL_BASE}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: baseUrl,
          limit: maxPages,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      });

      if (!startResponse.ok) throw new Error(`Crawl failed: ${startResponse.status}`);
      const startData = await startResponse.json();
      const jobId = startData.id;

      // Poll for completion
      let attempts = 0;
      while (attempts < 30) {
        await new Promise(r => setTimeout(r, 5000)); // Wait 5s between polls
        
        const statusResponse = await fetch(`${FIRECRAWL_BASE}/crawl/${jobId}`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
        });
        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          return (statusData.data || []).map((item: any) => ({
            url: item.metadata?.sourceURL || '',
            title: item.metadata?.title || '',
            content: item.markdown || '',
            publishedAt: item.metadata?.publishedDate,
            source: this.getSourceName(baseUrl),
            metadata: item.metadata,
          }));
        }

        if (statusData.status === 'failed') throw new Error('Crawl failed');
        attempts++;
      }

      throw new Error('Crawl timed out');
    } catch (error) {
      console.error('[Firecrawl] Crawl failed:', error);
      return [];
    }
  }

  /**
   * Search the web for agricultural content
   */
  async searchAgContent(query: string, limit: number = 10): Promise<ScrapedContent[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(`${FIRECRAWL_BASE}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `${query} Kenya agriculture farming`,
          limit,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      });

      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = await response.json();

      return (data.data || []).map((item: any) => ({
        url: item.metadata?.sourceURL || '',
        title: item.metadata?.title || '',
        content: item.markdown || '',
        publishedAt: item.metadata?.publishedDate,
        source: 'web_search',
        metadata: item.metadata,
      }));
    } catch (error) {
      console.error('[Firecrawl] Search failed:', error);
      return [];
    }
  }

  /**
   * Sync market prices from agricultural websites
   * Scrapes AIRC, FarmGain, and other sources for latest prices
   */
  async syncMarketPrices(): Promise<number> {
    const results = await this.scrapeUrl(AG_SOURCES.aircPrices);
    if (!results) return 0;

    // Parse market prices from scraped content
    // This would use NLP/regex to extract structured price data
    // from the markdown content
    console.log('[Firecrawl] Scraped market prices page:', results.title);
    return 1; // Number of sources synced
  }

  /**
   * Get agricultural news and alerts
   */
  async getAgNews(): Promise<ScrapedContent[]> {
    const sources = [
      AG_SOURCES.kilimoNews,
      AG_SOURCES.kalroUpdates,
      AG_SOURCES.faoKenya,
    ];

    const results: ScrapedContent[] = [];
    for (const url of sources) {
      const content = await this.scrapeUrl(url);
      if (content) results.push(content);
    }

    return results;
  }

  /**
   * Scrape weather alerts from KMD and NDMA
   */
  async getWeatherAlerts(): Promise<ScrapedContent[]> {
    const sources = [
      AG_SOURCES.meteoAlerts,
      AG_SOURCES.ndmaAlerts,
    ];

    const results: ScrapedContent[] = [];
    for (const url of sources) {
      const content = await this.scrapeUrl(url);
      if (content) results.push(content);
    }

    return results;
  }

  /**
   * Build extension knowledge base by crawling KALRO materials
   */
  async buildKnowledgeBase(): Promise<ScrapedContent[]> {
    return this.crawlSite(AG_SOURCES.kalroExtension, 100);
  }

  private getSourceName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split('.');
      return parts[parts.length - 2] || hostname;
    } catch {
      return 'unknown';
    }
  }
}

export const firecrawl = new FirecrawlConnector();

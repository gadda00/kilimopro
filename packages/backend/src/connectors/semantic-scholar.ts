/**
 * Semantic Scholar Connector — Agricultural Research Integration
 * 
 * Uses the Semantic Scholar Academic Graph API to fetch the latest
 * agricultural research papers relevant to Kenyan farming.
 * 
 * API: https://api.semanticscholar.org/api-docs/
 * Datasets: https://api.semanticscholar.org/api-docs/datasets
 * 
 * Applications in KilimoPRO:
 * 1. "Research" module — show farmers latest research on their crops
 * 2. Advisory engine — incorporate research findings into recommendations
 * 3. Extension workers — access to latest scientific literature
 */

const S2_API_BASE = 'https://api.semanticscholar.org/graph/v1';

export interface ResearchPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  authors: { name: string }[];
  venue: string | null;
  citationCount: number | null;
  openAccessPdf: { url: string } | null;
  fieldsOfStudy: string[];
  url: string;
}

export class SemanticScholarConnector {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private cacheTTL: number = 86400000; // 24 hours
  private rateLimitDelay: number = 1000; // 1s between requests (free tier)

  /**
   * Search for agricultural research papers
   */
  async searchPapers(query: string, options?: {
    year?: string;       // e.g., "2020-2026"
    fieldsOfStudy?: string[];  // e.g., ["Agricultural and Food Sciences"]
    limit?: number;
    minCitations?: number;
  }): Promise<ResearchPaper[]> {
    const cacheKey = `search_${query}_${JSON.stringify(options || {})}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const params = new URLSearchParams({
      query: `${query} agriculture Kenya Africa`,
      fields: 'title,abstract,year,authors,venue,citationCount,openAccessPdf,fieldsOfStudy,url',
      limit: (options?.limit || 10).toString(),
    });
    if (options?.year) params.append('year', options.year);
    if (options?.fieldsOfStudy?.length) {
      params.append('fieldsOfStudy', options.fieldsOfStudy.join(','));
    }

    try {
      await this.rateLimit();
      const response = await fetch(`${S2_API_BASE}/paper/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status}`);
      }

      const data = await response.json();
      let papers: ResearchPaper[] = data.data || [];

      // Filter by minimum citations
      if (options?.minCitations) {
        papers = papers.filter(p => (p.citationCount || 0) >= options.minCitations!);
      }

      this.cache.set(cacheKey, { data: papers, expiresAt: Date.now() + this.cacheTTL });
      return papers;
    } catch (error) {
      console.error('[SemanticScholar] Search failed:', error);
      const stale = this.cache.get(cacheKey);
      return stale?.data || [];
    }
  }

  /**
   * Get research papers for a specific crop
   */
  async getCropResearch(crop: string, problem?: string): Promise<ResearchPaper[]> {
    const query = problem 
      ? `${crop} ${problem} pest disease management`
      : `${crop} cultivation best practices yield improvement`;
    
    return this.searchPapers(query, {
      year: '2020-2026',
      fieldsOfStudy: ['Agricultural and Food Sciences'],
      limit: 5,
      minCitations: 5,
    });
  }

  /**
   * Get climate-smart agriculture research
   */
  async getClimateSmartResearch(crop?: string): Promise<ResearchPaper[]> {
    const query = crop 
      ? `climate smart agriculture ${crop} drought resistant adaptation`
      : 'climate smart agriculture Africa smallholder farmers';
    
    return this.searchPapers(query, {
      year: '2022-2026',
      fieldsOfStudy: ['Agricultural and Food Sciences', 'Environmental Science'],
      limit: 5,
      minCitations: 10,
    });
  }

  /**
   * Get pest management research
   */
  async getPestResearch(pest: string, crop?: string): Promise<ResearchPaper[]> {
    const query = crop 
      ? `${pest} ${crop} biological control integrated pest management`
      : `${pest} pest control Africa agriculture`;
    
    return this.searchPapers(query, {
      year: '2019-2026',
      fieldsOfStudy: ['Agricultural and Food Sciences'],
      limit: 5,
      minCitations: 3,
    });
  }

  /**
   * Get soil health research
   */
  async getSoilResearch(topic?: string): Promise<ResearchPaper[]> {
    const query = topic
      ? `soil health ${topic} organic matter fertility Africa`
      : 'soil health management smallholder farmers Africa';
    
    return this.searchPapers(query, {
      year: '2020-2026',
      fieldsOfStudy: ['Agricultural and Food Sciences', 'Earth and Planetary Sciences'],
      limit: 5,
      minCitations: 5,
    });
  }

  /**
   * Get paper details by ID
   */
  async getPaper(paperId: string): Promise<ResearchPaper | null> {
    try {
      await this.rateLimit();
      const response = await fetch(
        `${S2_API_BASE}/paper/${paperId}?fields=title,abstract,year,authors,venue,citationCount,openAccessPdf,fieldsOfStudy,url`
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[SemanticScholar] Get paper failed:', error);
      return null;
    }
  }

  /**
   * Get research recommendations for a farmer's context
   * Returns the most relevant research based on their crops and challenges
   */
  async getFarmerResearchRecommendations(context: {
    crops: string[];
    county?: string;
    challenges?: string[];  // e.g., ['drought', 'fall armyworm', 'low yield']
  }): Promise<{
    crop: string;
    papers: ResearchPaper[];
    challenge?: string;
  }[]> {
    const recommendations: { crop: string; papers: ResearchPaper[]; challenge?: string }[] = [];

    for (const crop of context.crops) {
      // Get general crop research
      const cropPapers = await this.getCropResearch(crop);
      recommendations.push({ crop, papers: cropPapers });

      // Get challenge-specific research
      if (context.challenges) {
        for (const challenge of context.challenges) {
          if (challenge.toLowerCase().includes('drought') || challenge.toLowerCase().includes('climate')) {
            const papers = await this.getClimateSmartResearch(crop);
            recommendations.push({ crop, papers, challenge });
          } else if (challenge.toLowerCase().includes('pest')) {
            const papers = await this.getPestResearch(challenge, crop);
            recommendations.push({ crop, papers, challenge });
          }
        }
      }
    }

    return recommendations;
  }

  private lastRequest: number = 0;

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;
    if (elapsed < this.rateLimitDelay) {
      await new Promise(r => setTimeout(r, this.rateLimitDelay - elapsed));
    }
    this.lastRequest = Date.now();
  }
}

export const semanticScholar = new SemanticScholarConnector();

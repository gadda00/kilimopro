/**
 * Council of High Intelligence — Multi-LLM Deliberation for Complex Farming Decisions
 * 
 * Inspired by: github.com/0xNyk/council-of-high-intelligence
 * 
 * When a farmer faces a complex decision (e.g., "Should I switch from maize to
 * sorghum given the changing rainfall patterns?"), a single AI response may not
 * be sufficient. The Council mode poses the question to multiple LLM "personas"
 * with different perspectives, then synthesizes their deliberation into a
 * comprehensive recommendation.
 * 
 * Personas relevant to agriculture:
 *  - Agronomist: Focuses on soil health, crop science, yield optimization
 *  - Economist: Focuses on market trends, ROI, input costs, risk management
 *  - Climate Scientist: Focuses on weather patterns, climate change adaptation
 *  - Extension Officer: Focuses on practical implementation, farmer capacity
 *  - Risk Manager: Focuses on downside scenarios, insurance, diversification
 */

interface CouncilPersona {
  name: string;
  role: string;
  systemPrompt: string;
  perspective: string;
}

interface CouncilResponse {
  persona: string;
  role: string;
  analysis: string;
  recommendation: string;
  confidence: number;
}

interface CouncilDeliberation {
  question: string;
  context: Record<string, any>;
  responses: CouncilResponse[];
  synthesis: string;
  finalRecommendation: string;
  consensus: 'strong' | 'moderate' | 'divided';
}

const PERSONAS: CouncilPersona[] = [
  {
    name: 'Dr. Wanjiku',
    role: 'Agronomist',
    systemPrompt: 'You are a senior agronomist with 20 years of experience in Kenyan agriculture. You specialize in soil health, crop science, and yield optimization for smallholder farmers. Your recommendations are based on KALRO research and FAO guidelines. Always consider soil type, agro-ecological zone, and crop-specific requirements.',
    perspective: 'Soil health, crop science, yield optimization, KALRO best practices',
  },
  {
    name: 'James Mwangi',
    role: 'Agricultural Economist',
    systemPrompt: 'You are an agricultural economist specializing in East African markets. You analyze input costs, market prices, ROI calculations, and risk management for smallholder farmers. You think in terms of cost-benefit analysis and market trends.',
    perspective: 'Market trends, ROI, input costs, risk management, price forecasting',
  },
  {
    name: 'Dr. Achieng',
    role: 'Climate Scientist',
    systemPrompt: 'You are a climate scientist specializing in East African climate patterns and their impact on agriculture. You understand El Nino/La Nina cycles, CHIRPS rainfall data, and climate change projections for Kenya. You recommend climate adaptation strategies.',
    perspective: 'Weather patterns, climate change, seasonal forecasting, adaptation strategies',
  },
  {
    name: 'Peter Kamau',
    role: 'Extension Officer',
    systemPrompt: 'You are a veteran agricultural extension officer with 15 years of field experience in rural Kenya. You know what farmers can actually implement with limited resources. You focus on practical, step-by-step recommendations that consider labor, capital, and time constraints.',
    perspective: 'Practical implementation, farmer capacity, resource constraints, field-tested solutions',
  },
  {
    name: 'Sarah Otieno',
    role: 'Risk Manager',
    systemPrompt: 'You are an agricultural risk management specialist. You think about worst-case scenarios, crop insurance, diversification strategies, and climate resilience. You help farmers prepare for droughts, floods, pest outbreaks, and market crashes.',
    perspective: 'Downside scenarios, insurance, diversification, climate resilience, contingency planning',
  },
];

export class CouncilService {
  private llmApiUrl: string;
  private llmApiKey: string;

  constructor() {
    this.llmApiUrl = process.env.LLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4';
    this.llmApiKey = process.env.LLM_API_KEY || '';
  }

  /**
   * Convene the council to deliberate on a complex farming question
   */
  async deliberate(question: string, context: {
    farmerName?: string;
    county?: string;
    crops?: string[];
    farmSize?: number;
    soilType?: string;
    irrigationType?: string;
    weather?: any;
    marketData?: any;
  }): Promise<CouncilDeliberation> {
    const contextStr = this.formatContext(context);
    
    // Get each persona's analysis
    const responses: CouncilResponse[] = [];
    
    for (const persona of PERSONAS) {
      try {
        const response = await this.getPersonaAnalysis(persona, question, contextStr);
        responses.push(response);
      } catch (error) {
        console.error(`[Council] ${persona.name} failed:`, error);
        responses.push({
          persona: persona.name,
          role: persona.role,
          analysis: 'Unable to provide analysis at this time.',
          recommendation: 'Please consult other council members.',
          confidence: 0,
        });
      }
    }

    // Synthesize responses into a final recommendation
    const synthesis = await this.synthesizeDeliberation(question, responses);
    
    return {
      question,
      context,
      responses,
      synthesis: synthesis.summary,
      finalRecommendation: synthesis.recommendation,
      consensus: synthesis.consensus,
    };
  }

  /**
   * Get analysis from a single persona
   */
  private async getPersonaAnalysis(
    persona: CouncilPersona,
    question: string,
    context: string,
  ): Promise<CouncilResponse> {
    if (!this.llmApiKey) {
      return {
        persona: persona.name,
        role: persona.role,
        analysis: `[${persona.role} perspective] ${persona.perspective}`,
        recommendation: 'LLM API not configured. Set LLM_API_KEY.',
        confidence: 0,
      };
    }

    const userPrompt = `You are ${persona.name}, a ${persona.role}. ${persona.systemPrompt}

FARMER CONTEXT:
${context}

FARMER'S QUESTION:
${question}

Provide your analysis from your professional perspective and a specific recommendation. Format your response as:
ANALYSIS: [Your detailed analysis considering your expertise]
RECOMMENDATION: [Your specific, actionable recommendation]
CONFIDENCE: [0-100, your confidence level in this recommendation]`;

    const response = await fetch(`${this.llmApiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.llmApiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: persona.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) throw new Error(`LLM API error: ${response.status}`);
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Parse structured response
    const analysisMatch = text.match(/ANALYSIS:\s*(.*?)(?=RECOMMENDATION:|$)/s);
    const recMatch = text.match(/RECOMMENDATION:\s*(.*?)(?=CONFIDENCE:|$)/s);
    const confMatch = text.match(/CONFIDENCE:\s*(\d+)/);

    return {
      persona: persona.name,
      role: persona.role,
      analysis: analysisMatch?.[1]?.trim() || text,
      recommendation: recMatch?.[1]?.trim() || '',
      confidence: confMatch ? parseInt(confMatch[1]) / 100 : 0.7,
    };
  }

  /**
   * Synthesize multiple persona responses into a unified recommendation
   */
  private async synthesizeDeliberation(
    question: string,
    responses: CouncilResponse[],
  ): Promise<{ summary: string; recommendation: string; consensus: 'strong' | 'moderate' | 'divided' }> {
    // If no LLM, do simple synthesis
    if (!this.llmApiKey) {
      const recommendations = responses.map(r => `${r.persona} (${r.role}): ${r.recommendation}`).join('\n');
      return {
        summary: 'Council deliberation completed. See individual responses below.',
        recommendation: recommendations,
        consensus: 'moderate',
      };
    }

    const summaryPrompt = `Five agricultural experts have deliberated on this farmer's question:

QUESTION: ${question}

EXPERT RESPONSES:
${responses.map(r => `
${r.persona} (${r.role}) — Confidence: ${(r.confidence * 100).toFixed(0)}%
Analysis: ${r.analysis}
Recommendation: ${r.recommendation}
`).join('\n')}

Synthesize these perspectives into:
1. A concise summary of the key points of agreement and disagreement
2. A single, clear final recommendation that incorporates the best insights from all experts
3. Assess the consensus level: "strong" (all agree), "moderate" (most agree), or "divided" (significant disagreement)

Format:
SUMMARY: [Your synthesis]
RECOMMENDATION: [The final unified recommendation]
CONSENSUS: [strong|moderate|divided]`;

    try {
      const response = await fetch(`${this.llmApiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.llmApiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: summaryPrompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) throw new Error('Synthesis failed');
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      const summaryMatch = text.match(/SUMMARY:\s*(.*?)(?=RECOMMENDATION:|$)/s);
      const recMatch = text.match(/RECOMMENDATION:\s*(.*?)(?=CONSENSUS:|$)/s);
      const consensusMatch = text.match(/CONSENSUS:\s*(strong|moderate|divided)/);

      return {
        summary: summaryMatch?.[1]?.trim() || text,
        recommendation: recMatch?.[1]?.trim() || '',
        consensus: (consensusMatch?.[1] as any) || 'moderate',
      };
    } catch (error) {
      console.error('[Council] Synthesis failed:', error);
      return {
        summary: 'Council synthesis unavailable. See individual expert responses.',
        recommendation: responses.map(r => r.recommendation).join(' '),
        consensus: 'moderate',
      };
    }
  }

  private formatContext(context: Record<string, any>): string {
    const lines: string[] = [];
    if (context.farmerName) lines.push(`Farmer: ${context.farmerName}`);
    if (context.county) lines.push(`Location: ${context.county} County, Kenya`);
    if (context.crops?.length) lines.push(`Crops: ${context.crops.join(', ')}`);
    if (context.farmSize) lines.push(`Farm size: ${context.farmSize} hectares`);
    if (context.soilType) lines.push(`Soil type: ${context.soilType}`);
    if (context.irrigationType) lines.push(`Irrigation: ${context.irrigationType}`);
    if (context.weather) lines.push(`Current weather: ${JSON.stringify(context.weather)}`);
    if (context.marketData) lines.push(`Market data: ${JSON.stringify(context.marketData)}`);
    return lines.join('\n') || 'No additional context provided.';
  }
}

export const council = new CouncilService();

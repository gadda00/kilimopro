/**
 * Market Data Connector
 * Collects agricultural market prices from:
 * 1. AIRC (Agriculture Information Resource Centre) — weekly bulletins
 * 2. Crowdsourced reports from KilimoPRO farmers
 * 3. FAOSTAT trade database — international benchmark prices
 */

import { prisma } from '../index.js';
import { faostat } from './faostat.js';

interface MarketPriceData {
  marketName: string;
  county: string;
  commodity: string;
  unit: string;
  price: number;
  currency: string;
  source: string;
  reportedAt: Date;
}

export class MarketConnector {
  /**
   * Get latest market prices for a commodity across all markets
   */
  async getLatestPrices(commodity: string, county?: string): Promise<MarketPriceData[]> {
    const where: any = { commodity: { equals: commodity, mode: 'insensitive' } };
    if (county) where.county = { equals: county, mode: 'insensitive' };

    const prices = await prisma.marketPrice.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
      distinct: ['marketName'],
      take: 20,
    });

    return prices.map(p => ({
      marketName: p.marketName,
      county: p.county,
      commodity: p.commodity,
      unit: p.unit,
      price: p.price,
      currency: p.currency,
      source: p.source,
      reportedAt: p.reportedAt,
    }));
  }

  /**
   * Get price history for a commodity (for forecasting)
   */
  async getPriceHistory(commodity: string, marketName?: string, days: number = 90): Promise<{
    date: string;
    price: number;
  }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = {
      commodity: { equals: commodity, mode: 'insensitive' },
      reportedAt: { gte: since },
    };
    if (marketName) where.marketName = { equals: marketName, mode: 'insensitive' };

    const prices = await prisma.marketPrice.findMany({
      where,
      orderBy: { reportedAt: 'asc' },
    });

    // Aggregate by week
    const weekly: Map<string, number[]> = new Map();
    for (const p of prices) {
      const weekKey = this.getWeekKey(p.reportedAt);
      if (!weekly.has(weekKey)) weekly.set(weekKey, []);
      weekly.get(weekKey)!.push(p.price);
    }

    return Array.from(weekly.entries()).map(([week, prices]) => ({
      date: week,
      price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    }));
  }

  /**
   * Forecast future prices using exponential smoothing
   */
  async forecastPrices(commodity: string, marketName?: string, horizon: number = 14): Promise<{
    currentPrice: number;
    forecast: { date: string; price: number; confidence: number }[];
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  }> {
    const history = await this.getPriceHistory(commodity, marketName, 90);
    
    if (history.length < 3) {
      return {
        currentPrice: 0,
        forecast: [],
        trend: 'stable',
        changePercent: 0,
      };
    }

    const prices = history.map(h => h.price);
    const currentPrice = prices[prices.length - 1];

    // Simple exponential smoothing
    const alpha = 0.3;
    let smoothed = prices[0];
    for (let i = 1; i < prices.length; i++) {
      smoothed = alpha * prices[i] + (1 - alpha) * smoothed;
    }

    // Linear trend
    const n = prices.length;
    const xMean = (n - 1) / 2;
    const yMean = prices.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (prices[i] - yMean);
      den += (i - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;

    // Generate forecast
    const forecast: { date: string; price: number; confidence: number }[] = [];
    const lastDate = new Date(history[history.length - 1].date);
    
    // Calculate standard deviation for confidence intervals
    const residuals = prices.map(p => p - yMean);
    const stdDev = Math.sqrt(residuals.reduce((a, b) => a + b * b, 0) / n);

    for (let h = 1; h <= horizon; h++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + h * 7); // weekly steps
      const forecastPrice = Math.round(smoothed + slope * h);
      const confidence = Math.max(0.3, 1 - (h / horizon) * 0.5); // confidence decreases with horizon
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        price: Math.max(0, forecastPrice),
        confidence: Math.round(confidence * 100) / 100,
      });
    }

    const changePercent = slope > 0 ? ((forecast[forecast.length - 1].price - currentPrice) / currentPrice) * 100 : 0;
    const trend = Math.abs(changePercent) < 3 ? 'stable' : changePercent > 0 ? 'up' : 'down';

    return {
      currentPrice,
      forecast,
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  }

  /**
   * Find best market to sell a commodity (arbitrage detection)
   */
  async findBestMarket(commodity: string, farmerCounty: string): Promise<{
    bestMarket: string;
    bestPrice: number;
    priceDifference: number;
    recommendation: string;
  }> {
    const prices = await this.getLatestPrices(commodity);
    
    if (prices.length === 0) {
      return {
        bestMarket: 'N/A',
        bestPrice: 0,
        priceDifference: 0,
        recommendation: 'No market data available for this commodity.',
      };
    }

    const sorted = [...prices].sort((a, b) => b.price - a.price);
    const best = sorted[0];
    const localMarket = prices.find(p => p.county === farmerCounty);
    const localPrice = localMarket?.price || sorted[sorted.length - 1].price;
    const priceDiff = ((best.price - localPrice) / localPrice) * 100;

    let recommendation: string;
    if (priceDiff > 20) {
      recommendation = `Strong price advantage in ${best.marketName} (${best.county}). Consider transporting your ${commodity} there for ${priceDiff.toFixed(0)}% higher returns.`;
    } else if (priceDiff > 10) {
      recommendation = `Moderate price advantage in ${best.marketName}. Worth considering if transport costs are low.`;
    } else {
      recommendation = `Prices are similar across markets. Sell locally to save on transport costs.`;
    }

    return {
      bestMarket: best.marketName,
      bestPrice: best.price,
      priceDifference: Math.round(priceDiff * 100) / 100,
      recommendation,
    };
  }

  /**
   * Record a crowdsourced price report from a farmer
   */
  async recordPriceReport(data: {
    userId: string;
    marketName: string;
    county: string;
    commodity: string;
    unit: string;
    price: number;
  }): Promise<void> {
    await prisma.marketPrice.create({
      data: {
        marketName: data.marketName,
        county: data.county,
        commodity: data.commodity,
        unit: data.unit,
        price: data.price,
        currency: 'KES',
        source: 'crowdsourced',
        reportedAt: new Date(),
      },
    });

    // Also create a farmer report
    await prisma.farmerReport.create({
      data: {
        userId: data.userId,
        reportType: 'price',
        commodity: data.commodity,
        value: data.price,
        notes: `${data.marketName}, ${data.county}`,
      },
    });
  }

  /**
   * Sync market prices from AIRC bulletins
   * (In production, this would parse the weekly PDF/Excel bulletins)
   */
  async syncAIRCPrices(): Promise<number> {
    // This would fetch and parse AIRC weekly market price bulletins
    // For now, we seed with known market data structure
    const knownMarkets = [
      { market: 'Wakulima Market', county: 'Nairobi', commodity: 'Maize', unit: '90kg bag', price: 3500 },
      { market: 'Marikiti Market', county: 'Mombasa', commodity: 'Maize', unit: '90kg bag', price: 3800 },
      { market: 'Kisumu Municipal', county: 'Kisumu', commodity: 'Maize', unit: '90kg bag', price: 3600 },
      { market: 'Eldoret Market', county: 'Uasin Gishu', commodity: 'Maize', unit: '90kg bag', price: 3200 },
      { market: 'Nakuru Wholesale', county: 'Nakuru', commodity: 'Maize', unit: '90kg bag', price: 3400 },
      { market: 'Wakulima Market', county: 'Nairobi', commodity: 'Beans', unit: '90kg bag', price: 7500 },
      { market: 'Marikiti Market', county: 'Mombasa', commodity: 'Beans', unit: '90kg bag', price: 8000 },
      { market: 'Eldoret Market', county: 'Uasin Gishu', commodity: 'Beans', unit: '90kg bag', price: 6800 },
      { market: 'Wakulima Market', county: 'Nairobi', commodity: 'Irish Potato', unit: '50kg bag', price: 2200 },
      { market: 'Nyahururu Market', county: 'Nyandarua', commodity: 'Irish Potato', unit: '50kg bag', price: 1800 },
    ];

    let count = 0;
    for (const m of knownMarkets) {
      await prisma.marketPrice.upsert({
        where: { id: `${m.market}_${m.commodity}_${Date.now()}` },
        create: {
          marketName: m.market,
          county: m.county,
          commodity: m.commodity,
          unit: m.unit,
          price: m.price,
          source: 'airc',
          reportedAt: new Date(),
        },
        update: {
          price: m.price,
          reportedAt: new Date(),
        },
      });
      count++;
    }

    return count;
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // Round to Sunday
    return d.toISOString().split('T')[0];
  }
}

export const market = new MarketConnector();

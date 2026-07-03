/**
 * Market Routes
 * GET /api/market/prices?commodity=X&county=Y
 * GET /api/market/history?commodity=X&market=Y&days=90
 * GET /api/market/forecast?commodity=X&market=Y&horizon=14
 * GET /api/market/best?commodity=X&county=Y
 * POST /api/market/report
 */

import { FastifyInstance } from 'fastify';
import { market } from '../connectors/market.js';

export async function marketRoutes(app: FastifyInstance) {
  // Latest prices
  app.get('/prices', async (request) => {
    const { commodity, county } = request.query as { commodity: string; county?: string };
    if (!commodity) return { error: 'commodity parameter required' };
    const prices = await market.getLatestPrices(commodity, county);
    return { commodity, prices, count: prices.length };
  });

  // Price history
  app.get('/history', async (request) => {
    const { commodity, market: marketName, days } = request.query as { 
      commodity: string; market?: string; days?: string 
    };
    if (!commodity) return { error: 'commodity parameter required' };
    const history = await market.getPriceHistory(commodity, marketName, parseInt(days || '90'));
    return { commodity, history, count: history.length };
  });

  // Price forecast
  app.get('/forecast', async (request) => {
    const { commodity, market: marketName, horizon } = request.query as {
      commodity: string; market?: string; horizon?: string
    };
    if (!commodity) return { error: 'commodity parameter required' };
    const forecast = await market.forecastPrices(commodity, marketName, parseInt(horizon || '14'));
    return forecast;
  });

  // Best market to sell
  app.get('/best', async (request) => {
    const { commodity, county } = request.query as { commodity: string; county: string };
    if (!commodity || !county) return { error: 'commodity and county required' };
    const result = await market.findBestMarket(commodity, county);
    return result;
  });

  // Farmer price report (crowdsourced)
  app.post('/report', async (request) => {
    const data = request.body as {
      userId: string; marketName: string; county: string;
      commodity: string; unit: string; price: number;
    };
    await market.recordPriceReport(data);
    return { success: true, message: 'Price report recorded. Thank you for contributing!' };
  });

  // Sync AIRC prices (admin/cron)
  app.post('/sync', async () => {
    const count = await market.syncAIRCPrices();
    return { success: true, synced: count };
  });
}

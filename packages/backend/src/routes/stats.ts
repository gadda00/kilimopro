/** Stats & analytics routes — for dashboards and government/NGO tier */
import { FastifyInstance } from 'fastify';
import { prisma } from '../index.js';
import { kilimostat } from '../connectors/kilimostat.js';
import { faostat } from '../connectors/faostat.js';

export async function statsRoutes(app: FastifyInstance) {
  // Platform statistics
  app.get('/platform', async () => {
    const [farmers, cooperatives, plots, reports, detections] = await Promise.all([
      prisma.user.count({ where: { role: 'FARMER' } }),
      prisma.user.count({ where: { role: 'COOPERATIVE' } }),
      prisma.plot.count(),
      prisma.farmerReport.count(),
      prisma.diseaseDetection.count(),
    ]);
    
    return {
      farmers,
      cooperatives,
      plots,
      farmerReports: reports,
      diseaseDetections: detections,
      timestamp: new Date().toISOString(),
    };
  });

  // Kenya crop statistics (from KilimoSTAT)
  app.get('/kenya/crops', async (request) => {
    const { county, year } = request.query as { county?: string; year?: string };
    const data = await kilimostat.getCropProduction(county, year ? parseInt(year) : undefined);
    return { data, source: 'KilimoSTAT', county: county || 'all' };
  });

  // Yield comparison (Kenya vs global, from FAOSTAT)
  app.get('/comparison/yield', async (request) => {
    const { crop } = request.query as { crop: string };
    if (!crop) return { error: 'crop parameter required' };
    
    const comparison = await faostat.compareYieldToGlobal(crop);
    return comparison;
  });

  // Market overview
  app.get('/markets', async () => {
    const marketCount = await prisma.marketPrice.groupBy({
      by: ['marketName', 'county'],
      _count: true,
      _max: { reportedAt: true },
    });
    
    return { markets: marketCount, totalMarkets: marketCount.length };
  });

  // Advisory impact
  app.get('/advisory-impact', async () => {
    const advisories = await prisma.advisory.groupBy({
      by: ['type', 'priority'],
      _count: true,
    });
    
    return { advisoryBreakdown: advisories };
  });
}

/**
 * Advisory Routes
 * GET /api/advisory/:userId — Get personalized recommendations
 * GET /api/advisory/daily/:userId — Get daily farm report
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '../index.js';
import { advisory } from '../services/advisory.js';

export async function advisoryRoutes(app: FastifyInstance) {
  // Get personalized advisory
  app.get('/:userId', async (request) => {
    const { userId } = request.params as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farm: { include: { plots: true } } },
    });
    
    if (!user || !user.farm) {
      return { error: 'User or farm not found' };
    }
    
    const crops = user.farm.plots
      .map(p => p.cropType)
      .filter((c): c is string => c !== null);
    
    const recommendations = await advisory.generateAdvisory({
      latitude: user.farm.latitude,
      longitude: user.farm.longitude,
      county: user.county || 'Nairobi',
      crops,
      soilType: user.farm.soilType || undefined,
      irrigationType: user.farm.irrigationType || undefined,
      language: user.language,
    });
    
    // Save recommendations as advisories
    for (const rec of recommendations) {
      await prisma.advisory.create({
        data: {
          userId,
          type: rec.type,
          title: rec.title,
          body: rec.body,
          priority: rec.priority,
        },
      });
    }
    
    return { recommendations, count: recommendations.length };
  });

  // Daily farm report
  app.get('/daily/:userId', async (request) => {
    const { userId } = request.params as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farm: { include: { plots: true } } },
    });
    
    if (!user || !user.farm) {
      return { error: 'User or farm not found' };
    }
    
    const crops = user.farm.plots
      .map(p => p.cropType)
      .filter((c): c is string => c !== null);
    
    const report = await advisory.generateDailyReport({
      latitude: user.farm.latitude,
      longitude: user.farm.longitude,
      county: user.county || 'Nairobi',
      crops,
      language: user.language,
    });
    
    return report;
  });
}

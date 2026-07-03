/** Farmer reports routes — crowdsourced data collection */
import { FastifyInstance } from 'fastify';
import { prisma } from '../index.js';

export async function reportRoutes(app: FastifyInstance) {
  // Submit a farmer report
  app.post('/', async (request) => {
    const { userId, reportType, commodity, value, notes, imageUrl, latitude, longitude } = request.body as any;
    
    const report = await prisma.farmerReport.create({
      data: { userId, reportType, commodity, value, notes, imageUrl, latitude, longitude },
    });
    
    return { report, message: 'Report submitted. Thank you for contributing to the KilimoPRO community!' };
  });

  // Get reports (for community feed / verification)
  app.get('/', async (request) => {
    const { reportType, commodity, county, limit } = request.query as any;
    
    const reports = await prisma.farmerReport.findMany({
      where: {
        ...(reportType && { reportType }),
        ...(commodity && { commodity: { equals: commodity, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit || '50'),
      include: { user: { select: { name: true, county: true } } },
    });
    
    return { reports, count: reports.length };
  });

  // Verify a report (by extension officer)
  app.patch('/:id/verify', async (request) => {
    const { id } = request.params as { id: string };
    const report = await prisma.farmerReport.update({
      where: { id },
      data: { verified: true },
    });
    return { report };
  });
}

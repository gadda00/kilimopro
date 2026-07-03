/** Farm management routes */
import { FastifyInstance } from 'fastify';
import { prisma } from '../index.js';

export async function farmRoutes(app: FastifyInstance) {
  // Create/update farm
  app.post('/', async (request) => {
    const { userId, name, latitude, longitude, elevation, soilType, soilPH, irrigationType } = request.body as any;
    
    const farm = await prisma.farm.upsert({
      where: { userId },
      create: { userId, name, latitude, longitude, elevation, soilType, soilPH, irrigationType },
      update: { name, latitude, longitude, elevation, soilType, soilPH, irrigationType },
    });
    
    return { farm };
  });

  // Get farm with plots
  app.get('/:userId', async (request) => {
    const { userId } = request.params as { userId: string };
    const farm = await prisma.farm.findUnique({
      where: { userId },
      include: { plots: { include: { observations: true } } },
    });
    return { farm };
  });

  // Add a plot
  app.post('/plots', async (request) => {
    const { farmId, name, sizeHectares, cropType, variety, plantingDate } = request.body as any;
    
    const plot = await prisma.plot.create({
      data: {
        farmId, name, sizeHectares,
        cropType, variety,
        plantingDate: plantingDate ? new Date(plantingDate) : null,
        status: cropType ? 'PLANTED' : 'EMPTY',
      },
    });
    
    return { plot };
  });

  // Update plot status
  app.patch('/plots/:plotId', async (request) => {
    const { plotId } = request.params as { plotId: string };
    const updates = request.body as any;
    
    const plot = await prisma.plot.update({
      where: { id: plotId },
      data: updates,
    });
    
    return { plot };
  });

  // Add observation (pest sighting, growth stage, harvest amount, etc.)
  app.post('/plots/:plotId/observations', async (request) => {
    const { plotId } = request.params as { plotId: string };
    const { type, value, imageUrl, latitude, longitude } = request.body as any;
    
    const observation = await prisma.observation.create({
      data: { plotId, type, value, imageUrl, latitude, longitude },
    });
    
    return { observation };
  });
}

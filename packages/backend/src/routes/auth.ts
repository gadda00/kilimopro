/** Auth routes — placeholder for JWT-based authentication */
import { FastifyInstance } from 'fastify';
import { prisma } from '../index.js';
import crypto from 'crypto';

export async function authRoutes(app: FastifyInstance) {
  // Register (via phone number — primary identifier for farmers)
  app.post('/register', async (request) => {
    const { phone, name, county, language } = request.body as {
      phone: string; name?: string; county?: string; language?: string;
    };
    
    if (!phone) return { error: 'Phone number required' };
    
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return { error: 'User already exists. Use login.' };
    
    const user = await prisma.user.create({
      data: { phone, name, county, language: language || 'sw' },
    });
    
    const token = generateToken(user.id);
    return { user, token };
  });

  // Login (via phone + OTP — simplified)
  app.post('/login', async (request) => {
    const { phone, otp } = request.body as { phone: string; otp?: string };
    
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return { error: 'User not found. Please register.' };
    
    // In production: verify OTP via Africa's Talking
    const token = generateToken(user.id);
    return { user, token };
  });

  // Send OTP
  app.post('/otp', async (request) => {
    const { phone } = request.body as { phone: string };
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return { error: 'User not found' };
    
    // In production: send OTP via Africa's Talking SMS API
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // await sendSMS(phone, `Your KilimoPRO verification code is: ${otp}`);
    
    return { success: true, message: 'OTP sent (demo mode)' };
  });

  // Get current user
  app.get('/me', async (request) => {
    const userId = (request.headers as any).authorization?.replace('Bearer ', '');
    if (!userId) return { error: 'Not authenticated' };
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farm: { include: { plots: true } } },
    });
    
    return { user };
  });
}

function generateToken(userId: string): string {
  // Simplified JWT — in production use jsonwebtoken
  return crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev-secret')
    .update(`${userId}:${Date.now()}`)
    .digest('hex');
}

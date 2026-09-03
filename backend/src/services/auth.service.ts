import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';
import { UserRole } from '../types';
import { prisma } from '../utils/prisma';

const DEMO_PASSWORD_HASH = bcrypt.hashSync('demo123', 10);

const DEMO_ACCOUNTS = [
  { email: 'admin@demo.com', name: 'Admin User', role: 'ADMIN', phone: '+91-9000000001', location: { lat: 28.6139, lng: 77.2090, city: 'New Delhi' } },
  { email: 'farmer@demo.com', name: 'Rajesh Kumar', role: 'FARMER', phone: '+91-9000000002', location: { lat: 28.4595, lng: 77.0266, city: 'Gurugram' } },
  { email: 'fpo@demo.com', name: 'Green Valley FPO', role: 'FPO', phone: '+91-9000000003', location: { lat: 28.6692, lng: 77.4538, city: 'Ghaziabad' } },
  { email: 'consumer@demo.com', name: 'Priya Sharma', role: 'CONSUMER', phone: '+91-9000000004', location: { lat: 28.5245, lng: 77.2066, city: 'South Delhi' } },
  { email: 'buyer@demo.com', name: 'Hotel Fresh Picks', role: 'B2B_BUYER', phone: '+91-9000000005', location: { lat: 28.6300, lng: 77.2170, city: 'Connaught Place' } },
  { email: 'logistics@demo.com', name: 'QuickDeliver Partners', role: 'LOGISTICS', phone: '+91-9000000006', location: { lat: 28.5800, lng: 77.3300, city: 'Noida' } },
];

export async function seedDemoAccounts() {
  for (const account of DEMO_ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { email: account.email } });
    if (!existing) {
      const user = await prisma.user.create({
        data: {
          email: account.email,
          password: DEMO_PASSWORD_HASH,
          name: account.name,
          role: account.role,
          phone: account.phone,
          isVerified: true,
          isActive: true,
        },
      });
      // Create profile based on role
      if (account.role === 'FARMER') {
        await prisma.farmerProfile.create({
          data: {
            userId: user.id,
            farmName: 'Rajesh Organic Farm',
            farmSize: '5 acres',
            latitude: account.location.lat,
            longitude: account.location.lng,
            city: account.location.city,
            specializations: JSON.stringify(['Vegetables', 'Fruits']),
            organicCertified: true,
            trustScore: 92,
          },
        });
      } else if (account.role === 'FPO') {
        await prisma.fPOProfile.create({
          data: {
            userId: user.id,
            fpoName: 'Green Valley FPO',
            registrationNumber: 'FPO-2024-DEL-001',
            memberCount: 45,
            latitude: account.location.lat,
            longitude: account.location.lng,
            city: account.location.city,
            specializations: JSON.stringify(['Grains', 'Pulses', 'Spices']),
            trustScore: 88,
          },
        });
      } else if (account.role === 'CONSUMER') {
        await prisma.consumerProfile.create({
          data: {
            userId: user.id,
            defaultLatitude: account.location.lat,
            defaultLongitude: account.location.lng,
            defaultCity: account.location.city,
            defaultAddress: '12 MG Road, South Delhi',
          },
        });
      } else if (account.role === 'B2B_BUYER') {
        await prisma.buyerProfile.create({
          data: {
            userId: user.id,
            businessName: 'Hotel Fresh Picks',
            businessType: 'Restaurant',
            latitude: account.location.lat,
            longitude: account.location.lng,
            city: account.location.city,
            address: '45 CP Block, Connaught Place',
            trustScore: 85,
          },
        });
      }
    }
  }
}

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        phone: data.phone,
        isVerified: false,
        isActive: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
      },
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();

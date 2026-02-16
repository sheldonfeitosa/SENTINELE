import { PrismaClient, User, Tenant } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { EmailService } from './email.service';
import { prisma } from '../lib/prisma';
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not defined in environment variables');
}

interface RegisterData {
    email: string;
    password: string;
    name: string;
    tenantName: string;
    tenantSlug: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface AuthResponse {
    token: string;
    user: {
        id: number;
        email: string;
        name: string;
        role: string;
        tenant: {
            id: string;
            name: string;
        }
    }
}

export class AuthService {

    async register(data: RegisterData): Promise<AuthResponse> {
        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // 2. Check if tenant slug exists
        const existingTenant = await prisma.tenant.findUnique({ where: { slug: data.tenantSlug } });
        if (existingTenant) {
            throw new Error('Tenant URL already taken');
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        // 4. Create Tenant and User Transactionally
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: data.tenantName,
                    slug: data.tenantSlug
                }
            });

            const user = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                    role: 'TENANT_ADMIN',
                    tenantId: tenant.id
                },
                include: { tenant: true }
            });

            return user;
        });

        // 5. Generate Token
        const token = this.generateToken(result);

        return {
            token,
            user: {
                id: result.id,
                email: result.email,
                name: result.name,
                role: result.role,
                tenant: {
                    id: result.tenant.id,
                    name: result.tenant.name
                }
            }
        };
    }

    async login(data: LoginData): Promise<AuthResponse> {
        // 1. Find User
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { tenant: true }
        });

        if (!user) {
            throw new Error('Credenciais inválidas.');
        }

        // 2. Verify Password
        const isValid = await bcrypt.compare(data.password, user.password);

        if (!isValid) {
            throw new Error('Credenciais inválidas.');
        }

        const token = this.generateToken(user);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenant: {
                    id: user.tenant.id,
                    name: user.tenant.name
                }
            }
        };
    }

    private generateToken(user: User & { tenant: Tenant }): string {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    async createTrial(data: { name: string; hospital: string; email: string; phone: string }): Promise<{ password: string }> {
        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('Email já cadastrado. Tente recuperar sua senha.');
        }

        // Generate basic slug from hospital name
        const baseSlug = data.hospital.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        let finalSlug = baseSlug;
        let counter = 1;

        // Ensure unique slug
        while (await prisma.tenant.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        // Generate Random Password (8 chars)
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Transaction: Create Tenant + User
        await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: data.hospital,
                    slug: finalSlug
                }
            });

            await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                    role: 'TENANT_ADMIN',
                    tenantId: tenant.id,
                    subscriptionStatus: 'trialing',
                    currentPeriodEnd: new Date(new Date().setDate(new Date().getDate() + 30)) // 30 days trial
                }
            });
        });

        // Send Welcome Email
        const emailService = new EmailService();
        await emailService.sendWelcomeEmail(
            data.email,
            data.name,
            password,
            process.env.APP_URL || 'http://localhost:5173'
        );

        return { password };
    }

    async forgotPassword(email: string): Promise<void> {
        // 1. Find User
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Silently return to avoid email enumeration
            return;
        }

        // 2. Generate Reset Token (32 bytes hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

        // 3. Update User with Token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        // 4. Send Reset Email
        const emailService = new EmailService();
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        await emailService.sendPasswordResetEmail(email, user.name, resetUrl);
    }

    async validateResetToken(token: string): Promise<boolean> {
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date()
                }
            }
        });

        return !!user;
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        // 1. Find valid user with token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            throw new Error('Token inválido ou expirado.');
        }

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // 3. Update password and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
    }
}

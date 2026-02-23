"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_service_1 = require("./email.service");
const prisma_1 = require("../lib/prisma");
const crypto_1 = __importDefault(require("crypto"));
const SALT_ROUNDS = 10;
const JWT_SECRET = (process.env.JWT_SECRET || 'sentinela-secret-key-change-me').replace(/[\r\n]/g, '').trim();
class AuthService {
    register(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Check if user already exists
            const existingUser = yield prisma_1.prisma.user.findUnique({ where: { email: data.email } });
            if (existingUser) {
                throw new Error('User already exists');
            }
            // 2. Check if tenant slug exists
            const existingTenant = yield prisma_1.prisma.tenant.findUnique({ where: { slug: data.tenantSlug } });
            if (existingTenant) {
                throw new Error('Tenant URL already taken');
            }
            // 3. Hash password
            const hashedPassword = yield bcryptjs_1.default.hash(data.password, SALT_ROUNDS);
            // 4. Create Tenant and User Transactionally
            const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const tenant = yield tx.tenant.create({
                    data: {
                        name: data.tenantName,
                        slug: data.tenantSlug
                    }
                });
                const user = yield tx.user.create({
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
            }));
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
        });
    }
    login(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Find User
            const user = yield prisma_1.prisma.user.findUnique({
                where: { email: data.email },
                include: { tenant: true }
            });
            if (!user) {
                throw new Error('Invalid credentials');
            }
            // 2. Verify Password
            const isValid = yield bcryptjs_1.default.compare(data.password, user.password);
            if (!isValid) {
                throw new Error('Invalid credentials');
            }
            // 3. Generate Token
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
        });
    }
    generateToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        }, JWT_SECRET, { expiresIn: '24h' });
    }
    createTrial(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Check if user already exists
            const existingUser = yield prisma_1.prisma.user.findUnique({ where: { email: data.email } });
            if (existingUser) {
                throw new Error('Email já cadastrado. Tente recuperar sua senha.');
            }
            // Generate basic slug from hospital name
            const baseSlug = data.hospital.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            let finalSlug = baseSlug;
            let counter = 1;
            // Ensure unique slug
            while (yield prisma_1.prisma.tenant.findUnique({ where: { slug: finalSlug } })) {
                finalSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            // Generate Random Password (8 chars)
            const password = Math.random().toString(36).slice(-8);
            const hashedPassword = yield bcryptjs_1.default.hash(password, SALT_ROUNDS);
            // Transaction: Create Tenant + User
            yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const tenant = yield tx.tenant.create({
                    data: {
                        name: data.hospital,
                        slug: finalSlug
                    }
                });
                yield tx.user.create({
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
            }));
            // Send Welcome Email
            const emailService = new email_service_1.EmailService();
            yield emailService.sendWelcomeEmail(data.email, data.name, password, process.env.APP_URL || 'https://sentinelaai.com.br');
            return { password };
        });
    }
    resetPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error('Usuário não encontrado.');
            }
            // Generate token
            const token = crypto_1.default.randomBytes(32).toString('hex');
            const expiry = new Date(Date.now() + 3600000); // 1 hour
            yield prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken: token,
                    resetTokenExpiry: expiry
                }
            });
            const resetLink = `${process.env.APP_URL || 'https://sentinelaai.com.br'}/reset-password?token=${token}`;
            const emailService = new email_service_1.EmailService();
            yield emailService.sendPasswordResetEmail(email, user.name, resetLink);
        });
    }
    verifyResetToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.prisma.user.findFirst({
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
            return user;
        });
    }
    updatePasswordWithToken(token, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.verifyResetToken(token);
            const hashedPassword = yield bcryptjs_1.default.hash(newPassword, SALT_ROUNDS);
            yield prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiry: null
                }
            });
        });
    }
}
exports.AuthService = AuthService;

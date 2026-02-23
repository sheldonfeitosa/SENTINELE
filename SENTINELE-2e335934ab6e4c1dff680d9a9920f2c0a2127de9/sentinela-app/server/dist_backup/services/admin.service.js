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
exports.AdminService = void 0;
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class AdminService {
    getAllTenants() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.tenant.findMany({
                include: {
                    _count: {
                        select: {
                            users: true
                        }
                    },
                    users: {
                        select: {
                            subscriptionStatus: true,
                            currentPeriodEnd: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        });
    }
    getSystemStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const [tenantCount, userCount, activeTenants] = yield Promise.all([
                prisma_1.prisma.tenant.count(),
                prisma_1.prisma.user.count(),
                prisma_1.prisma.user.groupBy({
                    by: ['tenantId'],
                    where: { subscriptionStatus: 'active' }
                })
            ]);
            const totalActive = activeTenants.length;
            const estimatedMRR = totalActive * 499.00; // Valor fixo hipotético por hospital ativo
            return {
                totalTenants: tenantCount,
                totalUsers: userCount,
                activeSubscriptions: totalActive,
                estimatedMRR,
                currency: 'BRL'
            };
        });
    }
    getTenantsWithUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.tenant.findMany({
                include: {
                    users: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            subscriptionStatus: true,
                            currentPeriodEnd: true
                        }
                    }
                }
            });
        });
    }
    updateUserPassword(userId, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
            return prisma_1.prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });
        });
    }
    updateTenantSubscription(tenantId, status, periodEnd) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.user.updateMany({
                where: { tenantId },
                data: {
                    subscriptionStatus: status,
                    currentPeriodEnd: periodEnd || null
                }
            });
        });
    }
    sendSalesEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            // Here we would integrate with EmailService to send a sales pitch
            console.log(`Simulating sales email send to: ${email}`);
            return true;
        });
    }
    createAdminUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield bcryptjs_1.default.hash(data.password, 10);
            return prisma_1.prisma.user.create({
                data: Object.assign(Object.assign({}, data), { password: hashedPassword })
            });
        });
    }
    deleteAdminUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.user.delete({
                where: { id: userId }
            });
        });
    }
}
exports.AdminService = AdminService;

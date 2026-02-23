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
exports.RiskManagerService = void 0;
const risk_manager_repository_1 = require("../repositories/risk-manager.repository");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const email_service_1 = require("./email.service");
class RiskManagerService {
    constructor() {
        this.repository = new risk_manager_repository_1.RiskManagerRepository();
        this.emailService = new email_service_1.EmailService();
    }
    safeParseSectors(sectors) {
        if (!sectors)
            return [];
        try {
            return JSON.parse(sectors);
        }
        catch (e) {
            console.error('Failed to parse sectors JSON:', sectors);
            return [];
        }
    }
    createManager(tenantId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const password = data.password || 'mudar123';
            const passwordHash = yield bcryptjs_1.default.hash(password, 10);
            // Check if user already exists in the system
            const existingUser = yield this.repository.findByEmail(data.email);
            let manager;
            if (existingUser) {
                // Update existing user - useful if they were just a regular user or added to wrong tenant
                manager = yield this.repository.update(existingUser.id, existingUser.tenantId, {
                    name: data.name || existingUser.name,
                    role: data.role || existingUser.role,
                    sectors: JSON.stringify(data.sectors || []),
                    tenantId: tenantId // Move them to the current tenant if they were elsewhere or just confirm
                });
            }
            else {
                // Create new manager
                manager = yield this.repository.create(tenantId, {
                    name: data.name,
                    email: data.email,
                    role: data.role || 'TENANT_ADMIN',
                    sectors: JSON.stringify(data.sectors || []),
                    password: passwordHash
                });
                // Send welcome email for NEW managers
                try {
                    const appUrl = process.env.APP_URL || 'https://sentinelaai.com.br';
                    yield this.emailService.sendWelcomeEmail(manager.email, manager.name, password, appUrl);
                }
                catch (error) {
                    console.error('Failed to send welcome email to new manager:', error);
                }
            }
            return Object.assign(Object.assign({}, manager), { sectors: this.safeParseSectors(manager.sectors) });
        });
    }
    getAllManagers(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const managers = yield this.repository.findAll(tenantId);
            return managers.map(m => (Object.assign(Object.assign({}, m), { sectors: this.safeParseSectors(m.sectors) })));
        });
    }
    getManagerById(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const manager = yield this.repository.findById(id, tenantId);
            if (!manager)
                return null;
            return Object.assign(Object.assign({}, manager), { sectors: this.safeParseSectors(manager.sectors) });
        });
    }
    updateManager(id, tenantId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateData = {};
            if (data.name)
                updateData.name = data.name;
            if (data.email)
                updateData.email = data.email;
            if (data.role)
                updateData.role = data.role;
            if (data.sectors)
                updateData.sectors = JSON.stringify(data.sectors);
            if (data.password) {
                updateData.password = yield bcryptjs_1.default.hash(data.password, 10);
            }
            const manager = yield this.repository.update(id, tenantId, updateData);
            return Object.assign(Object.assign({}, manager), { sectors: this.safeParseSectors(manager.sectors) });
        });
    }
    deleteManager(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.delete(id, tenantId);
        });
    }
}
exports.RiskManagerService = RiskManagerService;

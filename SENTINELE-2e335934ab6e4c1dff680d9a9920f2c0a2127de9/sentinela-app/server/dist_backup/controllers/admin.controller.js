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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("../services/admin.service");
class AdminController {
    constructor() {
        this.getTenants = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const tenants = yield this.service.getAllTenants();
                res.json(tenants);
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao buscar hospitais', details: error.message });
            }
        });
        this.getStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this.service.getSystemStats();
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao buscar estatísticas do sistema', details: error.message });
            }
        });
        this.getTenantsWithUsers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.service.getTenantsWithUsers();
                res.json(data);
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao buscar usuários dos hospitais', details: error.message });
            }
        });
        this.resetPassword = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, newPassword } = req.body;
                if (!userId || !newPassword) {
                    return res.status(400).json({ error: 'userId e newPassword são obrigatórios.' });
                }
                yield this.service.updateUserPassword(userId, newPassword);
                res.json({ message: 'Senha atualizada com sucesso.' });
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao resetar senha', details: error.message });
            }
        });
        this.updateSubscription = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { tenantId, status, periodEnd } = req.body;
                if (!tenantId || !status) {
                    return res.status(400).json({ error: 'tenantId e status são obrigatórios.' });
                }
                yield this.service.updateTenantSubscription(tenantId, status, periodEnd ? new Date(periodEnd) : undefined);
                res.json({ message: 'Assinatura atualizada com sucesso.' });
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao atualizar assinatura', details: error.message });
            }
        });
        this.sendSalesEmail = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email) {
                    return res.status(400).json({ error: 'Email é obrigatório.' });
                }
                yield this.service.sendSalesEmail(email);
                res.json({ message: 'E-mail de prospecção enviado com sucesso.' });
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao enviar e-mail de prospecção', details: error.message });
            }
        });
        this.createUser = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, email, password, role, tenantId } = req.body;
                if (!name || !email || !password || !role || !tenantId) {
                    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
                }
                const user = yield this.service.createAdminUser({ name, email, password, role, tenantId });
                res.status(201).json(user);
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao criar usuário', details: error.message });
            }
        });
        this.deleteUser = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
                }
                yield this.service.deleteAdminUser(Number(id));
                res.json({ message: 'Usuário excluído com sucesso.' });
            }
            catch (error) {
                res.status(500).json({ error: 'Erro ao excluir usuário', details: error.message });
            }
        });
        this.service = new admin_service_1.AdminService();
    }
}
exports.AdminController = AdminController;

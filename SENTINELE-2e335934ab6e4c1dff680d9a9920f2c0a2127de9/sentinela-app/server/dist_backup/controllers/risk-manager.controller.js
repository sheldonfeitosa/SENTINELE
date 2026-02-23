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
exports.RiskManagerController = void 0;
const risk_manager_service_1 = require("../services/risk-manager.service");
class RiskManagerController {
    constructor() {
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const tenantId = req.user.tenantId;
                const managerData = Object.assign(Object.assign({}, req.body), { tenantId });
                const manager = yield this.service.createManager(tenantId, managerData);
                res.status(201).json(manager);
            }
            catch (error) {
                console.error('CREATE MANAGER ERROR:', error);
                res.status(500).json({
                    error: 'Failed to create manager',
                    details: error.message || 'Unknown error'
                });
            }
        });
        this.getAll = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const tenantId = req.user.tenantId;
                const managers = yield this.service.getAllManagers(tenantId);
                res.json(managers);
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to fetch managers' });
            }
        });
        this.getById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const manager = yield this.service.getManagerById(id, tenantId);
                if (!manager) {
                    res.status(404).json({ error: 'Manager not found' });
                    return;
                }
                res.json(manager);
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to fetch manager' });
            }
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const manager = yield this.service.updateManager(id, tenantId, req.body);
                res.json(manager);
            }
            catch (error) {
                console.error('UPDATE MANAGER ERROR:', error.message);
                res.status(500).json({ error: 'Failed to update manager', details: error.message });
            }
        });
        this.delete = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                yield this.service.deleteManager(id, tenantId);
                res.status(204).send();
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to delete manager' });
            }
        });
        this.service = new risk_manager_service_1.RiskManagerService();
    }
}
exports.RiskManagerController = RiskManagerController;

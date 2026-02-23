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
exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
class DashboardController {
    constructor() {
        this.getStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                if (!user || !user.tenantId) {
                    return res.status(401).json({ error: 'User tenant context missing' });
                }
                const stats = yield this.service.getAdvancedStats(user.tenantId);
                res.json(stats);
            }
            catch (error) {
                console.error('Error fetching dashboard stats:', error);
                res.status(500).json({ error: 'Failed to fetch dashboard stats' });
            }
        });
        this.service = new dashboard_service_1.DashboardService();
    }
}
exports.DashboardController = DashboardController;

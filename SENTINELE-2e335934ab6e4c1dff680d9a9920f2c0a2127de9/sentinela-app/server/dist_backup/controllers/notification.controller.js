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
exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
class NotificationController {
    constructor() {
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const data = req.body;
                const authTenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
                const incident = yield this.service.createNotification(data, authTenantId);
                res.status(201).json(incident);
            }
            catch (error) {
                console.error('CONTROLLER ERROR:', error.message);
                res.status(500).json({ error: 'Failed to create notification', details: error.message });
            }
        });
        this.getAll = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const tenantId = req.user.tenantId;
                const notifications = yield this.service.getAllNotifications(tenantId);
                res.json(notifications);
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to fetch notifications' });
            }
        });
        this.getById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const notification = yield this.service.getNotificationById(id, tenantId);
                if (!notification) {
                    res.status(404).json({ error: 'Notification not found' });
                    return;
                }
                res.json(notification);
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to fetch notification' });
            }
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const data = req.body;
                const incident = yield this.service.updateNotification(id, tenantId, data);
                res.json(incident);
            }
            catch (error) {
                console.error('UPDATE ERROR:', error.message);
                res.status(500).json({ error: 'Failed to update notification' });
            }
        });
        this.generateRCA = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const rca = yield this.service.generateRCA(id, tenantId);
                res.json(rca);
            }
            catch (error) {
                console.error('RCA ERROR:', error.message);
                res.status(500).json({ error: 'Failed to generate RCA' });
            }
        });
        this.generateFiveWhys = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const result = yield this.service.generateFiveWhys(id, tenantId);
                res.json(result);
            }
            catch (error) {
                console.error('5 WHYS ERROR:', error.message);
                res.status(500).json({ error: 'Failed to generate 5 Whys' });
            }
        });
        this.reanalyze = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const result = yield this.service.reanalyzeIncident(id, tenantId);
                res.json(result);
            }
            catch (error) {
                console.error('REANALYZE ERROR:', error.message);
                res.status(500).json({ error: 'Failed to re-analyze incident' });
            }
        });
        // New Endpoints for Email Workflow
        this.forwardToSector = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const { email } = req.body;
                console.log(`🚀 Forwarding notification #${id} to ${email}`);
                if (!email) {
                    res.status(400).json({ error: 'Email is required' });
                    return;
                }
                const result = yield this.service.forwardToSector(id, tenantId, email);
                res.json(result);
            }
            catch (error) {
                console.error('❌ FORWARD ERROR DETAILS:', error);
                res.status(500).json({ error: 'Failed to forward email', details: error.message });
            }
        });
        this.notifyHighManagement = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const result = yield this.service.notifyHighManagement(id, tenantId);
                res.json(result);
            }
            catch (error) {
                console.error('HIGH MANAGEMENT ERROR:', error.message);
                res.status(500).json({ error: 'Failed to notify High Management' });
            }
        });
        this.startActionPlan = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const { deadline } = req.body;
                const result = yield this.service.startActionPlan(id, tenantId, deadline ? new Date(deadline) : undefined);
                res.json(result);
            }
            catch (error) {
                console.error('START ACTION PLAN ERROR:', error.message);
                res.status(500).json({ error: 'Failed to start action plan' });
            }
        });
        this.chat = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const { message, context } = req.body;
                const result = yield this.service.chatWithAI(id, tenantId, message, context);
                res.json({ message: result });
            }
            catch (error) {
                console.error('CHAT ERROR:', error.message);
                res.status(500).json({ error: 'Failed to chat with AI' });
            }
        });
        this.contactRiskManager = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const { message, requesterEmail } = req.body;
                const result = yield this.service.contactRiskManager(id, tenantId, message, requesterEmail);
                res.json(result);
            }
            catch (error) {
                console.error('CONTACT RISK MANAGER ERROR:', error.message);
                res.status(500).json({ error: 'Failed to contact Risk Manager' });
            }
        });
        this.approveDeadline = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const { deadline } = req.body;
                if (!deadline) {
                    res.status(400).json({ error: 'Deadline is required' });
                    return;
                }
                const result = yield this.service.approveDeadline(id, tenantId, new Date(deadline));
                res.json(result);
            }
            catch (error) {
                console.error('APPROVE DEADLINE ERROR:', error.message);
                res.status(500).json({ error: 'Failed to approve deadline' });
            }
        });
        this.rejectDeadline = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                const result = yield this.service.rejectDeadline(id, tenantId);
                res.json(result);
            }
            catch (error) {
                console.error('REJECT DEADLINE ERROR:', error.message);
                res.status(500).json({ error: 'Failed to reject deadline' });
            }
        });
        this.service = new notification_service_1.NotificationService();
    }
}
exports.NotificationController = NotificationController;

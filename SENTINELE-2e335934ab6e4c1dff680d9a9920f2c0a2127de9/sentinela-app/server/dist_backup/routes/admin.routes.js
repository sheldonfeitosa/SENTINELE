"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const admin_middleware_1 = require("../middlewares/admin.middleware");
const router = (0, express_1.Router)();
const controller = new admin_controller_1.AdminController();
// All routes here require authentication and SUPER_ADMIN role
router.use(auth_middleware_1.authenticate, admin_middleware_1.isAdmin);
router.get('/tenants', controller.getTenants);
router.get('/tenants-detailed', controller.getTenantsWithUsers);
router.get('/stats', controller.getStats);
router.post('/reset-password', controller.resetPassword);
router.put('/update-subscription', controller.updateSubscription);
router.post('/send-sales-email', controller.sendSalesEmail);
router.post('/users', controller.createUser);
router.delete('/users/:id', controller.deleteUser);
exports.default = router;

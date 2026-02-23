"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const linkedin_controller_1 = require("../controllers/linkedin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new linkedin_controller_1.LinkedinController();
// Auth routes
// GET /api/linkedin/auth -> Returns the URL to redirect the user to
router.get('/auth', auth_middleware_1.authenticate, controller.auth);
// POST /api/linkedin/callback -> Frontend sends code, backend returns token confirmation
router.post('/callback', auth_middleware_1.authenticate, controller.callback);
exports.default = router;

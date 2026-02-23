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
exports.LinkedinController = void 0;
const prisma_1 = require("../lib/prisma");
const linkedin_service_1 = require("../services/linkedin.service");
class LinkedinController {
    // Redirect user to LinkedIn Auth URL
    auth(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = linkedin_service_1.linkedinService.getAuthUrl();
            res.json({ url });
        });
    }
    // Handle Callback from LinkedIn
    callback(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { code, state } = req.body; // Expecting POST from frontend with the code
            if (!code) {
                return res.status(400).json({ error: 'Authorization code missing' });
            }
            try {
                // 1. Exchange code for access token
                const accessToken = yield linkedin_service_1.linkedinService.getAccessToken(code);
                // 2. Get User URN
                const urn = yield linkedin_service_1.linkedinService.getUserUrn(accessToken);
                // 3. Update User in DB
                // Assuming we have the authenticated user's ID from the session/token context
                // IN THIS IMPLEMENTATION: The frontend calls this endpoint after receiving the code on the callback page.
                // Ideally, the callback page is protected and we have req.user.
                // @ts-ignore
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || 1; // Fallback for MVP if auth not strict
                yield prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        linkedinAccessToken: accessToken,
                        linkedinUrn: urn
                    }
                });
                res.json({ success: true, connected: true });
            }
            catch (error) {
                console.error('LinkedIn Callback Error:', error);
                res.status(500).json({ error: 'Failed to authenticate with LinkedIn' });
            }
        });
    }
}
exports.LinkedinController = LinkedinController;

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
const express_1 = require("express");
const article_controller_1 = require("../controllers/article.controller");
const router = (0, express_1.Router)();
const controller = new article_controller_1.ArticleController();
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
// LinkedIn Auth Routes
const linkedin_service_1 = require("../services/linkedin.service");
router.get('/auth/linkedin', (req, res) => {
    res.redirect(linkedin_service_1.linkedinService.getAuthUrl());
});
router.get('/auth/linkedin/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code } = req.query;
        if (!code)
            return res.status(400).send('No code provided');
        const accessToken = yield linkedin_service_1.linkedinService.getAccessToken(code);
        // In a real app, STORE this token in the DB for the user.
        // For now, we'll just display it so the user can copy it to .env or verify flow.
        res.send(`<h1>Success! LinkedIn Connected</h1><p>Access Token: ${accessToken}</p>`);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('LinkedIn Auth Failed');
    }
}));
exports.default = router;

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
exports.ArticleController = void 0;
const prisma_1 = require("../lib/prisma");
const linkedin_service_1 = require("../services/linkedin.service");
class ArticleController {
    // List all articles (for the blog feed)
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const articles = yield prisma_1.prisma.article.findMany({
                    orderBy: { createdAt: 'desc' },
                    include: { author: { select: { name: true } } }
                });
                res.json(articles);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch articles' });
            }
        });
    }
    // Get article by ID
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const article = yield prisma_1.prisma.article.findUnique({
                    where: { id: Number(id) },
                    include: { author: { select: { name: true } } }
                });
                if (!article)
                    return res.status(404).json({ error: 'Article not found' });
                res.json(article);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch article' });
            }
        });
    }
    // Create new article
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { title, content, imageUrl, category, publishToLinkedin } = req.body;
                // Assuming userId is attached by auth middleware
                // @ts-ignore
                const authorId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || 1;
                const article = yield prisma_1.prisma.article.create({
                    data: {
                        title,
                        content,
                        imageUrl,
                        category: category || 'Geral', // Default category
                        authorId,
                        published: true
                    }
                });
                // Trigger LinkedIn Post if requested
                // Trigger LinkedIn Post if requested
                if (publishToLinkedin) {
                    try {
                        // Fetch user to get LinkedIn credentials
                        const user = yield prisma_1.prisma.user.findUnique({
                            where: { id: Number(authorId) }
                        });
                        if ((user === null || user === void 0 ? void 0 : user.linkedinAccessToken) && (user === null || user === void 0 ? void 0 : user.linkedinUrn)) {
                            const articleUrl = `${process.env.APP_URL || 'https://sentinelaai.com.br'}/insights/${article.id}`;
                            const postId = yield linkedin_service_1.linkedinService.createPost(user.linkedinAccessToken, user.linkedinUrn, `${title}\n\n${content.substring(0, 150)}...\n\nLeia o artigo completo:`, articleUrl);
                            // Save Post ID
                            yield prisma_1.prisma.article.update({
                                where: { id: article.id },
                                data: { linkedinPostId: postId }
                            });
                            console.log(`[LinkedIn] Posted article ${article.id} -> ${postId}`);
                        }
                        else {
                            console.warn('[LinkedIn] User requested post but is not connected to LinkedIn.');
                        }
                    }
                    catch (linkedinError) {
                        console.error('[LinkedIn] Failed to post:', linkedinError);
                        // Do not fail the article creation, just log the error
                    }
                }
                res.status(201).json(article);
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to create article' });
            }
        });
    }
}
exports.ArticleController = ArticleController;

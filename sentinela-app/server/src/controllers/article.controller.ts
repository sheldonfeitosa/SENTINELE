import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { linkedinService } from '../services/linkedin.service';
import sanitizeHtml from 'sanitize-html';

export class ArticleController {

    // List all articles (scoped to tenant)
    async getAll(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const articles = await prisma.article.findMany({
                where: {
                    author: { tenantId }
                },
                orderBy: { createdAt: 'desc' },
                include: { author: { select: { name: true, tenantId: true } } }
            });
            res.json(articles);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch articles' });
        }
    }

    // Get article by ID (scoped to tenant)
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const tenantId = (req as any).user.tenantId;
            const article = await prisma.article.findFirst({
                where: {
                    id: Number(id),
                    author: { tenantId }
                },
                include: { author: { select: { name: true, tenantId: true } } }
            });
            if (!article) return res.status(404).json({ error: 'Article not found' });
            res.json(article);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch article' });
        }
    }

    // Create new article
    async create(req: Request, res: Response) {
        try {
            const { title, content, imageUrl, category, publishToLinkedin } = req.body;
            // Assuming userId is attached by auth middleware
            // @ts-ignore
            const authorId = req.user?.userId || 1;

            const article = await prisma.article.create({
                data: {
                    title: sanitizeHtml(title),
                    content: sanitizeHtml(content),
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
                    const user = await prisma.user.findUnique({
                        where: { id: Number(authorId) }
                    });

                    if (user?.linkedinAccessToken && user?.linkedinUrn) {
                        const articleUrl = `http://localhost:5173/insights/${article.id}`; // TODO: Use real domain in prod
                        const postId = await linkedinService.createPost(
                            user.linkedinAccessToken,
                            user.linkedinUrn,
                            `${title}\n\n${content.substring(0, 150)}...\n\nLeia o artigo completo:`,
                            articleUrl
                        );

                        // Save Post ID
                        await prisma.article.update({
                            where: { id: article.id },
                            data: { linkedinPostId: postId }
                        });
                        console.log(`[LinkedIn] Posted article ${article.id} -> ${postId}`);
                    } else {
                        console.warn('[LinkedIn] User requested post but is not connected to LinkedIn.');
                    }
                } catch (linkedinError) {
                    console.error('[LinkedIn] Failed to post:', linkedinError);
                    // Do not fail the article creation, just log the error
                }
            }

            res.status(201).json(article);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create article' });
        }
    }
}

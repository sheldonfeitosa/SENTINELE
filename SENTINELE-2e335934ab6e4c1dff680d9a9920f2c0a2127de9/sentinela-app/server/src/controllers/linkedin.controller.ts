import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { linkedinService } from '../services/linkedin.service';

export class LinkedinController {

    // Redirect user to LinkedIn Auth URL
    async auth(req: Request, res: Response) {
        const url = linkedinService.getAuthUrl();
        res.json({ url });
    }

    // Handle Callback from LinkedIn
    async callback(req: Request, res: Response) {
        const { code, state } = req.body; // Expecting POST from frontend with the code

        if (!code) {
            return res.status(400).json({ error: 'Authorization code missing' });
        }

        try {
            // 1. Exchange code for access token
            const accessToken = await linkedinService.getAccessToken(code);

            // 2. Get User URN
            const urn = await linkedinService.getUserUrn(accessToken);

            // 3. Update User in DB
            // Assuming we have the authenticated user's ID from the session/token context
            // IN THIS IMPLEMENTATION: The frontend calls this endpoint after receiving the code on the callback page.
            // Ideally, the callback page is protected and we have req.user.

            // @ts-ignore
            const userId = req.user?.userId || 1; // Fallback for MVP if auth not strict

            await prisma.user.update({
                where: { id: userId },
                data: {
                    linkedinAccessToken: accessToken,
                    linkedinUrn: urn
                }
            });

            res.json({ success: true, connected: true });
        } catch (error) {
            console.error('LinkedIn Callback Error:', error);
            res.status(500).json({ error: 'Failed to authenticate with LinkedIn' });
        }
    }
}

import axios from 'axios';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3001/api/linkedin/callback';

export class LinkedinService {

    // 1. Generate Auth URL for user to approve permissions
    getAuthUrl(): string {
        const scope = 'w_member_social openid profile email'; // Scopes needed for posting
        const state = 'random_state_string'; // Should be randomized in prod

        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scope)}`;
    }

    // 2. Exchange Authorization Code for Access Token
    async getAccessToken(code: string): Promise<string> {
        const url = 'https://www.linkedin.com/oauth/v2/accessToken';

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', LINKEDIN_REDIRECT_URI);
        params.append('client_id', LINKEDIN_CLIENT_ID!);
        params.append('client_secret', LINKEDIN_CLIENT_SECRET!);

        const response = await axios.post(url, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return response.data.access_token;
    }

    // 3. Get User Person URN (needed for posting)
    async getUserUrn(accessToken: string): Promise<string> {
        const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Response format: { sub: "urn:li:person:..." }
        return `urn:li:person:${response.data.sub}`;
    }

    // 4. Create Post (Text + Image usually requires complex upload flow, starting simple with Text/Link)
    async createPost(accessToken: string, authorUrn: string, text: string, articleUrl?: string): Promise<string> {
        const url = 'https://api.linkedin.com/v2/ugcPosts';

        const body = {
            author: authorUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: text
                    },
                    shareMediaCategory: articleUrl ? 'ARTICLE' : 'NONE',
                    media: articleUrl ? [
                        {
                            status: 'READY',
                            description: { text: "Leia mais no Sentinela AI" },
                            originalUrl: articleUrl,
                            title: { text: "Novo Artigo Publicado" }
                        }
                    ] : undefined
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        };

        const response = await axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        return response.data.id; // e.g. urn:li:share:123
    }
}

export const linkedinService = new LinkedinService();

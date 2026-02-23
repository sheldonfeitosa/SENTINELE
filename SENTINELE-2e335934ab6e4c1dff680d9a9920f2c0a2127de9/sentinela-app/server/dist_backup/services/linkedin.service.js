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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkedinService = exports.LinkedinService = void 0;
const axios_1 = __importDefault(require("axios"));
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3001/api/linkedin/callback';
class LinkedinService {
    // 1. Generate Auth URL for user to approve permissions
    getAuthUrl() {
        const scope = 'w_member_social openid profile email'; // Scopes needed for posting
        const state = 'random_state_string'; // Should be randomized in prod
        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scope)}`;
    }
    // 2. Exchange Authorization Code for Access Token
    getAccessToken(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = 'https://www.linkedin.com/oauth/v2/accessToken';
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('code', code);
            params.append('redirect_uri', LINKEDIN_REDIRECT_URI);
            params.append('client_id', LINKEDIN_CLIENT_ID);
            params.append('client_secret', LINKEDIN_CLIENT_SECRET);
            const response = yield axios_1.default.post(url, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return response.data.access_token;
        });
    }
    // 3. Get User Person URN (needed for posting)
    getUserUrn(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get('https://api.linkedin.com/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            // Response format: { sub: "urn:li:person:..." }
            return `urn:li:person:${response.data.sub}`;
        });
    }
    // 4. Create Post (Text + Image usually requires complex upload flow, starting simple with Text/Link)
    createPost(accessToken, authorUrn, text, articleUrl) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield axios_1.default.post(url, body, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            return response.data.id; // e.g. urn:li:share:123
        });
    }
}
exports.LinkedinService = LinkedinService;
exports.linkedinService = new LinkedinService();

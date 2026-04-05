import sanitizeHtml from 'sanitize-html';

export function sanitize(data: any): any {
    if (typeof data === 'string') {
        return sanitizeHtml(data, {
            allowedTags: [],
            allowedAttributes: {},
        });
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitize(item));
    }

    if (typeof data === 'object' && data !== null) {
        const sanitized: any = {};
        for (const key in data) {
            sanitized[key] = sanitize(data[key]);
        }
        return sanitized;
    }

    return data;
}

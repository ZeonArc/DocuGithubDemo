/**
 * HMAC Authentication Library for DocuGithub
 * Generates HMAC-SHA256 signatures for n8n webhook authentication
 */

/**
 * Generate HMAC-SHA256 signature for request body
 */
export async function generateHmacSignature(body: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(body);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `sha256=${hashHex}`;
}

/**
 * Make authenticated API request to n8n webhook
 */
export async function apiRequest<T = unknown>(
    endpoint: string,
    data: object,
    accessToken?: string
): Promise<T> {
    const webhookBase = import.meta.env.VITE_N8N_WEBHOOK_BASE;
    const webhookSecret = import.meta.env.VITE_WEBHOOK_SECRET;

    if (!webhookBase) {
        throw new Error('VITE_N8N_WEBHOOK_BASE is not configured');
    }

    const body = JSON.stringify(data);

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add HMAC signature if secret is configured
    if (webhookSecret) {
        const signature = await generateHmacSignature(body, webhookSecret);
        headers['x-webhook-signature'] = signature;
    }

    // Add Auth0 JWT token if provided
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${webhookBase}/${endpoint}`, {
        method: 'POST',
        headers,
        body
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return response.json();
}

/**
 * API endpoints for DocuGithub
 */
export const api = {
    /**
     * Initialize a new documentation session
     */
    async initialize(data: { repo_url: string; session_id: string }, accessToken?: string) {
        return apiRequest('initialize', data, accessToken);
    },

    /**
     * Analyze repository structure
     */
    async analyze(data: { session_id: string }, accessToken?: string) {
        return apiRequest('analyze', data, accessToken);
    },

    /**
     * Set user preferences
     */
    async preferences(data: { session_id: string; preferences: object }, accessToken?: string) {
        return apiRequest('preferences', data, accessToken);
    },

    /**
     * Generate README documentation
     */
    async generate(data: { session_id: string }, accessToken?: string) {
        return apiRequest('generate', data, accessToken);
    },

    /**
     * Chat revision - modify README with AI
     */
    async chat(data: { session_id: string; message: string; current_readme: string }, accessToken?: string) {
        return apiRequest('chat', data, accessToken);
    },

    /**
     * Push README to GitHub
     */
    async push(data: { session_id: string; readme_content?: string; commit_message?: string }, accessToken?: string) {
        return apiRequest('push', data, accessToken);
    }
};

export default api;

export const forwardFetch = async (
    url: string,
    options: RequestInit & { body?: any }
): Promise<Response> => {
    // Determine if we're in a browser environment where we need to proxy
    // If it's relative or to our own /api, just fetch it directly
    if (url.startsWith('/api/') || !url.startsWith('http')) {
        return fetch(url, options as RequestInit);
    }

    // Bypass proxy with direct fetch for CORS-safe public APIs to avoid 10-second edge timeouts (e.g., Netlify, Deno Deploy)
    const isPublicCorsSafeApi = 
        url.includes('openrouter.ai') || 
        url.includes('generativelanguage.googleapis.com');

    if (isPublicCorsSafeApi) {
        try {
            console.log(`[Direct Fetch] Connecting directly to public CORS-safe API: ${url}`);
            const directResponse = await fetch(url, options as RequestInit);
            return directResponse;
        } catch (err) {
            console.warn(`[Direct Fetch] Direct connection to ${url} failed. Falling back to edge proxy.`, err);
            // Fall through to proxy logic below
        }
    }

    const payload = {
        url: url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body
    };

    return fetch('/api/forward', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: options.signal
    });
};

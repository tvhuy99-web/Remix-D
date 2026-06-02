export const forwardFetch = async (
    url: string,
    options: RequestInit & { body?: any }
): Promise<Response> => {
    // Determine if we're in a browser environment where we need to proxy
    // If it's relative or to our own /api, just fetch it directly
    if (url.startsWith('/api/') || !url.startsWith('http')) {
        return fetch(url, options as RequestInit);
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

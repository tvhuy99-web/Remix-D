import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const bodyText = await request.text();
        let payload;
        try {
            payload = JSON.parse(bodyText);
        } catch (e) {
            return new Response('Invalid JSON payload', { status: 400 });
        }

        const { url, method = 'GET', headers = {}, body } = payload;

        if (!url) {
            return new Response('Missing URL', { status: 400 });
        }

        const cleanHeaders: Record<string, string> = { ...headers };
        delete cleanHeaders['host'];
        delete cleanHeaders['connection'];
        delete cleanHeaders['accept-encoding']; // Let fetch handle it
        
        cleanHeaders['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        // Disable compression for streams to avoid undici issues might not be strictly needed in Deno but let's keep it safe
        cleanHeaders['Accept-Encoding'] = 'identity';

        const fetchOptions: RequestInit = {
            method,
            headers: cleanHeaders
        };

        if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);

        // We construct a new response with the original body to proxy the stream
        const responseHeaders = new Headers(response.headers);
        
        // Remove headers that might cause issues when proxying
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');
        responseHeaders.delete('transfer-encoding');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const config = { path: "/api/forward" };

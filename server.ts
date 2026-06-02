import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { Readable } from "node:stream";

// Polyfill for fetch if needed in older Node environments, but Node 18+ has it natively.

async function startServer() {
    const app = express();
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

    // Enable CORS for all routes if accessed directly, though usually it's same-origin
    app.use(cors());
    // Parse JSON bodies (increased limit for large payloads)
    app.use(express.json({ limit: "50mb" }));

    // Proxy endpoint for general-purpose fetch
    // This receives { url, method, headers: {}, body: {} (if applicable) }
    app.post("/api/forward", async (req, res) => {
        try {
            const { url, method, headers, body } = req.body;
            
            if (!url) {
                return res.status(400).json({ error: "Missing 'url' in request body" });
            }

            const fetchOptions: RequestInit = {
                method: method || "GET",
                headers: {
                    ...headers,
                    "Accept-Encoding": "identity" // Disable compression to avoid undici Z_DATA_ERROR
                },
            };

            // Only add body for POST/PUT/PATCH methods, and ensure it's stringified
            if (['POST', 'PUT', 'PATCH'].includes(fetchOptions.method as string) && body) {
                fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
            }

            const response = await fetch(url, fetchOptions);

            // Forward the status code
            res.status(response.status);

            // Forward relevant headers
            response.headers.forEach((value, key) => {
                // Avoid setting problematic headers like transfer-encoding which express handles
                if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'content-encoding') {
                   res.setHeader(key, value);
                }
            });

            // If it's a stream (e.g. SSE), pipe it directly to Express response
            if (response.body) {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('text/event-stream')) {
                    Readable.fromWeb(response.body as any).pipe(res);
                } else {
                    const text = await response.text();
                    res.send(text);
                }
            } else {
                res.end();
            }

        } catch (error: any) {
            console.error("Proxy error:", error);
            res.status(500).json({ error: error.message });
        }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        // Fallback for SPA routing
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();

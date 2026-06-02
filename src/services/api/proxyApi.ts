
import { forwardFetch } from './forwardFetch';
import type { SillyTavernPreset } from '../../types';
import { getEffectiveProxyUrl, getEffectiveProxyPassword, getEffectiveProxyLegacyMode } from '../settingsService';
import { useChatStore } from '../../store/chatStore';

const getCleanBaseUrl = (url: string) => {
    let clean = url.trim().replace(/\/$/, '');
    if (clean.endsWith('/v1/chat/completions')) {
        clean = clean.replace(/\/v1\/chat\/completions$/, '');
    } else if (clean.endsWith('/v1/models')) {
        clean = clean.replace(/\/v1\/models$/, '');
    } else if (clean.endsWith('/v1')) {
        clean = clean.replace(/\/v1$/, '');
    }
    return clean;
};

export const callProxy = async (
    model: string,
    prompt: string,
    settings: SillyTavernPreset,
    overrideConnection?: { url: string; password?: string; legacyMode?: boolean } // NEW
): Promise<string> => {
    const proxyUrl = overrideConnection?.url || getEffectiveProxyUrl();
    const proxyPassword = overrideConnection?.password ?? getEffectiveProxyPassword();
    const isLegacyMode = overrideConnection?.legacyMode ?? getEffectiveProxyLegacyMode();
    const cleanUrl = getCleanBaseUrl(proxyUrl);

    const payload: any = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: Number(settings.temp) || 1,
        max_tokens: Number(settings.max_tokens) || 4096,
        stream: false
    };
    if (settings.top_p !== undefined) payload.top_p = Number(settings.top_p);
    if (settings.frequency_penalty !== undefined) payload.frequency_penalty = Number(settings.frequency_penalty);
    if (settings.presence_penalty !== undefined) payload.presence_penalty = Number(settings.presence_penalty);
    if (settings.top_k !== undefined) payload.top_k = Number(settings.top_k);

    const headers: Record<string, string> = {};
    if (isLegacyMode) {
        headers['Content-Type'] = 'text/plain';
    } else {
        headers['Content-Type'] = 'application/json';
        if (proxyPassword) headers['Authorization'] = `Bearer ${proxyPassword}`;
    }

    const endpoint = `${cleanUrl}/v1/chat/completions`;

    // --- NETWORK LOGGING ---
    useChatStore.getState().addNetworkLog({
        id: `proxy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        url: endpoint,
        method: 'POST',
        headers: headers,
        body: payload,
        source: 'proxy'
    });
    // -----------------------

    const response = await forwardFetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errText = `Proxy Error: ${response.status}`;
        try {
            const data = await response.json();
            if (data.error) errText = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        } catch {
            try {
                const text = await response.text();
                if (text) errText = text;
            } catch {}
        }
        throw new Error(errText);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
};

// Fix: Added callOpenAIProxyTask for non-chat completions (e.g. translation, scanning)
// Update: Added maxTokens parameter to prevent truncation
export const callOpenAIProxyTask = async (
    prompt: string,
    model: string,
    protocol: string,
    safetySettings: any[],
    maxTokens: number = 16384 // Default safe value increased
): Promise<string> => {
    const proxyUrl = getEffectiveProxyUrl();
    const proxyPassword = getEffectiveProxyPassword();
    const isLegacyMode = getEffectiveProxyLegacyMode();
    const cleanUrl = getCleanBaseUrl(proxyUrl);

    const payload = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: maxTokens, // Use the dynamic value
        stream: false
    };

    const headers: Record<string, string> = {};
    if (isLegacyMode) {
        headers['Content-Type'] = 'text/plain';
    } else {
        headers['Content-Type'] = 'application/json';
        if (proxyPassword) headers['Authorization'] = `Bearer ${proxyPassword}`;
    }

    const endpoint = `${cleanUrl}/v1/chat/completions`;

    // --- NETWORK LOGGING ---
    useChatStore.getState().addNetworkLog({
        id: `proxy-task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        url: endpoint,
        method: 'POST',
        headers: headers,
        body: payload,
        source: 'proxy'
    });
    // -----------------------

    const response = await forwardFetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Proxy Task Error: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
};

/**
 * Handles Streaming response from Proxy (OpenAI Format SSE)
 */
export async function* callProxyStream(
    model: string,
    prompt: string,
    settings: SillyTavernPreset,
    signal?: AbortSignal,
    overrideConnection?: { url: string; password?: string; legacyMode?: boolean } // NEW
): AsyncGenerator<string, void, unknown> {
    const proxyUrl = overrideConnection?.url || getEffectiveProxyUrl();
    const proxyPassword = overrideConnection?.password ?? getEffectiveProxyPassword();
    const isLegacyMode = overrideConnection?.legacyMode ?? getEffectiveProxyLegacyMode();
    const cleanUrl = getCleanBaseUrl(proxyUrl);

    const payload: any = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: Number(settings.temp) || 1,
        max_tokens: Number(settings.max_tokens) || 4096,
        stream: true // ENABLE STREAMING
    };
    if (settings.top_p !== undefined) payload.top_p = Number(settings.top_p);
    if (settings.frequency_penalty !== undefined) payload.frequency_penalty = Number(settings.frequency_penalty);
    if (settings.presence_penalty !== undefined) payload.presence_penalty = Number(settings.presence_penalty);
    if (settings.top_k !== undefined) payload.top_k = Number(settings.top_k);

    const headers: Record<string, string> = {};
    if (isLegacyMode) {
        headers['Content-Type'] = 'text/plain';
    } else {
        headers['Content-Type'] = 'application/json';
        if (proxyPassword) headers['Authorization'] = `Bearer ${proxyPassword}`;
    }

    const endpoint = `${cleanUrl}/v1/chat/completions`;

    // --- NETWORK LOGGING ---
    useChatStore.getState().addNetworkLog({
        id: `proxy-stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        url: endpoint,
        method: 'POST',
        headers: headers,
        body: payload,
        source: 'proxy'
    });
    // -----------------------

    const response = await forwardFetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal
    });

    if (!response.ok) {
        let errText = `Proxy Stream Error: ${response.status}`;
        try {
            const data = await response.json();
            if (data.error) errText = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        } catch {
            try {
                const text = await response.text();
                if (text) errText = text;
            } catch {}
        }
        throw new Error(errText);
    }
    if (!response.body) throw new Error("No response body received from Proxy");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === "data: [DONE]") continue;
                
                if (trimmed.startsWith("data: ")) {
                    try {
                        const jsonStr = trimmed.slice(6);
                        const json = JSON.parse(jsonStr);
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) {
                            yield content;
                        }
                    } catch (e) {
                        // Ignore parse errors for partial chunks
                    }
                }
            }
        }
    } catch (e) {
        if (signal?.aborted) return;
        throw e;
    }
}

/**
 * Fetch list of models from Proxy
 */
export const fetchProxyModels = async (
    url: string,
    password?: string,
    isLegacyMode?: boolean
): Promise<{ id: string; name: string }[]> => {
    const cleanUrl = getCleanBaseUrl(url);
    const endpoint = `${cleanUrl}/v1/models`;

    const headers: Record<string, string> = {};
    if (!isLegacyMode) {
        headers['Content-Type'] = 'application/json';
        if (password) headers['Authorization'] = `Bearer ${password}`;
    }

    try {
        // --- NETWORK LOGGING ---
        useChatStore.getState().addNetworkLog({
            id: `proxy-models-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
            url: endpoint,
            method: 'GET',
            headers: headers,
            body: null,
            source: 'proxy'
        });
        // -----------------------

        const response = await forwardFetch(endpoint, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            if (response.status === 404) {
                 return []; // Proxy might not support /v1/models, return empty and let user type manually
            }
            throw new Error(`Failed to fetch models: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle standard OpenAI response format: { object: 'list', data: [...] }
        const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        
        return list.map((m: any) => ({
            id: m.id,
            name: m.id // Use ID as name for simplicity, or m.object if needed
        })).sort((a: any, b: any) => a.id.localeCompare(b.id));

    } catch (e) {
        throw e;
    }
};

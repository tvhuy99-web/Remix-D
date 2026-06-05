
import { forwardFetch } from './forwardFetch';
import type { SillyTavernPreset, OpenRouterModel } from '../../types';
import { getOpenRouterApiKey } from '../settingsService';
import { useChatStore } from '../../store/chatStore';

export const getOpenRouterHeaders = () => {
    const openRouterKey = getOpenRouterApiKey();
    if (!openRouterKey) throw new Error("Chưa cấu hình OpenRouter API Key.");
    return {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SillyTavern Card Studio'
    };
};

export const callOpenRouter = async (
    model: string, 
    prompt: string, 
    settings: SillyTavernPreset
): Promise<{text: string; reasoning?: string}> => {
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";
    const headers = getOpenRouterHeaders();
    
    const payload = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temp,
        top_p: settings.top_p,
        max_tokens: settings.max_tokens,
        stop: settings.stopping_strings,
        include_reasoning: true // Optional: OpenRouter reasoning request
    };

    // --- NETWORK LOGGING ---
    useChatStore.getState().addNetworkLog({
        id: `or-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        url: endpoint,
        method: 'POST',
        headers: headers,
        body: payload,
        source: 'openrouter'
    });
    // -----------------------

    const response = await forwardFetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter Error: ${errorData.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    return {
        text: data.choices[0]?.message?.content || '',
        reasoning: data.choices[0]?.message?.reasoning_content || undefined
    };
};

export async function getOpenRouterModels(): Promise<OpenRouterModel[]> {
    const response = await forwardFetch("https://openrouter.ai/api/v1/models", { method: 'GET' });
    const data = await response.json();
    return data.data || [];
}

// Fix: Added validateOpenRouterKey
export async function validateOpenRouterKey(key: string): Promise<boolean> {
    const response = await forwardFetch("https://openrouter.ai/api/v1/auth/key", {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!response.ok) throw new Error("Invalid API Key");
    return true;
}

/**
 * Handles Streaming response from OpenRouter (OpenAI Format SSE)
 */
export async function* callOpenRouterStream(
    model: string,
    prompt: string,
    settings: SillyTavernPreset,
    signal?: AbortSignal
): AsyncGenerator<{ text: string; reasoning?: string }, void, unknown> {
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";
    const headers = getOpenRouterHeaders();
    
    const payload: any = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings.temp !== undefined ? Number(settings.temp) : 1,
        max_tokens: settings.max_tokens !== undefined ? Number(settings.max_tokens) : 4096,
        stop: settings.stopping_strings,
        include_reasoning: true,
        stream: true // Enable streaming
    };
    if (settings.top_p !== undefined) payload.top_p = Number(settings.top_p);
    if (settings.top_k !== undefined) payload.top_k = Number(settings.top_k);

    // --- NETWORK LOGGING ---
    useChatStore.getState().addNetworkLog({
        id: `or-stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        url: endpoint,
        method: 'POST',
        headers: headers,
        body: payload,
        source: 'openrouter'
    });
    // -----------------------

    const response = await forwardFetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal
    });

    if (!response.ok) {
        let errText = `OpenRouter Stream Error: ${response.status}`;
        try {
            const errJson = await response.json();
            if (errJson?.error?.message) {
                errText = errJson.error.message;
            }
        } catch {}
        throw new Error(errText);
    }
    if (!response.body) throw new Error("No response body received from OpenRouter");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === "data: [DONE]") continue;

                if (trimmed.startsWith("data: ")) {
                    try {
                        const jsonStr = trimmed.slice(6);
                        const json = JSON.parse(jsonStr);
                        const choice = json.choices?.[0];
                        const content = choice?.delta?.content || "";
                        const reasoning = choice?.delta?.reasoning_content || "";
                        if (content || reasoning) {
                            yield { text: content, reasoning: reasoning || undefined };
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


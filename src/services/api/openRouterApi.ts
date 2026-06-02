
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

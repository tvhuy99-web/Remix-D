import { getConnectionSettings } from '../settingsService';

export const forwardFetch = async (
    url: string,
    options: RequestInit & { body?: any }
): Promise<Response> => {
    // Determine if we're in a browser environment where we need to proxy
    // If it's relative or to our own /api, just fetch it directly
    if (url.startsWith('/api/') || !url.startsWith('http')) {
        return fetch(url, options as RequestInit);
    }

    const { directFetchBypass } = getConnectionSettings();

    // If directFetchBypass is true, try to connect directly to the API without using proxy.
    if (directFetchBypass ?? true) {
        try {
            console.log(`[Direct Fetch] Connecting directly to API: ${url}`);
            const directResponse = await fetch(url, options as RequestInit);
            return directResponse;
        } catch (err: any) {
            console.warn(`[Direct Fetch] Direct connection to ${url} failed:`, err);
            // Instead of falling back to the proxy and getting a misleading timeout error,
            // we throw the original client-side error so the user knows exactly what failed
            // (e.g., CORS error, AdBlock, Network down).
            throw new Error(`Kết nối trực tiếp thất bại. Lỗi gốc: ${err.message}. (Gợi ý: Nếu API của bạn chặn CORS hoặc mạng có vấn đề, bạn có thể thử tắt "Tự động Kết nối Trực tiếp" trong Cài đặt API để sử dụng Proxy dự phòng)`);
        }
    }

    const payload = {
        url: url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body
    };

    const response = await fetch('/api/forward', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: options.signal
    });

    if (response.status === 504 || response.status === 502) {
        throw new Error("Máy chủ trung gian (Proxy) đã quá thời gian phản hồi (Timeout). Lỗi này thường do API phản hồi quá chậm (quá thời gian cho phép). Vui lòng bật 'Tự động Kết nối Trực tiếp' trong Cài đặt API để không bị giới hạn thời gian.");
    }

    if (response.status === 500) {
        const cloned = response.clone();
        try {
            const text = await cloned.text();
            if (text.toLowerCase().includes('edge function timed out')) {
                throw new Error("Proxy Timeout (Edge Function): API của bạn phản hồi quá chậm. Vui lòng bật 'Tự động Kết nối Trực tiếp' trong Cài đặt API.");
            }
        } catch (e) {
            // Ignore if we can't parse the body
        }
    }

    return response;
};

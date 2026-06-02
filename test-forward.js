fetch('http://127.0.0.1:3000/api/forward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        url: 'https://opengateway.gitlawb.com/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ogw_live_9ecacbf329abd3e84394eac54716ee8f'
        },
        body: {
            model: "mimo-v2.5-pro",
            messages: [{ role: "user", content: "Xin chào" }],
            temperature: 0.9,
            max_tokens: 4096,
            stream: false
        }
    })
}).then(r => r.json().then(data => ({status: r.status, data}))).then(console.log).catch(console.error);

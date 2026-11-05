export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ answer: 'Use POST' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const q = body.message || body.prompt || (body.messages && body.messages[body.messages.length-1]?.content) || '';
    if (!q) return res.status(400).json({ answer: 'No message' });

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: q }],
        max_tokens: 500
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(500).json({ answer: 'Groq error: ' + (data.error?.message || 'check API key') });
    const ans = data.choices?.[0]?.message?.content || 'No answer';
    return res.status(200).json({ answer: ans });
  } catch (e) {
    return res.status(500).json({ answer: 'Server error: ' + e.message });
  }
}

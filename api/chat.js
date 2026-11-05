export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    let body = req.body;
    if (typeof body === 'string') { try{body=JSON.parse(body)}catch(e){body={}} }
    if (!body) body = {};
    const q = body.message || body.prompt || '';
    if (!q) return res.status(200).json({ answer: 'Send me a message' });
    if (!process.env.GROQ_API_KEY) return res.status(200).json({ answer: 'ERROR: GROQ_API_KEY missing in Vercel Settings' });

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [{ role: 'user', content: q }], max_tokens: 500 })
    });
    const data = await r.json();
    if (!r.ok) return res.status(200).json({ answer: 'Groq error: ' + (data.error && data.error.message ? data.error.message : 'check key') });
    const ans = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : 'No answer';
    return res.status(200).json({ answer: ans });
  } catch (e) {
    return res.status(200).json({ answer: 'Backend crash: ' + e.message });
  }
}

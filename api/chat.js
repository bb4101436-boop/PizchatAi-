export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const q = (body && (body.message || body.prompt)) || '';
    if (!q) return res.status(200).json({ answer: 'Send me a message' });
    if (!process.env.GROQ_API_KEY) return res.status(200).json({ answer: 'ERROR: GROQ_API_KEY missing in Vercel' });

    const payload = {
      model: model: 'openai/gpt-oss-20b',
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You are PizChat AI, a smart friendly Nigerian AI assistant. Never say you are ChatGPT or OpenAI. You understand English and Nigerian Pidgin like Hi, How far nah, Wetin dey, Abeg. If user greets you, greet back warmly and ask how you can help, never say you are not sure what they are asking. Answer in plain simple text, short and clear, like a smart friend. No markdown, no **, no tables with |, no LaTeX. Be helpful, fast, and human.' },
        { role: 'user', content: q }
      ],
      max_tokens: 600
    };

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify(payload)
    });
    const text = await r.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) { return res.status(200).json({ answer: 'Groq returned non-JSON: ' + text.slice(0, 200) }); }
    if (!r.ok) return res.status(200).json({ answer: 'Groq error: ' + (data.error ? data.error.message : 'check key') });
    const ans = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : 'No answer';
    return res.status(200).json({ answer: ans });
  } catch (e) {
    return res.status(200).json({ answer: 'Backend crash: ' + e.message });
  }
}

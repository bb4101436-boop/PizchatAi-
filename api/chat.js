export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed' });
  const { message } = req.body || {};
  if (!message) return res.json({ reply: 'Ask me anything!' });
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant
        messages: [
          { role: 'system', content: 'You are PizChat, a friendly, simple, smart AI. Explain things simply like user is 12 if they ask. Be short, clear, fun.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });
    const data = await r.json();
    return res.status(200).json({ reply: data?.choices?.[0]?.message?.content || 'Sorry, I no get answer. Try again.' });
  } catch (e) {
    return res.status(200).json({ reply: 'Network slow, try again now.' });
  }
}

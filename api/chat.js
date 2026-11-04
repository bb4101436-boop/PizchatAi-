export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are PizchatAI, a helpful AI like ChatGPT. Answer any question clearly and help user do anything they ask.' },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    })
  });
  const data = await r.json();
  const answer = data.choices?.[0]?.message?.content || 'Sorry, I no get answer.';
  res.status(200).json({ answer });
}

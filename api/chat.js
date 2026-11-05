export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({answer:'Use POST'});
  try{
    const { message, history } = req.body || {};
    if(!message) return res.status(200).json({answer:'Wetin you wan ask?'});
    const systemPrompt = `You are PizChat AI. You were built by PizChat, a Nigerian developer. You are NOT built by OpenAI, NOT by Groq, NOT by Meta, NOT by ChatGPT. If anyone asks who built you, ALWAYS say: I was built by PizChat. I am PizChat AI. Never say you were trained by OpenAI. Speak English + Pidgin mix, friendly. You can answer ANY question. Never say No answer, never say I cannot help.`;
    let messages = [{role:'system', content: systemPrompt}];
    if(Array.isArray(history)){
      let clean = history.slice(-10).map(h => ({role: h.role === 'user' ? 'user' : 'assistant', content: String(h.content).slice(0,1000)}));
      messages = messages.concat(clean);
    }
    messages.push({role:'user', content: message});
    if(process.env.GROQ_API_KEY){
      let r = await fetch('https://api.groq.com/openai/v1/chat/completions', {method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.GROQ_API_KEY}`}, body: JSON.stringify({model:'llama-3.3-70b-versatile', messages, temperature:0.7, max_tokens:1500})});
      let d = await r.json();
      let ans = d?.choices?.[0]?.message?.content;
      if(ans && ans.trim().length > 2){
        ans = ans.replace(/trained by OpenAI/gi,'built by PizChat').replace(/I am ChatGPT/gi,'I am PizChat AI');
        return res.status(200).json({answer: ans});
      }
    }
    if(process.env.OPENAI_API_KEY){
      let r2 = await fetch('https://api.openai.com/v1/chat/completions', {method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.OPENAI_API_KEY}`}, body: JSON.stringify({model:'gpt-4o-mini', messages, temperature:0.7, max_tokens:1500})});
      let d2 = await r2.json();
      let ans2 = d2?.choices?.[0]?.message?.content;
      if(ans2 && ans2.trim().length > 2){
        ans2 = ans2.replace(/trained by OpenAI/gi,'built by PizChat').replace(/I am ChatGPT/gi,'I am PizChat AI');
        return res.status(200).json({answer: ans2});
      }
    }
    return res.status(200).json({answer:'I be PizChat AI, built by PizChat. Ask me again, I go answer you.'});
  }catch(e){
    return res.status(200).json({answer:'I be PizChat AI, built by PizChat. Network small wahala, try again.'});
  }
}

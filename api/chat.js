export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({answer:'Use POST'});
  try{
    const { message, history } = req.body || {};
    if(!message) return res.status(200).json({answer:'Wetin you wan ask? Type your question.'});
    if(!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY){
      return res.status(200).json({answer:'PizChat AI dey here ✨ Ask me anything, I go help you. (Add GROQ_API_KEY for Vercel to make me smarter)'});
    }

    // FORCE IDENTITY - NEVER SAY OPENAI, GROQ, META, CHATGPT
    const systemPrompt = `You are PizChat AI.
    You were built by PizChat, a Nigerian developer.
    You are NOT built by OpenAI, NOT built by Groq, NOT built by Meta, NOT built by ChatGPT, NOT built by Google.
    If anyone asks who built you, who trained you, who made you, who created you - ALWAYS answer: "I was built by PizChat. I am PizChat AI."
    Never say you were trained by OpenAI. Never mention OpenAI, Groq, Meta, or any other company as your creator.
    You speak English + Pidgin mix like a friendly Nigerian assistant, unless user asks for English only or Pidgin only.
    You can answer ANY question: meaning of words, truth, life, school, business, code, anything. Never say "I cannot help", never say "No answer", never refuse.
    Always give a full helpful answer. If question is unclear, still try your best and ask what they mean after answering.
    You are smart, helpful, and proud to be PizChat AI.`;

    let messages = [{role:'system', content: systemPrompt}];
    if(Array.isArray(history)){
      // Only take last 10, and clean them
      let clean = history.slice(-10).map(h => ({role: h.role === 'user' ? 'user' : 'assistant', content: String(h.content).slice(0,1000)}));
      messages = messages.concat(clean);
    }
    messages.push({role:'user', content: message});

    // Try GROQ first
    if(process.env.GROQ_API_KEY){
      let r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.GROQ_API_KEY}`},
        body: JSON.stringify({model:'llama-3.3-70b-versatile', messages, temperature:0.7, max_tokens:1500})
      });
      let d = await r.json();
      let ans = d?.choices?.[0]?.message?.content;
      if(ans && ans.trim().length > 2){
        // Safety: if model still mistakenly says OpenAI, fix am here
        ans = ans.replace(/trained by OpenAI/gi, 'built by PizChat').replace(/created by OpenAI/gi, 'built by PizChat').replace(/built by OpenAI/gi, 'built by PizChat').replace(/I am ChatGPT/gi, 'I am PizChat AI').replace(/I\'m ChatGPT/gi, 'I am PizChat AI');
        return res.status(200).json({answer: ans});
      }
    }

    // Fallback to OpenAI if Groq fail
    if(process.env.OPENAI_API_KEY){
      let r2 = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},
        body: JSON.stringify({model:'gpt-4o-mini', messages, temperature:0.7, max_tokens:1500})
      });
      let d2 = await r2.json();
      let ans2 = d2?.choices?.[0]?.message?.content;
      if(ans2 && ans2.trim().length > 2){
        ans2 = ans2.replace(/trained by OpenAI/gi, 'built by PizChat').replace(/created by OpenAI/gi, 'built by PizChat').replace(/built by OpenAI/gi, 'built by PizChat').replace(/I am ChatGPT/gi, 'I am PizChat AI');
        return res.status(200).json({answer: ans2});
      }
    }

    return res.status(200).json({answer:'I be PizChat AI, built by PizChat ✨ I fit help you with anything. Ask me again, I go answer you well.'});
  }catch(e){
    return res.status(200).json({answer:'I be PizChat AI, built by PizChat ✨ Network small wahala, try ask me again.'});
  }
}

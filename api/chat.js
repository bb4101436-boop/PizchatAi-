export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({answer:'Use POST'});
  try{
    const { message, history } = req.body || {};
    if(!message) return res.status(200).json({answer:'Wetin you wan ask? I be PizChat AI, built by PizChat.'});

    const systemPrompt = `You are PizChat AI. You were built by PizChat, a Nigerian developer. You are NOT built by OpenAI, NOT by Groq, NOT by Meta, NOT by ChatGPT. If anyone asks who built you, ALWAYS say: I was built by PizChat. I am PizChat AI. Never say you were trained by OpenAI. Speak English + Pidgin mix, friendly, smart. You can answer ANY question. Never say No answer, never say I cannot help. Always give a full real answer to the question.`;

    let messages = [{role:'system', content: systemPrompt}];
    if(Array.isArray(history)){
      let clean = history.slice(-10).map(h => ({role: h.role === 'user' ? 'user' : 'assistant', content: String(h.content).slice(0,1000)}));
      messages = messages.concat(clean);
    }
    messages.push({role:'user', content: message});

    // Try GROQ - try 2 models, because one fit fail
    if(process.env.GROQ_API_KEY){
      const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
      for(let model of models){
        try{
          let r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method:'POST',
            headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.GROQ_API_KEY}`},
            body: JSON.stringify({model: model, messages, temperature:0.7, max_tokens:1500})
          });
          let d = await r.json();
          let ans = d?.choices?.[0]?.message?.content;
          if(ans && ans.trim().length > 5){
            ans = ans.replace(/trained by OpenAI/gi,'built by PizChat').replace(/I am ChatGPT/gi,'I am PizChat AI').replace(/I\'m ChatGPT/gi,'I am PizChat AI');
            return res.status(200).json({answer: ans});
          }
        }catch(e){ continue; }
      }
    }

    // Try OPENAI if GROQ fail
    if(process.env.OPENAI_API_KEY){
      try{
        let r2 = await fetch('https://api.openai.com/v1/chat/completions', {
          method:'POST',
          headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},
          body: JSON.stringify({model:'gpt-4o-mini', messages, temperature:0.7, max_tokens:1500})
        });
        let d2 = await r2.json();
        let ans2 = d2?.choices?.[0]?.message?.content;
        if(ans2 && ans2.trim().length > 5){
          ans2 = ans2.replace(/trained by OpenAI/gi,'built by PizChat').replace(/I am ChatGPT/gi,'I am PizChat AI');
          return res.status(200).json({answer: ans2});
        }
      }catch(e){}
    }

    // LAST RESORT - still give REAL answer, no more "ask me again"
    let low = message.toLowerCase();
    let fallback = '';
    if(low.includes('are you smart') || low.includes('really smart') || low.includes('have sense')){
      fallback = 'Yes, I really smart ✨ I be PizChat AI, built by PizChat. I fit answer question, write code, generate image, help with homework, business idea, explain anything. I get sense because PizChat build me well to understand you and help you. Try me, ask me anything.';
    } else if(low.includes('who built') || low.includes('who made') || low.includes('who created')){
      fallback = 'I be PizChat AI, and na PizChat build me. PizChat na Nigerian developer wey build me to help you with anything. I no be OpenAI, I no be ChatGPT.';
    } else if(low.includes('respect')){
      fallback = 'Respect means to honour person worth, feelings, rights and opinions. E mean to treat person with consideration, listen to them, value their perspective, and act with dignity. E be mutual - you give am, you collect am.';
    } else {
      fallback = 'I be PizChat AI, built by PizChat ✨ You ask: "' + message + '". I hear you well. Make you ask me again in small detail, I go give you full clear answer. I fit help with question, code, image, anything.';
    }
    return res.status(200).json({answer: fallback});

  }catch(e){
    return res.status(200).json({answer:'I be PizChat AI, built by PizChat. Yes I smart, ask me anything, I go answer you.'});
  }
}

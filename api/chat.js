export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({answer:'Use POST'});
  try{
    const { message, history } = req.body || {};
    if(!message) return res.status(200).json({answer:'Wetin you wan ask?'});

    // Clean hidden instructions, so user no see them
    let cleanMessage = String(message);
    cleanMessage = cleanMessage.replace(/Answer in clear English only\./gi,'').replace(/Answer in Nigerian Pidgin only\./gi,'').replace(/Answer in English \+ Pidgin mix like PizChat\./gi,'').replace(/Give normal clear answer\./gi,'').replace(/Keep answer very short\./gi,'').replace(/Give detailed full explanation\./gi,'').replace(/You are PizChat AI, built by PizChat\./gi,'').replace(/You can answer any question.*/gi,'').replace(/Remember: You are PizChat AI, built by PizChat\./gi,'').trim();
    if(!cleanMessage) cleanMessage = 'Hello';

    const systemPrompt = `You are PizChat AI. You were built by PizChat, a Nigerian developer. You are NOT built by OpenAI, NOT by Groq, NOT by Meta, NOT by ChatGPT. If anyone asks who built you, ALWAYS say: I was built by PizChat. I am PizChat AI. Never say you were trained by OpenAI. Speak English + Pidgin mix, friendly, smart. You can answer ANY question, write anything, help with anything. Always give a full real answer.`;

    let messages = [{role:'system', content: systemPrompt}];
    if(Array.isArray(history)){
      let cleanHist = history.slice(-10).map(h => {
        let c = String(h.content).replace(/Answer in clear English only\./gi,'').replace(/You are PizChat AI.*/gi,'').slice(0,1000);
        return {role: h.role === 'user' ? 'user' : 'assistant', content: c};
      });
      messages = messages.concat(cleanHist);
    }
    messages.push({role:'user', content: cleanMessage});

    // 1. TRY GROQ - THIS IS THE REAL SMART BRAIN
    if(process.env.GROQ_API_KEY){
      const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
      for(let model of models){
        try{
          let r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method:'POST',
            headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.GROQ_API_KEY}`},
            body: JSON.stringify({model: model, messages, temperature:0.7, max_tokens:2000})
          });
          let d = await r.json();
          let ans = d?.choices?.[0]?.message?.content;
          if(ans && ans.trim().length > 5){
            ans = ans.replace(/trained by OpenAI/gi,'built by PizChat').replace(/I am ChatGPT/gi,'I am PizChat AI');
            return res.status(200).json({answer: ans});
          }
          // If Groq return error, save am make we fit tell user
          if(d?.error) console.log('GROQ ERROR:', d.error.message);
        }catch(e){ continue; }
      }
    }

    // 2. TRY OPENAI IF GROQ FAIL
    if(process.env.OPENAI_API_KEY){
      try{
        let r2 = await fetch('https://api.openai.com/v1/chat/completions', {
          method:'POST',
          headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},
          body: JSON.stringify({model:'gpt-4o-mini', messages, temperature:0.7, max_tokens:2000})
        });
        let d2 = await r2.json();
        let ans2 = d2?.choices?.[0]?.message?.content;
        if(ans2 && ans2.trim().length > 5){
          ans2 = ans2.replace(/trained by OpenAI/gi,'built by PizChat').replace(/I am ChatGPT/gi,'I am PizChat AI');
          return res.status(200).json({answer: ans2});
        }
      }catch(e){}
    }

    // NO FAKE TEST ANSWER AGAIN - TELL TRUTH IF KEY FAIL
    return res.status(200).json({answer:'I be PizChat AI, built by PizChat. My brain key (GROQ_API_KEY) for Vercel no dey work, na why I no fit answer well now. Go Vercel > Settings > Environment Variables, check if GROQ_API_KEY dey there and e never expire. Add new one from groq.com, then Redeploy. After that, I go answer anything well.'});

  }catch(e){
    return res.status(200).json({answer:'I be PizChat AI, built by PizChat. Small network wahala, try again.'});
  }
}

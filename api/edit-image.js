export default async function handler(req, res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  try{
    const { image, prompt } = req.body || {};
    if(!image || !prompt) return res.status(400).json({error:'Need image and prompt'});
    if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:'No OPENAI_API_KEY for Vercel. Go Vercel > Settings > Environment Variables > Add OPENAI_API_KEY, then Redeploy'});

    const base64 = image.split(',')[1];
    if(!base64) return res.status(400).json({error:'Image no good, upload again'});
    const buffer = Buffer.from(base64, 'base64');

    const form = new FormData();
    form.append('image', new Blob([buffer], {type:'image/png'}), 'photo.png');
    form.append('prompt', `Edit this exact photo. Keep exact same person, same face, same skin tone, same hair, same body, same pose, same background. DO NOT change face. DO NOT make cartoon. DO NOT make anime. DO NOT generate different person. ONLY: ${prompt}. Realistic photo.`);
    form.append('model', 'gpt-image-1');
    form.append('size', '1024x1024');

    const r = await fetch('https://api.openai.com/v1/images/edits', {
      method:'POST',
      headers:{ Authorization:`Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });
    const data = await r.json();
    if(!r.ok){
      return res.status(500).json({error:'OpenAI say: ' + (data?.error?.message || JSON.stringify(data).slice(0,300))});
    }
    if(!data.data?.[0]?.b64_json) return res.status(500).json({error:'OpenAI no return image: ' + JSON.stringify(data).slice(0,300)});
    return res.status(200).json({ image:`data:image/png;base64,${data.data[0].b64_json}` });
  }catch(e){ return res.status(500).json({error:'Server error: ' + String(e)}); }
}

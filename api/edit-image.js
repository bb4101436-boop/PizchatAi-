export default async function handler(req, res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  try{
    const { image, prompt } = req.body; // image = base64 dataUrl, prompt = "only change clothes to army uniform"
    if(!image || !prompt) return res.status(400).json({error:'Need image and prompt'});

    // Convert dataUrl to buffer
    const base64 = image.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');

    const form = new FormData();
    form.append('image', new Blob([buffer], {type:'image/png'}), 'photo.png');
    form.append('prompt', `Edit this exact photo. Keep the exact same person, same face, same skin tone, same hair, same body, same pose, same background. DO NOT change face. DO NOT make cartoon. DO NOT make anime. DO NOT generate a different person. ONLY: ${prompt}. Realistic photo.`);
    form.append('model', 'gpt-image-1');
    form.append('size', '1024x1024');

    const r = await fetch('https://api.openai.com/v1/images/edits', {
      method:'POST',
      headers:{ Authorization:`Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });
    const data = await r.json();
    if(!data.data?.[0]?.b64_json) return res.status(500).json({error:'Edit failed', detail:data});
    return res.status(200).json({ image:`data:image/png;base64,${data.data[0].b64_json}` });
  }catch(e){ return res.status(500).json({error:String(e)}); }
}

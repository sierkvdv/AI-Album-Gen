// src/lib/ai.ts
export async function generateAlbumCover(prompt: string, style: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  
  // Use DALL-E 3 for image generation
  const model = 'dall-e-3';
  const finalPrompt = `${prompt}. Album cover artwork, square 1024x1024, high detail, ${style}.`;

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ 
      model, 
      prompt: finalPrompt, 
      size: '1024x1024', 
      n: 1,
      quality: 'standard'
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    console.error('OpenAI API error:', msg);
    throw new Error(`OpenAI error ${res.status}: ${msg}`);
  }
  
  const data = await res.json();
  const url = data?.data?.[0]?.url;
  if (!url) {
    console.error('No image URL in response:', data);
    throw new Error('No image URL returned');
  }
  return url;
}
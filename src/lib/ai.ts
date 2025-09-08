import axios from 'axios';

/**
 * Generate an album cover using OpenAI's image generation API. The API key
 * must be provided in the environment variable `OPENAI_API_KEY`. The prompt
 * is composed of the user's freeform text plus style descriptors for
 * genre, mood and colour. This helper centralises the API call and hides
 * the details from the caller.
 *
 * @param prompt The freeform prompt provided by the user.
 * @param style A description of the style preset (e.g. "genre=Rock, mood=Dark, colour=Red").
 * @returns The URL of the generated image.
 */
export async function generateAlbumCover(prompt: string, style: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined');
  }
  const fullPrompt = `${prompt}. Style: ${style}. An album cover in square format.`;
  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );
  const imageUrl = response.data.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Failed to generate image');
  }
  return imageUrl;
}
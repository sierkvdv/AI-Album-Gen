/**
 * Generate an image using OpenAI DALL·E API.
 *
 * This function calls the OpenAI DALL·E API to generate a real image
 * based on the provided prompt and style. The generated image is then
 * downloaded and stored in Supabase Storage for permanent access.
 *
 * @param prompt The user provided prompt describing the image.
 * @param style  A human‑readable description of the style preset.
 * @param userId The user ID for organizing stored images.
 * @param width The desired width of the generated image.
 * @param height The desired height of the generated image.
 * @returns A URL string pointing to the generated image stored in Supabase.
 */
export async function generateAlbumCover(
  prompt: string,
  style: string,
  userId?: string,
  width: number = 1024,
  height: number = 1024,
  quality: 'standard' | 'hd' = 'standard'
): Promise<string> {
  // Use the mock image when testing or when OpenAI is not configured.
  if (process.env.MOCK_OPENAI === "true" || !process.env.OPENAI_API_KEY) {
    console.log('Using mock image - OpenAI not configured');
    return "/placeholder_light_gray_block.png";
  }

  try {
    // Create the full prompt with style (or without if no style is selected)
    const fullPrompt = style 
      ? `Create an image: ${prompt}. Style: ${style}. High quality, professional design.`
      : `Create an image: ${prompt}. High quality, professional design.`;

    // Call OpenAI DALL·E API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: `${width}x${height}`,
        quality: quality,
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    // If userId is provided, download and store the image in Supabase
    if (userId) {
      const { downloadAndStoreImage } = await import('./storage');
      const fileName = `image-${Date.now()}.png`;
      return await downloadAndStoreImage(imageUrl, fileName, userId);
    }

    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    // Fallback to placeholder if generation fails
    return "/placeholder_light_gray_block.png";
  }
}
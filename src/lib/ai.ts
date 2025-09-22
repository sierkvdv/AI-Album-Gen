/**
 * Generate an album cover image using OpenAI DALL·E API.
 *
 * This function calls the OpenAI DALL·E API to generate a real album cover
 * based on the provided prompt and style. The generated image is then
 * downloaded and stored in Supabase Storage for permanent access.
 *
 * @param prompt The user provided prompt describing the cover.
 * @param style  A human‑readable description of the style preset.
 * @param userId The user ID for organizing stored images.
 * @returns A URL string pointing to the generated image stored in Supabase.
 */
export async function generateAlbumCover(
  prompt: string,
  style: string,
  userId?: string
): Promise<string> {
  // Use the mock image when testing or when OpenAI is not configured.
  if (process.env.MOCK_OPENAI === "true" || !process.env.OPENAI_API_KEY) {
    console.log('Using mock image - OpenAI not configured');
    return "/placeholder_light_gray_block.png";
  }

  try {
    // Create the full prompt with style
    const fullPrompt = `Create an album cover for: ${prompt}. Style: ${style}. High quality, professional album cover design.`;

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
        size: '1024x1024',
        quality: 'hd',
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
      const fileName = `album-cover-${Date.now()}.png`;
      return await downloadAndStoreImage(imageUrl, fileName, userId);
    }

    return imageUrl;
  } catch (error) {
    console.error('Error generating album cover:', error);
    // Fallback to placeholder if generation fails
    return "/placeholder_light_gray_block.png";
  }
}
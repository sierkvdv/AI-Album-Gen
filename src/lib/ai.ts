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
  if (process.env.MOCK_OPENAI === "true") {
    console.log('Using mock image - MOCK_OPENAI is true');
    return "/placeholder_light_gray_block.png";
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('Using mock image - OpenAI API key not configured');
    return "/placeholder_light_gray_block.png";
  }

  try {
    // Create the full prompt with style (or without if no style is selected)
    const fullPrompt = style 
      ? `Create an image: ${prompt}. Style: ${style}. High quality, professional design.`
      : `Create an image: ${prompt}. High quality, professional design.`;

    console.log('AI Helper: Calling OpenAI API with prompt:', fullPrompt);
    console.log('AI Helper: Parameters:', { width, height, quality });

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

    console.log('AI Helper: OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AI Helper: OpenAI API error:', errorData);
      
      // Handle specific OpenAI error types
      if (errorData.error?.code === 'content_policy_violation') {
        throw new Error('CONTENT_POLICY_VIOLATION: Your prompt contains content that violates OpenAI\'s safety guidelines. Please try a different prompt.');
      }
      
      if (errorData.error?.type === 'image_generation_user_error') {
        throw new Error(`PROMPT_REJECTED: ${errorData.error.message}`);
      }
      
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('AI Helper: OpenAI API success response:', data);
    const imageUrl = data.data[0].url;

    // If userId is provided, download and store the image in Supabase
    if (userId) {
      console.log('AI Helper: Storing image in Supabase for user:', userId);
      const { downloadAndStoreImage } = await import('./storage');
      const fileName = `image-${Date.now()}.png`;
      const storedUrl = await downloadAndStoreImage(imageUrl, fileName, userId);
      console.log('AI Helper: Image stored successfully:', storedUrl);
      return storedUrl;
    }

    console.log('AI Helper: Returning direct image URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('AI Helper: Error generating image:', error);
    console.error('AI Helper: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // Fallback to placeholder if generation fails
    return "/placeholder_light_gray_block.png";
  }
}
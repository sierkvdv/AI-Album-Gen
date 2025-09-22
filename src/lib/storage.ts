import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload an image to Supabase Storage
 * @param imageBuffer - The image data as ArrayBuffer
 * @param fileName - The filename for the image
 * @param userId - The user ID for organizing files
 * @returns The public URL of the uploaded image
 */
export async function uploadImageToSupabase(
  imageBuffer: ArrayBuffer,
  fileName: string,
  userId: string
): Promise<string> {
  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${userId}/${timestamp}-${fileName}`;
    
    // Upload the image to Supabase Storage
    const { data, error } = await supabase.storage
      .from('ai-images')
      .upload(uniqueFileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('ai-images')
      .getPublicUrl(uniqueFileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
}

/**
 * Download an image from a URL and upload it to Supabase
 * @param imageUrl - The URL of the image to download
 * @param fileName - The filename for the stored image
 * @param userId - The user ID for organizing files
 * @returns The public URL of the uploaded image
 */
export async function downloadAndStoreImage(
  imageUrl: string,
  fileName: string,
  userId: string
): Promise<string> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    
    // Upload to Supabase
    return await uploadImageToSupabase(imageBuffer, fileName, userId);
  } catch (error) {
    console.error('Error downloading and storing image:', error);
    throw error;
  }
}

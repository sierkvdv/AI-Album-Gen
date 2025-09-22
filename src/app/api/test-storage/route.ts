import { NextResponse } from "next/server";
import { supabase } from "@/lib/storage";

/**
 * GET /api/test-storage
 * 
 * Test endpoint to check Supabase storage connection
 */
export async function GET() {
  try {
    console.log('Test Storage: Starting test');
    
    // Test bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Test Storage: Buckets error:', bucketsError);
      return NextResponse.json({ 
        error: "Failed to list buckets",
        message: bucketsError.message 
      }, { status: 500 });
    }
    
    console.log('Test Storage: Available buckets:', buckets);
    
    // Check if ai-images bucket exists
    const aiImagesBucket = buckets.find(bucket => bucket.name === 'ai-images');
    
    if (!aiImagesBucket) {
      return NextResponse.json({ 
        error: "ai-images bucket not found",
        availableBuckets: buckets.map(b => b.name)
      }, { status: 404 });
    }
    
    // Test file upload (small test file)
    const testContent = new TextEncoder().encode('test file content');
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ai-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Test Storage: Upload error:', uploadError);
      return NextResponse.json({ 
        error: "Failed to upload test file",
        message: uploadError.message,
        bucket: aiImagesBucket
      }, { status: 500 });
    }
    
    console.log('Test Storage: Upload successful:', uploadData);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('ai-images')
      .getPublicUrl(testFileName);
    
    // Clean up test file
    await supabase.storage
      .from('ai-images')
      .remove([testFileName]);
    
    return NextResponse.json({ 
      success: true,
      message: "Storage test successful",
      bucket: aiImagesBucket,
      uploadData,
      publicUrl: publicUrlData.publicUrl
    });
    
  } catch (error) {
    console.error('Test Storage: Unexpected error:', error);
    return NextResponse.json({ 
      error: "Unexpected error",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'OPENAI_API_KEY not found',
      hasKey: false 
    }, { status: 500 });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: 'A simple test image',
        size: '1024x1024',
        n: 1,
        quality: 'standard'
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({
        error: `OpenAI API error: ${res.status}`,
        details: errorText,
        hasKey: true,
        apiWorking: false
      }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      hasKey: true,
      apiWorking: true,
      imageUrl: data?.data?.[0]?.url
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Network or other error',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasKey: true,
      apiWorking: false
    }, { status: 500 });
  }
}

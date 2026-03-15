import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { sdUrl, prompt } = await req.json();

    if (!sdUrl || !prompt) {
      return NextResponse.json({ error: 'Missing sdUrl or prompt' }, { status: 400 });
    }

    const baseUrl = sdUrl.replace(/\/$/, '');

    const payload = {
      prompt: prompt,
      negative_prompt: "text, watermark, ugly, deformed",
      steps: 20,
      width: 512,
      height: 512,
      cfg_scale: 7,
      sampler_name: "Euler a"
    };

    const res = await fetch(`${baseUrl}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error(`Automatic1111 Generation Error: ${res.statusText}`);
    }

    const data = await res.json();

    if (data.images && data.images.length > 0) {
      // The image is returned as a base64 string
      const base64Image = data.images[0];
      return NextResponse.json({ image: `data:image/png;base64,${base64Image}` });
    }

    return NextResponse.json({ error: "No image data returned from Automatic1111." }, { status: 500 });

  } catch (error: any) {
    console.error("API Route /api/sd error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}

import { Settings } from '@/store/appStore';

export async function generateImage(settings: Settings, prompt: string): Promise<string | null> {
  const baseUrl = settings.sdUrl.replace(/\/$/, '');

  try {
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
      return `data:image/png;base64,${base64Image}`;
    }

    throw new Error("No image data returned from Automatic1111.");

  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

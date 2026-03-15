import { Settings } from '@/store/appStore';

export async function generateImage(settings: Settings, prompt: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/sd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sdUrl: settings.sdUrl,
        prompt: prompt
      })
    });

    if (!res.ok) {
        throw new Error(`Proxy API Error: ${res.statusText}`);
    }

    const data = await res.json();

    if (data.image) {
      return data.image;
    }

    throw new Error(data.error || "No image data returned from proxy API.");

  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

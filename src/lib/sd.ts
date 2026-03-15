import { Settings } from '@/store/appStore';

// Basic txt2img workflow for ComfyUI
const createComfyWorkflow = (prompt: string, negativePrompt: string = "") => {
  return {
    "3": {
      "inputs": {
        "seed": Math.floor(Math.random() * 1000000000000000),
        "steps": 20,
        "cfg": 7,
        "sampler_name": "euler",
        "scheduler": "normal",
        "denoise": 1,
        "model": [
          "4",
          0
        ],
        "positive": [
          "6",
          0
        ],
        "negative": [
          "7",
          0
        ],
        "latent_image": [
          "5",
          0
        ]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": "v1-5-pruned-emaonly.ckpt" // Provide a fallback/default
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": 512,
        "height": 512,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": prompt,
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": negativePrompt,
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": [
          "3",
          0
        ],
        "vae": [
          "4",
          2
        ]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": [
          "8",
          0
        ]
      },
      "class_type": "SaveImage"
    }
  };
};

export async function generateImage(settings: Settings, prompt: string): Promise<string | null> {
  const baseUrl = settings.comfyUiUrl.replace(/\/$/, '');

  try {
    // 1. Submit prompt workflow
    const workflow = createComfyWorkflow(prompt, "text, watermark, ugly, deformed");
    const res = await fetch(`${baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow })
    });

    if (!res.ok) {
        throw new Error(`ComfyUI Prompt Error: ${res.statusText}`);
    }

    const { prompt_id } = await res.json();
    console.log("ComfyUI prompt submitted, ID:", prompt_id);

    // 2. Poll for history to get image output (Simple polling for now)
    let maxRetries = 60; // 1 minute
    while (maxRetries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      const histRes = await fetch(`${baseUrl}/history/${prompt_id}`);
      const history = await histRes.json();

      if (history[prompt_id]) {
        const outputs = history[prompt_id].outputs;
        // Find the node output that contains the image (node 9 in our workflow)
        const nodeOutput = Object.values(outputs).find((out: any) => out?.images && out.images.length > 0) as { images?: { filename: string, subfolder: string, type: string }[] };

        if (nodeOutput && nodeOutput.images?.[0]) {
          const imageObj = nodeOutput.images?.[0];
          // Construct image URL from the get_image endpoint
          const params = new URLSearchParams({
              filename: imageObj.filename,
              subfolder: imageObj.subfolder,
              type: imageObj.type
          });

          // Fetch the actual image data
          const imgRes = await fetch(`${baseUrl}/view?${params.toString()}`);
          const blob = await imgRes.blob();
          return URL.createObjectURL(blob);
        }
      }
      maxRetries--;
    }

    throw new Error("ComfyUI Image generation timed out.");

  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

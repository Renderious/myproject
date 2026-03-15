import { Settings } from '@/store/appStore';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatWithLLM(settings: Settings, messages: Message[]) {
  const { ollamaUrl, model } = settings;
  const baseUrl = ollamaUrl.replace(/\/$/, '');

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: 0.7,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`LLM Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.message.content;
}

export async function generateJSONWithLLM(settings: Settings, messages: Message[], schema?: unknown) {
    const { ollamaUrl, model } = settings;
    const baseUrl = ollamaUrl.replace(/\/$/, '');

    // Add instruction to force JSON
    const msgs = [...messages];
    if (msgs.length > 0 && msgs[0].role === 'system') {
        msgs[0].content += '\n\nIMPORTANT: You must output ONLY valid JSON format. Do not include any other text, markdown formatting like ```json, or explanations before or after the JSON object.';
    } else {
        msgs.unshift({ role: 'system', content: 'You are an AI that outputs ONLY valid JSON. No markdown blocks, no conversational text.'});
    }

    const payload: Record<string, unknown> = {
      model,
      messages: msgs,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.7,
      }
    };

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`LLM JSON Error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.message.content;

    try {
        // Basic cleanup just in case
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(content);
    } catch (e) {
        console.error("Failed to parse JSON from LLM:", content);
        throw new Error("LLM did not return valid JSON");
    }
}

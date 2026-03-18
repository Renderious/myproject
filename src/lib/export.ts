import { CharacterCard } from "@/store/appStore";
import { addMetadataFromBase64DataURI } from "meta-png";

// A minimal valid transparent 1x1 PNG base64 string
const FALLBACK_PNG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/**
 * Embeds a Character Card as JSON into a PNG (as tEXt chunk)
 * and triggers a download of the modified PNG file, or downloads a Markdown file.
 *
 * @param character The character object to export.
 * @param format Whether to export as a V2, V3 card, or markdown.
 */
export async function exportCharacterCard(character: CharacterCard, format: 'v2' | 'v3' | 'markdown' = 'v2') {
  // Sanitize character name for the filename
  const safeName = (character.name || "Unknown").replace(/[^a-z0-9]/gi, '_').toLowerCase();

  if (format === 'markdown') {
    // Generate Markdown content
    const mdContent = `You are playing the role of the following character. Always stay in character. Never acknowledge you are an AI.

# Name: ${character.name || ""}
${character.nickname ? `**Nickname:** ${character.nickname}\n` : ""}
## Description:
${character.description || ""}

## Personality:
${character.personality || ""}

## Scenario:
${character.scenario || ""}

## First Message:
${character.first_mes || ""}

${character.mes_example ? `## Message Example:\n${character.mes_example}\n` : ""}
${character.system_prompt ? `## System Prompt:\n${character.system_prompt}\n` : ""}
${character.post_history_instructions ? `## Post History Instructions:\n${character.post_history_instructions}\n` : ""}
${character.creator_notes ? `## Creator Notes:\n${character.creator_notes}\n` : ""}
${character.alternate_greetings && character.alternate_greetings.length > 0 ? `## Alternate Greetings:\n${character.alternate_greetings.map(g => `- ${g}`).join('\n')}\n` : ""}
${character.tags && character.tags.length > 0 ? `## Tags:\n${character.tags.join(', ')}\n` : ""}
${character.creator ? `**Creator:** ${character.creator}\n` : ""}
${character.character_version ? `**Character Version:** ${character.character_version}\n` : ""}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}_card.md`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return;
  }

  // We need to omit any internal application state from the exported card if there is any,
  // but let's keep it mostly intact, just removing avatarUrl which we use for display
  const { avatarUrl, ...exportData } = character;

  // The V3 standard embeds the entire JSON structure in a 'ccv3' keyword text chunk, base64 encoded.
  // The V2 standard embeds it in a 'chara' chunk.

  let finalJsonString = "";
  let chunkKeyword = "";

  if (format === 'v3') {
    chunkKeyword = "ccv3";
    const v3Data = {
      spec: "chara_card_v3",
      spec_version: "3.0",
      data: exportData
    };
    finalJsonString = JSON.stringify(v3Data);
  } else {
    chunkKeyword = "chara";
    finalJsonString = JSON.stringify(exportData);
  }

  const charaBase64 = btoa(unescape(encodeURIComponent(finalJsonString))); // Handle utf-8 to base64

  let sourceImageBase64 = FALLBACK_PNG_BASE64;

  if (avatarUrl) {
    // If we have an avatar URL, we need to convert it to a base64 string first
    try {
      if (avatarUrl.startsWith("data:image/png;base64,")) {
        sourceImageBase64 = avatarUrl;
      } else {
        const response = await fetch(avatarUrl);
        const blob = await response.blob();

        // Convert blob to base64
        sourceImageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
               resolve(reader.result);
            } else {
               reject(new Error("Failed to read blob as base64 string"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.warn("Failed to fetch/convert avatar URL, using fallback placeholder.", error);
    }
  }

  try {
    // Add the metadata using meta-png
    // addMetadataFromBase64DataURI takes (dataUri, keyword, text)
    const newBase64DataUri = addMetadataFromBase64DataURI(sourceImageBase64, chunkKeyword, charaBase64);

    // Create a temporary link to download the file
    const link = document.createElement("a");
    link.href = newBase64DataUri;

    link.download = `${safeName}_card.png`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to export character card:", error);
    alert("An error occurred while exporting the character card. Check the console for details.");
  }
}

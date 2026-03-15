import { CharacterCard } from "@/store/appStore";
import { addMetadataFromBase64DataURI } from "meta-png";

// A minimal valid transparent 1x1 PNG base64 string
const FALLBACK_PNG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/**
 * Embeds a Character Card as JSON into a PNG (as tEXt chunk with keyword "chara")
 * and triggers a download of the modified PNG file.
 *
 * @param character The character object to export.
 */
export async function exportCharacterCard(character: CharacterCard) {
  // We need to omit any internal application state from the exported card if there is any,
  // but let's keep it mostly intact, just removing avatarUrl which we use for display
  const { avatarUrl, ...exportData } = character;

  // The V3 standard embeds the entire JSON structure in a 'chara' keyword text chunk, base64 encoded.
  const charaJsonString = JSON.stringify(exportData);
  const charaBase64 = btoa(unescape(encodeURIComponent(charaJsonString))); // Handle utf-8 to base64

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
    // Add the "chara" metadata using meta-png
    // addMetadataFromBase64DataURI takes (dataUri, keyword, text)
    const newBase64DataUri = addMetadataFromBase64DataURI(sourceImageBase64, "chara", charaBase64);

    // Create a temporary link to download the file
    const link = document.createElement("a");
    link.href = newBase64DataUri;

    // Sanitize character name for the filename
    const safeName = (character.name || "Unknown").replace(/[^a-z0-9]/gi, '_').toLowerCase();
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

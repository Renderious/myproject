import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { chatWithLLM, generateJSONWithLLM } from "@/lib/llm";
import { generateImage } from "@/lib/sd";
import { exportCharacterCard } from "@/lib/export";
import { cropImageToSquare } from "@/lib/imageUtils";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function LabView() {
  const { characters, activeCharacterId, settings, updateCharacterAvatar, updateCharacter } = useAppStore();
  const character = characters.find(c => c.id === activeCharacterId);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRegeneratingAvatar, setIsRegeneratingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Expanded Image View state
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [expandedPromptText, setExpandedPromptText] = useState("");

  // Local state for complex JSON fields to allow typing invalid JSON temporarily
  const [editJsonState, setEditJsonState] = useState<{
     alternate_greetings: string;
     group_only_greetings: string;
     tags: string;
     creator_notes_multilingual: string;
     source: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Sync json state when edit mode toggles
  useEffect(() => {
    if (isEditing && character) {
      setEditJsonState({
         alternate_greetings: JSON.stringify(character.alternate_greetings || [], null, 2),
         group_only_greetings: JSON.stringify(character.group_only_greetings || [], null, 2),
         tags: JSON.stringify(character.tags || [], null, 2),
         creator_notes_multilingual: JSON.stringify(character.creator_notes_multilingual || {}, null, 2),
         source: JSON.stringify(character.source || [], null, 2),
      });
    } else {
      setEditJsonState(null);
    }
  }, [isEditing, character?.id]);

  // Initialize chat when character changes
  useEffect(() => {
    if (character) {
      const systemPrompt = `You are playing the role of the following character:\nName: ${character.name}\nDescription: ${character.description}\nPersonality: ${character.personality}\nScenario: ${character.scenario}\n\nAdditional Instructions: ${character.system_prompt}\n\nAlways stay in character. Never acknowledge you are an AI.`;

      const initialMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "assistant", content: character.first_mes }
      ];
      setMessages(initialMessages);
    } else {
      setMessages([]);
    }
  }, [character?.id]); // Only re-run if the active character changes

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!character) {
    // Inject a dummy character for testing if in dev mode
    if (process.env.NODE_ENV === 'development') {
      // Just temporarily expose store to window to inject it
      if (typeof window !== 'undefined') {
        (window as any).__store = useAppStore;
      }
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in-up">
        <div className="w-20 h-20 mx-auto mb-6 bg-zinc-800/80 rounded-2xl flex items-center justify-center border border-zinc-700/50">
          <i className="ph ph-flask text-4xl text-amber-500/50"></i>
        </div>
        <h2 className="text-2xl font-bold text-zinc-300 mb-2">The Lab is Empty</h2>
        <p className="text-zinc-500">Forge a new persona or select one from the Barracks to begin testing.</p>
      </div>
    );
  }

  const handleRegenerateAvatar = async () => {
    if (!settings.model) {
      alert("Please select a model in the System Config first.");
      return;
    }

    setIsRegeneratingAvatar(true);
    try {
      const jsonPrompt = `Based on the following character properties, generate a detailed Stable Diffusion prompt for their visual appearance (comma separated tags, style, lighting. E.g. "1girl, cinematic lighting, cyberpunk city, highly detailed, sharp focus, vibrant colors").
Name: ${character.name}
Description: ${character.description}
Personality: ${character.personality}
Scenario: ${character.scenario}

Output ONLY valid JSON in this format: { "sd_prompt": "your prompt here" }`;

      const jsonMessages: ChatMessage[] = [
        { role: "user" as const, content: jsonPrompt }
      ];

      const characterData = await generateJSONWithLLM(settings, jsonMessages);

      if (characterData.sd_prompt) {
        console.log("Regenerating image with new prompt:", characterData.sd_prompt);
        const imgUrl = await generateImage(settings, characterData.sd_prompt);
        if (imgUrl) {
          updateCharacterAvatar(character.id, imgUrl);
          updateCharacter(character.id, { last_sd_prompt: characterData.sd_prompt });

          // If the user happens to have the expanded view open and triggers a regenerate
          // from the sidebar (or if it's their first time and we want to auto-fill it),
          // update the local expanded prompt text as well
          setExpandedPromptText(characterData.sd_prompt);
        } else {
          alert("Image generation failed. Check the server logs.");
        }
      } else {
        alert("Failed to generate a new SD prompt.");
      }
    } catch (error) {
      console.error("Avatar regeneration failed:", error);
      alert("An error occurred while regenerating the avatar.");
    } finally {
      setIsRegeneratingAvatar(false);
    }
  };

  const handleRegenerateFromPrompt = async () => {
    if (!settings.model) {
      alert("Please select a model in the System Config first.");
      return;
    }
    if (!expandedPromptText.trim()) {
      alert("Prompt cannot be empty.");
      return;
    }
    setIsRegeneratingAvatar(true);
    try {
      console.log("Regenerating image with edited prompt:", expandedPromptText);
      const imgUrl = await generateImage(settings, expandedPromptText);
      if (imgUrl) {
        updateCharacterAvatar(character.id, imgUrl);
        updateCharacter(character.id, { last_sd_prompt: expandedPromptText });
      } else {
        alert("Image generation failed. Check the server logs.");
      }
    } catch (error) {
      console.error("Avatar regeneration failed:", error);
      alert("An error occurred while regenerating the avatar.");
    } finally {
      setIsRegeneratingAvatar(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const croppedBase64 = await cropImageToSquare(file);
      updateCharacterAvatar(character.id, croppedBase64);
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert("An error occurred while uploading the avatar.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset input
      }
    }
  };

  const handleUpdateField = (field: string, value: any) => {
    if (character) {
      updateCharacter(character.id, { [field]: value });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if (!settings.model) {
      alert("Please select a model in the System Config first.");
      return;
    }

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await chatWithLLM(settings, newMessages);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response }
      ]);
    } catch (error: unknown) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${(error as Error).message}` }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full max-w-6xl h-full flex flex-col md:flex-row gap-6 animate-fade-in-up pt-12 md:pt-0">

      {/* Character Profile Sidebar */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-4 hide-scrollbar">
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 flex flex-col items-center text-center shadow-lg relative overflow-hidden group">
          {/* Background blurred avatar */}
          {character.avatarUrl && !isImageExpanded && (
             <div
               className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl group-hover:opacity-30 transition-opacity"
               style={{ backgroundImage: `url(${character.avatarUrl})` }}
             />
          )}

          {isImageExpanded ? (
             <div
               className="w-full flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-zinc-800/50 rounded-xl transition-colors border border-dashed border-zinc-700 hover:border-amber-500/50"
               onClick={() => setIsImageExpanded(false)}
             >
               <i className="ph ph-arrow-u-up-left text-4xl text-amber-500 mb-2"></i>
               <span className="text-sm font-bold text-zinc-400">Return to Chat</span>
             </div>
          ) : (
             <>
               <div className="relative mb-4 shrink-0 flex items-center gap-4">
                 <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] group/avatar">
                   {character.avatarUrl ? (
                     <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center">
                       <i className="ph ph-user text-4xl text-zinc-600"></i>
                     </div>
                   )}
                   <button
                     onClick={() => {
                        setIsImageExpanded(true);
                        setExpandedPromptText(character.last_sd_prompt || "");
                     }}
                     className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity border border-white/20 shadow-lg"
                     title="Expand Image"
                   >
                     <i className="ph ph-arrows-out text-lg"></i>
                   </button>
                 </div>

                 <div className="flex flex-col gap-2 z-10">
                   <button
                     onClick={handleRegenerateAvatar}
                     disabled={isRegeneratingAvatar || isUploadingAvatar}
                     className="w-10 h-10 flex items-center justify-center bg-zinc-800/80 hover:bg-zinc-700/80 text-amber-400 rounded-xl transition-colors border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                     title="Regenerate Avatar"
                   >
                     {isRegeneratingAvatar ? (
                       <i className="ph ph-spinner animate-spin text-xl"></i>
                     ) : (
                       <i className="ph ph-arrows-clockwise text-xl"></i>
                     )}
                   </button>

                   <button
                     onClick={() => fileInputRef.current?.click()}
                     disabled={isRegeneratingAvatar || isUploadingAvatar}
                     className="w-10 h-10 flex items-center justify-center bg-zinc-800/80 hover:bg-zinc-700/80 text-amber-400 rounded-xl transition-colors border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                     title="Upload Avatar"
                   >
                     {isUploadingAvatar ? (
                       <i className="ph ph-spinner animate-spin text-xl"></i>
                     ) : (
                       <i className="ph ph-upload-simple text-xl"></i>
                     )}
                   </button>
                 </div>
               </div>
               <h2 className="text-2xl font-bold text-amber-400 relative z-10">{character.name}</h2>
               <div className="flex items-center gap-2 mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500 relative z-10">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 Online
               </div>
             </>
          )}

          {/* Hidden file input for both views */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadAvatar}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-zinc-800 flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <i className="ph ph-file-text text-amber-500"></i> Persona Data
            </h3>
            <button
              onClick={() => {
                if (isEditing && editJsonState) {
                  // Attempt to parse and save all JSON fields on 'Done'
                  try {
                    const updates: any = {};
                    updates.alternate_greetings = JSON.parse(editJsonState.alternate_greetings);
                    updates.group_only_greetings = JSON.parse(editJsonState.group_only_greetings);
                    updates.tags = JSON.parse(editJsonState.tags);
                    updates.creator_notes_multilingual = JSON.parse(editJsonState.creator_notes_multilingual);
                    updates.source = JSON.parse(editJsonState.source);
                    if (character) updateCharacter(character.id, updates);
                    setIsEditing(false);
                  } catch (e) {
                    alert("One of the JSON fields has invalid format. Please fix it before saving.");
                  }
                } else {
                  setIsEditing(true);
                }
              }}
              className="text-amber-500 hover:text-amber-400 text-sm transition-colors"
            >
              {isEditing ? <><i className="ph ph-check"></i> Done</> : <><i className="ph ph-pencil-simple"></i> Edit</>}
            </button>
          </div>

          <div className="space-y-4 text-sm text-zinc-300">
            {/* Core Fields */}
            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Name</span>
              {isEditing ? (
                 <input className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none" value={character.name || ""} onChange={(e) => handleUpdateField("name", e.target.value)} />
              ) : (
                 <p className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.name}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Nickname (V3)</span>
              {isEditing ? (
                 <input className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none" value={character.nickname || ""} onChange={(e) => handleUpdateField("nickname", e.target.value)} />
              ) : (
                 <p className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.nickname || "N/A"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Description</span>
              {isEditing ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-24 resize-none" value={character.description || ""} onChange={(e) => handleUpdateField("description", e.target.value)} />
              ) : (
                 <p className="line-clamp-4 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.description}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Personality</span>
              {isEditing ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-24 resize-none" value={character.personality || ""} onChange={(e) => handleUpdateField("personality", e.target.value)} />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.personality}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Scenario</span>
              {isEditing ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-20 resize-none" value={character.scenario || ""} onChange={(e) => handleUpdateField("scenario", e.target.value)} />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.scenario}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">First Message</span>
              {isEditing ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-32 resize-none" value={character.first_mes || ""} onChange={(e) => handleUpdateField("first_mes", e.target.value)} />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.first_mes}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Message Example</span>
              {isEditing ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-32 resize-none" value={character.mes_example || ""} onChange={(e) => handleUpdateField("mes_example", e.target.value)} />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.mes_example || "None"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">System Prompt</span>
              {isEditing ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-24 resize-none" value={character.system_prompt || ""} onChange={(e) => handleUpdateField("system_prompt", e.target.value)} />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.system_prompt || "None"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Post History Instructions</span>
              {isEditing ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-24 resize-none" value={character.post_history_instructions || ""} onChange={(e) => handleUpdateField("post_history_instructions", e.target.value)} />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.post_history_instructions || "None"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Creator Notes</span>
              {isEditing ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-20 resize-none" value={character.creator_notes || ""} onChange={(e) => handleUpdateField("creator_notes", e.target.value)} />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.creator_notes || "None"}</p>
              )}
            </div>

            {/* Arrays/Objects section (Basic implementation) */}
            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Alternate Greetings (JSON Array)</span>
              {isEditing && editJsonState ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-20 resize-none font-mono text-xs"
                    value={editJsonState.alternate_greetings}
                    onChange={(e) => setEditJsonState(prev => prev ? {...prev, alternate_greetings: e.target.value} : null)}
                 />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.alternate_greetings?.length ? `[${character.alternate_greetings.length} greetings]` : "None"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Group Only Greetings (V3 - JSON Array)</span>
              {isEditing && editJsonState ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-20 resize-none font-mono text-xs"
                    value={editJsonState.group_only_greetings}
                    onChange={(e) => setEditJsonState(prev => prev ? {...prev, group_only_greetings: e.target.value} : null)}
                 />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.group_only_greetings?.length ? `[${character.group_only_greetings.length} greetings]` : "None"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Tags (JSON Array)</span>
              {isEditing && editJsonState ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-20 resize-none font-mono text-xs"
                    value={editJsonState.tags}
                    onChange={(e) => setEditJsonState(prev => prev ? {...prev, tags: e.target.value} : null)}
                 />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.tags?.length ? character.tags.join(", ") : "None"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Creator</span>
              {isEditing ? (
                 <input className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none" value={character.creator || ""} onChange={(e) => handleUpdateField("creator", e.target.value)} />
              ) : (
                 <p className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.creator || "N/A"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Character Version</span>
              {isEditing ? (
                 <input className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none" value={character.character_version || ""} onChange={(e) => handleUpdateField("character_version", e.target.value)} />
              ) : (
                 <p className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.character_version || "N/A"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Creator Notes Multilingual (V3 - JSON)</span>
              {isEditing && editJsonState ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-24 resize-none font-mono text-xs"
                    value={editJsonState.creator_notes_multilingual}
                    onChange={(e) => setEditJsonState(prev => prev ? {...prev, creator_notes_multilingual: e.target.value} : null)}
                 />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.creator_notes_multilingual && Object.keys(character.creator_notes_multilingual).length > 0 ? "Configured" : "None"}</p>
              )}
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Source (V3 - JSON Array)</span>
              {isEditing && editJsonState ? (
                 <textarea className="w-full bg-zinc-900 text-zinc-100 p-2 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none h-20 resize-none font-mono text-xs"
                    value={editJsonState.source}
                    onChange={(e) => setEditJsonState(prev => prev ? {...prev, source: e.target.value} : null)}
                 />
              ) : (
                 <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.source?.length ? character.source.join(", ") : "None"}</p>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                 <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Creation Date (V3)</span>
                 <p className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 text-xs">{character.creation_date ? new Date(character.creation_date * 1000).toLocaleString() : "N/A"}</p>
              </div>
              <div className="flex-1">
                 <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Modification Date (V3)</span>
                 <p className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 text-xs">{character.modification_date ? new Date(character.modification_date * 1000).toLocaleString() : "N/A"}</p>
              </div>
            </div>

          </div>

          <div className="mt-auto pt-4 border-t border-zinc-800 flex gap-2">
             <button
                onClick={() => exportCharacterCard(character, 'v2')}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <i className="ph ph-download-simple"></i> Export V2
             </button>
             <button
                onClick={() => exportCharacterCard(character, 'v3')}
                className="flex-1 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-500/30 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <i className="ph ph-download-simple"></i> Export V3
             </button>
          </div>
        </div>
      </div>

      {/* Right Side: Chat Interface OR Expanded Image View */}
      <div className="flex-1 glass-panel border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        {isImageExpanded ? (
          <div className="flex flex-col h-full bg-zinc-900/80">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <i className="ph ph-image text-2xl text-amber-500"></i>
                <div>
                  <h3 className="font-bold text-zinc-100 leading-tight">Expanded Preview</h3>
                  <p className="text-xs text-zinc-500">View and regenerate {character.name}'s avatar.</p>
                </div>
              </div>
              <button
                onClick={() => setIsImageExpanded(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>

            {/* Large Image Area */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
              <div className="relative max-h-full max-w-full flex items-center gap-6">
                <div className="relative aspect-square max-h-[60vh] rounded-2xl overflow-hidden bg-zinc-800 border-2 border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] flex-shrink-0">
                  {character.avatarUrl ? (
                    <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center min-w-[300px]">
                      <i className="ph ph-image-broken text-6xl text-zinc-600"></i>
                    </div>
                  )}
                </div>

                {/* Actions next to the large image */}
                <div className="flex flex-col gap-4 z-10 shrink-0">
                  <button
                    onClick={handleRegenerateFromPrompt}
                    disabled={isRegeneratingAvatar || isUploadingAvatar}
                    className="w-14 h-14 flex items-center justify-center bg-zinc-800/90 hover:bg-zinc-700/90 text-amber-400 rounded-2xl transition-colors border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title="Regenerate Avatar"
                  >
                    {isRegeneratingAvatar ? (
                      <i className="ph ph-spinner animate-spin text-3xl"></i>
                    ) : (
                      <i className="ph ph-arrows-clockwise text-3xl"></i>
                    )}
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRegeneratingAvatar || isUploadingAvatar}
                    className="w-14 h-14 flex items-center justify-center bg-zinc-800/90 hover:bg-zinc-700/90 text-amber-400 rounded-2xl transition-colors border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title="Upload Avatar"
                  >
                    {isUploadingAvatar ? (
                      <i className="ph ph-spinner animate-spin text-3xl"></i>
                    ) : (
                      <i className="ph ph-upload-simple text-3xl"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Prompt Editor (Replaces Chat Input) */}
            <div className="p-4 bg-zinc-900/90 border-t border-zinc-800">
              <div className="mb-2 flex justify-between items-center">
                 <span className="text-xs font-bold uppercase tracking-wider text-amber-500 ml-1">Generation Prompt</span>
              </div>
              <div className="flex items-end gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all shadow-inner">
                <textarea
                  value={expandedPromptText}
                  onChange={(e) => setExpandedPromptText(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (expandedPromptText.trim() && !isRegeneratingAvatar) {
                           handleRegenerateFromPrompt();
                        }
                     }
                  }}
                  placeholder="Enter a Stable Diffusion prompt..."
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none outline-none py-2 px-3 max-h-48 overflow-y-auto min-h-[80px]"
                  disabled={isRegeneratingAvatar}
                />
                <button
                  onClick={() => {
                     if (expandedPromptText.trim() && !isRegeneratingAvatar) {
                         handleRegenerateFromPrompt();
                     }
                  }}
                  disabled={isRegeneratingAvatar || !expandedPromptText.trim()}
                  className="p-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-colors shadow-lg mb-0.5 shrink-0 flex items-center justify-center gap-2"
                >
                  <i className="ph ph-magic-wand text-xl"></i>
                  <span className="font-bold hidden sm:inline">Generate</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Interface Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/50">
              <i className="ph ph-flask text-2xl text-amber-500"></i>
              <div>
                <h3 className="font-bold text-zinc-100 leading-tight">Test Environment</h3>
                <p className="text-xs text-zinc-500">Interact with {character.name} to evaluate their responses.</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700 flex items-center justify-center mt-1">
                       {msg.role === 'user' ? (
                           <i className="ph ph-user text-zinc-400"></i>
                       ) : character.avatarUrl ? (
                           <img src={character.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                           <i className="ph ph-robot text-amber-500"></i>
                       )}
                    </div>

                    {/* Bubble */}
                    <div className={`p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-amber-600/20 border border-amber-500/30 text-zinc-100 rounded-tr-sm'
                        : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 rounded-tl-sm shadow-lg whitespace-pre-wrap'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                   <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700 flex items-center justify-center mt-1">
                         {character.avatarUrl ? (
                             <img src={character.avatarUrl} alt="Avatar" className="w-full h-full object-cover opacity-50" />
                         ) : (
                             <i className="ph ph-robot text-amber-500 opacity-50"></i>
                         )}
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 rounded-tl-sm flex items-center gap-1.5 h-12">
                         <span className="w-2 h-2 rounded-full bg-amber-500/50 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                         <span className="w-2 h-2 rounded-full bg-amber-500/50 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                         <span className="w-2 h-2 rounded-full bg-amber-500/50 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-zinc-900/80 border-t border-zinc-800">
              <div className="flex items-end gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                     }
                  }}
                  placeholder={`Send a message to ${character.name}...`}
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none outline-none py-2 px-2 max-h-32 overflow-y-auto"
                  rows={1}
                  disabled={isTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping || !input.trim()}
                  className="p-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors shadow-lg mb-0.5 shrink-0"
                >
                  <i className="ph ph-paper-plane-right text-xl"></i>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

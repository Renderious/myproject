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
  const { characters, activeCharacterId, settings, updateCharacterAvatar } = useAppStore();
  const character = characters.find(c => c.id === activeCharacterId);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRegeneratingAvatar, setIsRegeneratingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          {character.avatarUrl && (
             <div
               className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl group-hover:opacity-30 transition-opacity"
               style={{ backgroundImage: `url(${character.avatarUrl})` }}
             />
          )}

          <div className="relative mb-4 shrink-0 flex items-center gap-4">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              {character.avatarUrl ? (
                <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="ph ph-user text-4xl text-zinc-600"></i>
                </div>
              )}
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadAvatar}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-amber-400 relative z-10">{character.name}</h2>
          <div className="flex items-center gap-2 mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500 relative z-10">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Online
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-zinc-800 flex-1 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
            <i className="ph ph-file-text text-amber-500"></i> Persona Data
          </h3>

          <div className="space-y-4 text-sm text-zinc-300">
            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Description</span>
              <p className="line-clamp-4 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.description}</p>
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Personality</span>
              <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.personality}</p>
            </div>

            <div>
              <span className="text-amber-500 font-semibold block mb-1 text-xs uppercase tracking-wider">Scenario</span>
              <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">{character.scenario}</p>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-zinc-800">
             <button
                onClick={() => exportCharacterCard(character)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <i className="ph ph-download-simple"></i> Export Card (PNG/JSON)
             </button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 glass-panel border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
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
      </div>

    </div>
  );
}

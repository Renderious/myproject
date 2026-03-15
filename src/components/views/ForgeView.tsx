import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { chatWithLLM, generateJSONWithLLM } from "@/lib/llm";
import { generateImage } from "@/lib/sd";
import { AnimatedHammer } from "@/components/AnimatedHammer";
import { TemperatureGauge } from "@/components/TemperatureGauge";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function ForgeView() {
  const { settings, addCharacter, setActiveCharacter, setCurrentView } = useAppStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const maxQuestions = 5;

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking || isGeneratingCard) return;

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
    setIsThinking(true);

    try {
      if (questionCount === 0 && messages.length === 0) {
        // First Interaction: Initialize system prompt and ask the first question
        const systemPrompt = `You are a master character forge. The user wants to create a new roleplay character (SillyTavern V3 format).
Based on their initial prompt, ask exactly 1 follow-up question to clarify their vision (e.g., appearance, personality, setting, backstory, secret motivations).
You will ask a total of 5 questions, one at a time. Keep your questions conversational, brief, and directly related to expanding the character concept.
Do not generate the character card yet. Only ask the first question.`;

        const llmMessages: ChatMessage[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ];

        const response = await chatWithLLM(settings, llmMessages);

        setMessages((prev) => [
          { role: "system", content: systemPrompt },
          ...prev,
          { role: "assistant", content: response }
        ]);
        setQuestionCount(1);
      } else if (questionCount < maxQuestions) {
        // Subsequent Interactions: Ask next question
        const llmMessages = [...newMessages];
        const response = await chatWithLLM(settings, llmMessages);

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response }
        ]);
        setQuestionCount((prev) => prev + 1);
      } else {
        // Final Step: Generate the character card!
        setIsGeneratingCard(true);
        setIsThinking(false);

        // 1. Generate JSON Card
        const jsonPrompt = `Based on the conversation history, generate a comprehensive SillyTavern V3 Character Card JSON object.
It must include the following keys:
- "name": string
- "description": string (visuals, background, traits)
- "personality": string
- "scenario": string
- "first_mes": string (a strong opening message from the character)
- "mes_example": string (example dialogue)
- "creator_notes": string
- "system_prompt": string
- "post_history_instructions": string
- "alternate_greetings": array of strings
- "nickname": string (short name or alias)
- "creator_notes": string (metadata or notes for the user)
- "tags": array of strings (e.g. ["fantasy", "elf"])
- "creator": string (your name or "The Forge")
- "character_version": string (e.g. "1.0")
- "group_only_greetings": array of strings (at least empty array [])
- "sd_prompt": string (A detailed Stable Diffusion prompt for their visual appearance, comma separated tags, style, lighting. E.g. "1girl, cinematic lighting, cyberpunk city, highly detailed, sharp focus, vibrant colors")

Output ONLY valid JSON.`;

        const jsonMessages = [
          ...newMessages,
          { role: "user" as const, content: jsonPrompt }
        ];

        const characterData = await generateJSONWithLLM(settings, jsonMessages);

        // 2. Generate Image
        let avatarUrl = undefined;
        if (characterData.sd_prompt) {
           console.log("Generating image with prompt:", characterData.sd_prompt);
           // Attempt to generate image. If it fails, we just won't have an avatar.
           const imgUrl = await generateImage(settings, characterData.sd_prompt);
           if (imgUrl) avatarUrl = imgUrl;
        }

        // 3. Save Character and Redirect
        const now = Math.floor(Date.now() / 1000);
        const newCharacter = {
            id: Date.now().toString(),
            name: characterData.name || "Unknown Persona",
            description: characterData.description || "",
            personality: characterData.personality || "",
            scenario: characterData.scenario || "",
            first_mes: characterData.first_mes || "",
            mes_example: characterData.mes_example || "",
            creator_notes: characterData.creator_notes || "",
            system_prompt: characterData.system_prompt || "",
            post_history_instructions: characterData.post_history_instructions || "",
            alternate_greetings: characterData.alternate_greetings || [],
            nickname: characterData.nickname || "",
            tags: characterData.tags || [],
            creator: characterData.creator || "The Forge",
            character_version: characterData.character_version || "1.0",
            group_only_greetings: characterData.group_only_greetings || [],
            creation_date: now,
            modification_date: now,
            avatarUrl: avatarUrl
        };

        addCharacter(newCharacter);
        setActiveCharacter(newCharacter.id);
        setCurrentView("lab");

      }
    } catch (error: unknown) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${(error as Error).message}` }
      ]);
    } finally {
      setIsThinking(false);
      setIsGeneratingCard(false);
    }
  };

  // Only render user and assistant messages for the chat UI
  const displayMessages = messages.filter(m => m.role !== 'system');
  const progress = questionCount / maxQuestions;

  return (
    <div className="w-full max-w-4xl flex flex-col h-full items-center animate-fade-in-up pt-12 md:pt-0 relative">

      {/* Header */}
      <div className="text-center mb-8 flex-shrink-0">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.3)] transform rotate-3 border border-orange-400/20">
          <i className="ph ph-fire text-3xl text-white"></i>
        </div>
        <h1 className="font-[var(--font-rajdhani)] text-4xl md:text-5xl font-bold tracking-tight">
          The <span className="bg-gradient-to-r from-orange-400 via-red-500 to-amber-400 bg-clip-text text-transparent">Forge</span>
        </h1>
      </div>

      {/* Main Content Area (Chat or Initial Input) */}
      <div className="w-full flex-1 flex gap-6 overflow-hidden min-h-0 relative">

        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto pr-2 pb-24 flex flex-col gap-4">

          {displayMessages.length === 0 && !isThinking ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
                <p className="text-xl md:text-2xl text-zinc-400 font-light">Who do you want to make today?</p>
                <p className="text-sm text-zinc-500 mt-2 max-w-md">
                   Describe their role, setting, and personality. The Forge will ask follow-up questions to hammer out the details.
                </p>
             </div>
          ) : (
            displayMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-orange-600/20 border border-orange-500/30 text-zinc-100 rounded-tr-sm'
                    : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 rounded-tl-sm shadow-lg'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {isThinking && !isGeneratingCard && (
            <div className="flex w-full justify-start mt-4 mb-8">
              <AnimatedHammer />
            </div>
          )}

          {isGeneratingCard && (
            <div className="flex w-full justify-center my-10 animate-pulse">
               <div className="text-center p-8 glass-panel border border-orange-500/50 rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.2)]">
                  <div className="w-16 h-16 mx-auto mb-4">
                      <AnimatedHammer />
                  </div>
                  <h3 className="text-xl font-bold text-orange-400 mb-2">Forging Character Soul & Avatar...</h3>
                  <p className="text-sm text-zinc-400">Synthesizing parameters and weaving visual prompt.</p>
               </div>
            </div>
          )}
        </div>

        {/* Temperature Gauge (Only show when chatting) */}
        {displayMessages.length > 0 && (
          <div className="hidden md:flex flex-col items-center justify-center py-8 px-4 glass-panel rounded-2xl border border-zinc-800 h-fit self-end mb-24">
            <TemperatureGauge progress={progress} />
            <div className="mt-4 text-xs font-bold text-zinc-500">
               {questionCount} / {maxQuestions}
            </div>
          </div>
        )}

      </div>

      {/* Input Area (Fixed at bottom) */}
      <div className="w-full absolute bottom-0 left-0 right-0 pt-4 pb-2 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent">
        <div className="glass-panel rounded-2xl p-2.5 flex items-end gap-2.5 border border-zinc-800 transition-all forge-input-focus focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/50 shadow-2xl">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
               }
            }}
            rows={1}
            disabled={isThinking || isGeneratingCard || questionCount > maxQuestions}
            placeholder={
               isGeneratingCard
               ? "Forging in progress..."
               : questionCount === 0
                  ? "Describe the persona..."
                  : "Answer the forge..."
            }
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 resize-none outline-none py-3 px-3 max-h-40 overflow-y-auto focus:ring-0 leading-relaxed text-base md:text-lg disabled:opacity-50"
            onInput={handleTextareaInput}
          ></textarea>

          <button
            onClick={handleSend}
            disabled={isThinking || isGeneratingCard || !input.trim()}
            className="p-4 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors shadow-[0_0_15px_rgba(234,88,12,0.3)] mb-0.5 group shrink-0"
          >
            {isThinking ? (
                <i className="ph ph-spinner-gap text-2xl font-bold animate-spin"></i>
            ) : (
                <i className="ph ph-paper-plane-right text-2xl font-bold group-hover:translate-x-0.5 transition-transform"></i>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

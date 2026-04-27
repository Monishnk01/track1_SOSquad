"use client";

import { useState, useEffect, useCallback } from "react";

const QUICK_PHRASES = [
  { text: "I need help", emoji: "🆘" },
  { text: "I'm hungry", emoji: "🍱" },
  { text: "I'm thirsty", emoji: "🚰" },
  { text: "I need medication", emoji: "💊" },
  { text: "Where is the restroom?", emoji: "🚻" },
  { text: "Thank you", emoji: "🙏" },
  { text: "Yes", emoji: "✅" },
  { text: "No", emoji: "❌" },
  { text: "I'm tired", emoji: "😴" },
  { text: "Call my caretaker", emoji: "📞" },
];

export default function SpeechDashboard() {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [targetLang, setTargetLang] = useState<"en" | "hi" | "kn">("en");

  // Keep voices for auto-selection but we don't need to show them all
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const translateAndSpeak = useCallback(async (textToProcess: string) => {
    if (!textToProcess) return;

    setIsTranslating(true);
    let finalSpeechText = textToProcess;

    if (targetLang !== "en") {
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToProcess)}`);
        const data = await res.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          finalSpeechText = data[0][0][0];
          setTranslatedText(finalSpeechText);
        }
      } catch (err) {
        console.error("Translation failed", err);
      }
    } else {
      setTranslatedText("");
    }

    setIsTranslating(false);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(finalSpeechText);
      
      // Auto-select best voice for the language
      const langPrefix = targetLang === "en" ? "en" : targetLang === "hi" ? "hi" : "kn";
      const appropriateVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
      
      if (appropriateVoices.length > 0) {
        // Prefer local service voices if available
        msg.voice = appropriateVoices.find(v => v.localService) || appropriateVoices[0];
      }
      
      msg.onstart = () => setIsSpeaking(true);
      msg.onend = () => setIsSpeaking(false);
      msg.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(msg);
    }
  }, [targetLang, voices]);



  return (
    <div className="flex-1 p-6 lg:p-12 flex flex-col mx-auto w-full max-w-[1400px] min-h-screen">
      <header className="mb-12 text-center">
        <h1 className="text-4xl lg:text-6xl font-black mb-4 text-yellow-400 tracking-tight" tabIndex={0}>
          Speech Assistance
        </h1>
        <p className="text-xl text-yellow-600 font-medium">Type or select a phrase to speak out loud</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Left Column: Text Input & Voice Settings */}
        <section className="lg:col-span-2 flex flex-col space-y-6">
          <div className="bg-black border-4 border-yellow-400 rounded-3xl p-8 shadow-[0_0_30px_rgba(250,204,21,0.1)] flex-1 flex flex-col">
            <h2 className="text-3xl font-bold mb-6 flex items-center text-yellow-400">
              <span className="mr-3">⌨️</span> Custom Message
            </h2>
            <textarea
              className="flex-1 w-full p-6 text-3xl font-bold bg-black text-yellow-400 border-4 border-yellow-600 rounded-2xl focus:border-yellow-400 focus:outline-none transition-colors resize-none placeholder-yellow-700"
              placeholder="Type your message in English..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Text to speech input area"
            />
            {translatedText && (
              <div className="mt-4 p-4 bg-yellow-900/30 border-2 border-yellow-400 rounded-xl">
                <p className="text-yellow-400 text-xl font-bold">Translation:</p>
                <p className="text-white text-3xl">{translatedText}</p>
              </div>
            )}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => translateAndSpeak(text)}
                disabled={!text || isSpeaking || isTranslating}
                className={`flex-1 py-6 rounded-2xl text-4xl font-black transition-all duration-300 shadow-xl flex items-center justify-center border-4 ${
                  isSpeaking || isTranslating
                    ? "bg-yellow-400 text-black border-yellow-200 animate-pulse"
                    : "bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black active:scale-95"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isTranslating ? "⏳ TRANSLATING..." : isSpeaking ? "🗣️ SPEAKING..." : "🔊 SPEAK"}
              </button>
              <button
                onClick={() => setText("")}
                className="px-8 py-6 bg-black text-yellow-400 text-2xl font-bold rounded-2xl border-4 border-yellow-600 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black transition-all"
                aria-label="Clear text"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="bg-black border-4 border-yellow-400 rounded-3xl p-6 shadow-xl">
            <label className="block text-yellow-400 text-sm font-bold uppercase tracking-widest mb-3">
              Translate & Speak In:
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as any)}
              className="w-full bg-black text-yellow-400 border-2 border-yellow-600 rounded-xl p-4 text-2xl font-bold focus:border-yellow-400 focus:outline-none cursor-pointer"
              aria-label="Select translation language"
            >
              <option value="en">English (Default)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
            </select>
          </div>
        </section>

        {/* Right Column: Quick Phrases */}
        <section className="bg-black border-4 border-yellow-400 rounded-3xl p-8 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
          <h2 className="text-3xl font-bold mb-8 flex items-center text-yellow-400">
            <span className="mr-3">⚡</span> Quick Phrases
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase.text}
                onClick={() => translateAndSpeak(phrase.text)}
                className="bg-black hover:bg-yellow-400 border-2 border-yellow-600 hover:border-yellow-400 p-5 rounded-2xl text-left transition-all group flex items-center justify-between"
                aria-label={`Speak phrase: ${phrase.text}`}
              >
                <span className="text-2xl font-bold text-yellow-400 group-hover:text-black transition-colors">
                  {phrase.text}
                </span>
                <span className="text-3xl">{phrase.emoji}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Global CSS for custom styles */}
      <style jsx global>{`
        body {
          background-color: #000;
        }
        .bg-primary {
          background-color: #fbbf24;
        }
        .text-primary-foreground {
          color: #000;
        }
      `}</style>
    </div>
  );
}


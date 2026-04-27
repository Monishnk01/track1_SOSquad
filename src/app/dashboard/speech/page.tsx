"use client";

import { useState } from "react";

export default function SpeechDashboard() {
  const [text, setText] = useState("");

  const speak = () => {
    if ('speechSynthesis' in window && text) {
      const msg = new SpeechSynthesisUtterance(text);
      // Example of adding languages (to be fully implemented)
      msg.lang = "en-IN";
      window.speechSynthesis.speak(msg);
    }
  };

  return (
    <div className="flex-1 p-8 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
      <h1 className="text-5xl font-black mb-8" tabIndex={0}>Speech Assistance Dashboard</h1>
      <div className="w-full space-y-4">
        <textarea
          className="w-full h-48 p-4 text-3xl font-bold bg-background text-foreground accessible-border rounded"
          placeholder="Type here to speak..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Text to speech input area"
        />
        <button
          onClick={speak}
          className="w-full bg-primary text-primary-foreground text-3xl font-bold p-6 rounded hover:opacity-90 transition-opacity"
          aria-label="Speak text"
        >
          Speak
        </button>
      </div>
    </div>
  );
}

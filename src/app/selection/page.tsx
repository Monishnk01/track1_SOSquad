"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ImpairmentType = {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
};

const options: ImpairmentType[] = [
  {
    id: "visual",
    title: "Visual Assistance",
    description: "High contrast, voice navigation, and object detection.",
    icon: "👁️",
    route: "/dashboard/visual",
  },
  {
    id: "auditory",
    title: "Auditory Assistance",
    description: "Visual cues, transcripts, and sign language integration.",
    icon: "🦻",
    route: "/dashboard/auditory",
  },
  {
    id: "motor",
    title: "Motor Assistance",
    description: "Large targets, keyboard navigation, no complex gestures.",
    icon: "🦾",
    route: "/dashboard/motor",
  },
  {
    id: "speech",
    title: "Speech Assistance",
    description: "Text-to-speech boards and multilingual translation.",
    icon: "🗣️",
    route: "/dashboard/speech",
  }
];

export default function SelectionPage() {
  const router = useRouter();
  const [reminderMsg, setReminderMsg] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(msg);
    }
  };

  const addReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderMsg || !reminderTime) return;

    const stored = localStorage.getItem('medicalReminders');
    const reminders = stored ? JSON.parse(stored) : [];
    const newReminder = {
      id: Date.now().toString(),
      message: reminderMsg,
      time: reminderTime
    };
    
    localStorage.setItem('medicalReminders', JSON.stringify([...reminders, newReminder]));
    speakText(`Reminder set for ${reminderMsg} at ${reminderTime}`);
    setReminderMsg("");
    setReminderTime("");
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        <h1 
          className="text-4xl md:text-5xl font-black mb-4 text-center"
          tabIndex={0}
          onFocus={() => speakText("Personalize your experience. Select your primary assistance need.")}
        >
          Select Assistance Module
        </h1>
        <p className="text-2xl text-center mb-12" aria-hidden="true">
          Choose the option that best fits your needs.
        </p>
        
        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          role="group"
          aria-label="Assistance Modules"
        >
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                speakText(`Opening ${option.title}`);
                router.push(option.route);
              }}
              onFocus={() => speakText(`${option.title}. ${option.description}. Press Enter to select.`)}
              onMouseEnter={() => speakText(option.title)}
              className="flex flex-col items-center justify-center p-8 bg-black text-yellow-400 accessible-border rounded-2xl hover:bg-yellow-400 hover:text-black transition-all group focus:bg-yellow-400 focus:text-black"
              aria-label={`${option.title} Module. ${option.description}`}
            >
              <span className="text-8xl mb-6 group-hover:scale-110 transition-transform" aria-hidden="true">
                {option.icon}
              </span>
              <h2 className="text-3xl font-bold mb-4">{option.title}</h2>
              <p className="text-xl text-center px-4">
                {option.description}
              </p>
            </button>
          ))}
        </div>

        {/* Reminder Form */}
        <div className="mt-16 bg-black border-4 border-yellow-400 p-8 rounded-3xl shadow-[0_0_50px_rgba(250,204,21,0.2)]">
          <h2 className="text-3xl font-black mb-6 text-yellow-400 flex items-center">
            <span className="mr-3">⏰</span> Medicine or Doctor Visit Reminder
          </h2>
          <form onSubmit={addReminder} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Reminder (e.g. Heart Medicine)"
              value={reminderMsg}
              onChange={(e) => setReminderMsg(e.target.value)}
              onMouseEnter={() => speakText("Type your reminder here")}
              className="flex-[2] bg-black text-yellow-400 border-2 border-yellow-600 p-4 rounded-xl text-xl focus:border-yellow-400 focus:outline-none placeholder-yellow-700"
              required
            />
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              onMouseEnter={() => speakText("Select the reminder time")}
              className="flex-1 bg-black text-yellow-400 border-2 border-yellow-600 p-4 rounded-xl text-xl focus:border-yellow-400 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="bg-yellow-400 text-black font-black text-xl py-4 px-8 rounded-xl hover:bg-yellow-300 transition-all active:scale-95 border-b-4 border-yellow-600"
              onMouseEnter={() => speakText("Add this reminder")}
            >
              ADD REMINDER
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

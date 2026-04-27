"use client";

import { useEffect, useState } from "react";

interface Reminder {
  id: string;
  message: string;
  time: string; // ISO format or just HH:MM
}

export default function GlobalReminder() {
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    // Polling function to check localStorage for medications/appointments
    const interval = setInterval(() => {
      const storedReminders = localStorage.getItem("medicalReminders");
      if (storedReminders) {
        try {
          const reminders: Reminder[] = JSON.parse(storedReminders);
          const now = new Date();
          const currentHours = String(now.getHours()).padStart(2, '0');
          const currentMinutes = String(now.getMinutes()).padStart(2, '0');
          const currentTimeStr = `${currentHours}:${currentMinutes}`;

          const upcoming = reminders.find(r => r.time === currentTimeStr);
          if (upcoming) {
            setActiveReminder(upcoming);
            
            // Web Audio API chime
            try {
              const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
              const audioCtx = new AudioContextClass();
              const oscillator = audioCtx.createOscillator();
              oscillator.type = "sine";
              oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
              oscillator.connect(audioCtx.destination);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 1); // Play for 1 sec
            } catch (e) {
              console.error("Audio Context not supported/allowed", e);
            }

            // Vibration API
            if (navigator.vibrate) {
              navigator.vibrate([500, 250, 500, 250, 1000]); // SOS-like pattern
            }
            
            // Ensure screen reader grabs this immediately
            const msg = new SpeechSynthesisUtterance("Medical Reminder: " + upcoming.message);
            window.speechSynthesis.speak(msg);

            // Remove it from storage so it doesn't loop in the same minute
            const updated = reminders.filter(r => r.id !== upcoming.id);
            localStorage.setItem("medicalReminders", JSON.stringify(updated));
          }
        } catch (e) {
          console.error("Error parsing reminders", e);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!activeReminder) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reminder-title"
      aria-describedby="reminder-desc"
    >
      <div className="bg-gray-900 border-8 border-yellow-400 p-12 rounded-[40px] max-w-2xl w-full text-center space-y-8 shadow-[0_0_100px_rgba(250,204,21,0.3)] animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-4">
          <span className="text-8xl animate-bounce" aria-hidden="true">🔔</span>
          <h2 id="reminder-title" className="text-5xl font-black uppercase tracking-tighter text-yellow-400">
            Health Reminder
          </h2>
        </div>
        
        <div className="bg-gray-800 p-8 rounded-3xl border-4 border-gray-700">
          <p id="reminder-desc" className="text-4xl font-bold text-white leading-tight">
            {activeReminder.message}
          </p>
          <p className="text-2xl text-yellow-200 mt-4 uppercase font-black">
            Scheduled for {activeReminder.time}
          </p>
        </div>

        <button 
          onClick={() => setActiveReminder(null)}
          className="bg-yellow-400 text-black text-4xl font-black py-8 px-12 rounded-3xl w-full hover:bg-yellow-300 active:scale-95 transition-all shadow-2xl border-b-8 border-yellow-600"
          aria-label="Acknowledge and dismiss health reminder"
        >
          DISMISS REMINDER
        </button>
      </div>
    </div>
  );
}


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
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
            const msg = new SpeechSynthesisUtterance("Reminder: " + upcoming.message);
            window.speechSynthesis.speak(msg);

            // Remove it from storage so it doesn't loop in the same minute
            const updated = reminders.filter(r => r.id !== upcoming.id);
            localStorage.setItem("medicalReminders", JSON.stringify(updated));
          }
        } catch (e) {
          console.error("Error parsing reminders", e);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!activeReminder) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reminder-title"
      aria-describedby="reminder-desc"
    >
      <div className="bg-background text-foreground accessible-border p-8 rounded-2xl max-w-lg w-full text-center space-y-6">
        <h2 id="reminder-title" className="text-3xl font-bold uppercase tracking-wider text-primary">
          Medical Reminder
        </h2>
        <p id="reminder-desc" className="text-2xl font-medium">
          {activeReminder.message}
        </p>
        <button 
          onClick={() => setActiveReminder(null)}
          className="bg-primary text-primary-foreground text-2xl font-bold py-4 px-8 rounded flex-1 w-full hover:opacity-90 active:scale-95 transition-all"
          aria-label="Acknowledge and dismiss reminder"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}

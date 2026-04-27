"use client";

import { useState } from "react";

export default function EmergencyMode() {
  const [status, setStatus] = useState<"idle" | "getting_location" | "alerting" | "success">("idle");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleSOS = () => {
    setStatus("getting_location");
    addLog("Requesting Geolocation permission...");

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          addLog(`Location found: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`);
          setStatus("alerting");
          
          setTimeout(() => {
            addLog("Simulating hospital search via Google Places...");
            addLog("Found nearest hospital: City Care Hospital (1.2km away)");
            addLog("Simulating SMS to Caretaker...");
            setStatus("success");

            const utterance = new SpeechSynthesisUtterance("Emergency alert sent to your caretaker and nearest hospital located.");
            window.speechSynthesis.speak(utterance);
          }, 2000);
        },
        (error) => {
          console.error(error);
          setStatus("idle");
          alert("Unable to retrieve your location. Please ensure location services are enabled.");
        }
      );
    } else {
      setStatus("idle");
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {status !== "idle" && (
        <div 
          className="bg-background text-foreground accessible-border p-4 rounded-xl max-w-sm mb-2"
          role="status"
          aria-live="polite"
        >
          <h3 className="font-bold text-xl mb-2 text-primary">Emergency Status</h3>
          <ul className="text-sm space-y-1">
            {logs.map((log, index) => (
              <li key={index}>• {log}</li>
            ))}
          </ul>
          {status === "success" && (
            <button 
              onClick={() => { setStatus("idle"); setLogs([]); }}
              className="mt-4 w-full bg-foreground text-background py-2 rounded font-bold"
              aria-label="Dismiss emergency log"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleSOS}
        disabled={status === "getting_location" || status === "alerting"}
        className="accessible-border bg-red-600 hover:bg-red-700 text-white font-black text-2xl h-20 w-20 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95 disabled:opacity-50"
        aria-label="Emergency SOS Button. Double tap to alert your caretaker."
      >
        SOS
      </button>
    </div>
  );
}

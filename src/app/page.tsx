"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);
  
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const msg = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(msg);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    speakText("Logging in. Please wait.");
    
    // Create a dummy reminder for testing the GlobalReminder out
    const now = new Date();
    // Schedule a reminder 1 minute from now
    now.setMinutes(now.getMinutes() + 1);
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    
    localStorage.setItem("medicalReminders", JSON.stringify([
      { id: Date.now().toString(), message: "Test Reminder! Take Medication.", time: `${hrs}:${mins}` }
    ]));
    
    router.push("/selection");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-background text-foreground accessible-border p-8 md:p-12 rounded-2xl shadow-xl">
        <h1 
          className="text-4xl md:text-5xl font-black mb-8 text-center"
          onFocus={() => speakText("Welcome to Sahayak. Please sign in.")}
          onMouseEnter={() => speakText("Welcome to Sahayak. Please sign in.")}
          tabIndex={0}
        >
          Sign In
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-4">
            <label 
              htmlFor="username" 
              className="block text-2xl font-bold"
            >
              Username or Phone Number
            </label>
            <input 
              ref={usernameRef}
              id="username" 
              name="username" 
              type="text" 
              required
              className="w-full text-2xl p-4 accessible-border rounded bg-background text-foreground"
              onFocus={() => speakText("Enter username")}
              onMouseEnter={() => speakText("Enter username")}
              aria-required="true"
            />
          </div>

          <div className="space-y-4">
            <label 
              htmlFor="password" 
              className="block text-2xl font-bold"
            >
              Password or Voice PIN
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required
              className="w-full text-2xl p-4 accessible-border rounded bg-background text-foreground"
              onFocus={() => speakText("Enter password")}
              onMouseEnter={() => speakText("Enter password")}
              aria-required="true"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground text-3xl font-bold py-6 rounded-lg transition-transform hover:scale-[1.02] active:scale-95"
            onFocus={() => speakText("Sign in Button. Press Enter to submit.")}
            onMouseEnter={() => speakText("Sign in Button")}
            aria-label="Sign In"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";

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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(msg);
    }
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
              className="flex flex-col items-center justify-center p-8 bg-background text-foreground accessible-border rounded-2xl hover:bg-primary/10 transition-all group focus:bg-primary/20"
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
      </div>
    </div>
  );
}

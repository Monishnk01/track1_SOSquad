"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface TranscriptItem {
  id: string;
  text: string;
  timestamp: Date;
}

export default function AuditoryDashboard() {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<'neutral' | 'happy' | 'goodbye' | 'greeting' | 'crying'>('neutral');
  const recognitionRef = useRef<any>(null); // Keeping any for now but using @ts-ignore more precisely if needed
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    // Scroll to bottom when transcript updates
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    // Eagerly request microphone permission to prompt user immediately on load
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => console.warn("Microphone permission denied:", err));
  }, []);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true; // Enabled interim results for better feedback

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setTranscript(prev => [...prev, {
              id: Date.now().toString() + i,
              text: transcriptPiece,
              timestamp: new Date()
            }]);
            analyzeEmotion(transcriptPiece);
          } else {
            currentTranscript += transcriptPiece;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        // Do not stop listening on network/no-speech errors to keep it working all the time
        if (event.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        // Automatically restart listening if we are supposed to be listening
        if (isListeningRef.current && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn("Failed to restart speech recognition", e);
            }
          }, 200); // Small delay prevents rapid crashing loop
        } else {
          setIsListening(false);
        }
      };
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Listen to isListening state changes to handle continuous recording
  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Might already be started
      }
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const analyzeEmotion = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Check goodbye first so 'good' in 'goodbye' doesn't trigger 'happy'
    if (lowerText.includes('goodbye') || lowerText.includes('bye') || lowerText.includes('see you')) {
      setCurrentEmotion('goodbye');
    } else if (/\b(hi|hello|hey|greetings)\b/.test(lowerText)) {
      setCurrentEmotion('greeting');
    } else if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('smile') || lowerText.includes('glad')) {
      setCurrentEmotion('happy');
    } else if (lowerText.includes('cry') || lowerText.includes('sad') || lowerText.includes('crying') || lowerText.includes('tears')) {
      setCurrentEmotion('crying');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setTranscript([]);
      setCurrentEmotion('neutral');
      setIsListening(true);
    }
  };

  const renderVisualTranslation = () => {
    switch (currentEmotion) {
      case 'happy':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-black border-8 border-yellow-400 rounded-2xl shadow-xl transition-all duration-300 transform scale-105 w-full h-full">
            <div className="text-9xl mb-6" aria-label="Smiling Face Emoji">😊</div>
            <div className="relative w-64 h-64 bg-black border-4 border-yellow-400 rounded-xl p-4 flex items-center justify-center overflow-hidden">
               <Image src="/images/happy_asl.png" alt="ASL Sign for Happy" fill className="object-contain p-2" />
            </div>
            <p className="mt-6 text-4xl font-bold text-yellow-400 uppercase tracking-widest">Happy</p>
          </div>
        );
      case 'goodbye':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-black border-8 border-yellow-400 rounded-2xl shadow-xl transition-all duration-300 transform scale-105 w-full h-full">
            <div className="text-9xl mb-6" aria-label="Waving Hand Emoji">👋</div>
            <div className="relative w-64 h-64 bg-black border-4 border-yellow-400 rounded-xl p-4 flex items-center justify-center overflow-hidden">
               <Image src="/images/goodbye_asl.png" alt="ASL Sign for Goodbye" fill className="object-contain p-2" />
            </div>
            <p className="mt-6 text-4xl font-bold text-yellow-400 uppercase tracking-widest">Goodbye</p>
          </div>
        );
      case 'greeting':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-black border-8 border-yellow-400 rounded-2xl shadow-xl transition-all duration-300 transform scale-105 w-full h-full">
            <div className="text-9xl mb-6" aria-label="Waving Hand Emoji">👋</div>
            <div className="relative w-64 h-64 bg-black border-4 border-yellow-400 rounded-xl p-4 flex items-center justify-center overflow-hidden">
               <Image src="/images/goodbye_asl.png" alt="ASL Sign for Hello" fill className="object-contain p-2" />
            </div>
            <p className="mt-6 text-4xl font-bold text-yellow-400 uppercase tracking-widest">Hello</p>
          </div>
        );
      case 'crying':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-black border-8 border-yellow-400 rounded-2xl shadow-xl transition-all duration-300 transform scale-105 w-full h-full">
            <div className="text-9xl mb-6" aria-label="Crying Face Emoji">😢</div>
            <div className="relative w-64 h-64 bg-black border-4 border-yellow-400 rounded-xl p-4 flex items-center justify-center overflow-hidden">
               <Image src="/images/crying_asl.png" alt="ASL Sign for Crying" fill className="object-contain p-2" />
            </div>
            <p className="mt-6 text-4xl font-bold text-yellow-400 uppercase tracking-widest">Sad / Crying</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-black border-4 border-yellow-600 rounded-2xl shadow-inner h-full w-full opacity-70">
            <div className="text-8xl mb-6 opacity-50" aria-label="Neutral Face Emoji">😐</div>
            <p className="text-3xl text-yellow-600 font-semibold text-center">Waiting for conversation...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-12 flex flex-col mx-auto w-full max-w-[1600px] min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-4xl lg:text-6xl font-black mb-8 text-yellow-400 tracking-tight" tabIndex={0}>
          Auditory Assistance
        </h1>
        <button
          onClick={toggleListening}
          className={`px-10 py-5 rounded-full text-3xl font-bold transition-all duration-300 shadow-2xl flex items-center justify-center mx-auto border-4 ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700 text-white border-red-400 animate-pulse' 
              : 'bg-yellow-400 hover:bg-yellow-300 text-gray-900 border-yellow-200 hover:scale-105'
          }`}
          aria-pressed={isListening}
          aria-label={isListening ? "Stop Speech-to-Text Conversation" : "Start Speech-to-Text Conversation"}
        >
          {isListening ? (
            <>
              <svg className="w-10 h-10 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
              Listening...
            </>
          ) : (
            <>
              <svg className="w-10 h-10 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              Start Speech-to-Text Conversation
            </>
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 pb-24">
        {/* Column 1: Text Transcript */}
        <section 
          className="bg-black border-4 border-yellow-400 rounded-3xl p-8 flex flex-col shadow-[0_0_30px_rgba(250,204,21,0.1)] h-[600px] lg:h-auto"
          aria-label="Text Transcript"
        >
          <h2 className="text-4xl font-bold mb-6 border-b-4 border-yellow-400 pb-4 flex items-center text-yellow-400">
            <svg className="w-10 h-10 mr-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Text Transcript
          </h2>
          <div 
            className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar"
            role="log"
            aria-live="polite"
          >
            {transcript.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-yellow-600 text-3xl font-medium italic text-center max-w-md leading-relaxed">
                  Click &quot;Start&quot; and begin speaking. Your words will appear here.
                </p>
              </div>
            ) : (
              transcript.map((item) => (
                <div key={item.id} className="bg-black p-6 rounded-2xl border-2 border-yellow-600 shadow-md">
                  <div className="text-yellow-600 text-lg font-mono mb-2 font-bold tracking-wider">
                    {item.timestamp.toLocaleTimeString()}
                  </div>
                  <p className="text-3xl text-yellow-400 leading-relaxed font-medium">
                    &quot;{item.text}&quot;
                  </p>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </section>

        {/* Column 2: Visual Interpretation & Translation */}
        <section 
          className="flex flex-col h-[600px] lg:h-auto"
          aria-label="Visual Interpretation & Translation"
        >
          <h2 className="text-4xl font-bold mb-6 text-center lg:text-left flex items-center justify-center lg:justify-start text-yellow-400">
            <svg className="w-10 h-10 mr-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Visual Translation
          </h2>
          <div className="flex-1 rounded-3xl overflow-hidden flex items-center justify-center">
            {renderVisualTranslation()}
          </div>
        </section>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 6px;
          border: 3px solid #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}

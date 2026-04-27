"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const COLORS: Record<string, string> = {
  person: "#FF4444",
  car: "#FF8800",
  truck: "#FF8800",
  bus: "#FF8800",
  bicycle: "#FFCC00",
  motorcycle: "#FFCC00",
  dog: "#00CCFF",
  cat: "#00CCFF",
  chair: "#AA44FF",
  default: "#00FF88",
};

const DANGER_CLASSES = ["person", "car", "truck", "bus", "bicycle", "motorcycle"];

export default function VisualDashboard() {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [botStatus, setBotStatus] = useState("Say 'Sahayak' anytime for help");
  const [detectedObjects, setDetectedObjects] = useState<cocoSsd.DetectedObject[]>([]);
  const [latestAlert, setLatestAlert] = useState<string>("");
  const [isResponding, setIsResponding] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastAlertTime = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const isListeningRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const speakText = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (isCameraActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
          speakText("Camera started. Monitoring for obstacles.");
        };
      }
    } catch (err) {
      speakText("Camera access denied. Please allow camera permission.");
      setBotStatus("⚠️ Camera permission denied");
    }
  }, [isCameraActive, speakText]);

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setDetectedObjects([]);
    setLatestAlert("");
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    speakText("Camera stopped.");
  }, [speakText]);

  const handleWakeWordDetected = useCallback(async (fullTranscript: string) => {
    setIsResponding(true);
    setBotStatus("🎙️ Listening to your question...");

    let afterWake = fullTranscript.toLowerCase();
    const wakeMatch = afterWake.match(/sahayak|sahaya|sahayaq/);
    if (wakeMatch) {
      afterWake = afterWake.substring(wakeMatch.index! + wakeMatch[0].length).trim();
    }

    let response = "Yes, I'm here! How can I help you?";

    if (afterWake.length === 0 && wakeMatch) {
      speakText(response);
      setBotStatus(`✅ "${response}"`);
      setTimeout(() => {
        setIsResponding(false);
        setBotStatus("Say 'Sahayak', 'help me', or 'open camera'");
      }, 5000);
      return;
    }

    if (afterWake.includes("obstacle") || afterWake.includes("what") || afterWake.includes("see")) {
      const objs = detectedObjects.map(o => o.class).join(", ");
      response = objs
        ? `I can currently see: ${objs}. Please be careful.`
        : "I don't see any immediate obstacles right now.";
    } else if (afterWake.includes("help") && !afterWake.includes("can you")) {
      response = "I can help you detect obstacles, navigate paths, and alert you of dangers. You can also ask me to open the camera.";
    } else if (afterWake.includes("open") || afterWake.includes("start") || afterWake.includes("camera") || afterWake.includes("video")) {
      response = "Opening camera now. Monitoring for obstacles.";
      startCamera();
    } else if (afterWake.includes("stop") || afterWake.includes("close") || afterWake.includes("off")) {
      response = "Okay, stopping camera.";
      stopCamera();
    } else {
      // General question - query the chat API
      try {
        setBotStatus("💭 Thinking...");
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: afterWake })
        });
        const data = await res.json();
        if (data.answer) {
          response = data.answer;
        }
      } catch (e) {
        response = "I'm having trouble connecting to my brain right now.";
      }
    }

    speakText(response);
    setBotStatus(`✅ "${response}"`);

    setTimeout(() => {
      setIsResponding(false);
      setBotStatus("Say 'Sahayak', 'help me', or 'open camera'");
    }, 5000);
  }, [speakText, detectedObjects, startCamera, stopCamera]);

  const handleWakeWordDetectedRef = useRef(handleWakeWordDetected);
  useEffect(() => {
    handleWakeWordDetectedRef.current = handleWakeWordDetected;
  }, [handleWakeWordDetected]);

  // ── Wake‑word Speech Recognition ──────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          const text = event.results[i][j].transcript.toLowerCase();
          if (
            text.includes("sahayak") || 
            text.includes("sahaya") || 
            text.includes("sahayaq") ||
            text.includes("help me") ||
            text.includes("open camera") ||
            text.includes("start camera")
          ) {
            handleWakeWordDetectedRef.current(text);
            // Stop and let onend handle restart to clear old transcripts
            try { recognition.stop(); } catch (e) {}
            return;
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setBotStatus("⚠️ Microphone permission denied.");
        return;
      }
      if (isListeningRef.current) {
        setTimeout(() => {
          try { recognition.start(); } catch (e) {}
        }, 500);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        setTimeout(() => {
          try { recognition.start(); } catch (e) {}
        }, 200);
      }
    };

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    try { recognition.start(); } catch (e) {}

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []); // Empty dependency array ensures we don't recreate on every frame

  // ── Load Model & Request Mic Permission ────────────────────────────────────
  useEffect(() => {
    // Eagerly request microphone permission to prompt user immediately on load
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => console.warn("Microphone permission denied:", err));

    const loadModel = async () => {
      await tf.ready();
      const ssdModel = await cocoSsd.load({ base: "mobilenet_v2" });
      setModel(ssdModel);
      setModelLoading(false);
    };
    loadModel();
  }, []);

  // ── Draw Detections ────────────────────────────────────────────────────────
  const drawDetections = useCallback((predictions: cocoSsd.DetectedObject[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((pred) => {
      const [x, y, w, h] = pred.bbox;
      const color = COLORS[pred.class] ?? COLORS.default;
      const isDanger = DANGER_CLASSES.includes(pred.class);

      ctx.lineWidth = isDanger ? 5 : 3;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeRect(x, y, w, h);

      const label = `${pred.class} ${Math.round(pred.score * 100)}%`;
      ctx.font = "bold 20px sans-serif";
      const textW = ctx.measureText(label).width + 16;
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 30, textW, 30);

      ctx.fillStyle = "#000";
      ctx.shadowBlur = 0;
      ctx.fillText(label, x + 8, y - 8);
    });
  }, []);

  // ── Detection Loop ─────────────────────────────────────────────────────────
  const detectFrame = useCallback(async () => {
    if (!model || !videoRef.current || !isCameraActive) return;
    if (videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const predictions = await model.detect(videoRef.current);
    setDetectedObjects(predictions);
    drawDetections(predictions);

    const now = Date.now();
    if (now - lastAlertTime.current > 3000) {
      const dangerItems = predictions.filter(p => DANGER_CLASSES.includes(p.class) && p.score > 0.5);
      if (dangerItems.length > 0) {
        const closest = dangerItems.reduce((a, b) => a.bbox[2] * a.bbox[3] > b.bbox[2] * b.bbox[3] ? a : b);
        const [, , w, h] = closest.bbox;
        const frameArea = (videoRef.current.videoWidth || 640) * (videoRef.current.videoHeight || 480);
        const ratio = (w * h) / frameArea;

        let alertText = `${ratio > 0.25 ? "Warning! Very close" : "Caution!"} ${closest.class} detected.`;
        speakText(alertText);
        setLatestAlert(alertText);
        lastAlertTime.current = now;
      } else {
        setLatestAlert("");
      }
    }

    animFrameRef.current = requestAnimationFrame(detectFrame);
  }, [model, isCameraActive, speakText, drawDetections]);

  useEffect(() => {
    if (isCameraActive && model) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraActive, model, detectFrame]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-black text-yellow-400 overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 bg-black border-b-4 border-yellow-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-4xl">👁️</span>
          <div>
            <h1 className="text-2xl font-black text-yellow-400">Visual Assistance</h1>
            <p className="text-xs text-yellow-400 font-mono">Powered by Sahayak AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full animate-pulse ${modelLoading ? "bg-yellow-400" : "bg-green-400"}`} />
          <span className="text-sm text-gray-300">{modelLoading ? "Loading AI..." : "AI Ready"}</span>
        </div>
      </header>

      <div className="relative flex-1 bg-black overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline style={{ display: isCameraActive ? "block" : "none" }} />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: isCameraActive ? "block" : "none", objectFit: "cover" }} />

        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black">
            <div className="text-8xl opacity-40">📷</div>
            <p className="text-2xl text-yellow-400 font-semibold">Camera is off</p>
            <button onClick={startCamera} className="px-10 py-5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-2xl font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
              📷 Start Camera
            </button>
          </div>
        )}

        {latestAlert && (
          <div className="absolute top-4 left-4 right-4 bg-red-600/90 backdrop-blur-sm text-white text-xl font-black px-6 py-4 rounded-2xl border-4 border-red-400 shadow-2xl animate-pulse z-10 flex items-center gap-3">
            <span className="text-3xl">⚠️</span> {latestAlert}
          </div>
        )}

        {isCameraActive && (
          <div className="absolute bottom-4 left-4 right-4 flex gap-3 z-10">
            <button onClick={stopCamera} className="flex-1 bg-red-700/80 hover:bg-red-600 backdrop-blur-sm text-white text-lg font-bold py-3 rounded-xl border-2 border-red-400 transition-all">
              ⏹ Stop Camera
            </button>
          </div>
        )}

        {isCameraActive && detectedObjects.length > 0 && (
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl p-3 border border-white/20 z-10 max-w-[180px]">
            <p className="text-xs text-yellow-400 font-bold uppercase mb-2">Detected</p>
            {detectedObjects.slice(0, 6).map((obj, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[obj.class] ?? COLORS.default }} />
                <span className="capitalize text-white">{obj.class}</span>
                <span className="text-gray-400 ml-auto">{Math.round(obj.score * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 bg-black border-t-4 border-yellow-400 px-6 py-4 space-y-3">
        <div className={`rounded-xl px-5 py-3 border-4 transition-all duration-300 ${isResponding ? "bg-yellow-400 text-black border-yellow-400" : "bg-black border-yellow-400 text-yellow-400"}`}>
          <p className="text-xs font-bold uppercase mb-1">🎙️ Sahayak Voice Assistant</p>
          <p className="text-xl font-mono leading-snug" role="status" aria-live="polite">{botStatus}</p>
        </div>
        <div className="flex gap-2 text-xs text-yellow-400 flex-wrap">
          <span className="bg-black px-3 py-1 rounded-full border border-yellow-400">Say "Sahayak" or "Help me"</span>
          <span className="bg-black px-3 py-1 rounded-full border border-yellow-400">Works in noisy environments</span>
          <span className="bg-black px-3 py-1 rounded-full border border-yellow-400">Say "Open Camera" to start</span>
        </div>
        <button onClick={() => { stopCamera(); window.location.href = "/selection"; }} className="w-full bg-black hover:bg-yellow-400 hover:text-black text-yellow-400 text-xl font-bold py-4 rounded-xl border-4 border-yellow-400 transition-all active:scale-95">
          ← Back to Menu
        </button>
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    
    // NOTE: To make this a real AI, integrate OpenAI or Gemini here.
    // Example:
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{ role: "user", content: question }]
    // });
    // return NextResponse.json({ answer: response.choices[0].message.content });

    const lowerQ = question.toLowerCase().trim();
    let answer = `I heard you ask: "${question}". Since I'm currently running in offline mock mode, I don't have a full brain to answer that.`;

    // Basic heuristic responses for testing
    if (lowerQ.includes("time")) {
      answer = `The current time is ${new Date().toLocaleTimeString()}.`;
    } else if (lowerQ.includes("date") || lowerQ.includes("day") || lowerQ.includes("today")) {
      answer = `Today is ${new Date().toLocaleDateString()}.`;
    } else if (lowerQ.includes("your name") || lowerQ.includes("who are you")) {
      answer = "I am Sahayak, your personal accessibility assistant. I'm here to help you navigate and interact with the world.";
    } else if (lowerQ.includes("how are you")) {
      answer = "I am functioning perfectly. Thank you for asking! How can I help you today?";
    } else if (lowerQ.includes("weather")) {
      answer = "I don't have a live weather feed right now, but I hope it's a beautiful day wherever you are!";
    } else if (lowerQ.includes("joke")) {
      answer = "Why do programmers prefer dark mode? Because light attracts bugs!";
    } else if (lowerQ.includes("hello") || lowerQ.includes("hi") || lowerQ.includes("hey")) {
      answer = "Hello! What can I assist you with today?";
    } else if (lowerQ.includes("thank")) {
      answer = "You are very welcome. Let me know if you need anything else.";
    }

    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
  }
}

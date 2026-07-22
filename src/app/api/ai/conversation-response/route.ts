import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini-router";
import { extractRequestMetadata } from "@/lib/langsmith";

interface ConversationMessage {
  role: "ai" | "user";
  content: string;
}

interface ConversationRequest {
  topic: string;
  messages: ConversationMessage[];
  context?: "corporate_assessment" | "training" | "general";
  sessionId?: string;
  userId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ConversationRequest = await req.json();
    const { topic, messages, context, sessionId, userId } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        response: `Let's begin our conversation about ${topic}. What are your thoughts on this topic?`,
      });
    }

    // Get the last user message
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    if (!lastUserMessage) {
      return NextResponse.json({
        response: "Please share your thoughts on the topic.",
      });
    }

    // Build conversation context
    const conversationHistory = messages
      .map((m) => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n");

    // gemini-router handles key + model rotation automatically

    const systemContext = context === "corporate_assessment" 
      ? "You are a professional corporate interviewer conducting a voice assessment. Be friendly but professional. Ask follow-up questions to assess the candidate's communication skills, professionalism, and subject matter knowledge."
      : "You are having a professional conversation to help the user practice their communication skills.";

    const prompt = `${systemContext}

TOPIC: ${topic}

CONVERSATION SO FAR:
${conversationHistory}

Generate a natural, professional follow-up response or question. Keep it concise (1-2 sentences). Don't be overly formal but maintain professionalism.

Respond with ONLY the response text, no JSON or formatting.`;

    const traceMeta = extractRequestMetadata(req, {
      userId: userId,
      sessionId: sessionId,
      conversationId: topic,
    });

    try {
      const response = await generateText(prompt);
      return NextResponse.json({ response: response.trim() });
    } catch (error) {
      console.error("[CONVERSATION_RESPONSE] Gemini error:", error);
      return NextResponse.json({
        response: "That's interesting. Can you tell me more about your perspective on this?",
      });
    }
  } catch (error) {
    console.error("[CONVERSATION_RESPONSE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

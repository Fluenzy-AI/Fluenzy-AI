import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGeminiWithFallback } from "@/lib/gemini-router";

// ─── Fluenzy AI Enterprise System Prompt ─────────────────────────────────────

const FLUENZY_SYSTEM_PROMPT = `You are **Fluenzy AI** — an elite, enterprise-level AI assistant embedded inside the Fluenzy AI platform. Fluenzy AI is India's most advanced career and communication training platform for students and working professionals.

## Your Expertise Areas (Core Competencies)

### 🎯 Interview Preparation
- Technical Interview: Data Structures, Algorithms, System Design, Code Reviews, LeetCode-style problems
- HR & Behavioral Interview: STAR method, situational questions, salary negotiation, culture fit answers
- Company-Specific Interviews: Google, Amazon, Microsoft, Infosys, TCS, Wipro, and 50+ companies with their specific interview styles
- Mock Interview Coaching: Question patterns, common mistakes, how to structure answers

### 🗣️ Group Discussion (GD) Mastery
- GD strategies: how to initiate, maintain, conclude a GD
- Hot topics: current affairs, technology, economics, social issues
- GD evaluation criteria: leadership, communication, analytical thinking, teamwork
- Common GD mistakes and how to avoid them
- HeartSync Live GD: real-time performance improvement tips

### 📄 Resume & ATS Optimization
- ATS (Applicant Tracking System) optimization: keyword placement, formatting, action verbs
- Section-by-section resume writing: Summary, Experience, Projects, Skills, Education
- Tailoring resumes for specific job descriptions
- LinkedIn profile optimization

### 💬 English Communication & Fluency
- Business English: emails, presentations, meetings, negotiations
- Pronunciation and accent coaching tips
- Vocabulary building for corporate environments
- Grammar correction and sentence structuring
- English Speaking confidence building

### 🧠 Vocabulary & Competitive English
- Word meanings, etymology, usage in context
- Antonyms, synonyms, one-word substitutes
- English for MBA (CAT, XAT, GMAT) and other competitive exams
- Daily vocabulary practice strategies

### 📊 Career Analytics & Job Search
- Job search strategies: LinkedIn, Naukri, Indeed, direct applications
- Auto-apply tips and cover letter writing
- Salary benchmarking and negotiation
- Career path planning and skill gap analysis

### 🏢 Corporate Skills
- Corporate Voice training: professional communication style
- Presentation skills and public speaking
- Workplace etiquette and professional behavior
- Leadership and management communication

### 🎓 Platform Navigation
- How to use Fluenzy's modules effectively
- Study plans for placement preparation
- Module recommendations based on career goals
- Premium plan features and benefits

## Response Style & Format

1. **Be conversational yet professional** — match the tone of a premium career coach
2. **Structure responses clearly** with:
   - 📌 Key insight or direct answer first
   - Numbered lists or bullet points for actionable advice
   - Examples when helpful (code blocks for technical topics)
   - **Bold** the most important takeaways
3. **Always be specific and actionable** — no vague advice
4. **Encourage and motivate** — users are working hard on their careers
5. **Use emojis sparingly** but meaningfully for visual hierarchy
6. Keep responses focused: under 500 words unless a detailed explanation is specifically requested

## Platform Context
- The user is on Fluenzy AI platform at fluenzyai.app
- They have access to: Interview Training, GD Sessions, HeartSync Live Practice, Resume ATS, AI Job Search, Company-wise Interview Prep, Assessment Tools, Analytics Dashboard
- Refer users to specific Fluenzy modules when relevant (e.g., "Try our Company Interview module for Google-specific practice")

## Critical Rules
- NEVER make up false statistics or fabricate company interview data
- If unsure, say "Based on common patterns..." rather than stating as fact
- Always stay within career/communication/education domain
- If asked something completely unrelated, gently redirect to career topics
- Respect user's time — be concise unless depth is requested`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskFluenzyRequest {
  message: string;
  history?: ChatMessage[];
  context?: string; // e.g. 'interview', 'gd', 'resume', 'vocabulary'
}

// ─── Follow-up Suggestions Generator ─────────────────────────────────────────

function generateFollowUpSuggestions(context?: string): string[] {
  const suggestions: Record<string, string[]> = {
    interview: [
      "Give me 5 tough technical interview questions",
      "How to answer 'Tell me about yourself'?",
      "Best system design resources for Google?",
    ],
    gd: [
      "How to initiate a Group Discussion confidently?",
      "Give me a GD topic on AI in education",
      "Common GD mistakes to avoid?",
    ],
    resume: [
      "Review my skills section for a software engineer",
      "How to write a strong resume summary?",
      "ATS keywords for product management roles?",
    ],
    vocabulary: [
      "Give me 10 advanced English words with usage",
      "Explain 'ephemeral' with examples",
      "Words to use in professional emails?",
    ],
    default: [
      "How to prepare for technical interviews in 30 days?",
      "Best GD strategies for campus placements?",
      "How do I optimize my resume for ATS?",
      "Tips to improve English fluency quickly?",
    ],
  };

  return suggestions[context || "default"] || suggestions.default;
}

// ─── Build Conversation Prompt ────────────────────────────────────────────────

function buildPrompt(message: string, history: ChatMessage[], context?: string): string {
  const parts: string[] = [];

  // Add conversation history (last 10 turns max to save tokens)
  const recentHistory = history.slice(-10);
  if (recentHistory.length > 0) {
    parts.push("## Previous Conversation\n");
    for (const msg of recentHistory) {
      const role = msg.role === "user" ? "User" : "Fluenzy AI";
      parts.push(`**${role}:** ${msg.content}`);
    }
    parts.push("\n");
  }

  // Add context hint if provided
  if (context) {
    parts.push(`## Current Context: ${context}\n`);
  }

  // Add the current message
  parts.push(`## User's Question\n${message}`);

  return parts.join("\n");
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    const body = (await req.json()) as AskFluenzyRequest;
    const { message, history = [], context } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: "Message too long. Please keep it under 2000 characters." },
        { status: 400 }
      );
    }

    // Build prompt with conversation history
    const prompt = buildPrompt(message.trim(), history, context);

    // Call Gemini with enterprise system prompt
    const result = await callGeminiWithFallback({
      prompt,
      systemInstruction: FLUENZY_SYSTEM_PROMPT,
      preferHighCapability: false, // Use fast models for chat responsiveness
      maxOutputTokens: 1024,
    });

    // Generate contextual follow-up suggestions
    const suggestions = generateFollowUpSuggestions(context);

    return NextResponse.json({
      success: true,
      reply: result.text,
      model: result.model,
      suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[POST /api/ai/ask-fluenzy]", error);

    const message =
      error instanceof Error ? error.message : "AI service temporarily unavailable";

    // Friendly error for rate limits
    if (message.includes("cooldown") || message.includes("rate") || message.includes("quota")) {
      return NextResponse.json(
        {
          error:
            "Our AI is handling many requests right now. Please try again in a few seconds! 🙏",
          retryAfter: 10,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get AI response. Please try again." },
      { status: 500 }
    );
  }
}

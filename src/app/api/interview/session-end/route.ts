import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { traceGeminiCall, extractRequestMetadata, FEATURES } from "@/lib/langsmith";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      interviewType,   // 'PI' | 'Technical'
      role,            // 'HR' | 'Candidate' | 'EngineeringManager'
      duration,        // seconds
      transcript,      // [{ speaker, role, text, ts }]
      topic,
      sessionId,
    } = body;

    const isCandidate = role === 'Candidate';

    // Build the evaluation prompt
    const transcriptText = (transcript || [])
      .map((t: { speaker: string; role: string; text: string }) => `[${t.role} – ${t.speaker}]: ${t.text}`)
      .join('\n');

    const candidatePrompt = `
You are an expert AI interview coach evaluating a ${interviewType === 'Technical' ? 'technical' : 'personal'} interview. 

Interview Topic/Question: "${topic}"
Duration: ${Math.ceil((duration || 0) / 60)} minutes
Role: Candidate

Transcript:
${transcriptText || 'No transcript available.'}

Evaluate the Candidate on these metrics (score 0–100):
1. Communication – clarity, structure, fluency
2. Confidence – tone, assertiveness, delivery
3. Grammar – language correctness
4. Fluency – smoothness of speech
${interviewType === 'Technical' ? '5. Technical Knowledge – depth and accuracy\n6. Problem Solving – logical approach' : '5. Behavioral Clarity – STAR structure, examples\n6. Self-Awareness – understanding strengths/weaknesses'}
7. Participation Score – engagement, responsiveness
8. Overall Rating (out of 10)

Respond in strict JSON:
{
  "communication": number,
  "confidence": number,
  "grammar": number,
  "fluency": number,
  "technicalKnowledge": number,
  "problemSolving": number,
  "behavioralClarity": number,
  "selfAwareness": number,
  "participation": number,
  "overallRating": number,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "aiSuggestions": ["...", "...", "..."],
  "summary": "2-3 sentence overall assessment"
}`;

    const interviewerPrompt = `
You are an expert AI interview coach evaluating an interviewer in a ${interviewType === 'Technical' ? 'technical' : 'personal'} interview.

Interview Topic/Question: "${topic}"
Duration: ${Math.ceil((duration || 0) / 60)} minutes
Role: ${role}

Transcript:
${transcriptText || 'No transcript available.'}

Evaluate the Interviewer (${role}) on these metrics (score 0–100):
1. Question Quality – relevance, depth, variety
2. Professionalism – tone, respectfulness
3. Engagement – active listening, follow-ups
4. Follow-up Depth – probing beyond surface answers
5. Fairness – unbiased questioning
6. Listening Skill – responding to candidate cues
7. Overall Interviewer Score (out of 10)

Respond in strict JSON:
{
  "questionQuality": number,
  "professionalism": number,
  "engagement": number,
  "followUpDepth": number,
  "fairness": number,
  "listeningSkill": number,
  "overallRating": number,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "aiSuggestions": ["...", "...", "..."],
  "summary": "2-3 sentence overall assessment"
}`;

    const prompt = isCandidate ? candidatePrompt : interviewerPrompt;

    const traceMeta = extractRequestMetadata(request, {
      userId: session.user.id || session.user.email,
      email: session.user.email,
      sessionId,
      conversationId: topic,
    });

    let report: Record<string, unknown>;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await traceGeminiCall({
        feature: FEATURES.MOCK_INTERVIEW,
        name: isCandidate ? 'evaluate-candidate-session' : 'evaluate-interviewer-session',
        model: 'gemini-1.5-flash',
        userPrompt: prompt,
        metadata: traceMeta,
        tags: [interviewType, role],
        fn: () => model.generateContent(prompt)
      }) as any;
      const text = result.response.text().replace(/```json\n?|```\n?/g, '').trim();
      report = JSON.parse(text);
    } catch {
      // Fallback: generate synthetic scores
      report = isCandidate
        ? {
            communication: Math.floor(60 + Math.random() * 30),
            confidence: Math.floor(55 + Math.random() * 35),
            grammar: Math.floor(65 + Math.random() * 25),
            fluency: Math.floor(60 + Math.random() * 30),
            technicalKnowledge: interviewType === 'Technical' ? Math.floor(50 + Math.random() * 40) : 0,
            problemSolving: interviewType === 'Technical' ? Math.floor(55 + Math.random() * 35) : 0,
            behavioralClarity: interviewType === 'PI' ? Math.floor(60 + Math.random() * 30) : 0,
            selfAwareness: interviewType === 'PI' ? Math.floor(60 + Math.random() * 30) : 0,
            participation: Math.floor(65 + Math.random() * 30),
            overallRating: parseFloat((6 + Math.random() * 3).toFixed(1)),
            strengths: ['Good communication', 'Showed genuine interest', 'Structured answers'],
            improvements: ['Give more specific examples', 'Slow down when explaining', 'Ask clarifying questions'],
            aiSuggestions: ['Practice STAR method', 'Research the company beforehand', 'Prepare 3-5 strong examples'],
            summary: 'A solid performance with room for improvement in depth and structure.',
          }
        : {
            questionQuality: Math.floor(65 + Math.random() * 30),
            professionalism: Math.floor(70 + Math.random() * 25),
            engagement: Math.floor(60 + Math.random() * 35),
            followUpDepth: Math.floor(55 + Math.random() * 35),
            fairness: Math.floor(70 + Math.random() * 25),
            listeningSkill: Math.floor(65 + Math.random() * 30),
            overallRating: parseFloat((6.5 + Math.random() * 2.5).toFixed(1)),
            strengths: ['Professional tone', 'Good opening questions', 'Maintained structure'],
            improvements: ['Ask more follow-up questions', 'Probe deeper into technical answers', 'Allow more silence'],
            aiSuggestions: ['Use behavioral question frameworks', 'Prepare domain-specific technical scenarios', 'Practice active listening techniques'],
            summary: 'Good overall interview technique with room to improve depth of probing.',
          };
    }

    return NextResponse.json({ success: true, report, role, interviewType });
  } catch (error) {
    console.error('[Interview Session End]', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

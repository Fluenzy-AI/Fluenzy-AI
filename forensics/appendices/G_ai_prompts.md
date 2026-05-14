# Appendix G — AI Prompts (Verbatim Snippets)

> Extracted verbatim from source lines containing prompt definitions/usages.

## `DOCUMENTATION.md:958`
```
**Answer Evaluation Prompt Design** (`/api/evaluate-answer`):
- Role: "Fluenzy AI, advanced AI Interview Coach"
- Handles Hindi-English mix and STT transcription errors
- Critical rules: Never zero scores unless silent; fix STT artifacts (e.g., "Germany API" → "Gemini API")
```

## `Learn_English/components/CorporateVoicePractice.tsx:1103`
```
const passage = listenRepeatHistory.length > 0 ? listenRepeatHistory[listenRepeatHistory.length - 1].prompt : '';
    const score = evaluateListenRepeat(transcript, passage);
    
    setTimeout(() => {
```

## `Learn_English/components/GDAgent.tsx:125`
```
const prompt = `
        Evaluate the following Group Discussion transcript. Provide role-based analysis for EVERY participant (AI and User).
        Transcript: ${JSON.stringify(transcriptRef.current)}
```

## `Learn_English/components/GDAgent.tsx:138`
```
contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
```

## `Learn_English/components/VoiceAgent.tsx:452`
```
const instruction = `
        ${SYSTEM_INSTRUCTIONS[type as ModuleType] || 'Senior Interview Coach.'}
        ${isEnglishLearning
          ? `CONTEXT: Lesson Topic: ${sessionMeta?.lessonTitle || 'General English Practice'}, User Proficiency Level: ${user.proficiency}. Focus on teaching English skills, not conducting interviews.`
```

## `Learn_English/components/VoiceAgent.tsx:466`
```
STRICT INSTRUCTION: Teach ONLY this chapter "${sessionMeta?.lessonTitle}". Do NOT explain what GD is, GD rules, evaluation criteria, or any other chapter. Stay within the scope of this specific chapter only.`
          : `CONTEXT: Role: ${sessionMeta?.role || user.jobRole}, Company: ${sessionMeta?.company || 'Top MNC'}, Resume: ${sessionMeta?.resumeText || 'General Profile'}.
        Use your thinking budget to analyze resume projects and company requirements before every question.`
        }
```

## `Learn_English/components/VoiceAgent.tsx:476`
```
systemInstruction: instruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          thinkingConfig: { thinkingBudget: 24576 }, // max budget for 2.5 Flash
```

## `Learn_English/components/VoiceAgent.tsx:529`
```
// CRITICAL: Send initial text prompt to make AI speak FIRST
            // This triggers the AI to greet the user immediately
            sessionPromise.then(s => {
              const initialPrompt = isGDCoach
```

## `src/app/api/admin/marketing/ai-generate/route.ts:38`
```
{ error: "Missing required fields: prompt, senderType" },
            { status: 400 }
          );
        }
```

## `src/app/api/admin/marketing/ai-generate/route.ts:59`
```
const { prompt, senderType, tone, count } = params;

        if (!prompt || !senderType) {
          return NextResponse.json(
```

## `src/app/api/admin/marketing/ai-generate/route.ts:63`
```
{ error: "Missing required fields: prompt, senderType" },
            { status: 400 }
          );
        }
```

## `src/app/api/admin/marketing/ai-generate/route.ts:69`
```
{ prompt, senderType, tone: tone || "professional" },
          count || 3
        );
```

## `src/app/api/ai/conversation-response/route.ts:61`
```
const prompt = `${systemContext}

TOPIC: ${topic}
```

## `src/app/api/ai/conversation-response/route.ts:73`
```
const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      
      return NextResponse.json({ response });
```

## `src/app/api/ai/evaluate-gd/route.ts:105`
```
const prompt = `You are an expert Group Discussion evaluator. Analyze this GD transcript and evaluate the specific participant.

TOPIC: "${topic}"
```

## `src/app/api/ai/evaluate-gd/route.ts:137`
```
const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse JSON from response
```

## `src/app/api/ai/evaluate-voice/route.ts:95`
```
const prompt = `Compare the original text with what was spoken. Evaluate the reading quality.

ORIGINAL TEXT: "${originalText}"
```

## `src/app/api/ai/evaluate-voice/route.ts:120`
```
const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
```

## `src/app/api/ai/evaluate-voice/route.ts:161`
```
const prompt = `Evaluate how accurately the speaker repeated the original phrase.

ORIGINAL: "${originalText}"
REPEATED: "${transcript}"
```

## `src/app/api/ai/evaluate-voice/route.ts:182`
```
const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
```

## `src/app/api/ai/evaluate-voice/route.ts:230`
```
const prompt = `Evaluate this interview response for a ${jobRole || "professional"} position.

QUESTION: "${question || "General interview question"}"
PHASE: ${phase || "general"}
```

## `src/app/api/ai/evaluate-voice/route.ts:255`
```
const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
```

## `src/app/api/ai/evaluate-voice/route.ts:306`
```
const prompt = `Evaluate this extemporaneous speech on the topic: "${topic || "General topic"}"

SPEECH: "${transcript}"
DURATION: ${durationSeconds || 60} seconds
```

## `src/app/api/ai/evaluate-voice/route.ts:330`
```
const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
```

## `src/app/api/ai/evaluate-voice/route.ts:377`
```
const prompt = `Evaluate how well the candidate summarized the original passage.

ORIGINAL PASSAGE: "${originalText || "A passage was played"}"
```

## `src/app/api/ai/evaluate-voice/route.ts:400`
```
const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
```

## `src/app/api/ai/evaluate-voice/route.ts:458`
```
const prompt = `Provide a comprehensive evaluation of this voice interview for a ${jobRole || "professional"} position.

CANDIDATE: ${candidateName || "Candidate"}
```

## `src/app/api/ai/evaluate-voice/route.ts:485`
```
const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
```

## `src/app/api/ai/evaluate-voice/route.ts:546`
```
const prompt = `Evaluate this corporate conversation between an AI and a candidate on the topic: "${topic || "Professional communication"}"

CONVERSATION TRANSCRIPT:
${transcript}
```

## `src/app/api/ai/evaluate-voice/route.ts:570`
```
const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
```

## `src/app/api/ai/generate-video-feedback/route.ts:89`
```
const prompt = `Generate professional, specific behavioral feedback for an interview candidate.

Metrics (0-100 scale)${averagedMetrics ? ' - These are session averages' : ''}:
- Confidence: ${metrics.confidence}%
```

## `src/app/api/ai/generate-video-feedback/route.ts:132`
```
const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
```

## `src/app/api/candidates/auth/google/route.ts:20`
```
prompt: "select_account",
    state,
  });
```

## `src/app/api/college/google-auth/route.ts:16`
```
prompt: "select_account",
    state: "college_login",
  });
```

## `src/app/api/evaluate-answer/route.ts:48`
```
const prompt = `
You are Fluenzy AI, an advanced AI Interview Coach. Analyze this transcript.
Candidate might use Hindi-English mix or have Speech-to-Text errors.
```

## `src/app/api/evaluate-answer/route.ts:84`
```
result = await modelPro.generateContent(prompt);
    } catch (proError: any) {
      console.warn("Gemini 2.5 Pro busy or 404, switching to 2.5 Flash...");
```

## `src/app/api/evaluate-answer/route.ts:94`
```
result = await modelFlash.generateContent(prompt);
    }

    const response = await result.response;
```

## `src/app/api/generate-pdf/route.ts:270`
```
const prompt = `
You are FluenzyAI Interview Intelligence Engine.
Analyze ONE interview answer and return STRICT JSON only.
```

## `src/app/api/generate-pdf/route.ts:310`
```
const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
```

## `src/app/api/generate-pdf/route.ts:696`
```
const prompt = `
You are FluenzyAI Interview Intelligence Engine.
Question type: ${questionType}
Candidate: ${userName}
```

## `src/app/api/generate-pdf/route.ts:757`
```
const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text().replace(/```json\n?|\n?```/g, "").trim());
    const output: ArchiveEvaluation = {
      userRawRoman: normalizeToEnglishSafe(String(parsed.userRawRoman || rawRoman)),
```

## `src/app/api/generate-pdf/route.ts:1065`
```
const prompt = `You are a professional interview coach analyzing a single video frame captured during a mock job interview.\n\nLook carefully at this specific image and describe what you actually see:\n1. OBSERVATION: What behavioral issue is visible in THIS frame? Be specific about posture, gaze direction, head angle, shoulder position, facial tension, or expression. Do NOT give a generic description — describe only what is visually present.\n2. SUGGESTION: Give ONE clear, actionable correction...
```

## `src/app/api/generate-pdf/route.ts:1067`
```
{ text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: base64Only } },
    ]);
    const text = result.response.text().trim();
```

## `src/app/api/generate-pdf/route.ts:1472`
```
const hrText = escapeHtml(String(t.aiPrompt || "(no prompt)"));
                // If HR aiPrompt is a "come in" welcome response, user knocked/spoke first
                const userSpokeFirst = /^(please come in|come in|yes come in|do come in|yes please)/i.test(String(t.aiPrompt || "").trim());
```

## `src/app/api/interview-guide/route.ts:493`
```
const prompt = generateGuidePrompt(guideInput);

    let result;
    try {
```

## `src/app/api/interview-guide/route.ts:502`
```
result = await modelPro.generateContent(prompt);
    } catch (proError: any) {
      console.warn("Gemini 2.5 Pro busy, switching to 2.5 Flash...");
      // Fallback: Gemini 2.5 Flash
```

## `src/app/api/interview-guide/route.ts:510`
```
result = await modelFlash.generateContent(prompt);
    }

    const response = await result.response;
```

## `src/app/api/interview/session-end/route.ts:102`
```
const prompt = isCandidate ? candidatePrompt : interviewerPrompt;

    let report: Record<string, unknown>;
    try {
```

## `src/app/api/interview/session-end/route.ts:107`
```
const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json\n?|```\n?/g, '').trim();
      report = JSON.parse(text);
    } catch {
```

## `src/app/api/portal/auth/google/route.ts:35`
```
prompt: "select_account",
  });

  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
```

## `src/app/candidate/assessment/[token]/page.tsx:915`
```
<p className="font-medium mb-1">Important Instructions:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                      <li>Ensure you have a stable internet connection</li>
                      <li>The timer will start immediately after clicking Start</li>
```

## `src/app/company/portal/assessments/new/page.tsx:371`
```
placeholder="Add instructions or context for candidates..."
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
```

## `src/app/company/portal/assessments/new/page.tsx:629`
```
placeholder="Add instructions and guidelines for candidates..."
                      rows={6}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
```

## `src/app/faqs/page.tsx:56`
```
answer: "STAR stands for Situation, Task, Action, and Result — a structured framework for answering behavioral questions. Fluenzy's NLP engine checks whether each part is present in your answer. If you skip the 'Result', the AI will prompt: 'Could you explain the quantitative impact of that action?' Your STAR completeness % appears in your post-session report.",
      },
      {
        question: "What is a Group Discussion (GD) session?",
```

## `src/app/portal/hr/certificates/page.tsx:183`
```
const reason = prompt("Enter reason for revocation:");
    if (!reason) return;
    
    const res = await fetch(`/api/portal/hr/certificates/${id}/revoke`, {
```

## `src/app/portal/marketing/ai-generator/page.tsx:51`
```
const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");

  // Improve form
```

## `src/app/portal/marketing/ai-generator/page.tsx:232`
```
value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Write a re-engagement email for users who haven't logged in for 7 days. Encourage them to try our new interview practice feature. Include a 20% discount code."
                    rows={6}
```

## `src/app/portal/marketing/ai-generator/page.tsx:260`
```
disabled={loading || !prompt}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
```

## `src/app/portal/marketing/campaigns/page.tsx:227`
```
prompt: formData.aiPrompt,
          tone: formData.aiTone,
          senderType: formData.senderType || "news",
        }),
```

## `src/app/portal/marketing/page.tsx:231`
```
prompt: campaignForm.aiPrompt,
          senderType: campaignForm.senderType,
          tone: campaignForm.aiTone,
        }),
```

## `src/app/portal/marketing/recipients/page.tsx:208`
```
prompt: emailForm.aiPrompt,
          tone: "professional",
          includePersonalization: true,
        }),
```

## `src/app/superadmin/page.tsx:500`
```
const newLimit = prompt('Enter new usage limit:', currentLimit.toString());
    if (newLimit && !isNaN(Number(newLimit))) {
      try {
        const res = await fetch('/api/admin/users/limit', {
```

## `src/app/train/competitions/[competitionId]/battle/page.tsx:743`
```
<h2 className="text-lg font-semibold text-white mb-3">Instructions</h2>
              <p className="text-slate-300">
                {currentModule?.moduleType === 'READ_ALOUD' && 
                  "Read the following passage clearly and at a natural pace. Focus on pronunciation and clarity."}
```

## `src/components/MarketingDashboard.tsx:213`
```
prompt: campaignForm.aiPrompt,
          senderType: campaignForm.senderType,
          tone: campaignForm.aiTone,
        }),
```

## `src/lib/gemini.ts:55`
```
const prompt = `Generate ${count} multiple-choice questions on the topic: "${topic}".
Difficulty level: ${difficulty}.

For each question:
```

## `src/lib/gemini.ts:80`
```
const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extract JSON from response (handle markdown code blocks)
```

## `src/lib/gemini.ts:115`
```
const prompt = `Generate a coding challenge on the topic: "${topic}".
Difficulty level: ${difficulty}.

The problem should:
```

## `src/lib/gemini.ts:139`
```
const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extract JSON from response
```

## `src/lib/gemini.ts:174`
```
const prompt = `You are an expert evaluator assessing a candidate's answer.

Question: ${question}
```

## `src/lib/gemini.ts:199`
```
const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
```

## `src/lib/gemini.ts:268`
```
const prompt = `Evaluate this coding solution:

Language: ${language}
Problem: ${description}
```

## `src/lib/gemini.ts:303`
```
const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
```

## `src/lib/gemini.ts:340`
```
const prompt = `Generate ${count} interview questions for a ${role} position.
Experience level: ${experienceLevel}

${contextPrompt}
```

## `src/lib/gemini.ts:355`
```
const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\[[\s\S]*\]/);
```

## `src/lib/gemini.ts:386`
```
const prompt = `Evaluate this interview for a ${role} position${experienceLevel ? ` (${experienceLevel} level)` : ''}.

Interview Transcript:
${transcript.map((qa, i) => `\n${i + 1}. Q: ${qa.question}\n   A: ${qa.answer}`).join('\n')}
```

## `src/lib/gemini.ts:413`
```
const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
```

## `src/lib/jobs/matcher.ts:91`
```
const prompt = `
You are a career assistant. Compare these user skills with the job description.
User skills: ${userSkills.join(", ")}
Job title: ${job.title}
```

## `src/lib/jobs/matcher.ts:115`
```
contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
```

## `src/lib/jobs/resumeParser.ts:23`
```
const prompt = `
Extract technical and professional skills from this resume text.
Return ONLY a JSON array of skill strings. No explanation.
Example: ["Python", "React", "Project Management", "SQL"]
```

## `src/lib/jobs/resumeParser.ts:38`
```
body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
```

## `src/lib/marketing/ai-email-generator.ts:17`
```
prompt: string;
  segmentContext?: string;
  senderType: "news" | "contact" | "careers" | "support";
  tone?: "professional" | "friendly" | "urgent" | "motivational" | "casual";
```

## `src/lib/marketing/ai-email-generator.ts:54`
```
const systemPrompt = `You are an expert email marketing professional for Fluenzy AI, an AI-powered interview preparation and English fluency training platform. Your goal is to write compelling, high-converting emails that respect user privacy and follow best practices.

Platform: Fluenzy AI (fluenzyai.app)
Sender: ${senderContext}
```

## `src/lib/marketing/ai-email-generator.ts:76`
```
User Request: ${request.prompt}

Respond in JSON format with the following structure:
{
```

## `src/lib/marketing/ai-email-generator.ts:88`
```
const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const text = response.text();
```

## `src/lib/marketing/ai-email-generator.ts:138`
```
const prompt = `Generate ${variationCount} different email variations for the following request:

${request.prompt}
```

## `src/lib/marketing/ai-email-generator.ts:161`
```
const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
```

## `src/lib/marketing/ai-email-generator.ts:206`
```
const prompt = `Improve this email with a focus on ${improvementFocus}:

Subject: ${subject}
Body: ${body}
```

## `src/lib/marketing/ai-email-generator.ts:223`
```
const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
```

## `src/lib/marketing/ai-email-generator.ts:251`
```
const instructions: Record<string, string> = {
    professional: "Maintain a formal, business-appropriate tone. Use clear, concise language. Focus on credibility and expertise.",
    friendly: "Use warm, conversational language. Include personal touches. Be approachable and relatable.",
    urgent: "Create a sense of time-sensitivity without being pushy. Use action-oriented language. Emphasize limited opportunities.",
```

## `src/lib/marketing/ai-email-generator.ts:347`
```
const prompt = `Generate ${count} email subject lines for Fluenzy AI (an interview prep platform) based on this context:

${context}
```

## `src/lib/marketing/ai-email-generator.ts:360`
```
const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
```

## `src/lib/resume-parser-ai.ts:287`
```
const prompt = RESUME_PARSER_PROMPT + rawText;

    const result = await model.generateContent(prompt);
    const response = await result.response;
```

## `src/lib/resume-parser-ai.ts:289`
```
const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
```

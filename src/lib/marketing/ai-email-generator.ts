/**
 * AI Email Generator using Google Gemini API
 * Generates professional marketing emails with contextual content
 */

import { generateJSON } from "@/lib/gemini-router";
import { TraceMetadata, traceGeminiCall, FEATURES } from "@/lib/langsmith";

export interface AIEmailRequest {
  prompt: string;
  segmentContext?: string;
  senderType: "news" | "contact" | "careers" | "support";
  tone?: "professional" | "friendly" | "urgent" | "motivational" | "casual";
  targetAudience?: string;
  purpose?: string;
}

export interface AIEmailResponse {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  suggestedVariables: string[];
  spamScore: number;
  suggestions: string[];
}

// Spam trigger words to check against
const SPAM_TRIGGERS = [
  "free", "winner", "congratulations", "urgent", "act now", "limited time",
  "100%", "guarantee", "click here", "subscribe", "unbelievable", "miracle",
  "make money", "earn cash", "risk free", "no obligation", "dear friend"
];

/**
 * Generate marketing email content using Gemini AI
 */
export async function generateMarketingEmail(
  request: AIEmailRequest,
  metadata?: TraceMetadata
): Promise<AIEmailResponse> {

  const toneInstructions = getToneInstructions(request.tone || "professional");
  const senderContext = getSenderContext(request.senderType);

  const systemPrompt = `You are an expert email marketing professional for Fluenzy AI, an AI-powered interview preparation and English fluency training platform. Your goal is to write compelling, high-converting emails that respect user privacy and follow best practices.

Platform: Fluenzy AI (fluenzyai.app)
Sender: ${senderContext}
Tone: ${toneInstructions}
${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ""}
${request.purpose ? `Purpose: ${request.purpose}` : ""}
${request.segmentContext ? `Segment Context: ${request.segmentContext}` : ""}

IMPORTANT GUIDELINES:
1. Always maintain the ${request.tone || "professional"} tone throughout
2. Include a clear call-to-action (CTA) button
3. Keep subject lines under 50 characters for better mobile display
4. Use personalization variables: {{first_name}}, {{plan_type}}, {{last_activity}}
5. ALWAYS include {{unsubscribe_link}} in the footer
6. Avoid spam trigger words
7. Focus on value and benefits, not features
8. Create urgency without being pushy
9. Use Fluenzy AI branding colors: Purple (#7c3aed), Dark (#0b0f1a)
10. Keep paragraphs short (2-3 sentences max)
11. Dashboard link should be: https://www.fluenzyai.app/train

User Request: ${request.prompt}

Respond in JSON format with the following structure:
{
  "subject": "Email subject line (under 50 chars)",
  "bodyHtml": "Full HTML email body with inline styles, using Fluenzy AI branding",
  "bodyText": "Plain text version of the email",
  "suggestedVariables": ["{{first_name}}", "{{plan_type}}"],
  "suggestions": ["Any suggestions to improve the campaign"]
}`;

  try {
    const parsed = await generateJSON<any>(systemPrompt);
    const spamScore = calculateSpamScore(parsed.subject + " " + parsed.bodyText);
    if (!parsed.bodyHtml.includes("{{unsubscribe_link}}")) parsed.bodyHtml = addUnsubscribeLink(parsed.bodyHtml);
    if (!parsed.bodyText.includes("{{unsubscribe_link}}")) parsed.bodyText += "\n\nUnsubscribe: {{unsubscribe_link}}";
    return {
      subject: parsed.subject,
      bodyHtml: parsed.bodyHtml,
      bodyText: parsed.bodyText,
      suggestedVariables: parsed.suggestedVariables || ["{{first_name}}", "{{unsubscribe_link}}"],
      spamScore,
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    console.error("AI Email Generation Error:", error);
    throw new Error("Failed to generate email content. Please try again.");
  }
}

/**
 * Generate email variations for A/B testing
 */
export async function generateEmailVariations(
  request: AIEmailRequest,
  variationCount: number = 3,
  metadata?: TraceMetadata
): Promise<AIEmailResponse[]> {
  const prompt = `Generate ${variationCount} different email variations for the following request:

${request.prompt}

Each variation should:
1. Have a different subject line approach (curiosity, benefit, question, etc.)
2. Have a different opening hook
3. Maintain the same core message and CTA

Respond in JSON format:
{
  "variations": [
    {
      "subject": "...",
      "bodyHtml": "...",
      "bodyText": "...",
      "suggestedVariables": ["..."],
      "approach": "curiosity"
    }
  ]
}`;

  try {
    const parsed = await generateJSON<{ variations: any[] }>(prompt);
    return parsed.variations.map((v: any) => ({
      subject: v.subject,
      bodyHtml: v.bodyHtml,
      bodyText: v.bodyText,
      suggestedVariables: v.suggestedVariables || [],
      spamScore: calculateSpamScore(v.subject + " " + v.bodyText),
      suggestions: [v.approach],
    }));
  } catch (error) {
    console.error("AI Variation Generation Error:", error);
    throw new Error("Failed to generate email variations");
  }
}

/**
 * Improve existing email content
 */
export async function improveEmailContent(
  subject: string,
  body: string,
  improvementFocus: "deliverability" | "engagement" | "conversion" | "clarity",
  metadata?: TraceMetadata
): Promise<AIEmailResponse> {
  const focusInstructions = {
    deliverability: "Reduce spam triggers, improve sender reputation factors, avoid promotional language",
    engagement: "Add more compelling hooks, improve storytelling, increase emotional connection",
    conversion: "Strengthen CTA, add urgency, improve value proposition clarity",
    clarity: "Simplify language, improve readability, reduce cognitive load",
  };

  const prompt = `Improve this email with a focus on ${improvementFocus}:

Subject: ${subject}
Body: ${body}

Focus: ${focusInstructions[improvementFocus]}

Respond in JSON format:
{
  "subject": "Improved subject",
  "bodyHtml": "Improved HTML body",
  "bodyText": "Improved plain text body",
  "suggestedVariables": ["..."],
  "improvements": ["List of improvements made"]
}`;

  try {
    const parsed = await generateJSON<any>(prompt);
    return {
      subject: parsed.subject,
      bodyHtml: parsed.bodyHtml,
      bodyText: parsed.bodyText,
      suggestedVariables: parsed.suggestedVariables || [],
      spamScore: calculateSpamScore(parsed.subject + " " + parsed.bodyText),
      suggestions: parsed.improvements || [],
    };
  } catch (error) {
    console.error("AI Improvement Error:", error);
    throw new Error("Failed to improve email content");
  }
}

/**
 * Get tone-specific instructions
 */
function getToneInstructions(tone: string): string {
  const instructions: Record<string, string> = {
    professional: "Maintain a formal, business-appropriate tone. Use clear, concise language. Focus on credibility and expertise.",
    friendly: "Use warm, conversational language. Include personal touches. Be approachable and relatable.",
    urgent: "Create a sense of time-sensitivity without being pushy. Use action-oriented language. Emphasize limited opportunities.",
    motivational: "Be inspiring and encouraging. Focus on possibilities and growth. Use empowering language.",
    casual: "Keep it light and relaxed. Use everyday language. Feel like a message from a friend.",
  };

  return instructions[tone] || instructions.professional;
}

/**
 * Get sender context based on sender type
 */
function getSenderContext(senderType: string): string {
  const contexts: Record<string, string> = {
    news: "Fluenzy AI News (news@fluenzyai.app) - Platform updates, feature announcements, industry news",
    contact: "Fluenzy AI Contact (contact@fluenzyai.app) - General communication, inquiries, feedback",
    careers: "Fluenzy AI Careers (careers@fluenzyai.app) - Career advice, job opportunities, professional development",
    support: "Fluenzy AI Support (support@fluenzyai.app) - Help, tips, tutorials, user guidance",
  };

  return contexts[senderType] || contexts.news;
}

/**
 * Calculate spam score (0-100, lower is better)
 */
function calculateSpamScore(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;

  // Check for spam triggers
  SPAM_TRIGGERS.forEach((trigger) => {
    if (lowerText.includes(trigger.toLowerCase())) {
      score += 10;
    }
  });

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.3) {
    score += 15;
  }

  // Check for excessive exclamation marks
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 3) {
    score += exclamations * 2;
  }

  // Check for excessive dollar signs
  const dollarSigns = (text.match(/\$/g) || []).length;
  if (dollarSigns > 2) {
    score += dollarSigns * 3;
  }

  return Math.min(100, score);
}

/**
 * Add unsubscribe link to HTML email
 */
function addUnsubscribeLink(html: string): string {
  const unsubscribeFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
      <p>You received this email because you're a Fluenzy AI user.</p>
      <p>
        <a href="{{unsubscribe_link}}" style="color: #7c3aed; text-decoration: underline;">Unsubscribe</a>
        &nbsp;|&nbsp;
        <a href="https://www.fluenzyai.app/privacy" style="color: #7c3aed; text-decoration: underline;">Privacy Policy</a>
      </p>
      <p style="margin-top: 10px;">© ${new Date().getFullYear()} Fluenzy AI. All rights reserved.</p>
    </div>
  `;

  // Try to insert before closing body tag, or append to end
  if (html.includes("</body>")) {
    return html.replace("</body>", unsubscribeFooter + "</body>");
  }
  return html + unsubscribeFooter;
}

/**
 * Generate subject line suggestions
 */
export async function generateSubjectLines(
  context: string,
  count: number = 5,
  metadata?: TraceMetadata
): Promise<string[]> {
  const prompt = `Generate ${count} email subject lines for Fluenzy AI (an interview prep platform) based on this context:

${context}

Requirements:
- Under 50 characters each
- Varied approaches (curiosity, benefit, question, urgency)
- Avoid spam triggers
- Personalization is okay (use {{first_name}} if helpful)

Respond as JSON array: ["subject1", "subject2", ...]`;

  try {
    const parsed = await generateJSON<string[]>(prompt);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return ["Check out what's new", "Your Fluenzy AI update", "Important news for you"];
  } catch (error) {
    console.error("Subject line generation error:", error);
    return ["Your Fluenzy AI Update", "Important News", "Don't miss this"];
  }
}

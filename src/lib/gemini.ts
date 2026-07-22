/**
 * Gemini AI Library
 * Wrapper around Google Generative AI for assessment-related tasks.
 * All calls are routed through gemini-router for automatic key + model rotation.
 */

import { callGeminiWithFallback, generateJSON, generateText } from "@/lib/gemini-router";
import { traceGeminiCall, FEATURES } from "@/lib/langsmith";

// Model aliases kept for reference / LangSmith tracing metadata
const FLASH_MODEL = "gemini-2.5-flash";
const PRO_MODEL   = "gemini-2.5-pro";

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option (0-3)
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
}

export interface CodingQuestion {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  testCases: Array<{ input: string; output: string }>;
  hints?: string[];
  timeLimit?: number; // seconds
  memoryLimit?: number; // MB
}

export interface EvaluationResult {
  score: number; // 0-100
  feedback: string;
  strengths?: string[];
  improvements?: string[];
  detailedAnalysis?: Record<string, any>;
}

/**
 * Generate MCQ questions using Gemini
 */
export async function generateMCQQuestions(
  topic: string,
  count: number = 10,
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<MCQQuestion[]> {
  const model = genAI.getGenerativeModel({ model: FLASH_MODEL });

  const prompt = `Generate ${count} multiple-choice questions on the topic: "${topic}".
Difficulty level: ${difficulty}.

For each question:
1. Write a clear, professional question
2. Provide exactly 4 options
3. Indicate the correct answer (0-3 index)
4. Provide a brief explanation
5. Tag with a specific sub-topic if applicable

Return ONLY valid JSON array in this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 2,
    "explanation": "Brief explanation why this is correct",
    "difficulty": "${difficulty}",
    "topic": "Specific sub-topic"
  }
]

Make questions practical, relevant, and at ${difficulty} difficulty level.`;

  try {
    const questions: MCQQuestion[] = await generateJSON<MCQQuestion[]>(prompt, {
      preferredModel: FLASH_MODEL,
    });
    
    // Validate structure
    questions.forEach((q, i) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
          typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error(`Invalid question structure at index ${i}`);
      }
    });
    
    return questions;
  } catch (error: any) {
    console.error("Gemini MCQ generation error:", error);
    throw new Error(`Failed to generate MCQ questions: ${error.message}`);
  }
}

/**
 * Generate coding challenge using Gemini
 */
export async function generateCodingChallenge(
  topic: string,
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<CodingQuestion> {
  const prompt = `Generate a coding challenge on the topic: "${topic}".
Difficulty level: ${difficulty}.

The problem should:
1. Have a clear title and description
2. Include input/output format
3. Have 3-5 test cases with inputs and expected outputs
4. Optionally include hints
5. Be solvable in common languages (Python, JavaScript, Java, C++)

Return ONLY valid JSON in this exact format:
{
  "title": "Problem Title",
  "description": "Detailed problem description with input/output format",
  "difficulty": "${difficulty}",
  "testCases": [
    { "input": "test input", "output": "expected output" }
  ],
  "hints": ["Hint 1", "Hint 2"],
  "timeLimit": 2,
  "memoryLimit": 256
}`;

  try {
    const challenge: CodingQuestion = await generateJSON<CodingQuestion>(prompt, {
      preferredModel: FLASH_MODEL,
    });
    
    // Validate structure
    if (!challenge.title || !challenge.description || !Array.isArray(challenge.testCases) || 
        challenge.testCases.length === 0) {
      throw new Error("Invalid coding challenge structure");
    }
    
    return challenge;
  } catch (error: any) {
    console.error("Gemini coding challenge generation error:", error);
    throw new Error(`Failed to generate coding challenge: ${error.message}`);
  }
}

/**
 * Evaluate text answer using Gemini
 */
export async function evaluateTextAnswer(
  question: string,
  userAnswer: string,
  modelAnswer?: string,
  context?: string
): Promise<EvaluationResult> {
  const prompt = `You are an expert evaluator assessing a candidate's answer.

Question: ${question}

${modelAnswer ? `Model Answer: ${modelAnswer}` : ''}

${context ? `Context: ${context}` : ''}

Candidate's Answer: ${userAnswer}

Evaluate the answer and provide:
1. Score out of 100
2. Constructive feedback
3. Strengths (what they did well)
4. Areas for improvement

Return ONLY valid JSON:
{
  "score": 85,
  "feedback": "Overall feedback...",
  "strengths": ["Point 1", "Point 2"],
  "improvements": ["Area 1", "Area 2"]
}`;

  try {
    const evaluation: EvaluationResult = await generateJSON<EvaluationResult>(prompt, {
      preferredModel: FLASH_MODEL,
    });
    
    if (typeof evaluation.score !== 'number' || !evaluation.feedback) {
      throw new Error("Invalid evaluation structure");
    }
    
    return evaluation;
  } catch (error: any) {
    console.error("Gemini evaluation error:", error);
    throw new Error(`Failed to evaluate answer: ${error.message}`);
  }
}

/**
 * Evaluate MCQ answers
 */
export function evaluateMCQAnswers(
  questions: MCQQuestion[],
  userAnswers: number[]
): EvaluationResult {
  if (questions.length !== userAnswers.length) {
    throw new Error("Mismatch between questions and answers count");
  }

  let correctCount = 0;
  const breakdown: any[] = [];

  questions.forEach((q, i) => {
    const isCorrect = q.correctAnswer === userAnswers[i];
    if (isCorrect) correctCount++;
    
    breakdown.push({
      questionIndex: i,
      question: q.question,
      correctAnswer: q.correctAnswer,
      userAnswer: userAnswers[i],
      isCorrect,
      explanation: q.explanation
    });
  });

  const score = Math.round((correctCount / questions.length) * 100);
  
  return {
    score,
    feedback: `You answered ${correctCount} out of ${questions.length} questions correctly (${score}%).`,
    detailedAnalysis: { breakdown, correctCount, totalQuestions: questions.length }
  };
}

/**
 * Evaluate coding submission
 */
export async function evaluateCodingSubmission(
  code: string,
  language: string,
  testCases: Array<{ input: string; output: string }>,
  description: string
): Promise<EvaluationResult> {
  const prompt = `Evaluate this coding solution:

Language: ${language}
Problem: ${description}

Code:
\`\`\`${language}
${code}
\`\`\`

Test Cases:
${testCases.map((tc, i) => `Test ${i + 1}: Input: ${tc.input}, Expected: ${tc.output}`).join('\n')}

Evaluate the code for:
1. Correctness (would it pass the test cases?)
2. Code quality (readability, structure)
3. Efficiency (time/space complexity)
4. Best practices

Return ONLY valid JSON:
{
  "score": 85,
  "feedback": "Overall assessment...",
  "strengths": ["Good point 1", "Good point 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "detailedAnalysis": {
    "correctness": 90,
    "codeQuality": 85,
    "efficiency": 80,
    "testsPassed": 4,
    "testsTotal": 5
  }
}`;

  try {
    const evaluation: EvaluationResult = await generateJSON<EvaluationResult>(prompt, {
      preferredModel: FLASH_MODEL,
    });
    
    if (typeof evaluation.score !== 'number' || !evaluation.feedback) {
      throw new Error("Invalid evaluation structure");
    }
    
    return evaluation;
  } catch (error: any) {
    console.error("Gemini coding evaluation error:", error);
    throw new Error(`Failed to evaluate code: ${error.message}`);
  }
}

/**
 * Generate interview questions dynamically (for AI Interview type)
 */
export async function generateInterviewQuestions(
  role: string,
  experienceLevel: string,
  previousAnswers?: Array<{ question: string; answer: string }>,
  count: number = 5
): Promise<string[]> {
  const contextPrompt = previousAnswers && previousAnswers.length > 0
    ? `\n\nPrevious conversation:\n${previousAnswers.map(qa => 
        `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}\n\nAsk follow-up questions based on their answers.`
    : '';

  const prompt = `Generate ${count} interview questions for a ${role} position.
Experience level: ${experienceLevel}

${contextPrompt}

Questions should be:
1. Relevant to the role
2. Appropriate for experience level
3. Open-ended to encourage detailed responses
4. Professional and clear

Return ONLY a JSON array of question strings:
["Question 1?", "Question 2?", "Question 3?"]`;

  try {
    const questions: string[] = await generateJSON<string[]>(prompt, {
      preferredModel: FLASH_MODEL,
    });
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions array");
    }
    
    return questions;
  } catch (error: any) {
    console.error("Gemini interview questions error:", error);
    throw new Error(`Failed to generate interview questions: ${error.message}`);
  }
}

/**
 * Evaluate voice/interview transcript
 */
export async function evaluateInterviewTranscript(
  role: string,
  transcript: Array<{ question: string; answer: string }>,
  experienceLevel?: string
): Promise<EvaluationResult> {
  const model = genAI.getGenerativeModel({ model: PRO_MODEL });

  const prompt = `Evaluate this interview for a ${role} position${experienceLevel ? ` (${experienceLevel} level)` : ''}.

Interview Transcript:
${transcript.map((qa, i) => `\n${i + 1}. Q: ${qa.question}\n   A: ${qa.answer}`).join('\n')}

Evaluate on:
1. Technical knowledge (if applicable)
2. Communication clarity
3. Problem-solving approach
4. Cultural fit indicators
5. Overall impression

Return ONLY valid JSON:
{
  "score": 75,
  "feedback": "Overall performance summary...",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Area 1", "Area 2"],
  "detailedAnalysis": {
    "technicalKnowledge": 80,
    "communication": 75,
    "problemSolving": 70,
    "culturalFit": 80
  }
}`;

  try {
    const evaluation: EvaluationResult = await generateJSON<EvaluationResult>(prompt, {
      preferredModel: PRO_MODEL, // transcript eval uses more powerful model
    });
    if (typeof evaluation.score !== 'number' || !evaluation.feedback) {
      throw new Error("Invalid evaluation structure");
    }
    return evaluation;
  } catch (error: any) {
    console.error("Gemini transcript evaluation error:", error);
    throw new Error(`Failed to evaluate transcript: ${error.message}`);
  }
}

export default {
  generateMCQQuestions,
  generateCodingChallenge,
  evaluateTextAnswer,
  evaluateMCQAnswers,
  evaluateCodingSubmission,
  generateInterviewQuestions,
  evaluateInterviewTranscript
};

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to generate PDF-friendly HTML
function generatePDFHTML(guide: any, userName: string, targetRole: string, targetCompany: string | null) {
  const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: #1a1a2e;
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
      }
      h1 { 
        font-size: 28px; 
        color: #6c5ce7; 
        margin-bottom: 8px;
        text-align: center;
      }
      h2 { 
        font-size: 20px; 
        color: #2d3436; 
        margin: 30px 0 15px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid #6c5ce7;
      }
      h3 { 
        font-size: 16px; 
        color: #6c5ce7;
        margin: 20px 0 10px 0;
      }
      h4 {
        font-size: 14px;
        color: #2d3436;
        margin: 15px 0 8px 0;
      }
      p { margin: 8px 0; font-size: 13px; }
      ul { margin: 10px 0 10px 25px; }
      li { margin: 5px 0; font-size: 13px; }
      .header { text-align: center; margin-bottom: 30px; }
      .subtitle { color: #636e72; font-size: 14px; text-align: center; margin-bottom: 5px; }
      .badge { 
        display: inline-block; 
        padding: 4px 12px; 
        background: #dfe6e9; 
        border-radius: 20px; 
        font-size: 11px;
        margin: 3px;
      }
      .section { margin-bottom: 25px; page-break-inside: avoid; }
      .qa-card { 
        background: #f8f9fa; 
        padding: 15px; 
        border-radius: 8px; 
        margin: 12px 0;
        border-left: 4px solid #6c5ce7;
      }
      .question { font-weight: 600; color: #2d3436; margin-bottom: 8px; }
      .answer { color: #4a4a4a; }
      .tip { 
        font-size: 12px; 
        color: #e17055; 
        font-style: italic;
        margin-top: 8px;
      }
      .intro-box { 
        background: linear-gradient(135deg, #667eea20, #764ba220); 
        padding: 15px; 
        border-radius: 8px; 
        margin: 12px 0;
      }
      .intro-duration { 
        font-weight: 600; 
        color: #6c5ce7; 
        font-size: 14px; 
        margin-bottom: 8px;
      }
      .avoid { color: #d63031; text-decoration: line-through; }
      .use { color: #00b894; font-weight: 500; }
      .checklist-item { 
        padding: 5px 0;
        border-bottom: 1px dashed #dfe6e9;
      }
      .page-break { page-break-before: always; }
      .footer { 
        text-align: center; 
        margin-top: 40px; 
        padding-top: 20px;
        border-top: 1px solid #dfe6e9;
        font-size: 11px;
        color: #636e72;
      }
    </style>
  `;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Interview Guide - ${targetRole}</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>🎯 Ultimate Interview Guide</h1>
        <p class="subtitle">Personalized for <strong>${userName}</strong></p>
        <p class="subtitle">${targetRole}${targetCompany ? ` @ ${targetCompany}` : ''}</p>
        <div style="margin-top: 10px;">
          <span class="badge">${guide.section1_preparation?.starMethod ? 'STAR Method' : ''}</span>
          <span class="badge">HR Questions</span>
          <span class="badge">Technical Prep</span>
        </div>
      </div>
  `;

  // Section 1: Preparation
  if (guide.section1_preparation) {
    html += `<div class="section">
      <h2>📚 ${guide.section1_preparation.title || 'Before the Interview'}</h2>`;
    
    if (guide.section1_preparation.oneDayBefore) {
      html += `<h3>One Day Before</h3><ul>`;
      guide.section1_preparation.oneDayBefore.forEach((tip: string) => {
        html += `<li>${tip}</li>`;
      });
      html += `</ul>`;
    }

    if (guide.section1_preparation.oneHourBefore) {
      html += `<h3>One Hour Before</h3><ul>`;
      guide.section1_preparation.oneHourBefore.forEach((tip: string) => {
        html += `<li>${tip}</li>`;
      });
      html += `</ul>`;
    }

    if (guide.section1_preparation.commonMistakes) {
      html += `<h3>❌ Common Mistakes to Avoid</h3><ul>`;
      guide.section1_preparation.commonMistakes.forEach((mistake: string) => {
        html += `<li class="avoid">${mistake}</li>`;
      });
      html += `</ul>`;
    }

    if (guide.section1_preparation.starMethod) {
      html += `<h3>⭐ STAR Method</h3>`;
      Object.entries(guide.section1_preparation.starMethod).forEach(([key, value]) => {
        html += `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</p>`;
      });
    }

    html += `</div>`;
  }

  // Section 2: Introduction
  if (guide.section2_introduction) {
    html += `<div class="section page-break">
      <h2>👤 ${guide.section2_introduction.title || 'Tell Me About Yourself'}</h2>`;
    
    if (guide.section2_introduction.short30sec) {
      html += `<div class="intro-box">
        <p class="intro-duration">⏱️ 30 Seconds Version</p>
        <p>${guide.section2_introduction.short30sec}</p>
      </div>`;
    }

    if (guide.section2_introduction.medium60sec) {
      html += `<div class="intro-box">
        <p class="intro-duration">⏱️ 60 Seconds Version</p>
        <p>${guide.section2_introduction.medium60sec}</p>
      </div>`;
    }

    if (guide.section2_introduction.long90sec) {
      html += `<div class="intro-box">
        <p class="intro-duration">⏱️ 90 Seconds Version</p>
        <p>${guide.section2_introduction.long90sec}</p>
      </div>`;
    }

    html += `</div>`;
  }

  // Section 3: HR Questions
  if (guide.section3_hrQuestions?.questions) {
    html += `<div class="section page-break">
      <h2>💬 ${guide.section3_hrQuestions.title || 'HR Interview Questions'}</h2>`;
    
    guide.section3_hrQuestions.questions.forEach((q: any, i: number) => {
      html += `<div class="qa-card">
        <p class="question">${i + 1}. ${q.question}</p>
        <p class="answer">${q.answer}</p>
        ${q.tips ? `<p class="tip">💡 ${q.tips}</p>` : ''}
      </div>`;
    });

    html += `</div>`;
  }

  // Section 4: Technical Questions
  if (guide.section4_technicalQuestions) {
    html += `<div class="section page-break">
      <h2>💻 ${guide.section4_technicalQuestions.title || 'Technical Questions'}</h2>`;
    
    ['beginner', 'intermediate', 'advanced'].forEach((level) => {
      if (guide.section4_technicalQuestions[level]?.length) {
        html += `<h3>${level.charAt(0).toUpperCase() + level.slice(1)} Level</h3>`;
        guide.section4_technicalQuestions[level].forEach((q: any, i: number) => {
          html += `<div class="qa-card">
            <p class="question">${i + 1}. ${q.question}</p>
            <p class="answer">${q.answer}</p>
          </div>`;
        });
      }
    });

    html += `</div>`;
  }

  // Section 5: Company Specific
  if (guide.section5_companySpecific && targetCompany) {
    html += `<div class="section page-break">
      <h2>🏢 ${guide.section5_companySpecific.title || 'Company-Specific Questions'}</h2>`;
    
    if (guide.section5_companySpecific.whyThisCompany) {
      html += `<div class="qa-card">
        <p class="question">Why ${targetCompany}?</p>
        <p class="answer">${guide.section5_companySpecific.whyThisCompany}</p>
      </div>`;
    }

    if (guide.section5_companySpecific.cultureFit) {
      html += `<div class="qa-card">
        <p class="question">Culture Fit</p>
        <p class="answer">${guide.section5_companySpecific.cultureFit}</p>
      </div>`;
    }

    if (guide.section5_companySpecific.valueAddition) {
      html += `<div class="qa-card">
        <p class="question">How You Add Value</p>
        <p class="answer">${guide.section5_companySpecific.valueAddition}</p>
      </div>`;
    }

    html += `</div>`;
  }

  // Section 6: Communication
  if (guide.section6_communication) {
    html += `<div class="section page-break">
      <h2>🗣️ ${guide.section6_communication.title || 'Communication Tips'}</h2>`;
    
    if (guide.section6_communication.betterReplacements) {
      html += `<h3>Better Replacements</h3><ul>`;
      guide.section6_communication.betterReplacements.forEach((item: any) => {
        html += `<li><span class="avoid">${item.avoid}</span> → <span class="use">${item.useInstead}</span></li>`;
      });
      html += `</ul>`;
    }

    if (guide.section6_communication.powerPhrases) {
      html += `<h3>✨ Power Phrases</h3><ul>`;
      guide.section6_communication.powerPhrases.forEach((phrase: string) => {
        html += `<li>"${phrase}"</li>`;
      });
      html += `</ul>`;
    }

    html += `</div>`;
  }

  // Section 7: Cheat Sheet
  if (guide.section7_cheatSheet) {
    html += `<div class="section page-break">
      <h2>📝 ${guide.section7_cheatSheet.title || 'Rapid Memorization Cheat Sheet'}</h2>`;
    
    if (guide.section7_cheatSheet.keyLinesToMemorize) {
      html += `<h3>Key Lines to Memorize</h3><ul>`;
      guide.section7_cheatSheet.keyLinesToMemorize.forEach((line: string) => {
        html += `<li>"${line}"</li>`;
      });
      html += `</ul>`;
    }

    if (guide.section7_cheatSheet.finalChecklist) {
      html += `<h3>✅ Final Checklist</h3>`;
      guide.section7_cheatSheet.finalChecklist.forEach((item: string) => {
        html += `<p class="checklist-item">☐ ${item}</p>`;
      });
    }

    html += `</div>`;
  }

  // Footer
  html += `
      <div class="footer">
        <p>Generated by <strong>Fluenzy AI</strong> - Your AI Interview Coach</p>
        <p>Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="margin-top: 10px; font-style: italic;">"Rat ke interview nikal!" 🚀</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

// GET /api/interview-guide/pdf/[id] - Generate PDF for a guide
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const guide = await (prisma as any).interviewGuide.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    // Generate HTML
    const html = generatePDFHTML(
      guide.generatedContent,
      user.name,
      guide.targetRole,
      guide.targetCompany
    );

    // Return HTML with print-friendly headers
    // User can use "Print to PDF" or browser will handle it
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="Interview_Guide_${guide.targetRole.replace(/\s+/g, "_")}.html"`,
      },
    });

  } catch (error: any) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error.message },
      { status: 500 }
    );
  }
}

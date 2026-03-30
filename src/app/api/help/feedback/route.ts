import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { articleId, helpful } = body;

    // Log feedback for analytics
    // In production, save this to your analytics database
    console.log(`[Help Feedback] Article: ${articleId}, Helpful: ${helpful}`);

    // You could save to database here:
    // await prisma.helpFeedback.create({
    //   data: { articleId, helpful, timestamp: new Date() }
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging help feedback:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

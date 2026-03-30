import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getPublicUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

const toIstDateKey = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
};

const generateUsername = async (email: string) => {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "");
  let candidate = base || `user${Math.floor(Math.random() * 10000)}`;

  const existing = await (prisma as any).userProfile.findUnique({ where: { username: candidate } });
  if (!existing) return candidate;

  let attempts = 0;
  while (attempts < 5) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const next = `${candidate}-${suffix}`;
    const exists = await (prisma as any).userProfile.findUnique({ where: { username: next } });
    if (!exists) return next;
    attempts += 1;
  }

  return `${candidate}-${Date.now().toString(36).slice(-4)}`;
};

const suggestUsernames = async (requested: string, userId: string) => {
  const base = requested.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!base) return [];

  const suggestions = new Set<string>();
  const seedCandidates = [
    `${base}1`,
    `${base}01`,
    `${base}123`,
    `${base}-${new Date().getFullYear()}`,
    `${base}_ai`,
  ];

  for (const candidate of seedCandidates) {
    const existing = await (prisma as any).userProfile.findFirst({
      where: { username: candidate, userId: { not: userId } },
    });
    if (!existing) suggestions.add(candidate);
    if (suggestions.size >= 5) break;
  }

  let attempts = 0;
  while (suggestions.size < 5 && attempts < 20) {
    const suffix = Math.floor(100 + Math.random() * 900);
    const candidate = `${base}${suffix}`;
    const existing = await (prisma as any).userProfile.findFirst({
      where: { username: candidate, userId: { not: userId } },
    });
    if (!existing) suggestions.add(candidate);
    attempts += 1;
  }

  return Array.from(suggestions);
};

export async function GET() {
  try {
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

    const profile = await (prisma as any).userProfile.findUnique({
      where: { userId: user.id },
      include: {
        skills: true,
        experiences: true,
        educations: true,
        certifications: true,
        projects: true,
        courses: true,
        languages: true,
      },
    });

    const ensuredProfile = profile
      ? profile
      : await (prisma as any).userProfile.create({
          data: {
            userId: user.id,
            username: await generateUsername(user.email),
            headline: "",
            bio: "",
            socialLinks: {},
            openToWork: false,
            publicProfileEnabled: false,
            publicSections: {
              skills: true,
              experience: true,
              education: true,
              certifications: true,
              projects: true,
              courses: true,
              languages: true,
              analyticsReport: false,
            },
          },
          include: {
            skills: true,
            experiences: true,
            educations: true,
            certifications: true,
            projects: true,
            courses: true,
            languages: true,
          },
        });

    const subscription = await prisma.subscriptions.findFirst({
      where: {
        userId: user.id,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });

    const planPricing = await (prisma as any).planPricing.findMany();
    const pricingMap: Record<string, any> = {};
    planPricing.forEach((pricing: any) => {
      pricingMap[pricing.plan] = pricing;
    });

    const globalSettings = await (prisma as any).globalPlanSettings.findMany();
    const settingsMap: Record<string, any> = {};
    globalSettings.forEach((setting: any) => {
      settingsMap[setting.plan] = setting;
    });

    const userPlan = user.plan?.toString() || "Free";
    const pricing = pricingMap[userPlan];
    const settings = settingsMap[userPlan];

    const totalUsage =
      (user.englishUsage || 0) +
      (user.dailyUsage || 0) +
      (user.hrUsage || 0) +
      (user.technicalUsage || 0) +
      (user.companyUsage || 0) +
      (user.gdUsage || 0);

    const planInfo = {
      plan: userPlan,
      planName: pricing?.name || userPlan,
      price: pricing?.price || 0,
      currency: pricing?.currency || "INR",
      monthlyLimit: settings?.isUnlimited ? null : settings?.monthlyLimit || 0,
      isUnlimited: settings?.isUnlimited || false,
      currentUsage: totalUsage,
      remainingUses: settings?.isUnlimited
        ? "Unlimited"
        : Math.max(0, (settings?.monthlyLimit || 0) - totalUsage),
      renewalDate: user.renewalDate,
      subscription: subscription || null,
    };

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        startTime: { gte: oneYearAgo },
      },
      select: { startTime: true },
    });

    const activity: Record<string, number> = {};
    sessions.forEach((sessionItem) => {
      const key = toIstDateKey(sessionItem.startTime);
      activity[key] = (activity[key] || 0) + 1;
    });

    const payments = await (prisma as any).paymentHistory.findMany({
      where: { userId: user.id },
      include: { receipt: true },
      orderBy: { date: "desc" },
      take: 20,
    });

    const resumes = await (prisma as any).resume.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        image: user.avatar || session.user.image || null,
      },
      profile: {
        id: ensuredProfile.id,
        username: ensuredProfile.username,
        headline: ensuredProfile.headline,
        bio: ensuredProfile.bio,
        socialLinks: ensuredProfile.socialLinks || {},
        openToWork: ensuredProfile.openToWork,
        publicProfileEnabled: ensuredProfile.publicProfileEnabled,
        publicSections: ensuredProfile.publicSections,
      },
      planInfo,
      sections: {
        skills: ensuredProfile.skills,
        experiences: ensuredProfile.experiences,
        educations: ensuredProfile.educations,
        certifications: ensuredProfile.certifications,
        projects: ensuredProfile.projects,
        courses: ensuredProfile.courses,
        languages: ensuredProfile.languages,
      },
      activity,
      resumes: resumes.map((resume: any) => {
        // Convert R2 key to CDN URL for lifetime access
        let fileUrl = resume.fileUrl;
        if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('/') && isR2Configured()) {
          fileUrl = getPublicUrl(fileUrl) || fileUrl;
        }
        return {
          id: resume.id,
          fileName: resume.fileName,
          fileUrl,
          uploadedAt: resume.uploadedAt,
        };
      }),
      payments: payments.map((payment: any) => ({
        id: payment.id,
        date: payment.date,
        plan: payment.plan,
        amount: payment.finalAmount,
        couponUsed: payment.couponUsed,
        invoiceId: payment.invoiceId,
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        receiptUrl: payment.receipt?.receiptUrl || (payment.orderId ? `/api/receipt-pdf?orderId=${encodeURIComponent(payment.orderId)}` : null),
      })),
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    const body = await request.json();
    const {
      username,
      headline,
      bio,
      openToWork,
      publicProfileEnabled,
      publicSections,
      socialLinks,
      name,
      image,
    } = body;

    let normalizedUsername = username?.toString().toLowerCase().trim();
    if (normalizedUsername) {
      normalizedUsername = normalizedUsername.replace(/[^a-z0-9_-]/g, "");
      const existing = await (prisma as any).userProfile.findFirst({
        where: {
          username: normalizedUsername,
          userId: { not: user.id },
        },
      });
      if (existing) {
        const suggestions = await suggestUsernames(normalizedUsername, user.id);
        return NextResponse.json({ error: "Username already taken", suggestions }, { status: 400 });
      }
    }

    const profile = await (prisma as any).userProfile.upsert({
      where: { userId: user.id },
      update: {
        username: normalizedUsername,
        headline,
        bio,
        socialLinks: socialLinks || undefined,
        openToWork: Boolean(openToWork),
        publicProfileEnabled: Boolean(publicProfileEnabled),
        publicSections: publicSections || undefined,
      },
      create: {
        userId: user.id,
        username: normalizedUsername || (await generateUsername(user.email)),
        headline: headline || "",
        bio: bio || "",
        socialLinks: socialLinks || {},
        openToWork: Boolean(openToWork),
        publicProfileEnabled: Boolean(publicProfileEnabled),
        publicSections: publicSections || {
          skills: true,
          experience: true,
          education: true,
          certifications: true,
          projects: true,
          courses: true,
          languages: true,
          analyticsReport: false,
        },
      },
    });

    if (name || image) {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          name: name ?? user.name,
          avatar: image ?? user.avatar,
        },
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        username: profile.username,
        headline: profile.headline,
        bio: profile.bio,
        socialLinks: profile.socialLinks || {},
        openToWork: profile.openToWork,
        publicProfileEnabled: profile.publicProfileEnabled,
        publicSections: profile.publicSections,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

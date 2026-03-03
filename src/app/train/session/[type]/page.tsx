import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { validateModuleAccess } from "@/lib/billing";
import { Suspense } from "react";
import { SessionPageClient } from "./SessionPageClient";

// Maps URL type param → billing module key
const SESSION_MODULE_MAP: Record<string, string> = {
  ENGLISH_LEARNING: "english",
  CONVERSATION_PRACTICE: "daily",
  HR_INTERVIEW: "hr",
  TECH_INTERVIEW: "technical",
  COMPANY_WISE_HR: "company",
  GD_COACH: "gdCoach",
  GD_DISCUSSION: "gd",
  GD_AI_AGENTS: "gd",
  GD_PRIVATE: "gd",
  GD_RANDOM: "gd",
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const moduleKey = SESSION_MODULE_MAP[type];
  if (moduleKey) {
    const user = await prisma.users.findUnique({
      where: { email: session!.user!.email! },
      select: { id: true },
    });
    if (!user) redirect("/login");

    const subFeature =
      type === "GD_AI_AGENTS"
        ? "gd_ai_agents"
        : type === "GD_PRIVATE"
        ? "gd_private"
        : type === "GD_RANDOM"
        ? "gd_random"
        : undefined;

    const access = await validateModuleAccess(user.id, moduleKey as any, subFeature);
    if (!access.allowed) redirect(`/pricing?locked=${moduleKey}`);
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SessionPageClient />
    </Suspense>
  );
}

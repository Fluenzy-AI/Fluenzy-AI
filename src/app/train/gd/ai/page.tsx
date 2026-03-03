import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { validateModuleAccess } from "@/lib/billing";
import GDAIPageClient from "./GDAIPageClient";

export default async function GDAIPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.users.findUnique({
    where: { email: session!.user!.email! },
    select: { id: true },
  });
  if (!user) redirect("/login");

  // GD AI Agents is the limited sub-feature of GD
  const access = await validateModuleAccess(user.id, "gd", "gd_ai_agents");
  if (!access.allowed) redirect("/pricing?locked=gd");

  return <GDAIPageClient />;
}

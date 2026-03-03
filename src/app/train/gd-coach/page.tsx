import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { validateModuleAccess } from "@/lib/billing";
import GDCoachClient from "./GDCoachClient";

export default async function GDCoachPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.users.findUnique({
    where: { email: session!.user!.email! },
    select: { id: true },
  });
  if (!user) redirect("/login");

  const access = await validateModuleAccess(user.id, "gdCoach");
  if (!access.allowed) redirect("/billing?locked=gdCoach");

  return <GDCoachClient />;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { validateModuleAccess } from "@/lib/billing";
import TechnicalPageClient from "./TechnicalPageClient";

export default async function TechnicalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.users.findUnique({
    where: { email: session!.user!.email! },
    select: { id: true },
  });
  if (!user) redirect("/login");

  const access = await validateModuleAccess(user.id, "technical");
  if (!access.allowed) redirect("/pricing?locked=technical");

  return <TechnicalPageClient />;
}
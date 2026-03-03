import { redirect } from "next/navigation";

// Moved to /train/gd-agent — redirect for backward compatibility
export default function GDAIPage() {
  redirect("/train/gd-agent");
}

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CollegeIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("college_token");
    if (token) {
      router.replace("/college/dashboard");
    } else {
      router.replace("/college/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );
}

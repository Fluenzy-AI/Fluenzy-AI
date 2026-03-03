import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications – College Portal",
  description: "Send in-app notifications to your registered students",
};

export default function CollegeNotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

"use client";

import CollegeProtectedLayout from "../components/CollegeProtectedLayout";
import CollegeNotifications from "@/components/CollegeNotifications";

export default function CollegeNotificationsPage() {
  return (
    <CollegeProtectedLayout>
      <CollegeNotifications />
    </CollegeProtectedLayout>
  );
}

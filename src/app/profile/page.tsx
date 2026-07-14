import { Suspense } from "react";
import ProfileClient from "./ProfileClient";
import ProfileSkeleton from "./ProfileSkeleton";

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileClient />
    </Suspense>
  );
}
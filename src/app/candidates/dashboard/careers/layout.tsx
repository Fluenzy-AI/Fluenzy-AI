import { ReactNode } from "react";

interface CandidateCareersLayoutProps {
  children: ReactNode;
}

// The careers section inherits authentication from /candidates/dashboard/layout.tsx
// since all /candidates/* routes go through that layout
export default function CandidateCareersLayout({ children }: CandidateCareersLayoutProps) {
  return <>{children}</>;
}
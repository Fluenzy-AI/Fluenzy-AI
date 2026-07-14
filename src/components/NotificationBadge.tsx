import React from "react";

interface NotificationBadgeProps {
  count: number;
}

export default function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) return null;
  return (
    <span 
      className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none pointer-events-none"
      aria-hidden="true"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

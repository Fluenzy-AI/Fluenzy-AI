'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function GDTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on route change
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div 
      className={`
        transition-all duration-500 ease-out transform
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {children}
    </div>
  );
}

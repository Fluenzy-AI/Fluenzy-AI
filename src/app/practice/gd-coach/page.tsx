'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GDCoachStubPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/train/gd-coach');
  }, [router]);
  return null;
}

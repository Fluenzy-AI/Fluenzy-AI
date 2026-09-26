'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EnglishCoachStubPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/train/english');
  }, [router]);
  return null;
}

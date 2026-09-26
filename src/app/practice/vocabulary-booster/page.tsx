'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VocabBoosterStubPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/train/vocabulary');
  }, [router]);
  return null;
}

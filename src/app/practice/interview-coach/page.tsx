'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InterviewCoachStubPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/train/hr');
  }, [router]);
  return null;
}

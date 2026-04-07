'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Super Admin - Create Competition Page
// Create global, university, or college competitions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { CreateCompetitionForm } from '@/components/competitions/CreateCompetitionForm';

interface University {
  id: string;
  name: string;
}

export default function SuperAdminCreateCompetitionPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/superadminlogin');
    }
  }, [status, router]);

  // Fetch universities for scope selection
  useEffect(() => {
    async function fetchUniversities() {
      try {
        // Fetch registered universities from API
        const res = await fetch('/api/competitions/universities', {
          credentials: 'include'
        });
        const data = await res.json();
        
        if (data.success && data.data) {
          setUniversities(data.data.map((u: { id: string; name: string }) => ({
            id: u.id,
            name: u.name
          })));
        } else {
          console.error('Failed to fetch universities:', data.error);
          setUniversities([]);
        }
      } catch (error) {
        console.error('Failed to fetch universities:', error);
        setUniversities([]);
      } finally {
        setLoadingUniversities(false);
      }
    }

    fetchUniversities();
  }, []);

  const handleSubmit = async (formData: unknown) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Competition created successfully!');
        router.push(`/superadmin/competitions/${data.data.id}`);
      } else {
        toast.error(data.error || 'Failed to create competition');
      }
    } catch (error) {
      toast.error('Failed to create competition');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUniversities) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/superadmin/competitions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Trophy className="h-7 w-7 text-violet-400" />
            Create Competition
          </h1>
          <p className="text-muted-foreground">
            Create a new global, university, or college competition
          </p>
        </div>
      </div>

      {/* Form */}
      <CreateCompetitionForm
        allowedScopes={['GLOBAL', 'UNIVERSITY', 'COLLEGE']}
        universities={universities}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/superadmin/competitions')}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

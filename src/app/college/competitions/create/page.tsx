'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// College Admin - Create Competition Page
// Multi-step form for creating college competitions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useCollegeAdmin } from '@/contexts/CollegeAdminContext';
import CollegeProtectedLayout from '../../components/CollegeProtectedLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { CreateCompetitionForm } from '@/components/competitions/CreateCompetitionForm';

export default function CollegeCreateCompetitionPage() {
  const { token, admin } = useCollegeAdmin();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: unknown) => {
    if (!token) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Competition created successfully!');
        router.push(`/college/competitions/${data.data.id}`);
      } else {
        toast.error(data.error || 'Failed to create competition');
      }
    } catch (error) {
      toast.error('Failed to create competition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CollegeProtectedLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/college/competitions">
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
              Create a new competition for your college students
            </p>
          </div>
        </div>

        {/* Form */}
        <CreateCompetitionForm
          allowedScopes={['COLLEGE']}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/college/competitions')}
          isSubmitting={isSubmitting}
        />
      </div>
    </CollegeProtectedLayout>
  );
}

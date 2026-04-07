'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Admin Portal - Create Competition Page
// Create global and university competitions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { usePortalAuth } from '@/contexts/PortalAuthContext';
import PortalLayout from '@/components/PortalLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { CreateCompetitionForm } from '@/components/competitions/CreateCompetitionForm';

// Admin nav items
const ADMIN_NAV = [
  { label: "Dashboard", href: "/portal/admin" },
  { label: "Competitions", href: "/portal/admin/competitions" },
  { label: "User Management", href: "/portal/admin/users" },
  { label: "Subscriptions", href: "/portal/admin/subscriptions" },
  { label: "Payment Logs", href: "/portal/admin/payments" },
  { label: "Support Tickets", href: "/portal/admin/tickets" },
  { label: "Broadcast Email", href: "/portal/admin/broadcast-email" },
  { label: "Feature Toggles", href: "/portal/admin/feature-toggles" },
  { label: "Email History", href: "/portal/admin/email-logs" },
  { label: "Audit Logs", href: "/portal/admin/audit-logs" },
  { label: "Analytics", href: "/portal/admin/analytics" },
];

interface University {
  id: string;
  name: string;
}

export default function AdminCreateCompetitionPage() {
  const { user } = usePortalAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

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
    console.log('Submitting competition form:', formData);
    try {
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      console.log('Competition API response:', data);
      
      if (data.success) {
        toast.success('Competition created successfully!');
        router.push(`/portal/admin/competitions/${data.data.id}`);
      } else {
        console.error('Competition creation failed:', data);
        toast.error(data.error || 'Failed to create competition');
      }
    } catch (error) {
      console.error('Competition creation error:', error);
      toast.error('Failed to create competition');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUniversities) {
    return (
      <PortalLayout navItems={ADMIN_NAV} title="Create Competition" roleLabel="Admin Portal" roleColor="text-amber-400">
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Create Competition" roleLabel="Admin Portal" roleColor="text-amber-400">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/portal/admin/competitions">
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
              Create a new global or university competition
            </p>
          </div>
        </div>

        {/* Form - Admin can create GLOBAL and UNIVERSITY scope */}
        <CreateCompetitionForm
          allowedScopes={['GLOBAL', 'UNIVERSITY']}
          universities={universities}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/portal/admin/competitions')}
          isSubmitting={isSubmitting}
        />
      </div>
    </PortalLayout>
  );
}

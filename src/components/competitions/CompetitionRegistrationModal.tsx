'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Competition Registration Modal
// Modal for confirming competition registration
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  Trophy,
  Users,
  Sparkles,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompetitionTimer } from './CompetitionTimer';

interface Competition {
  id: string;
  name: string;
  description?: string | null;
  type: 'GD_BATTLE' | 'HR_INTERVIEW_BATTLE' | 'CORPORATE_VOICE_BATTLE';
  startDate: string;
  endDate: string;
  registrationDeadline?: string | null;
  durationPerModule: number;
  maxAttempts: number;
  participantLimit?: number | null;
  participantCount?: number;
  prizePool?: string | null;
  modules?: Array<{ moduleType: string; weight: number }>;
}

interface CompetitionRegistrationModalProps {
  competition: Competition;
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => Promise<void>;
  isRegistering?: boolean;
  eligibility?: {
    eligible: boolean;
    reason?: string;
  };
}

const typeLabels = {
  GD_BATTLE: 'Group Discussion Battle',
  HR_INTERVIEW_BATTLE: 'HR Interview Battle',
  CORPORATE_VOICE_BATTLE: 'Corporate Voice Battle'
};

export function CompetitionRegistrationModal({
  competition,
  isOpen,
  onClose,
  onRegister,
  isRegistering = false,
  eligibility = { eligible: true }
}: CompetitionRegistrationModalProps) {
  const [agreedToRules, setAgreedToRules] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} minutes`;
  };

  const spotsRemaining = competition.participantLimit 
    ? competition.participantLimit - (competition.participantCount || 0)
    : null;

  const handleRegister = async () => {
    if (!agreedToRules || !eligibility.eligible) return;
    await onRegister();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Register for Competition
          </DialogTitle>
          <DialogDescription>
            You&apos;re about to register for this competition. Please review the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Competition Info */}
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="font-semibold text-lg">{competition.name}</h4>
              <Badge variant="secondary" className="mt-1">
                {typeLabels[competition.type]}
              </Badge>
            </div>

            {competition.description && (
              <p className="text-sm text-muted-foreground">
                {competition.description}
              </p>
            )}
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-400" />
              <div>
                <p className="text-muted-foreground text-xs">Starts</p>
                <p>{new Date(competition.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-400" />
              <div>
                <p className="text-muted-foreground text-xs">Duration per module</p>
                <p>{formatDuration(competition.durationPerModule)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-400" />
              <div>
                <p className="text-muted-foreground text-xs">Participants</p>
                <p>
                  {competition.participantCount || 0}
                  {competition.participantLimit && ` / ${competition.participantLimit}`}
                </p>
              </div>
            </div>

            {competition.prizePool && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-muted-foreground text-xs">Prize Pool</p>
                  <p className="text-yellow-400">{competition.prizePool}</p>
                </div>
              </div>
            )}
          </div>

          {/* Modules */}
          {competition.modules && competition.modules.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Competition Modules:</p>
              <div className="flex flex-wrap gap-2">
                {competition.modules.map((module, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {module.moduleType.replace(/_/g, ' ')} ({module.weight}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Registration Deadline Countdown */}
          {competition.registrationDeadline && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-400">Registration closes in:</span>
                <CompetitionTimer 
                  targetDate={competition.registrationDeadline} 
                  size="sm"
                  showIcon={false}
                />
              </div>
            </div>
          )}

          {/* Spots Warning */}
          {spotsRemaining !== null && spotsRemaining <= 10 && spotsRemaining > 0 && (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Only {spotsRemaining} spots remaining!</span>
            </div>
          )}

          {/* Not Eligible Warning */}
          {!eligibility.eligible && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2 text-red-400">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium">Not Eligible</p>
                  <p className="text-sm text-red-400/80">
                    {eligibility.reason || 'You are not eligible to register for this competition.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Agreement Checkbox */}
          {eligibility.eligible && (
            <div className="flex items-start gap-3 pt-2">
              <Checkbox 
                id="agree-rules"
                checked={agreedToRules}
                onCheckedChange={(checked) => setAgreedToRules(checked === true)}
              />
              <label 
                htmlFor="agree-rules" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                I understand that I will have <strong>{competition.maxAttempts}</strong> attempt(s) 
                to complete this competition. Once started, I must complete all modules within the 
                time limit. I agree to participate fairly and follow all competition guidelines.
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRegistering}>
            Cancel
          </Button>
          <Button 
            onClick={handleRegister}
            disabled={!agreedToRules || isRegistering || !eligibility.eligible}
            className="gap-2"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirm Registration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

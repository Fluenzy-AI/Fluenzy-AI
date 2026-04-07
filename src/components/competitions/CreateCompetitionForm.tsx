'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Create Competition Form Component
// Multi-step form for creating competitions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save,
  Loader2,
  Globe,
  Building2,
  GraduationCap,
  Trophy,
  Plus,
  X,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModuleWeightEditor } from './ModuleWeightEditor';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ModuleConfig {
  moduleType: string;
  weight: number;
  order: number;
  config?: Record<string, unknown>;
}

interface RewardConfig {
  rankFrom: number;
  rankTo: number;
  rewardType: string;
  rewardTitle: string;
  rewardValue?: string;
}

interface CompetitionFormData {
  name: string;
  description: string;
  scope: 'GLOBAL' | 'UNIVERSITY' | 'COLLEGE';
  type: 'GD_BATTLE' | 'HR_INTERVIEW_BATTLE' | 'CORPORATE_VOICE_BATTLE';
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  durationPerModule: number;
  maxAttempts: number;
  participantLimit?: number;
  prizePool: string;
  bannerUrl: string;
  universityIds: string[];
  modules: ModuleConfig[];
  rewards: RewardConfig[];
  // GD Battle specific
  minGDParticipants?: number;
  maxGDParticipants?: number;
}

interface CreateCompetitionFormProps {
  allowedScopes: Array<'GLOBAL' | 'UNIVERSITY' | 'COLLEGE'>;
  universities?: Array<{ id: string; name: string }>;
  onSubmit: (data: CompetitionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<CompetitionFormData>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const competitionTypes = [
  { value: 'GD_BATTLE', label: 'Group Discussion Battle', description: 'Real-time GD with AI evaluation' },
  { value: 'HR_INTERVIEW_BATTLE', label: 'HR Interview Battle', description: 'AI-powered HR interview assessment' },
  { value: 'CORPORATE_VOICE_BATTLE', label: 'Corporate Voice Battle', description: 'Voice and communication assessment' }
];

// Standard speaking modules (for HR Interview and Corporate Voice battles)
const speakingModuleTypes = [
  { value: 'READ_ALOUD', label: 'Read Aloud' },
  { value: 'LISTEN_AND_REPEAT', label: 'Listen & Repeat' },
  { value: 'COMPREHENSION', label: 'Comprehension' },
  { value: 'CONVERSATION', label: 'Conversation' },
  { value: 'EXTEMPORANEOUS', label: 'Extemporaneous' },
  { value: 'LISTEN_AND_SUMMARIZE', label: 'Listen & Summarize' }
];

// GD-specific evaluation modules (for GD Battle)
const gdModuleTypes = [
  { value: 'COMMUNICATION', label: 'Communication Skills', description: 'Clarity, articulation, and expression' },
  { value: 'LEADERSHIP', label: 'Leadership', description: 'Ability to guide and influence discussion' },
  { value: 'CONFIDENCE', label: 'Confidence', description: 'Self-assurance and composure' },
  { value: 'RELEVANCE', label: 'Topic Relevance', description: 'Staying on topic and adding value' },
  { value: 'TEAMWORK', label: 'Team Work', description: 'Collaboration and listening skills' },
  { value: 'GRAMMAR', label: 'Grammar & Vocabulary', description: 'Language accuracy and richness' },
  { value: 'INITIATIVE', label: 'Initiative', description: 'Starting topics and driving conversation' },
  { value: 'BODY_LANGUAGE', label: 'Body Language', description: 'Non-verbal communication' }
];

// Default modules for each competition type
const defaultModulesByType = {
  GD_BATTLE: [
    { moduleType: 'COMMUNICATION', weight: 20, order: 1 },
    { moduleType: 'LEADERSHIP', weight: 15, order: 2 },
    { moduleType: 'CONFIDENCE', weight: 15, order: 3 },
    { moduleType: 'RELEVANCE', weight: 20, order: 4 },
    { moduleType: 'TEAMWORK', weight: 15, order: 5 },
    { moduleType: 'GRAMMAR', weight: 15, order: 6 }
  ],
  HR_INTERVIEW_BATTLE: [
    { moduleType: 'READ_ALOUD', weight: 20, order: 1 },
    { moduleType: 'CONVERSATION', weight: 40, order: 2 },
    { moduleType: 'EXTEMPORANEOUS', weight: 25, order: 3 },
    { moduleType: 'COMPREHENSION', weight: 15, order: 4 }
  ],
  CORPORATE_VOICE_BATTLE: [
    { moduleType: 'READ_ALOUD', weight: 25, order: 1 },
    { moduleType: 'CONVERSATION', weight: 50, order: 2 },
    { moduleType: 'EXTEMPORANEOUS', weight: 25, order: 3 }
  ]
};

// Legacy support - keep moduleTypes as speakingModuleTypes
const moduleTypes = speakingModuleTypes;

const rewardTypes = [
  { value: 'GOLD_CERTIFICATE', label: 'Gold Certificate' },
  { value: 'SILVER_CERTIFICATE', label: 'Silver Certificate' },
  { value: 'BRONZE_CERTIFICATE', label: 'Bronze Certificate' },
  { value: 'SCHOLARSHIP', label: 'Scholarship' },
  { value: 'BADGE', label: 'Badge' },
  { value: 'CASH_PRIZE', label: 'Cash Prize' }
];

const scopeIcons = {
  GLOBAL: Globe,
  UNIVERSITY: GraduationCap,
  COLLEGE: Building2
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function CreateCompetitionForm({
  allowedScopes,
  universities = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData
}: CreateCompetitionFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Get default modules based on competition type
  const getDefaultModules = (type: string) => {
    return defaultModulesByType[type as keyof typeof defaultModulesByType] || defaultModulesByType.GD_BATTLE;
  };
  
  const [formData, setFormData] = useState<CompetitionFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    scope: initialData?.scope || allowedScopes[0],
    type: initialData?.type || 'GD_BATTLE',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    registrationDeadline: initialData?.registrationDeadline || '',
    durationPerModule: initialData?.durationPerModule || 300,
    maxAttempts: initialData?.maxAttempts || 1,
    participantLimit: initialData?.participantLimit,
    prizePool: initialData?.prizePool || '',
    bannerUrl: initialData?.bannerUrl || '',
    universityIds: initialData?.universityIds || [],
    modules: initialData?.modules || getDefaultModules(initialData?.type || 'GD_BATTLE'),
    rewards: initialData?.rewards || [
      { rankFrom: 1, rankTo: 1, rewardType: 'GOLD_CERTIFICATE', rewardTitle: 'Gold Winner' },
      { rankFrom: 2, rankTo: 2, rewardType: 'SILVER_CERTIFICATE', rewardTitle: 'Silver Winner' },
      { rankFrom: 3, rankTo: 3, rewardType: 'BRONZE_CERTIFICATE', rewardTitle: 'Bronze Winner' }
    ],
    // GD Battle defaults: 3-8 participants
    minGDParticipants: initialData?.minGDParticipants || 3,
    maxGDParticipants: initialData?.maxGDParticipants || 8
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get available modules based on competition type
  const getAvailableModules = () => {
    if (formData.type === 'GD_BATTLE') {
      return gdModuleTypes;
    }
    return speakingModuleTypes;
  };

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Name, type, and scope' },
    { number: 2, title: 'Schedule', description: 'Dates and limits' },
    { number: 3, title: 'Modules', description: 'Assessment modules' },
    { number: 4, title: 'Rewards', description: 'Prizes and certificates' },
    { number: 5, title: 'Review', description: 'Confirm and create' }
  ];

  const updateFormData = <K extends keyof CompetitionFormData>(
    field: K,
    value: CompetitionFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };
  
  // Handle type change - update modules accordingly
  const handleTypeChange = (newType: string) => {
    const newModules = getDefaultModules(newType);
    setFormData(prev => ({
      ...prev,
      type: newType as CompetitionFormData['type'],
      modules: newModules
    }));
    setErrors(prev => ({ ...prev, type: '' }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Competition name is required';
      if (formData.name.length < 5) newErrors.name = 'Name must be at least 5 characters';
      if (!formData.type) newErrors.type = 'Competition type is required';
      
      // GD Battle validation
      if (formData.type === 'GD_BATTLE') {
        const min = formData.minGDParticipants || 3;
        const max = formData.maxGDParticipants || 8;
        if (min < 2 || min > 5) newErrors.minGDParticipants = 'Min participants must be 2-5';
        if (max < 3 || max > 8) newErrors.maxGDParticipants = 'Max participants must be 3-8';
        if (min > max) newErrors.minGDParticipants = 'Min cannot exceed max participants';
      }
    }

    if (step === 2) {
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.endDate) newErrors.endDate = 'End date is required';
      if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
      if (formData.durationPerModule < 60) newErrors.durationPerModule = 'Duration must be at least 60 seconds';
    }

    if (step === 3) {
      const totalWeight = formData.modules.reduce((sum, m) => sum + m.weight, 0);
      if (totalWeight !== 100) newErrors.modules = `Module weights must sum to 100 (currently ${totalWeight})`;
      if (formData.modules.length === 0) newErrors.modules = 'At least one module is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    await onSubmit(formData);
  };

  const addReward = () => {
    const maxRank = Math.max(...formData.rewards.map(r => r.rankTo), 0);
    updateFormData('rewards', [
      ...formData.rewards,
      { 
        rankFrom: maxRank + 1, 
        rankTo: maxRank + 1, 
        rewardType: 'BADGE', 
        rewardTitle: `Rank ${maxRank + 1}` 
      }
    ]);
  };

  const removeReward = (index: number) => {
    updateFormData('rewards', formData.rewards.filter((_, i) => i !== index));
  };

  const updateReward = (index: number, field: keyof RewardConfig, value: string | number) => {
    const newRewards = [...formData.rewards];
    newRewards[index] = { ...newRewards[index], [field]: value };
    updateFormData('rewards', newRewards);
  };

  // ─── Render Steps ────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Competition Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Competition Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="e.g., National GD Championship 2024"
          className={cn(errors.name && 'border-red-500')}
        />
        {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe the competition, rules, and eligibility..."
          rows={3}
        />
      </div>

      {/* Competition Type */}
      <div className="space-y-2">
        <Label>Competition Type *</Label>
        <div className="grid gap-3">
          {competitionTypes.map((type) => (
            <div
              key={type.value}
              onClick={() => handleTypeChange(type.value)}
              className={cn(
                'p-4 rounded-lg border-2 cursor-pointer transition-all',
                formData.type === type.value
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{type.label}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                {formData.type === type.value && (
                  <CheckCircle className="h-5 w-5 text-violet-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GD Battle Settings - Show only when GD_BATTLE is selected */}
      {formData.type === 'GD_BATTLE' && (
        <div className="space-y-4 p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-violet-400" />
            <Label className="text-violet-300 font-medium">GD Room Settings</Label>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Configure how many participants can join each GD room (like /train/live-gd)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minGDParticipants">Min Participants per GD *</Label>
              <Select
                value={(formData.minGDParticipants || 3).toString()}
                onValueChange={(v) => {
                  const newMin = parseInt(v);
                  updateFormData('minGDParticipants', newMin);
                  // Ensure max is always >= min
                  if ((formData.maxGDParticipants || 8) < newMin) {
                    updateFormData('maxGDParticipants', newMin);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 participants</SelectItem>
                  <SelectItem value="3">3 participants</SelectItem>
                  <SelectItem value="4">4 participants</SelectItem>
                  <SelectItem value="5">5 participants</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">GD won't start until this many join</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxGDParticipants">Max Participants per GD *</Label>
              <Select
                value={(formData.maxGDParticipants || 8).toString()}
                onValueChange={(v) => {
                  const newMax = parseInt(v);
                  updateFormData('maxGDParticipants', newMax);
                  // Ensure min is always <= max
                  if ((formData.minGDParticipants || 3) > newMax) {
                    updateFormData('minGDParticipants', newMax);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 participants</SelectItem>
                  <SelectItem value="4">4 participants</SelectItem>
                  <SelectItem value="5">5 participants</SelectItem>
                  <SelectItem value="6">6 participants</SelectItem>
                  <SelectItem value="7">7 participants</SelectItem>
                  <SelectItem value="8">8 participants</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Room will be full at this count</p>
            </div>
          </div>
          <div className="mt-2 p-3 bg-slate-800 rounded-lg text-sm text-slate-300">
            <span className="text-violet-400">ℹ️</span> Each GD room will have{' '}
            <span className="font-semibold text-white">{formData.minGDParticipants || 3}</span> to{' '}
            <span className="font-semibold text-white">{formData.maxGDParticipants || 8}</span>{' '}
            participants discussing topics with real-time AI evaluation via Agora.
          </div>
        </div>
      )}

      {/* Scope */}
      <div className="space-y-2">
        <Label>Competition Scope *</Label>
        <div className="grid grid-cols-3 gap-3">
          {allowedScopes.map((scope) => {
            const Icon = scopeIcons[scope];
            return (
              <div
                key={scope}
                onClick={() => updateFormData('scope', scope)}
                className={cn(
                  'p-4 rounded-lg border-2 cursor-pointer transition-all text-center',
                  formData.scope === scope
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                )}
              >
                <Icon className={cn(
                  'h-6 w-6 mx-auto mb-2',
                  formData.scope === scope ? 'text-violet-400' : 'text-muted-foreground'
                )} />
                <p className="text-sm font-medium">{scope}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* University Selection (if UNIVERSITY scope) */}
      {formData.scope === 'UNIVERSITY' && universities.length > 0 && (
        <div className="space-y-2">
          <Label>Select Universities</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Only registered college partners are shown
          </p>
          <div className="flex flex-wrap gap-2">
            {universities.map((uni) => (
              <Badge
                key={uni.id}
                variant={formData.universityIds.includes(uni.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  const ids = formData.universityIds.includes(uni.id)
                    ? formData.universityIds.filter(id => id !== uni.id)
                    : [...formData.universityIds, uni.id];
                  updateFormData('universityIds', ids);
                }}
              >
                {uni.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* No universities available message */}
      {formData.scope === 'UNIVERSITY' && universities.length === 0 && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-yellow-400 text-sm">
            No registered universities found. Only approved college partners can be selected for university-scoped competitions.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Start Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date & Time *</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => updateFormData('startDate', e.target.value)}
            className={cn(errors.startDate && 'border-red-500')}
          />
          {errors.startDate && <p className="text-sm text-red-400">{errors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date & Time *</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => updateFormData('endDate', e.target.value)}
            className={cn(errors.endDate && 'border-red-500')}
          />
          {errors.endDate && <p className="text-sm text-red-400">{errors.endDate}</p>}
        </div>
      </div>

      {/* Registration Deadline */}
      <div className="space-y-2">
        <Label htmlFor="registrationDeadline">Registration Deadline</Label>
        <Input
          id="registrationDeadline"
          type="datetime-local"
          value={formData.registrationDeadline}
          onChange={(e) => updateFormData('registrationDeadline', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Leave empty to allow registration until start</p>
      </div>

      {/* Duration & Attempts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="durationPerModule">Duration per Module (seconds) *</Label>
          <Input
            id="durationPerModule"
            type="number"
            min={60}
            max={3600}
            value={formData.durationPerModule}
            onChange={(e) => updateFormData('durationPerModule', parseInt(e.target.value) || 300)}
            className={cn(errors.durationPerModule && 'border-red-500')}
          />
          <p className="text-xs text-muted-foreground">
            {Math.floor(formData.durationPerModule / 60)} minutes
          </p>
          {errors.durationPerModule && <p className="text-sm text-red-400">{errors.durationPerModule}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Max Attempts</Label>
          <Select
            value={formData.maxAttempts.toString()}
            onValueChange={(v) => updateFormData('maxAttempts', parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 attempt</SelectItem>
              <SelectItem value="2">2 attempts</SelectItem>
              <SelectItem value="3">3 attempts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Participant Limit & Prize Pool */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="participantLimit">Participant Limit (optional)</Label>
          <Input
            id="participantLimit"
            type="number"
            min={1}
            value={formData.participantLimit || ''}
            onChange={(e) => updateFormData('participantLimit', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Unlimited"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prizePool">Prize Pool</Label>
          <Input
            id="prizePool"
            value={formData.prizePool}
            onChange={(e) => updateFormData('prizePool', e.target.value)}
            placeholder="e.g., ₹50,000 in prizes"
          />
        </div>
      </div>

      {/* Banner URL */}
      <div className="space-y-2">
        <Label htmlFor="bannerUrl">Banner Image URL</Label>
        <Input
          id="bannerUrl"
          value={formData.bannerUrl}
          onChange={(e) => updateFormData('bannerUrl', e.target.value)}
          placeholder="https://..."
        />
        {formData.bannerUrl && (
          <div className="h-32 rounded-lg overflow-hidden">
            <img 
              src={formData.bannerUrl} 
              alt="Banner preview" 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = ''; }}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">
          Configure the assessment modules for this competition. The total weight must equal 100%.
        </p>
        {formData.type === 'GD_BATTLE' && (
          <p className="text-sm text-violet-400 mb-4">
            💡 GD Battle uses communication-based evaluation criteria for live group discussions.
          </p>
        )}
        {errors.modules && (
          <p className="text-sm text-red-400 mb-4">{errors.modules}</p>
        )}
      </div>

      <ModuleWeightEditor
        modules={formData.modules}
        availableModules={getAvailableModules()}
        onChange={(modules) => updateFormData('modules', modules)}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Rewards & Certificates</p>
          <p className="text-sm text-muted-foreground">
            Define rewards for top performers
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addReward}>
          <Plus className="h-4 w-4 mr-1" />
          Add Reward
        </Button>
      </div>

      <div className="space-y-4">
        {formData.rewards.map((reward, index) => (
          <Card key={index} className="bg-slate-800/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Rank Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={reward.rankFrom}
                        onChange={(e) => updateReward(index, 'rankFrom', parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="number"
                        min={reward.rankFrom}
                        value={reward.rankTo}
                        onChange={(e) => updateReward(index, 'rankTo', parseInt(e.target.value) || reward.rankFrom)}
                        className="w-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reward Type</Label>
                    <Select
                      value={reward.rewardType}
                      onValueChange={(v) => updateReward(index, 'rewardType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rewardTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={reward.rewardTitle}
                      onChange={(e) => updateReward(index, 'rewardTitle', e.target.value)}
                      placeholder="e.g., Gold Winner"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Value (optional)</Label>
                    <Input
                      value={reward.rewardValue || ''}
                      onChange={(e) => updateReward(index, 'rewardValue', e.target.value)}
                      placeholder="e.g., ₹10,000"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeReward(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle>{formData.name}</CardTitle>
          <CardDescription>Review your competition details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p>{competitionTypes.find(t => t.value === formData.type)?.label}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Scope</p>
              <p>{formData.scope}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Start</p>
              <p>{formData.startDate ? new Date(formData.startDate).toLocaleString() : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">End</p>
              <p>{formData.endDate ? new Date(formData.endDate).toLocaleString() : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration per Module</p>
              <p>{Math.floor(formData.durationPerModule / 60)} minutes</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Attempts</p>
              <p>{formData.maxAttempts}</p>
            </div>
            {/* GD Battle specific settings in review */}
            {formData.type === 'GD_BATTLE' && (
              <div className="col-span-2 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <p className="text-muted-foreground mb-1">GD Room Size</p>
                <p className="text-violet-400 font-medium">
                  {formData.minGDParticipants || 3} - {formData.maxGDParticipants || 8} participants per room
                </p>
              </div>
            )}
            {formData.participantLimit && (
              <div>
                <p className="text-muted-foreground">Participant Limit</p>
                <p>{formData.participantLimit}</p>
              </div>
            )}
            {formData.prizePool && (
              <div>
                <p className="text-muted-foreground">Prize Pool</p>
                <p className="text-yellow-400">{formData.prizePool}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-muted-foreground mb-2">Modules</p>
            <div className="flex flex-wrap gap-2">
              {formData.modules.map((m, i) => (
                <Badge key={i} variant="secondary">
                  {moduleTypes.find(t => t.value === m.moduleType)?.label} ({m.weight}%)
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-2">Rewards</p>
            <div className="space-y-1 text-sm">
              {formData.rewards.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span>
                    Rank {r.rankFrom}{r.rankTo > r.rankFrom ? `-${r.rankTo}` : ''}: {r.rewardTitle}
                    {r.rewardValue && ` (${r.rewardValue})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div 
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                currentStep >= step.number ? 'text-violet-400' : 'text-muted-foreground'
              )}
              onClick={() => step.number < currentStep && setCurrentStep(step.number)}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                currentStep > step.number && 'bg-violet-500 text-white',
                currentStep === step.number && 'bg-violet-500/20 border-2 border-violet-500 text-violet-400',
                currentStep < step.number && 'bg-slate-700 text-slate-400'
              )}>
                {currentStep > step.number ? <CheckCircle className="h-4 w-4" /> : step.number}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-4',
                currentStep > step.number ? 'bg-violet-500' : 'bg-slate-700'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={currentStep === 1 ? onCancel : prevStep}>
          {currentStep === 1 ? 'Cancel' : (
            <>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </>
          )}
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={nextStep}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Competition
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

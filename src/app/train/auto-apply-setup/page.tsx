'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  MapPin,
  DollarSign,
  Briefcase,
  Building,
  Target,
  Clock,
  ArrowLeft,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme, themeConfig } from '@/contexts/ThemeContext';

interface AutoApplyPreferences {
  autoApplyEnabled: boolean;
  targetRoles: string[];
  preferredLocations: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  experienceLevel: string;
  preferredCompanies: string[];
  avoidCompanies: string[];
  jobTypes: string[];
  autoApplyCount: number;
  monthlyLimit: number;
}

interface PlanInfo {
  plan: string;
  planName: string;
  isUnlimited: boolean;
}

export default function AutoApplySetupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;

  const [preferences, setPreferences] = useState<AutoApplyPreferences>({
    autoApplyEnabled: false,
    targetRoles: [],
    preferredLocations: [],
    salaryRange: { min: 0, max: 0 },
    experienceLevel: '',
    preferredCompanies: [],
    avoidCompanies: [],
    jobTypes: [],
    autoApplyCount: 0,
    monthlyLimit: 0,
  });

  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAvoidCompany, setNewAvoidCompany] = useState('');

  // Fetch existing preferences and plan info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [prefsRes, planRes] = await Promise.all([
          fetch('/api/candidates/preferences'),
          fetch('/api/user-plan'),
        ]);

        if (prefsRes.ok) {
          const data = await prefsRes.json();
          if (data.preferences) {
            setPreferences({
              autoApplyEnabled: data.preferences.autoApplyEnabled || false,
              targetRoles: data.preferences.targetRoles || [],
              preferredLocations: data.preferences.preferredLocations || [],
              salaryRange: data.preferences.salaryRange || { min: 0, max: 0 },
              experienceLevel: data.preferences.experienceLevel || '',
              preferredCompanies: data.preferences.preferredCompanies || [],
              avoidCompanies: data.preferences.avoidCompanies || [],
              jobTypes: data.preferences.jobTypes || ['Full-time'],
              autoApplyCount: data.preferences.autoApplyCount || 0,
              monthlyLimit: data.preferences.monthlyLimit || 0,
            });
          }
        }

        if (planRes.ok) {
          const data = await planRes.json();
          setPlanInfo(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/candidates/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('auto-apply-updated'));
        router.back();
      } else {
        console.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (type: 'roles' | 'locations' | 'companies' | 'avoidCompanies', value: string) => {
    if (!value.trim()) return;

    const key = type === 'roles' ? 'targetRoles' :
                type === 'locations' ? 'preferredLocations' :
                type === 'companies' ? 'preferredCompanies' : 'avoidCompanies';

    setPreferences(prev => ({
      ...prev,
      [key]: [...prev[key as keyof AutoApplyPreferences] as string[], value.trim()]
    }));

    // Clear the input
    if (type === 'roles') setNewRole('');
    else if (type === 'locations') setNewLocation('');
    else if (type === 'companies') setNewCompany('');
    else if (type === 'avoidCompanies') setNewAvoidCompany('');
  };

  const removeItem = (type: 'targetRoles' | 'preferredLocations' | 'preferredCompanies' | 'avoidCompanies', index: number) => {
    setPreferences(prev => ({
      ...prev,
      [type]: (prev[type] as string[]).filter((_, i) => i !== index)
    }));
  };

  const getUsageDisplay = () => {
    if (!planInfo) return null;

    if (planInfo.plan === 'Free') {
      return (
        <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <AlertCircle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-sm text-orange-400 font-medium">Auto-Apply not available on Free plan</p>
          <p className="text-xs text-orange-400/70 mt-1">Upgrade to Standard or Pro to enable auto-apply</p>
        </div>
      );
    }

    const usagePercentage = preferences.monthlyLimit > 0 ?
      (preferences.autoApplyCount / preferences.monthlyLimit) * 100 : 0;
    
    const remaining = preferences.monthlyLimit - preferences.autoApplyCount;
    const isLowUsage = remaining <= 10 && remaining > 0;
    const isExhausted = remaining <= 0;

    return (
      <div className="space-y-4">
        {/* Large counter display like training modules */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className={`w-5 h-5 ${
              isExhausted ? 'text-red-400' : 
              isLowUsage ? 'text-orange-400' : 
              'text-cyan-400'
            }`} />
            <span className={`text-3xl font-bold ${
              isExhausted ? 'text-red-400' : 
              isLowUsage ? 'text-orange-400' : 
              'text-cyan-400'
            }`}>
              {remaining}
            </span>
            <span className="text-gray-400 text-xl">/ {preferences.monthlyLimit}</span>
          </div>
          <p className="text-sm text-gray-400">
            {remaining === 0 ? 'No applications remaining' :
             remaining === 1 ? '1 application remaining' :
             `${remaining} applications remaining`}
          </p>
        </div>

        <Separator className="bg-gray-700" />

        {/* Usage breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Used this month</span>
            <span className={`font-semibold ${
              usagePercentage > 80 ? 'text-orange-400' : 'text-green-400'
            }`}>
              {preferences.autoApplyCount}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePercentage > 80 ? 'bg-orange-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            {planInfo.plan === 'Standard' ? 'Standard Plan: 300/month' :
             planInfo.plan === 'Pro' ? 'Pro Plan: 30 high-quality/month' :
             'Unlimited applications'}
          </p>
        </div>

        {/* Warning or info messages */}
        {isExhausted && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400 text-center">
              Monthly limit reached. Resets on 1st of next month.
            </p>
          </div>
        )}
        {isLowUsage && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-xs text-orange-400 text-center">
              Only {remaining} application{remaining > 1 ? 's' : ''} left this month!
            </p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className={currentTheme.textMuted}>Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className={`text-3xl font-bold ${currentTheme.text}`}>
                Auto-Apply Setup
              </h1>
              <p className={`${currentTheme.textMuted} mt-1`}>
                Configure your job application preferences and let AI apply for you
              </p>
            </div>
            {/* Usage indicator like training modules */}
            {planInfo && planInfo.plan !== 'Free' && (
              <div className="hidden md:flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
                <Zap className={`w-5 h-5 ${
                  preferences.monthlyLimit - preferences.autoApplyCount <= 0 ? 'text-red-400' :
                  preferences.monthlyLimit - preferences.autoApplyCount <= 10 ? 'text-orange-400' :
                  'text-cyan-400'
                }`} />
                <div>
                  <p className="text-xs text-gray-400">Applications Remaining</p>
                  <p className={`text-lg font-bold ${
                    preferences.monthlyLimit - preferences.autoApplyCount <= 0 ? 'text-red-400' :
                    preferences.monthlyLimit - preferences.autoApplyCount <= 10 ? 'text-orange-400' :
                    'text-cyan-400'
                  }`}>
                    {preferences.monthlyLimit - preferences.autoApplyCount} / {preferences.monthlyLimit}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auto-Apply Toggle */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  Enable Auto-Apply
                </CardTitle>
                <CardDescription>
                  Automatically apply to jobs that match your preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-Apply Status</p>
                      <p className="text-sm text-gray-500">
                        {preferences.autoApplyEnabled ? 'Applications will be submitted automatically' : 'Manual applications only'}
                      </p>
                    </div>
                    <Switch
                      checked={preferences.autoApplyEnabled}
                      onCheckedChange={(enabled) =>
                        setPreferences(prev => ({ ...prev, autoApplyEnabled: enabled }))
                      }
                      disabled={planInfo?.plan === 'Free'}
                    />
                  </div>
                  
                  {/* Mini usage counter in toggle card */}
                  {planInfo?.plan !== 'Free' && preferences.monthlyLimit > 0 && (
                    <div className="pt-3 border-t border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          This Month
                        </span>
                        <span className={`font-semibold ${
                          preferences.monthlyLimit - preferences.autoApplyCount <= 0 ? 'text-red-400' :
                          preferences.monthlyLimit - preferences.autoApplyCount <= 10 ? 'text-orange-400' :
                          'text-cyan-400'
                        }`}>
                          {preferences.monthlyLimit - preferences.autoApplyCount} remaining
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            (preferences.autoApplyCount / preferences.monthlyLimit) * 100 > 80 ? 'bg-orange-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min((preferences.autoApplyCount / preferences.monthlyLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Target Roles */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Target Roles
                </CardTitle>
                <CardDescription>
                  Specify the job roles you want to apply for automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., AI Engineer, Full Stack Developer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('roles', newRole)}
                  />
                  <Button
                    size="sm"
                    onClick={() => addItem('roles', newRole)}
                    disabled={!newRole.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.targetRoles.map((role, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {role}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeItem('targetRoles', index)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preferred Locations */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  Preferred Locations
                </CardTitle>
                <CardDescription>
                  Choose locations where you want to work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Bangalore, Mumbai, Remote"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('locations', newLocation)}
                  />
                  <Button
                    size="sm"
                    onClick={() => addItem('locations', newLocation)}
                    disabled={!newLocation.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.preferredLocations.map((location, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {location}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeItem('preferredLocations', index)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Salary Range */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  Salary Range (Annual)
                </CardTitle>
                <CardDescription>
                  Set your expected salary range in INR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Salary</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 500000"
                      value={preferences.salaryRange.min || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        salaryRange: { ...prev.salaryRange, min: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Maximum Salary</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1500000"
                      value={preferences.salaryRange.max || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        salaryRange: { ...prev.salaryRange, max: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Preferences */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-400" />
                  Company Preferences
                </CardTitle>
                <CardDescription>
                  Specify companies you prefer or want to avoid
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preferred Companies */}
                <div>
                  <Label className="text-green-400">Preferred Companies</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="e.g., Google, Microsoft, Amazon"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addItem('companies', newCompany)}
                    />
                    <Button
                      size="sm"
                      onClick={() => addItem('companies', newCompany)}
                      disabled={!newCompany.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preferences.preferredCompanies.map((company, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1 border-green-400/20 text-green-400">
                        {company}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeItem('preferredCompanies', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Companies to Avoid */}
                <div>
                  <Label className="text-red-400">Companies to Avoid</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="e.g., Company Name"
                      value={newAvoidCompany}
                      onChange={(e) => setNewAvoidCompany(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addItem('avoidCompanies', newAvoidCompany)}
                    />
                    <Button
                      size="sm"
                      onClick={() => addItem('avoidCompanies', newAvoidCompany)}
                      disabled={!newAvoidCompany.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preferences.avoidCompanies.map((company, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1 border-red-400/20 text-red-400">
                        {company}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeItem('avoidCompanies', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Stats */}
            <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} ${
              preferences.autoApplyEnabled ? 'ring-2 ring-cyan-500/20' : ''
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Monthly Usage Tracker
                </CardTitle>
                {preferences.autoApplyEnabled && (
                  <Badge variant="outline" className="w-fit mt-2 bg-green-500/10 text-green-400 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Auto-Apply Active
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {getUsageDisplay()}
              </CardContent>
            </Card>

            {/* Plan Info */}
            {planInfo && (
              <Card className={`${currentTheme.cardBg} border ${currentTheme.cardBorder}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-400" />
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <Badge variant="outline" className="mb-3">
                      {planInfo.planName}
                    </Badge>
                    {planInfo.plan === 'Free' && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                          Upgrade to enable auto-apply functionality
                        </p>
                        <Button
                          onClick={() => router.push('/pricing')}
                          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        >
                          Upgrade Now
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Preferences
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
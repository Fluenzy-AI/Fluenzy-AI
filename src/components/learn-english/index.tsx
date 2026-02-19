"use client";

import React from 'react';
import { UserProfile } from '../../../Learn_English/types';
import EnglishDashboard from '../../../Learn_English/components/EnglishDashboard';
import VoiceAgent from '../../../Learn_English/components/VoiceAgent';
import HRDashboard from '../../../Learn_English/components/HRDashboard';
import GDAgent from '../../../Learn_English/components/GDAgent';
import CompanyHRDashboard from '../../../Learn_English/components/CompanyHRDashboard';
import LearningPath from '../../../Learn_English/components/LearningPath';

interface LearnEnglishAppProps {
  mode: string;
  user: UserProfile;
  onSessionEnd?: (user: UserProfile) => void;
}

const LearnEnglishApp: React.FC<LearnEnglishAppProps> = ({ mode, user, onSessionEnd }) => {
  switch (mode) {
    case 'english':
      return <EnglishDashboard user={user} />;
    case 'daily':
      return <VoiceAgent user={user} onSessionEnd={onSessionEnd || (() => {})} />;
    case 'hr':
      return <HRDashboard user={user} />;
    case 'gd':
      return <GDAgent user={user} onSessionEnd={onSessionEnd || (() => {})} />;
    case 'technical':
      // Assuming technical uses GDAgent or similar, but for now use GDAgent
      return <GDAgent user={user} onSessionEnd={onSessionEnd || (() => {})} />;
    case 'company':
      return <CompanyHRDashboard />;
    default:
      return <LearningPath />;
  }
};

export default LearnEnglishApp;
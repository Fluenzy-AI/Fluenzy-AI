
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  PlayCircle,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Trophy,
  Lock
} from 'lucide-react';
import { UserProfile, Lesson, ModuleType } from '../types';

const LessonCard: React.FC<{ lesson: Lesson, onStart: () => void, onUpgrade?: () => void, isLocked?: boolean }> = ({ lesson, onStart, onUpgrade, isLocked = false }) => (
  <div
    onClick={isLocked ? onUpgrade : onStart}
    className={`group relative p-6 rounded-3xl border transition-all duration-300 backdrop-blur-xl ${
      isLocked ? 'bg-slate-800/60 border-slate-700/50 opacity-60 cursor-pointer hover:bg-slate-800/80' :
      lesson.isCompleted
        ? 'bg-gradient-to-br from-emerald-900/20 to-slate-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/10 cursor-pointer hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1'
        : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-blue-500/30 shadow-xl shadow-blue-500/10 cursor-pointer hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${isLocked ? '' : 'group-hover:scale-110'} ${
        isLocked ? 'bg-slate-600 text-slate-300' :
        lesson.isCompleted
          ? 'bg-emerald-500 text-white shadow-lg'
          : 'bg-blue-600 text-white shadow-lg'
      }`}>
        {isLocked ? <Lock size={24} /> : lesson.isCompleted ? <CheckCircle2 size={24} /> : <PlayCircle size={24} />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold truncate ${isLocked ? 'text-slate-400' : 'text-white'}`}>
          {lesson.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
            isLocked ? 'text-red-300 bg-red-500/20' :
            lesson.isCompleted ? 'text-emerald-300 bg-emerald-500/20' : 'text-blue-300 bg-blue-500/20'
          }`}>
            {isLocked ? 'Locked' : lesson.isCompleted ? 'Completed' : 'Available'}
          </span>
          {lesson.isCompleted && lesson.score && (
            <span className="text-[10px] font-black text-emerald-400">
              {lesson.score}%
            </span>
          )}
        </div>
      </div>
      {!isLocked && <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-400 transition-all" />}
    </div>
  </div>
);

const EnglishDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const router = useRouter();
  const [canUse, setCanUse] = useState(true);
  const [learningPath, setLearningPath] = useState(user.learningPath);

  useEffect(() => {
    const checkUsage = async () => {
      try {
        const response = await fetch('/api/training-usage');
        if (response.ok) {
          const data = await response.json();
          setCanUse(data.canUse.english);
        }
      } catch (error) {
        console.error('Failed to check usage:', error);
      }
    };

    checkUsage();

    // Listen for usage updates from other components
    const handleUsageUpdate = () => checkUsage();
    window.addEventListener('usage-updated', handleUsageUpdate);

    return () => {
      window.removeEventListener('usage-updated', handleUsageUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Try API first
        const response = await fetch('/api/lesson-progress');
        if (response.ok) {
          const progressData = await response.json();
          const updatedPath = user.learningPath.map(level => ({
            ...level,
            lessons: level.lessons.map(lesson => ({
              ...lesson,
              isCompleted: progressData[lesson.id] || false
            }))
          }));
          setLearningPath(updatedPath);
          // Store in localStorage as backup
          localStorage.setItem('englishProgress', JSON.stringify(progressData));
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('englishProgress');
          if (stored) {
            const progressData = JSON.parse(stored);
            const updatedPath = user.learningPath.map(level => ({
              ...level,
              lessons: level.lessons.map(lesson => ({
                ...lesson,
                isCompleted: progressData[lesson.id] || false
              }))
            }));
            setLearningPath(updatedPath);
          }
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('englishProgress');
        if (stored) {
          const progressData = JSON.parse(stored);
          const updatedPath = user.learningPath.map(level => ({
            ...level,
            lessons: level.lessons.map(lesson => ({
              ...lesson,
              isCompleted: progressData[lesson.id] || false
            }))
          }));
          setLearningPath(updatedPath);
        }
      }
    };

    fetchProgress();
  }, [user.learningPath]);

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };

  const handleStartLesson = (lesson: Lesson) => {
    if (!canUse) return;
    // For now, navigate to a session page with query params
    router.push(`/train/session/${ModuleType.ENGLISH_LEARNING}?lessonId=${lesson.id}&lessonTitle=${encodeURIComponent(lesson.title)}`);
  };

  const totalLessons = learningPath.reduce((acc, level) => acc + level.lessons.length, 0);
  const completedLessons = learningPath.reduce((acc, level) =>
    acc + level.lessons.filter(l => l.isCompleted).length, 0);
  const progress = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <button
            onClick={() => router.push('/train')}
            className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-4 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Modules
          </button>
          <h1 className="text-4xl font-black text-white tracking-tight">English Learning</h1>
          <p className="text-slate-300 mt-2 text-lg font-medium">Structured path from Beginner to Corporate Fluency.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-700/50 shadow-lg min-w-[200px]">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400"><Trophy size={20} /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Overall Progress</p>
                <p className="text-sm font-black text-white">{progress}% Completed</p>
              </div>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{completedLessons}/{totalLessons} Lessons</p>
          </div>
        </div>
      </div>

      <div className="space-y-16">
        {learningPath.map((levelProgress) => (
          <div key={levelProgress.level} className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg shadow-lg"><GraduationCap size={18} /></div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">{levelProgress.level} Track</h2>
              <div className="h-px flex-1 bg-slate-700/50"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {levelProgress.lessons.filter(l => l.isCompleted).length}/{levelProgress.lessons.length} Completed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levelProgress.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onStart={() => handleStartLesson(lesson)}
                  onUpgrade={handleUpgrade}
                  isLocked={!canUse}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnglishDashboard;

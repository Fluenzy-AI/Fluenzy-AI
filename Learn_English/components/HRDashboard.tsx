
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  PlayCircle,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  Trophy
} from 'lucide-react';
import { UserProfile, Lesson, ModuleType } from '../types';
import { useTheme } from '@/contexts/ThemeContext';

const LessonCard: React.FC<{ lesson: Lesson; onStart: () => void; isLight: boolean }> = ({ lesson, onStart, isLight }) => (
  <div
    onClick={onStart}
    className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
      lesson.isCompleted
        ? isLight
          ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-md shadow-emerald-100 hover:shadow-xl hover:shadow-emerald-200/60 hover:-translate-y-1'
          : 'bg-gradient-to-br from-emerald-900/20 to-slate-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1'
        : isLight
          ? 'bg-white border-pink-200 shadow-md shadow-pink-100/60 hover:shadow-xl hover:shadow-pink-200/60 hover:-translate-y-1 hover:border-pink-300'
          : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-pink-500/30 shadow-xl shadow-pink-500/10 hover:shadow-2xl hover:shadow-pink-500/20 hover:-translate-y-1'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform ${
        lesson.isCompleted ? '' : 'group-hover:scale-110'
      } ${
        lesson.isCompleted
          ? 'bg-emerald-500 text-white shadow-lg'
          : 'bg-pink-500 text-white shadow-lg'
      }`}>
        {lesson.isCompleted ? <CheckCircle2 size={22} /> : <PlayCircle size={22} />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold truncate text-sm ${
          isLight
            ? lesson.isCompleted ? 'text-slate-700' : 'text-slate-800'
            : 'text-white'
        }`}>
          {lesson.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
            lesson.isCompleted
              ? isLight ? 'text-emerald-700 bg-emerald-100' : 'text-emerald-300 bg-emerald-500/20'
              : isLight ? 'text-pink-600 bg-pink-100' : 'text-pink-300 bg-pink-500/20'
          }`}>
            {lesson.isCompleted ? 'Completed' : 'Available'}
          </span>
          {lesson.isCompleted && lesson.score && (
            <span className="text-[10px] font-black text-emerald-500">
              {lesson.score}%
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className={`transition-all ${
        isLight ? 'text-slate-300 group-hover:text-pink-400' : 'text-slate-400 group-hover:text-pink-400'
      }`} />
    </div>
  </div>
);

const HRDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [hrLearningPath, setHrLearningPath] = useState(user.hrLearningPath);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Try API first
        const response = await fetch('/api/hr-progress');
        if (response.ok) {
          const progressData = await response.json();
          const updatedPath = user.hrLearningPath.map(level => ({
            ...level,
            lessons: level.lessons.map(lesson => ({
              ...lesson,
              isCompleted: progressData[lesson.id] || false
            }))
          }));
          setHrLearningPath(updatedPath);
          // Store in localStorage as backup
          localStorage.setItem('hrProgress', JSON.stringify(progressData));
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('hrProgress');
          if (stored) {
            const progressData = JSON.parse(stored);
            const updatedPath = user.hrLearningPath.map(level => ({
              ...level,
              lessons: level.lessons.map(lesson => ({
                ...lesson,
                isCompleted: progressData[lesson.id] || false
              }))
            }));
            setHrLearningPath(updatedPath);
          }
        }
      } catch (error) {
        console.error('Failed to fetch HR progress:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('hrProgress');
        if (stored) {
          const progressData = JSON.parse(stored);
          const updatedPath = user.hrLearningPath.map(level => ({
            ...level,
            lessons: level.lessons.map(lesson => ({
              ...lesson,
              isCompleted: progressData[lesson.id] || false
            }))
          }));
          setHrLearningPath(updatedPath);
        }
      }
    };

    fetchProgress();
  }, [user.hrLearningPath]);

  const handleStartLesson = (lesson: Lesson) => {
    router.push(`/train/session/${ModuleType.HR_INTERVIEW}?lessonId=${lesson.id}&lessonTitle=${encodeURIComponent(lesson.title)}`);
  };

  const totalLessons = hrLearningPath.reduce((acc, level) => acc + level.lessons.length, 0);
  const completedLessons = hrLearningPath.reduce((acc, level) =>
    acc + level.lessons.filter(l => l.isCompleted).length, 0);
  const progress = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <button
            onClick={() => router.push('/train')}
            className={`flex items-center gap-2 font-bold text-sm mb-4 transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <ArrowLeft size={16} />
            Back to Modules
          </button>
          <h1 className={`text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>HR Interview Coach</h1>
          <p className={`mt-2 text-lg font-medium ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>Step-by-step masterclass for corporate behaviorals.</p>
        </div>

        <div className="flex gap-4">
          <div className={`p-4 rounded-2xl border shadow-lg min-w-[200px] ${
            isLight
              ? 'bg-white border-slate-200 shadow-pink-100/60'
              : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-slate-700/50'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${
                isLight ? 'bg-pink-100 text-pink-500' : 'bg-pink-500/20 text-pink-400'
              }`}><Trophy size={20} /></div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                  isLight ? 'text-slate-400' : 'text-slate-400'
                }`}>HR Readiness</p>
                <p className={`text-sm font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>{progress}% Completed</p>
              </div>
            </div>
            <div className={`w-full rounded-full h-2 ${isLight ? 'bg-slate-100' : 'bg-slate-700/50'}`}>
              <div
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={`text-[10px] mt-2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>{completedLessons}/{totalLessons} Steps</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {hrLearningPath.map((levelProgress) => (
          <div key={levelProgress.level} className="space-y-4">
            <div className="flex items-center gap-4 px-2">
              <div className="p-2 bg-gradient-to-br from-pink-600 to-purple-600 text-white rounded-lg shadow-lg">
                <UserCheck size={18} />
              </div>
              <h2 className={`text-xl font-black uppercase tracking-tight ${
                isLight ? 'text-slate-800' : 'text-white'
              }`}>{levelProgress.level} HR Track</h2>
              <div className={`h-px flex-1 ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                isLight ? 'text-slate-400' : 'text-slate-400'
              }`}>
                {levelProgress.lessons.filter(l => l.isCompleted).length}/{levelProgress.lessons.length} Completed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelProgress.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onStart={() => handleStartLesson(lesson)}
                  isLight={isLight}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HRDashboard;

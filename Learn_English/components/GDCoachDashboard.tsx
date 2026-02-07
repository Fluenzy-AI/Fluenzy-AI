
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  PlayCircle,
  ChevronRight,
  ArrowLeft,
  Users,
  Trophy,
  Target,
  MessageSquare,
  Crown,
  Lightbulb,
  Shield,
  Zap
} from 'lucide-react';
import { UserProfile, Lesson, ModuleType } from '../types';

const LessonCard: React.FC<{ lesson: Lesson, onStart: () => void }> = ({ lesson, onStart }) => (
  <div
    onClick={onStart}
    className={`group relative p-6 rounded-3xl border transition-all duration-300 backdrop-blur-xl ${
      lesson.isCompleted
        ? 'bg-gradient-to-br from-emerald-900/20 to-slate-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/10 cursor-pointer hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1'
        : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-purple-500/30 shadow-xl shadow-purple-500/10 cursor-pointer hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${lesson.isCompleted ? '' : 'group-hover:scale-110'} ${
        lesson.isCompleted
          ? 'bg-emerald-500 text-white shadow-lg'
          : 'bg-purple-600 text-white shadow-lg'
      }`}>
        {lesson.isCompleted ? <CheckCircle2 size={24} /> : <PlayCircle size={24} />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold truncate ${lesson.isCompleted ? 'text-white' : 'text-white'}`}>
          {lesson.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
            lesson.isCompleted ? 'text-emerald-300 bg-emerald-500/20' : 'text-purple-300 bg-purple-500/20'
          }`}>
            {lesson.isCompleted ? 'Completed' : 'Available'}
          </span>
          {lesson.isCompleted && lesson.score && (
            <span className="text-[10px] font-black text-emerald-400">
              {lesson.score}%
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-400 group-hover:text-purple-400 transition-all" />
    </div>
  </div>
);

const LevelBadge: React.FC<{ level: string, icon: React.ReactNode, color: string }> = ({ level, icon, color }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${color}`}>
    {icon}
    <span className="text-xs font-black uppercase tracking-wider">{level}</span>
  </div>
);

const GDCoachDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const router = useRouter();
  const [gdLearningPath, setGdLearningPath] = useState(user.gdLearningPath);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Try API first
        const response = await fetch('/api/gd-progress');
        if (response.ok) {
          const progressData = await response.json();
          const updatedPath = user.gdLearningPath.map(level => ({
            ...level,
            lessons: level.lessons.map(lesson => ({
              ...lesson,
              isCompleted: progressData[lesson.id] || false
            }))
          }));
          setGdLearningPath(updatedPath);
          // Store in localStorage as backup
          localStorage.setItem('gdProgress', JSON.stringify(progressData));
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('gdProgress');
          if (stored) {
            const progressData = JSON.parse(stored);
            const updatedPath = user.gdLearningPath.map(level => ({
              ...level,
              lessons: level.lessons.map(lesson => ({
                ...lesson,
                isCompleted: progressData[lesson.id] || false
              }))
            }));
            setGdLearningPath(updatedPath);
          }
        }
      } catch (error) {
        console.error('Failed to fetch GD progress:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('gdProgress');
        if (stored) {
          const progressData = JSON.parse(stored);
          const updatedPath = user.gdLearningPath.map(level => ({
            ...level,
            lessons: level.lessons.map(lesson => ({
              ...lesson,
              isCompleted: progressData[lesson.id] || false
            }))
          }));
          setGdLearningPath(updatedPath);
        }
      }
    };

    fetchProgress();
  }, [user.gdLearningPath]);

  const handleStartLesson = (lesson: Lesson) => {
    router.push(`/train/session/${ModuleType.GD_COACH}?lessonId=${lesson.id}&lessonTitle=${encodeURIComponent(lesson.title)}`);
  };

  const totalLessons = gdLearningPath.reduce((acc, level) => acc + level.lessons.length, 0);
  const completedLessons = gdLearningPath.reduce((acc, level) =>
    acc + level.lessons.filter(l => l.isCompleted).length, 0);
  const progress = Math.round((completedLessons / totalLessons) * 100);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Beginner':
        return <Lightbulb size={14} />;
      case 'Intermediate':
        return <Target size={14} />;
      case 'Advanced':
        return <Crown size={14} />;
      default:
        return <Users size={14} />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-blue-500/20 text-blue-400';
      case 'Intermediate':
        return 'bg-amber-500/20 text-amber-400';
      case 'Advanced':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

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
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="text-purple-500" size={36} />
            GD Coach
          </h1>
          <p className="text-slate-300 mt-2 text-lg font-medium">Master Group Discussions from beginner to leadership level.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-700/50 shadow-lg min-w-[200px]">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400"><Trophy size={20} /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">GD Readiness</p>
                <p className="text-sm font-black text-white">{progress}% Completed</p>
              </div>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{completedLessons}/{totalLessons} Lessons</p>
          </div>
        </div>
      </div>

      {/* Training Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400"><Lightbulb size={20} /></div>
            <h3 className="font-bold text-white">Beginner Level</h3>
          </div>
          <p className="text-slate-400 text-sm">Learn GD basics, rules, and how to speak without fear.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Initiator</span>
            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Supporter</span>
            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Listener</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-900/30 to-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-amber-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500/20 p-2 rounded-xl text-amber-400"><Target size={20} /></div>
            <h3 className="font-bold text-white">Intermediate Level</h3>
          </div>
          <p className="text-slate-400 text-sm">Build confidence, structure points, handle interruptions.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">Info Provider</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">Analyzer</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">Challenger</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-900/30 to-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400"><Crown size={20} /></div>
            <h3 className="font-bold text-white">Advanced Level</h3>
          </div>
          <p className="text-slate-400 text-sm">Develop leadership presence and selection-level performance.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">Moderator</span>
            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">Summarizer</span>
            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">Leader</span>
          </div>
        </div>
      </div>

      {/* Lessons by Level */}
      {gdLearningPath.map((levelData, idx) => {
        const levelLessonsCompleted = levelData.lessons.filter(l => l.isCompleted).length;
        const levelProgress = Math.round((levelLessonsCompleted / levelData.lessons.length) * 100);
        
        return (
          <div key={idx} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <LevelBadge 
                  level={levelData.level} 
                  icon={getLevelIcon(levelData.level)} 
                  color={getLevelColor(levelData.level)} 
                />
                <div>
                  <h2 className="text-2xl font-black text-white">{levelData.level} GD Training</h2>
                  <p className="text-slate-400 text-sm">{levelLessonsCompleted}/{levelData.lessons.length} lessons completed</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-32 bg-slate-700/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      levelData.level === 'Beginner' ? 'bg-blue-500' :
                      levelData.level === 'Intermediate' ? 'bg-amber-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <span className="text-slate-400 text-xs font-bold">{levelProgress}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelData.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onStart={() => handleStartLesson(lesson)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-xl p-8 rounded-3xl border border-purple-500/30 text-center">
        <h3 className="text-2xl font-black text-white mb-2">Ready for Live GD Practice?</h3>
        <p className="text-slate-300 mb-6">After completing the lessons, test your skills in a live GD simulation with AI participants.</p>
        <button
          onClick={() => router.push('/train/gd')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 flex items-center gap-2 mx-auto"
        >
          <Zap size={20} />
          Start Live GD Simulation
        </button>
      </div>
    </div>
  );
};

export default GDCoachDashboard;

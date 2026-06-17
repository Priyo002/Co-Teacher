import { useState, useEffect } from 'react';
import { Plus, BookOpen, Loader2, PlayCircle, BarChart3, TrendingUp, CheckCircle, Clock, Check } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import CreateCourseModal from '../components/CreateCourseModal';
import { useApi } from '../hooks/useApi';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetchApi = useApi();
  
  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await fetchApi('/courses/mine');
        setCourses(data || []);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await fetchApi(`/courses/${courseId}`, { method: 'DELETE' });
      setCourses(prev => prev.filter(c => c._id !== courseId));
    } catch (err) {
      alert("Failed to delete course: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const totalCourses = courses.length;
  const totalLessons = courses.reduce((acc, c) => acc + (c.modules?.reduce((mAcc, m) => mAcc + (m.lessons?.length || 0), 0) || 0), 0);
  const completedLessons = courses.reduce((acc, c) => acc + (c.modules?.reduce((mAcc, m) => mAcc + (m.lessons?.filter(l => l.completedAt)?.length || 0), 0) || 0), 0);
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  const coursesWithLatestOpen = [...courses].map(c => {
    const latestLesson = c.modules?.flatMap(m => m.lessons || []).reduce((latest, l) => {
      if (!l.lastOpenedAt) return latest;
      return !latest || new Date(l.lastOpenedAt) > new Date(latest.lastOpenedAt) ? l : latest;
    }, null);
    return { ...c, latestOpen: latestLesson?.lastOpenedAt || c.createdAt };
  }).sort((a, b) => new Date(b.latestOpen) - new Date(a.latestOpen));

  const recentCourse = coursesWithLatestOpen[0];
  const allCourses = coursesWithLatestOpen;

  return (
    <div className="p-8 animate-fade-in max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
          <p className="text-slate-400">Track your progress and continue learning.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary shadow-brand-500/20"
        >
          <Plus className="w-5 h-5" />
          Generate Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center border-dashed border-2 border-white/10 bg-dark-800/30">
          <div className="bg-dark-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-slate-400 max-w-md mb-6">You haven't generated any courses. Use the AI course generator to start learning anything.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-secondary">
            Create Your First Course
          </button>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="glass-panel p-6 border-brand-500/20 bg-brand-500/5">
              <div className="flex items-center gap-2 text-brand-400 mb-2">
                <BookOpen className="w-4 h-4" />
                <h3 className="text-sm font-medium">Total Courses</h3>
              </div>
              <p className="text-3xl font-bold text-white">{totalCourses}</p>
            </div>
            <div className="glass-panel p-6 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <h3 className="text-sm font-medium">Lessons Completed</h3>
              </div>
              <p className="text-3xl font-bold text-white">{completedLessons} <span className="text-sm font-normal text-slate-500">/ {totalLessons}</span></p>
            </div>
            <div className="glass-panel p-6 border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <h3 className="text-sm font-medium">Overall Progress</h3>
              </div>
              <p className="text-3xl font-bold text-white">{progressPercent}%</p>
            </div>
          </div>

          {/* Continue Learning & Study Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
            {/* Continue Learning */}
            <div className="xl:col-span-2 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <PlayCircle className="w-6 h-6 text-brand-400" />
                Continue Learning
              </h2>
              <div className="flex-1">
                {recentCourse ? (
                  <CourseCard course={recentCourse} onDelete={handleDeleteCourse} />
                ) : (
                  <div className="glass-panel h-full p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 bg-dark-800/30">
                    <p className="text-slate-400 mb-4">You haven't started any courses yet.</p>
                    <button onClick={() => setIsModalOpen(true)} className="btn-secondary">
                      Generate a Course
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Study Activity Heatmap */}
            <div className="xl:col-span-1 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-purple-400" />
                  Study Activity
                </div>
              </h2>
              
              <div className="glass-panel p-6 border-purple-500/20 bg-purple-500/5 flex-1 flex flex-col">
                {(() => {
                  const activityCounts = new Map();
                  courses.forEach(c => {
                    if (c.createdAt) {
                      const d = new Date(c.createdAt).toDateString();
                      activityCounts.set(d, (activityCounts.get(d) || 0) + 1);
                    }
                    c.modules?.forEach(m => {
                      m.lessons?.forEach(l => {
                        if (l.completedAt) {
                          const d = new Date(l.completedAt).toDateString();
                          activityCounts.set(d, (activityCounts.get(d) || 0) + 1);
                        }
                        if (l.lastOpenedAt) {
                          const d = new Date(l.lastOpenedAt).toDateString();
                          activityCounts.set(d, (activityCounts.get(d) || 0) + 1);
                        }
                      });
                    });
                  });

                  let streak = 0;
                  const today = new Date();
                  const yesterday = new Date();
                  yesterday.setDate(today.getDate() - 1);
                  
                  let checkDate = new Date();
                  if (!activityCounts.has(today.toDateString()) && activityCounts.has(yesterday.toDateString())) {
                    checkDate = yesterday;
                  }
                  
                  for (let i = 0; i < 365; i++) {
                    const d = new Date(checkDate);
                    d.setDate(d.getDate() - i);
                    if (activityCounts.has(d.toDateString())) streak++;
                    else break;
                  }

                  // Monthly Calendar View Generation
                  const currentMonth = today.getMonth();
                  const currentYear = today.getFullYear();
                  
                  // Get number of days in current month
                  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                  // Get day of week for the 1st of the month (0 = Sun, 6 = Sat)
                  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                  
                  // Create array of days to render (padding start with nulls)
                  const calendarDays = Array.from({ length: 42 }).map((_, index) => {
                    const dayNumber = index - firstDayOfMonth + 1;
                    if (dayNumber > 0 && dayNumber <= daysInMonth) {
                      const d = new Date(currentYear, currentMonth, dayNumber);
                      return {
                        date: d,
                        day: dayNumber,
                        isToday: dayNumber === today.getDate(),
                        count: activityCounts.get(d.toDateString()) || 0
                      };
                    }
                    return null;
                  });

                  return (
                    <div className="flex flex-col h-full justify-between">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <span className="text-slate-400 font-medium text-sm block mb-1">Current Streak</span>
                          <span className="text-2xl font-bold text-white flex items-center gap-2">
                            {streak} <span className="text-sm font-normal text-brand-400">Days 🔥</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 font-medium text-sm block mb-1">This Month</span>
                          <span className="text-xl font-bold text-white">
                            {today.toLocaleDateString('en-US', { month: 'long' })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        {/* Days of week header */}
                        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <span key={i} className="text-sm font-semibold text-slate-500">{d}</span>
                          ))}
                        </div>
                        
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center relative z-10">
                          {calendarDays.map((dayObj, i) => {
                            if (!dayObj) return <div key={i} className="h-8" />;
                            
                            const isActive = dayObj.count > 0;
                            
                            return (
                              <div key={i} className="relative flex flex-col items-center justify-center h-8 group cursor-default">
                                {isActive ? (
                                  <div className={`w-7 h-7 flex items-center justify-center rounded-full z-10 ${dayObj.isToday ? 'bg-brand-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : ''}`}>
                                    <CheckCircle className={`w-5 h-5 ${dayObj.isToday ? 'text-dark-900' : 'text-brand-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'}`} strokeWidth={2.5} />
                                  </div>
                                ) : (
                                  <div 
                                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-colors z-10 ${
                                      dayObj.isToday 
                                        ? 'bg-brand-500 text-dark-900 font-bold shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    {dayObj.day}
                                  </div>
                                )}
                                
                                {/* Tooltip */}
                                {isActive && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-dark-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-xl">
                                    {dayObj.count} activities
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* All Courses Grid */}
          {allCourses.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-brand-400" />
                All Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allCourses.map(course => (
                  <CourseCard key={course._id} course={course} onDelete={handleDeleteCourse} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <CreateCourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

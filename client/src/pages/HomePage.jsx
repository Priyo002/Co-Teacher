import { useState, useEffect } from 'react';
import { Plus, BookOpen, PlayCircle, BarChart3, TrendingUp, CheckCircle, Clock, Check, Bookmark, Search, Award, Sparkles, ArrowUp } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import CreateCourseModal from '../components/CreateCourseModal';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import { useApi } from '../hooks/useApi';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionPrompt, setSuggestionPrompt] = useState('');
  const [suggestionLevel, setSuggestionLevel] = useState('Auto-detect');
  const [tick, setTick] = useState(0);
  const fetchApi = useApi();
  
  useEffect(() => {
    async function loadData() {
      try {
        const [coursesRes, bookmarksRes, certificatesRes] = await Promise.all([
          fetchApi('/courses/mine'),
          fetchApi('/user/bookmarks'),
          fetchApi('/user/certificates')
        ]);
        setCourses(coursesRes || []);
        setBookmarks(bookmarksRes.bookmarks || []);
        setCertificates(certificatesRes.certificates || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    fetchCourseSuggestions();

    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await fetchApi(`/courses/${courseId}`, { method: 'DELETE' });
      setCourses(prev => prev.filter(c => c._id !== courseId));
      // Also remove any bookmarks that belonged to this course from local state
      setBookmarks(prev => prev.filter(b => b.module?.course?._id !== courseId));
    } catch (err) {
      alert("Failed to delete course: " + err.message);
    }
  };

  const fetchCourseSuggestions = async (refresh = false) => {
    setLoadingSuggestions(true);
    try {
      const data = await fetchApi(`/courses/suggestions${refresh ? '?refresh=true' : ''}`);
      setSuggestions(data.suggestions || []);
      setLastGeneratedAt(data.lastGeneratedAt);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
      if (refresh) alert(err.message || "Failed to fetch suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getRemainingTime = () => {
    if (!lastGeneratedAt) return { ready: true, text: "" };
    const diffMs = (5 * 60 * 1000) - (new Date() - new Date(lastGeneratedAt));
    if (diffMs <= 0) return { ready: true, text: "" };
    
    const m = Math.floor(diffMs / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    return { ready: false, text: `${m}:${s.toString().padStart(2, '0')}` };
  };

  const timerState = getRemainingTime();

  const openCourseModalWithPrompt = (title, difficulty) => {
    setSuggestionPrompt(title);
    setSuggestionLevel(difficulty || 'Beginner');
    setIsModalOpen(true);
  };

  const handleRemoveBookmark = async (e, lessonId) => {
    e.preventDefault(); // Prevent navigating to the lesson
    try {
      await fetchApi(`/user/bookmarks/${lessonId}`, { method: 'POST' });
      setBookmarks(prev => prev.filter(b => b._id !== lessonId));
    } catch (err) {
      alert("Failed to remove bookmark: " + err.message);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
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
    <div className="p-8 md:p-12 animate-fade-in max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-slate-900 tracking-tight">My Dashboard</h1>
          <p className="text-lg text-slate-500">Track your progress and continue learning.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto relative z-50">
          <div className="relative flex-1 sm:w-96 md:w-[400px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses & bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm"
            />
            
            {/* Dynamic Search Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col z-[100]">
                {(() => {
                  const query = searchQuery.toLowerCase();
                  const filteredCourses = allCourses.filter(c => 
                    (c.title || '').toLowerCase().includes(query)
                  );
                  const filteredBookmarks = bookmarks.filter(b => 
                    (b.title || '').toLowerCase().includes(query) || 
                    (b.module?.course?.title || '').toLowerCase().includes(query)
                  );

                  if (filteredCourses.length === 0 && filteredBookmarks.length === 0) {
                    return <div className="p-4 text-center text-slate-500 text-sm">No matches found.</div>;
                  }

                  return (
                    <div className="flex flex-col py-2">
                      {filteredCourses.length > 0 && (
                        <div className="px-2 py-1">
                          <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" /> Courses
                          </h4>
                          <div className="flex flex-col">
                            {filteredCourses.map(course => (
                              <Link 
                                key={course._id} 
                                to={`/course/${course._id}`}
                                className="px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center transition-colors group"
                              >
                                <span className="text-sm font-medium text-slate-700 group-hover:text-brand-600 transition-colors truncate">{course.title}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {filteredCourses.length > 0 && filteredBookmarks.length > 0 && (
                        <div className="h-px bg-slate-100 mx-4 my-1"></div>
                      )}
                      
                      {filteredBookmarks.length > 0 && (
                        <div className="px-2 py-1">
                          <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Bookmark className="w-3 h-3" /> Bookmarked Lessons
                          </h4>
                          <div className="flex flex-col">
                            {filteredBookmarks.map(lesson => (
                              <Link 
                                key={lesson._id} 
                                to={`/course/${lesson.module?.course?._id}/lesson/${lesson._id}`}
                                className="px-3 py-2.5 rounded-lg hover:bg-slate-50 flex flex-col justify-center transition-colors group"
                              >
                                <span className="text-sm font-medium text-slate-700 group-hover:text-brand-600 transition-colors truncate">{lesson.title}</span>
                                <span className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                  <BookOpen className="w-2.5 h-2.5" /> {lesson.module?.course?.title}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              setSuggestionPrompt('');
              setSuggestionLevel('Auto-detect');
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="w-5 h-5" />
            Generate Course
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center bg-slate-50">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-brand-500 shadow-sm border border-slate-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900">No courses yet</h3>
          <p className="text-slate-500 max-w-md mb-6">You haven't generated any courses. Use the AI course generator to start learning anything.</p>
          <button onClick={() => {
            setSuggestionPrompt('');
            setSuggestionLevel('Auto-detect');
            setIsModalOpen(true);
          }} className="btn-primary">
            Create Your First Course
          </button>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-brand-600 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Courses</h3>
                </div>
                <p className="text-5xl font-extrabold text-slate-900">{totalCourses}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-purple-600 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Saved Bookmarks</h3>
                </div>
                <p className="text-5xl font-extrabold text-slate-900">{bookmarks.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-blue-600 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Lessons Completed</h3>
                </div>
                <p className="text-5xl font-extrabold text-slate-900 flex items-baseline gap-2">
                  {completedLessons} 
                  <span className="text-xl font-medium text-slate-400">/ {totalLessons}</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-green-600 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Overall Progress</h3>
                </div>
                <p className="text-5xl font-extrabold text-slate-900">{progressPercent}%</p>
              </div>
            </div>
          </div>

          {/* Recommended for You */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center justify-between text-slate-900 tracking-tight">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                Recommended for You
              </div>
              <button
                onClick={() => fetchCourseSuggestions(true)}
                disabled={!timerState.ready || loadingSuggestions}
                className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] justify-center"
              >
                <Sparkles className="w-4 h-4" /> 
                {loadingSuggestions 
                  ? 'Thinking...' 
                  : (!timerState.ready 
                      ? `Wait ${timerState.text}` 
                      : 'Surprise Me')}
              </button>
            </h2>

            {loadingSuggestions ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 h-40 flex flex-col justify-between animate-pulse">
                    <div>
                      <div className="h-5 w-3/4 bg-slate-200 rounded-md mb-3"></div>
                      <div className="h-3 w-full bg-slate-100 rounded-md"></div>
                      <div className="h-3 w-5/6 bg-slate-100 rounded-md mt-2"></div>
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full mt-auto"></div>
                  </div>
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => openCourseModalWithPrompt(suggestion.title, suggestion.difficulty)}
                    className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col items-start text-left w-full"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 opacity-0 group-hover:opacity-100"></div>
                    <h3 className="font-bold text-slate-900 mb-2 relative z-10 group-hover:text-amber-700 transition-colors">{suggestion.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-3 mb-4 relative z-10">{suggestion.description}</p>
                    <div className="mt-auto flex items-center gap-2 relative z-10">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">{suggestion.difficulty}</span>
                      <span className="text-[10px] font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                        Generate Now <ArrowUp className="w-3 h-3 rotate-45" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Continue Learning & Study Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
            {/* Continue Learning */}
            <div className="xl:col-span-2 flex flex-col h-full">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900 tracking-tight">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-brand-600" />
                </div>
                Continue Learning
              </h2>
              <div className="flex-1">
                {recentCourse ? (
                  <CourseCard course={recentCourse} onDelete={handleDeleteCourse} />
                ) : (
                  <div className="bg-white rounded-3xl h-full p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-200 shadow-sm">
                    <p className="text-slate-500 mb-6 text-lg">You haven't started any courses yet.</p>
                    <button onClick={() => {
                      setSuggestionPrompt('');
                      setSuggestionLevel('Auto-detect');
                      setIsModalOpen(true);
                    }} className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg transition-all">
                      Generate a Course
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Study Activity Heatmap */}
            <div className="xl:col-span-1 flex flex-col h-full">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-between text-slate-900 tracking-tight">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  Study Activity
                </div>
              </h2>
              
              <div className="glass-panel p-6 border-slate-200 bg-white flex-1 flex flex-col shadow-sm">
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
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-slate-500 font-medium text-sm block mb-1">Current Streak</span>
                          <span className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {streak} <span className="text-sm font-normal text-brand-600">Days 🔥</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 font-medium text-sm block mb-1">This Month</span>
                          <span className="text-xl font-bold text-slate-900">
                            {today.toLocaleDateString('en-US', { month: 'long' })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="my-auto py-2">
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
                                  <div className={`w-7 h-7 flex items-center justify-center rounded-full z-10 ${dayObj.isToday ? 'bg-brand-500 shadow-md' : 'bg-brand-100'}`}>
                                    <CheckCircle className={`w-5 h-5 ${dayObj.isToday ? 'text-white' : 'text-brand-600'}`} strokeWidth={2.5} />
                                  </div>
                                ) : (
                                  <div 
                                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-colors z-10 ${
                                      dayObj.isToday 
                                        ? 'bg-brand-500 text-white font-bold shadow-md' 
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {dayObj.day}
                                  </div>
                                )}
                                
                                {/* Tooltip */}
                                {isActive && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-xs text-slate-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-200 shadow-xl">
                                    {dayObj.count} activities
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex items-center justify-end gap-2 text-xs font-medium text-slate-400 mt-2">
                        <span>Less</span>
                        <div className="w-3 h-3 rounded-full bg-slate-100"></div>
                        <div className="w-3 h-3 rounded-full bg-brand-200"></div>
                        <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                        <div className="w-3 h-3 rounded-full bg-brand-700"></div>
                        <span>More</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Tabs for All Courses / Bookmarks */}
          <div className="mt-6 relative z-0">
            <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
              <button
                onClick={() => setActiveTab('courses')}
                className={`pb-3 text-lg font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'courses' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <BookOpen className="w-5 h-5" />
                All Courses
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`pb-3 text-lg font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'bookmarks' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <Bookmark className="w-5 h-5" />
                Bookmarks
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`pb-3 text-lg font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'certificates' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <Award className="w-5 h-5" />
                Certificates
              </button>
            </div>

            {activeTab === 'courses' ? (
              allCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCourses.map(course => (
                    <CourseCard key={course._id} course={course} onDelete={handleDeleteCourse} />
                  ))}
                </div>
              ) : null
            ) : activeTab === 'certificates' ? (
              certificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map(cert => (
                    <Link
                      key={cert._id}
                      to={`/certificate/${cert.certificateId}`}
                      className="glass-panel p-6 border-slate-200 hover:border-brand-500 transition-all hover:-translate-y-1 group bg-white shadow-sm hover:shadow-md flex flex-col justify-between min-h-[220px]"
                    >
                      <div>
                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500 mb-4 group-hover:scale-110 transition-transform">
                          <Award className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-slate-900 group-hover:text-brand-600 transition-colors">{cert.courseTitle}</h3>
                      </div>
                      <div className="flex items-center justify-between w-full mt-4">
                        <span className="text-sm font-medium text-brand-600">View Certificate</span>
                        <span className="text-xs text-slate-400 font-mono">Score: {cert.averageScore}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
                  <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Certificates Yet</h3>
                  <p className="text-slate-500">Complete a course 100% to earn your first certificate!</p>
                </div>
              )
            ) : (
              bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.map(lesson => (
                    <Link 
                      key={lesson._id}
                      to={`/course/${lesson.module?.course?._id}/lesson/${lesson._id}`}
                      className="glass-panel p-5 border-slate-200 hover:border-brand-500 transition-all hover:-translate-y-1 group bg-white shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                          <Bookmark className="w-5 h-5 fill-current" />
                        </div>
                        <button
                          onClick={(e) => handleRemoveBookmark(e, lesson._id)}
                          className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-red-50"
                          title="Remove bookmark"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 text-slate-900 group-hover:text-brand-600 transition-colors">{lesson.title}</h3>
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{lesson.description}</p>
                      <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{lesson.module?.course?.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
                  <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Bookmarks Yet</h3>
                  <p className="text-slate-500">Save your favorite lessons to quickly access them later!</p>
                </div>
              )
            )}
          </div>
        </>
      )}

      <CreateCourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialPrompt={suggestionPrompt} initialLevel={suggestionLevel} />
    </div>
  );
}

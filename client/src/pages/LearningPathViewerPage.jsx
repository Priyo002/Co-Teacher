import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Target, BookOpen, Clock, Lock, Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Loader2, ListTree, TrendingUp } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

export default function LearningPathViewerPage() {
  const { id } = useParams();
  const fetchApi = useApi();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingIndex, setGeneratingIndex] = useState(null);

  useEffect(() => {
    async function loadPath() {
      try {
        const data = await fetchApi(`/paths/${id}`);
        setPath(data);
      } catch (err) {
        setError(err.message || 'Failed to load learning path');
      } finally {
        setLoading(false);
      }
    }
    loadPath();
  }, [id, fetchApi]);

  const handleGenerateCourse = async (courseIndex) => {
    if (user.credits < 100) {
      alert("You need 100 credits to generate this course.");
      return;
    }

    setGeneratingIndex(courseIndex);
    try {
      const data = await fetchApi(`/paths/${id}/courses/${courseIndex}/generate`, { method: 'POST' });
      // Update local state to show the newly generated course link
      setPath(data.path);
      refreshProfile();
    } catch (err) {
      alert(err.message || 'Failed to generate course');
    } finally {
      setGeneratingIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your roadmap...</p>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Oops! Something went wrong.</h2>
          <p>{error}</p>
          <Link to="/" className="mt-6 px-6 py-2 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalHours = path.courses.reduce((acc, c) => acc + (c.estimatedHours || 0), 0);
  const completedCourses = path.courses.filter(c => c.courseId).length;
  const progressPercent = Math.round((completedCourses / path.courses.length) * 100);

  return (
    <div className="p-8 max-w-5xl mx-auto pb-32 animate-fade-in">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl mb-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 text-brand-400 font-bold tracking-wider uppercase text-sm mb-4">
              <Target className="w-5 h-5" /> Learning Path
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight text-white">{path.goal}</h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-300">
              <span className="flex items-center gap-2"><ListTree className="w-5 h-5" /> {path.courses.length} Courses</span>
              <span className="flex items-center gap-2"><Clock className="w-5 h-5" /> ~{totalHours} Hours</span>
            </div>
          </div>
          
          <div className="w-full md:w-80 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-brand-300 font-semibold tracking-wider text-sm uppercase">Your Progress</span>
              <div className="px-3 py-1 bg-white/10 rounded-lg text-white font-bold">
                {progressPercent}%
              </div>
            </div>
            <div className="h-4 bg-slate-800/50 rounded-full overflow-hidden p-1 backdrop-blur-sm border border-slate-700/50">
              <div className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-1000 relative overflow-hidden" style={{ width: `${progressPercent}%` }}>
                <div className="absolute inset-0 bg-white/20 skew-x-12 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-slate-300 flex items-center justify-between">
               <span>{completedCourses} / {path.courses.length} courses</span>
               {completedCourses === path.courses.length && <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Completed</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Timeline */}
      <div className="relative pl-4 md:pl-16">
        {/* Vertical Line connecting nodes */}
        <div className="absolute top-12 bottom-12 left-[35px] md:left-[83px] w-0.5 bg-gradient-to-b from-brand-300 via-slate-200 to-slate-200"></div>

        <div className="space-y-12 relative z-10">
          {path.courses.map((course, index) => {
            const isGenerated = !!course.courseId;
            const isGenerating = generatingIndex === index;
            // A course is available to generate if it's the first ungenerated course in the sequence.
            const firstUngeneratedIndex = path.courses.findIndex(c => !c.courseId);
            const isAvailable = index === firstUngeneratedIndex;

            return (
              <div key={index} className="flex gap-6 md:gap-12 relative group">
                
                {/* Timeline Node */}
                <div className="relative shrink-0 flex items-start pt-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-slate-50 transition-colors shadow-sm relative z-10 ${
                    isGenerated ? 'bg-brand-500 text-white' : 
                    isAvailable ? 'bg-white text-brand-500 border-brand-100 ring-4 ring-brand-50' : 'bg-slate-100 text-slate-300'
                  }`}>
                    {isGenerated ? <CheckCircle2 className="w-5 h-5" /> : 
                     isAvailable ? <Sparkles className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>
                  {/* Connecting dashed line if available next */}
                  {isAvailable && index > 0 && (
                     <div className="absolute top-0 bottom-full left-1/2 w-0.5 border-l-2 border-brand-200 border-dashed -translate-x-1/2 -mt-12 h-12 z-0"></div>
                  )}
                </div>

                {/* Course Card */}
                <div className={`flex-1 rounded-[2rem] p-6 md:p-8 transition-all ${
                  isGenerated ? 'bg-white border border-slate-200/60 shadow-lg shadow-brand-500/5 hover:shadow-xl' : 
                  isAvailable ? 'bg-white border border-brand-200 shadow-2xl shadow-brand-500/10 ring-1 ring-brand-100 relative' : 
                  'bg-slate-50/50 border border-slate-100 opacity-60'
                }`}>
                  <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-xs font-black tracking-widest uppercase ${isGenerated ? 'text-brand-500' : isAvailable ? 'text-brand-600' : 'text-slate-400'}`}>
                          Course {index + 1}
                        </span>
                        {!isGenerated && !isAvailable && (
                          <span className="px-2.5 py-1 rounded-md bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                      <h3 className={`text-2xl font-extrabold mb-4 ${isGenerated || isAvailable ? 'text-slate-900' : 'text-slate-600'}`}>
                        {course.title}
                      </h3>
                      <p className="text-slate-600 mb-8 leading-relaxed text-[15px]">
                        {course.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                          <Clock className="w-4 h-4" /> {course.estimatedHours} Hours
                        </div>
                        {course.difficulty && (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                            course.difficulty === 'Beginner' ? 'bg-green-50 text-green-600' :
                            course.difficulty === 'Intermediate' ? 'bg-orange-50 text-orange-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            <TrendingUp className="w-4 h-4" /> {course.difficulty}
                          </div>
                        )}
                        {course.prerequisites && course.prerequisites.length > 0 && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="font-bold">Prerequisites:</span>
                            {course.prerequisites.map((prereq, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 rounded-md text-xs">{prereq}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="shrink-0 pt-4 xl:pt-0">
                      {isGenerated ? (
                        <Link to={`/course/${course.courseId._id || course.courseId}`} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors w-full xl:w-auto">
                          Start Course
                        </Link>
                      ) : isGenerating ? (
                        <button disabled className="px-8 py-3.5 bg-brand-50 text-brand-600 font-bold rounded-xl flex items-center justify-center gap-2 w-full xl:w-auto">
                          <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                        </button>
                      ) : isAvailable ? (
                        <button 
                          onClick={() => handleGenerateCourse(index)}
                          className="group relative px-8 py-3.5 bg-brand-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 overflow-hidden shadow-lg shadow-brand-500/20 hover:bg-brand-600 hover:scale-[1.02] transition-all active:scale-95 w-full xl:w-auto"
                        >
                          <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                          <Sparkles className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">Generate Course</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
                
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

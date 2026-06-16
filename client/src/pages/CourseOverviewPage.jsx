import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Circle, PlayCircle, ArrowLeft, MoreVertical, Share2, Loader2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function CourseOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchApi = useApi();
  
  useEffect(() => {
    async function loadCourse() {
      try {
        const data = await fetchApi(`/courses/${id}`);
        setCourse(data);
      } catch (err) {
        setError(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return <div className="p-8 text-center text-red-400">{error || 'Course not found'}</div>;
  }

  const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const completedLessons = course.modules.reduce(
    (acc, mod) => acc + mod.lessons.filter(l => l.completedAt).length, 0
  );
  const progress = Math.round((completedLessons / totalLessons) * 100) || 0;

  return (
    <div className="p-4 sm:p-8 animate-fade-in max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="glass-panel p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full text-xs font-medium border border-brand-500/20">
                Course
              </span>
              {course.isPublic && (
                <span className="bg-dark-600 text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                  Public
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-slate-300 max-w-2xl text-lg">{course.description}</p>
          </div>
          
          <div className="flex gap-3">
            <button className="btn-secondary px-4 py-2">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button className="btn-secondary px-4 py-2">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full conic-gradient-progress relative flex items-center justify-center bg-dark-800 shrink-0 border border-white/5 shadow-inner">
            <span className="text-sm font-bold text-white z-10">{progress}%</span>
          </div>
          <div>
            <h4 className="font-medium text-slate-200">Overall Progress</h4>
            <p className="text-sm text-slate-400">{completedLessons} of {totalLessons} lessons completed</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">Curriculum</h2>
        {course.modules.map((module, mIdx) => (
          <div key={module._id} className="glass-panel overflow-hidden">
            <div className="bg-dark-800/50 p-4 border-b border-white/5">
              <h3 className="font-semibold text-lg">{module.title}</h3>
            </div>
            <div className="divide-y divide-white/5">
              {module.lessons.map((lesson, lIdx) => (
                <Link 
                  key={lesson._id}
                  to={`/course/${course._id}/lesson/${lesson._id}`}
                  className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {lesson.completedAt ? (
                      <CheckCircle className="w-5 h-5 text-brand-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-medium text-slate-200 group-hover:text-brand-300 transition-colors">
                        {mIdx + 1}.{lIdx + 1} {lesson.title}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {!lesson.isEnriched && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-dark-900 px-2 py-1 rounded border border-white/5">
                        Draft
                      </span>
                    )}
                    <PlayCircle className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

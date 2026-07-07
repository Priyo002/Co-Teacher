import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Circle, PlayCircle, ArrowLeft, MoreVertical, Share2, Loader2, Check, Trash2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import CourseSkeleton from '../components/skeletons/CourseSkeleton';

export default function CourseOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [generatingTest, setGeneratingTest] = useState(false);
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

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      try {
        await fetchApi(`/courses/${id}`, { method: 'DELETE' });
        navigate('/');
      } catch (err) {
        alert(err.message || 'Failed to delete course');
      }
    }
  };

  if (loading) {
    return <CourseSkeleton />;
  }

  if (error || !course) {
    return <div className="p-8 text-center text-red-400">{error || 'Course not found'}</div>;
  }

  const lessonsArray = course.modules?.flatMap(mod => mod.lessons || []) || [];
  const totalLessons = lessonsArray.length;
  const completedLessons = lessonsArray.filter(l => l.completedAt).length;
  const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  const hasFinalTest = course.finalTest && course.finalTest.questions && course.finalTest.questions.length > 0;

  const handleGenerateTest = async () => {
    setGeneratingTest(true);
    try {
      const res = await fetchApi(`/courses/${id}/generate-test`, { method: 'POST' });
      // Refresh course to get the new test
      setCourse({ ...course, finalTest: res.finalTest });
    } catch (err) {
      alert(err.message || 'Failed to generate test. Please try again.');
    } finally {
      setGeneratingTest(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 animate-fade-in max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="glass-panel p-6 sm:p-8 mb-8 relative overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="absolute top-0 right-0 p-32 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-xs font-semibold border border-brand-100">
                Course
              </span>
              {course.isPublic && (
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200">
                  Public
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900">{course.title}</h1>
            <p className="text-slate-600 max-w-2xl text-lg">{course.description}</p>
          </div>
          
          <div className="flex gap-3 relative">
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)} 
                className={`btn-secondary px-4 py-2 ${showDropdown ? 'bg-slate-100' : ''}`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                    <button 
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Course
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full conic-gradient-progress relative flex items-center justify-center bg-slate-50 shrink-0 border border-slate-200 shadow-inner">
              <span className="text-sm font-bold text-slate-900 z-10">{progress}%</span>
            </div>
            <div>
              <h4 className="font-medium text-slate-900">Overall Progress</h4>
              <p className="text-sm text-slate-500">{completedLessons} of {totalLessons} lessons completed</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <h4 className="font-medium text-slate-900">Final Certification</h4>
              {!course?.earnedCertificateId && (
                <p className="text-sm text-slate-500">Score 70%+ to unlock</p>
              )}
            </div>
            
            {course?.earnedCertificateId ? (
              <button 
                onClick={() => navigate(`/certificate/${course.earnedCertificateId}`)}
                className="btn-primary shadow-md shadow-brand-500/20 whitespace-nowrap"
              >
                View Certificate
              </button>
            ) : hasFinalTest ? (
              <button 
                onClick={() => navigate(`/course/${id}/test`)}
                className="btn-primary shadow-md shadow-brand-500/20 whitespace-nowrap"
              >
                Take Final Test
              </button>
            ) : (
              <button 
                onClick={handleGenerateTest}
                disabled={generatingTest}
                className="btn-secondary whitespace-nowrap"
              >
                {generatingTest ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Generating...</> : 'Generate Test'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4 text-slate-900">Curriculum</h2>
        {course.modules?.map((module, mIdx) => (
          <div key={module._id} className="glass-panel overflow-hidden bg-white border-slate-200 shadow-sm">
            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">Module {mIdx + 1}: {module.title.replace(/^Module\s*\d+:\s*/i, '')}</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {module.lessons?.map((lesson, lIdx) => (
                <Link 
                  key={lesson._id}
                  to={`/course/${course._id}/lesson/${lesson._id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {lesson.completedAt ? (
                      <CheckCircle className="w-5 h-5 text-brand-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 group-hover:text-brand-300 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                        {mIdx + 1}.{lIdx + 1} {lesson.title}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {lesson.generationStatus === 'none' && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        Draft
                      </span>
                    )}
                    <PlayCircle className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
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

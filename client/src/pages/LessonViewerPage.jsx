import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, Menu, ChevronRight, Loader2, Bot, PanelLeftClose, PanelLeftOpen, PanelRightOpen, AlertTriangle } from 'lucide-react';
import LessonRenderer from '../components/LessonRenderer';
import AITutorChat from '../components/AITutorChat';
import { useApi } from '../hooks/useApi';
import { Sparkles } from 'lucide-react';

export default function LessonViewerPage() {
  const { courseId, id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const fetchApi = useApi();

  const handleGenerateLesson = async () => {
    setGeneratingLesson(true);
    setGenerationError(null);
    try {
      await fetchApi(`/courses/${courseId}/lessons/${id}/enrich`, { method: 'POST' });
      const data = await fetchApi(`/courses/${courseId}/lessons/${id}`);
      setLesson(data.lesson);
    } catch (err) {
      console.error("Failed to generate lesson:", err);
      // Clean up nasty HTML error messages
      const msg = err.message.includes('<!DOCTYPE html>') ? 'AI returned incomplete lesson content. Please try again.' : err.message;
      setGenerationError(msg || 'Failed to generate lesson content.');
    } finally {
      setGeneratingLesson(false);
    }
  };

  useEffect(() => {
    async function loadLessonView() {
      setLoading(true);
      setError(null);
      setGenerationError(null);
      try {
        const data = await fetchApi(`/courses/${courseId}/lessons/${id}`);
        setCourse(data.course);
        setLesson(data.lesson);

        // Automatically trigger generation if it's a draft
        if (!data.lesson.isEnriched) {
          setGeneratingLesson(true);
          try {
            await fetchApi(`/courses/${courseId}/lessons/${id}/enrich`, { method: 'POST' });
            const updatedData = await fetchApi(`/courses/${courseId}/lessons/${id}`);
            setLesson(updatedData.lesson);
          } catch (err) {
            console.error("Failed to auto-generate lesson:", err);
            const msg = err.message.includes('<!DOCTYPE html>') ? 'AI returned incomplete lesson content. Please try again.' : err.message;
            setGenerationError(msg || 'Failed to auto-generate lesson.');
          } finally {
            setGeneratingLesson(false);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    }
    loadLessonView();
  }, [courseId, id]);

  const handleToggleComplete = async () => {
    setSavingProgress(true);
    try {
      const isCurrentlyCompleted = !!lesson.completedAt;
      const updatedLesson = await fetchApi(`/courses/${courseId}/lessons/${id}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !isCurrentlyCompleted })
      });
      setLesson(updatedLesson);
      
      // Update the course state so the sidebar checkmark updates immediately
      setCourse(prevCourse => {
        const newCourse = { ...prevCourse };
        newCourse.modules = newCourse.modules.map(mod => ({
          ...mod,
          lessons: mod.lessons.map(l => l._id === id ? { ...l, completedAt: updatedLesson.completedAt } : l)
        }));
        return newCourse;
      });
    } catch (err) {
      alert("Failed to update progress: " + err.message);
    } finally {
      setSavingProgress(false);
    }
  };

  if (loading && !course) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error && !course) {
    return <div className="p-8 text-center text-red-400">{error || 'Lesson not found'}</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Sidebar Toggle Overlay / Button */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-20 bg-dark-800 p-2 rounded-lg border border-white/10 text-slate-300 hover:text-white transition-colors shadow-lg"
          title="Expand Curriculum"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar Navigation */}
      {isSidebarOpen && (
        <aside 
          className="absolute lg:static inset-y-0 left-0 z-30 w-72 bg-dark-900 border-r border-white/5 flex flex-col shadow-xl"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <button 
              onClick={() => navigate(`/course/${courseId}`)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Course
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              title="Shrink Curriculum"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          <h3 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-500">Curriculum</h3>
          
          <div className="space-y-6">
            {course.modules.map((module) => (
              <div key={module._id}>
                <h4 className="font-semibold text-slate-300 mb-2">{module.title}</h4>
                <div className="space-y-1">
                  {module.lessons.map((l) => {
                    const isActive = l._id === lesson._id;
                    return (
                      <Link
                        key={l._id}
                        to={`/course/${courseId}/lesson/${l._id}`}
                        className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${isActive ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                      >
                        {l.completedAt ? (
                          <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-500'}`} />
                        ) : (
                          <Circle className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-600'}`} />
                        )}
                        <span className="text-sm line-clamp-2">{l.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
      )}

      <main className="flex-1 bg-dark-950 overflow-y-auto relative">
        {loading || !lesson ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="relative flex items-center justify-center w-full h-full bg-dark-800 border border-brand-500/30 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                  <Sparkles className="w-10 h-10 text-brand-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Loading Lesson...</h3>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : (
          <>
            {lesson.isEnriched && !isRightSidebarOpen && (
              <button
                onClick={() => setIsRightSidebarOpen(true)}
                className="hidden lg:flex absolute top-4 right-4 z-20 bg-dark-800 text-slate-300 border border-white/10 p-2 rounded-lg hover:text-white transition-colors shadow-lg"
                title="Expand AI Tutor"
              >
                <PanelRightOpen className="w-5 h-5" />
              </button>
            )}
            <div className="w-full max-w-[1400px] mx-auto p-6 md:px-12 lg:px-16 pb-32">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
                <Link to={`/course/${courseId}`} className="truncate max-w-[150px] md:max-w-[300px] hover:text-slate-300 transition-colors">
                  {course.title}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-brand-400">{lesson.title}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
                <h1 className="text-3xl md:text-5xl font-bold">{lesson.title}</h1>
                
                {lesson.isEnriched && (
                  <button 
                    onClick={handleToggleComplete}
                    disabled={savingProgress}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      lesson.completedAt 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' 
                        : 'bg-dark-800 text-slate-300 border border-white/10 hover:bg-dark-700'
                    }`}
                  >
                    {savingProgress ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : lesson.completedAt ? (
                      <><CheckCircle className="w-5 h-5" /> Completed</>
                    ) : (
                      <><Circle className="w-5 h-5" /> Mark as Complete</>
                    )}
                  </button>
                )}
              </div>
              
              <div className="glass-panel p-8 md:p-12 mb-8">
                {!lesson.isEnriched ? (
                  <div className="text-center py-16">
                    {generationError ? (
                      <>
                        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-red-400 mb-4">Generation Failed</h3>
                        <p className="text-slate-400 max-w-md mx-auto mb-8">
                          {generationError}
                        </p>
                        <button 
                          onClick={handleGenerateLesson} 
                          className="btn-primary shadow-brand-500/20"
                        >
                          Try Again
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative w-24 h-24 mx-auto mb-8">
                          <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                          <div className="relative flex items-center justify-center w-full h-full bg-dark-800 border border-brand-500/30 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                            <Sparkles className="w-10 h-10 text-brand-400 animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Crafting Your Lesson...</h3>
                        <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                          The AI is writing detailed content, discovering relevant videos, and building a knowledge check quiz. This usually takes about 20-30 seconds.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <LessonRenderer blocks={lesson.content} />
                )}
              </div>

              {lesson.isEnriched && (
                <div className="lg:hidden h-[600px] mb-8 rounded-xl overflow-hidden border border-white/10">
                  <AITutorChat courseId={courseId} lessonId={id} />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Right Sidebar AI Tutor (Desktop) */}
      {lesson.isEnriched && isRightSidebarOpen && (
        <aside className="hidden lg:flex flex-col w-96 shrink-0 border-l border-white/5 bg-dark-900 z-20 relative shadow-xl">
          <AITutorChat courseId={courseId} lessonId={id} onClose={() => setIsRightSidebarOpen(false)} />
        </aside>
      )}
    </div>
  );
}

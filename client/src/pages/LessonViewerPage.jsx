import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, Menu, ChevronRight, Loader2, Bot, PanelLeftClose, PanelLeftOpen, PanelRightOpen, AlertTriangle, Download, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
  const [generatingChunk, setGeneratingChunk] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const fetchApi = useApi();
  const endOfContentRef = useRef(null);

  const [leftWidth, setLeftWidth] = useState(288);
  const [rightWidth, setRightWidth] = useState(384);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  const startResizeLeft = useCallback((e) => {
    e.preventDefault();
    isDraggingLeft.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  const startResizeRight = useCallback((e) => {
    e.preventDefault();
    isDraggingRight.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLeft.current) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 600) setLeftWidth(newWidth);
      }
      if (isDraggingRight.current) {
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth >= 300 && newWidth <= 800) setRightWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      if (isDraggingLeft.current || isDraggingRight.current) {
        isDraggingLeft.current = false;
        isDraggingRight.current = false;
        document.body.style.cursor = 'default';
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
      if (course) {
        const optimisticLesson = course.modules.flatMap(m => m.lessons).find(l => l._id === id);
        if (optimisticLesson) {
          setLesson(optimisticLesson);
        } else {
          setLesson(null);
        }
      } else {
        setLesson(null);
      }
      setLoading(true);
      setError(null);
      setGenerationError(null);
      setGeneratingChunk(false);
      if (generatingRef) generatingRef.current = false;
      try {
        const data = await fetchApi(`/courses/${courseId}/lessons/${id}`);
        setCourse(data.course);
        setLesson(data.lesson);
      } catch (err) {
        setError(err.message || 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    }
    loadLessonView();
  }, [courseId, id]);

  const generatingRef = useRef(false);
  const currentIdRef = useRef(id);

  useEffect(() => {
    currentIdRef.current = id;
  }, [id]);

  const handleGenerateChunk = async (chunkType) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGeneratingChunk(true);
    setGenerationError(null);
    try {
      const updatedLesson = await fetchApi(`/courses/${courseId}/lessons/${id}/generate/${chunkType}`, { method: 'POST' });
      if (currentIdRef.current === id) {
        setLesson(updatedLesson);
      }
    } catch (err) {
      if (currentIdRef.current === id) {
        console.error(`Failed to generate ${chunkType}:`, err);
        setGenerationError(`Failed to generate ${chunkType}. Please try again.`);
      }
    } finally {
      if (currentIdRef.current === id) {
        generatingRef.current = false;
        setGeneratingChunk(false);
      }
    }
  };

  useEffect(() => {
    if (lesson && lesson.generationStatus === 'none' && !generatingRef.current && !generationError) {
      handleGenerateChunk('outline');
    }
  }, [lesson, generationError]);

  useEffect(() => {
    if (!endOfContentRef.current || !lesson || generationError) return;
    if (lesson.generationStatus === 'none' || lesson.generationStatus === 'complete' || lesson.isEnriched) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !generatingRef.current) {
        if (lesson.generationStatus === 'outline' || lesson.generationStatus === 'chunks') {
          handleGenerateChunk('chunk');
        } else if (lesson.generationStatus === 'quiz') {
          handleGenerateChunk('quiz');
        }
      }
    }, { threshold: 0.1 });

    observer.observe(endOfContentRef.current);
    return () => observer.disconnect();
  }, [lesson, generationError]);

  useEffect(() => {
    if (course && lesson) {
      const activeModule = course.modules.find(m => m.lessons.some(l => l._id === lesson._id));
      if (activeModule) {
        setExpandedModules(prev => ({ ...prev, [activeModule._id]: true }));
      }
    }
  }, [course, lesson]);

  useEffect(() => {
    if (lesson?.title) {
      document.title = lesson.title.replace(/^Module\s*\d+:\s*/i, '');
    }
    return () => {
      document.title = 'AI Course App';
    };
  }, [lesson?.title]);

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

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
    <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden print:h-auto print:overflow-visible print:block">
      {/* Sidebar Toggle Overlay / Button */}
      {!isSidebarOpen && (
        <div className="absolute top-1/2 -translate-y-1/2 left-4 z-40 hidden lg:block no-print">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-110 transition-transform"
            title="Unfold"
          >
            <ChevronsRight className="w-6 h-6 ml-0.5" />
          </button>
        </div>
      )}

      {/* Mobile Sidebar Open Button */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-20 bg-dark-800 p-2 rounded-lg border border-white/10 text-slate-300 hover:text-white transition-colors shadow-lg no-print"
          title="Expand Curriculum"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar Navigation */}
      {isSidebarOpen && (
        <aside 
          className="absolute lg:relative inset-y-0 left-0 z-30 bg-dark-900 border-r border-white/5 flex flex-col shadow-xl no-print shrink-0"
          style={{ width: `${leftWidth}px` }}
        >
          <div 
            onMouseDown={startResizeLeft}
            className="hidden lg:flex flex-col justify-center absolute top-0 -right-4 w-8 h-full cursor-col-resize z-50 group"
          >
            <div className="absolute left-4 top-0 h-full w-[2px] bg-transparent group-hover:bg-brand-500 transition-colors" />
            
            <button
              onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }}
              className="absolute left-[2px] w-7 h-7 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-white group-hover:border-white/20 transition-all z-10"
              title="Collapse"
            >
              <ChevronsLeft className="w-4 h-4 mr-0.5" />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <button 
              onClick={() => navigate(`/course/${courseId}`)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Course
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              title="Shrink Curriculum"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          <h3 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-500">Curriculum</h3>
          
          <div className="space-y-4">
            {course.modules.map((module, mIdx) => {
              const isExpanded = expandedModules[module._id];
              return (
                <div key={module._id} className="mb-2">
                  <button 
                    onClick={() => toggleModule(module._id)}
                    className="flex items-center justify-between w-full text-left font-semibold text-slate-300 mb-2 hover:text-white transition-colors"
                  >
                    <span className="pr-4 line-clamp-2">Module {mIdx + 1}: {module.title.replace(/^Module\s*\d+:\s*/i, '')}</span>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-brand-400' : ''}`} />
                  </button>
                  
                  {isExpanded && (
                    <div className="space-y-1 border-l border-white/10 ml-2 pl-4">
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
      )}

      {/* Right Sidebar Toggle Overlay / Button */}
      {lesson && lesson.generationStatus !== 'none' && !isRightSidebarOpen && !error && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-40 hidden lg:block no-print">
          <button
            onClick={() => setIsRightSidebarOpen(true)}
            className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-110 transition-transform group"
            title="Expand AI Tutor"
          >
            <Bot className="w-6 h-6" />
          </button>
        </div>
      )}
      
      {/* Mobile Right Sidebar Toggle */}
      {lesson && lesson.generationStatus !== 'none' && !isRightSidebarOpen && !error && (
        <button
          onClick={() => setIsRightSidebarOpen(true)}
          className="lg:hidden absolute top-4 right-4 z-40 bg-dark-800 p-2 rounded-lg border border-white/10 text-slate-300 hover:text-white transition-colors shadow-lg no-print"
          title="Expand AI Tutor"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}

      <main className="flex-1 bg-dark-950 overflow-y-auto relative print:overflow-visible print:block">
        {!lesson ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : (
          <>
            
            <div className={`w-full max-w-[1400px] mx-auto p-6 md:px-12 pb-32 print-content transition-all duration-300 ${
              !isSidebarOpen ? 'lg:pl-24' : 'lg:pl-16'
            } ${
              !isRightSidebarOpen ? 'lg:pr-24' : 'lg:pr-16'
            }`}>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
                <Link to={`/course/${courseId}`} className="truncate max-w-[150px] md:max-w-[300px] hover:text-slate-300 transition-colors">
                  {course.title}
                </Link>
                <ChevronRight className="w-4 h-4" />
                {(() => {
                  const activeModule = course.modules.find(m => m.lessons.some(l => l._id === lesson._id));
                  return activeModule ? (
                    <>
                      <span className="truncate max-w-[150px] md:max-w-[200px]">{activeModule.title.replace(/^Module\s*\d+:\s*/i, '')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : null;
                })()}
                <span className="text-brand-400">{lesson.title}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-6">
                <h1 className="text-3xl md:text-4xl font-bold">{lesson.title}</h1>
                
                {(lesson.isEnriched || lesson.generationStatus === 'complete') && (
                  <div className="flex items-center gap-3 no-print shrink-0">
                    <button
                      onClick={() => window.print()}
                      title="Download PDF"
                      className="flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleToggleComplete}
                      disabled={savingProgress}
                      title={lesson.completedAt ? "Completed" : "Mark as Complete"}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all ${
                        lesson.completedAt 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' 
                          : 'bg-dark-800 text-slate-300 border border-white/10 hover:bg-dark-700'
                      }`}
                    >
                      {savingProgress ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : lesson.completedAt ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="glass-panel p-6 md:p-8 mb-8">
                {lesson.content && lesson.content.length > 0 && (
                  <LessonRenderer blocks={lesson.content} />
                )}

                {generatingChunk && (
                  <div className="flex flex-col items-center justify-center py-16 border-t border-white/5 mt-8">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                      <div className="relative flex items-center justify-center w-full h-full bg-dark-800 border border-brand-500/30 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                        <Sparkles className="w-8 h-8 text-brand-400 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">
                      Generating lesson content...
                    </p>
                  </div>
                )}

                {generationError && (
                  <div className="text-center py-8 border-t border-white/5 mt-8">
                    <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <p className="text-slate-400 mb-6">{generationError}</p>
                    <button 
                      onClick={() => {
                        const nextChunk = lesson.generationStatus === 'none' ? 'intro' : (lesson.generationStatus === 'intro' ? 'content' : 'quiz');
                        handleGenerateChunk(nextChunk);
                      }} 
                      className="btn-primary shadow-brand-500/20 py-2 px-6"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                
                <div ref={endOfContentRef} className="h-1 w-full" />
              </div>

              {/* Inline mobile AI Tutor removed so it can be a proper sidebar overlay */}
            </div>
          </>
        )}
      </main>

      {/* Right Sidebar AI Tutor */}
      {lesson.generationStatus !== 'none' && isRightSidebarOpen && (
        <aside 
          className="absolute lg:relative inset-y-0 right-0 z-30 flex flex-col shrink-0 border-l border-white/5 bg-dark-900 shadow-xl no-print w-full sm:w-[384px] lg:w-auto"
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${rightWidth}px` : undefined }}
        >
          <div 
            onMouseDown={startResizeRight}
            className="hidden lg:flex absolute top-0 -left-4 w-8 h-full cursor-col-resize z-50 group flex-col justify-center"
          >
            <div className="absolute left-4 top-0 h-full w-[2px] bg-transparent group-hover:bg-brand-500 transition-colors" />
            
            <button
              onClick={(e) => { e.stopPropagation(); setIsRightSidebarOpen(false); }}
              className="absolute right-[2px] w-7 h-7 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-white group-hover:border-white/20 transition-all z-10"
              title="Collapse"
            >
              <ChevronsRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <AITutorChat courseId={courseId} lessonId={id} onClose={() => setIsRightSidebarOpen(false)} />
        </aside>
      )}
    </div>
  );
}

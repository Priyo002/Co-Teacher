import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, Menu, X, ChevronRight } from 'lucide-react';

export default function LessonViewerPage() {
  const { courseId, id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Simulated fetch
  useEffect(() => {
    // In reality, we'd fetch `/api/courses/${courseId}/lessons/${id}`
    setCourse({
      _id: courseId,
      title: 'Introduction to Artificial Intelligence',
      modules: [
        {
          _id: 'm1',
          title: 'Module 1: AI Fundamentals',
          lessons: [
            { _id: 'l1', title: 'What is Artificial Intelligence?', isEnriched: true, completedAt: '2023-10-01' },
            { _id: 'l2', title: 'History of AI', isEnriched: true, completedAt: null }
          ]
        }
      ]
    });
    setLesson({
      _id: id,
      title: 'History of AI',
      content: [],
      isEnriched: true
    });
  }, [courseId, id]);

  if (!course || !lesson) {
    return <div className="p-8 text-center text-slate-400">Loading lesson...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-20 md:hidden bg-dark-800 p-2 rounded-lg border border-white/10 text-slate-300"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`absolute md:static inset-y-0 left-0 z-30 w-72 bg-dark-900 border-r border-white/5 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
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
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
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

      {/* Main Content Area Shell */}
      <main className="flex-1 bg-dark-950 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto p-6 md:p-10 pb-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <span className="truncate max-w-[150px] md:max-w-[300px]">{course.title}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-brand-400">{lesson.title}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-12">{lesson.title}</h1>
          
          <div className="glass-panel p-8 min-h-[400px] flex items-center justify-center text-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">Lesson content will stream here</h2>
              <p className="text-slate-400">Step 18 will implement the LessonRenderer</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

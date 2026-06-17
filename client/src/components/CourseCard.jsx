import { Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight, Trash2 } from 'lucide-react';

export default function CourseCard({ course, onDelete }) {
  const lessonCount = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;
  const completedLessons = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.filter(l => l.completedAt)?.length || 0), 0) || 0;
  const progressPercent = lessonCount === 0 ? 0 : Math.round((completedLessons / lessonCount) * 100);
  
  let buttonText = "Start";
  if (progressPercent > 0 && progressPercent < 100) buttonText = "Resume";
  if (progressPercent === 100) buttonText = "Review";

  return (
    <div className="glass-panel group h-full flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-brand-500/10 relative">
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(course._id);
          }}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="Delete Course"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <div className="p-6 flex flex-col flex-1 mt-2">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-brand-500/10 rounded-xl p-3 text-brand-400 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all">
            <BookOpen className="w-6 h-6" />
          </div>
          {course.isPublic && (
            <span className="bg-dark-600 border border-white/10 text-xs px-2 py-1 rounded-md text-slate-400 mr-8">
              Public
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-slate-400 text-sm mb-6 line-clamp-3">
          {course.description || "No description provided."}
        </p>

        {/* Progress Bar */}
        <div className="mt-auto mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>{completedLessons} / {lessonCount} completed</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-dark-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-500 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{lessonCount} lessons</span>
          </div>
          <Link
            to={`/course/${course._id}`}
            className="flex items-center gap-1 text-brand-400 font-medium group-hover:text-brand-300 transition-colors"
          >
            {buttonText} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

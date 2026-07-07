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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group h-full flex flex-col overflow-hidden relative">
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(course._id);
          }}
          className="absolute top-6 right-6 z-10 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
          title="Delete Course"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-6">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform duration-300">
            <BookOpen className="w-7 h-7" />
          </div>
          {course.isPublic && (
            <span className="bg-slate-100 border border-slate-200 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg text-slate-500 mr-12">
              Public
            </span>
          )}
        </div>
        
        <h3 className="text-2xl font-bold mb-3 line-clamp-2 text-slate-900 tracking-tight group-hover:text-brand-600 transition-colors">{course.title}</h3>
        <p className="text-slate-500 text-base mb-8 line-clamp-3 leading-relaxed">
          {course.description || "No description provided."}
        </p>

        {/* Progress Bar */}
        <div className="mt-auto mb-8">
          <div className="flex justify-between text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
            <span>{completedLessons} / {lessonCount} completed</span>
            <span className={progressPercent === 100 ? "text-green-500" : "text-brand-500"}>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${progressPercent === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Clock className="w-5 h-5" />
            <span>{lessonCount} lessons</span>
          </div>
          <Link
            to={`/course/${course._id}`}
            className="flex items-center gap-2 text-brand-600 font-bold px-6 py-2.5 rounded-xl bg-brand-50 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm"
          >
            {buttonText} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

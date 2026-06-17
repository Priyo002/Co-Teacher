import { Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

export default function CourseCard({ course }) {
  const lessonCount = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;
  
  return (
    <div className="glass-panel group h-full flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-brand-500/10">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-brand-500/10 rounded-xl p-3 text-brand-400 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all">
            <BookOpen className="w-6 h-6" />
          </div>
          {course.isPublic && (
            <span className="bg-dark-600 border border-white/10 text-xs px-2 py-1 rounded-md text-slate-400">
              Public
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-slate-400 text-sm mb-6 line-clamp-3">
          {course.description || "No description provided."}
        </p>
        
        <div className="mt-auto flex items-center justify-between text-sm pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{lessonCount} lessons</span>
          </div>
          <Link
            to={`/course/${course._id}`}
            className="flex items-center gap-1 text-brand-400 font-medium group-hover:text-brand-300 transition-colors"
          >
            Study <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

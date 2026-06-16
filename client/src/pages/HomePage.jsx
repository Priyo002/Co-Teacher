import { useState, useEffect } from 'react';
import { Plus, BookOpen, Loader2 } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import CreateCourseModal from '../components/CreateCourseModal';
import { useApi } from '../hooks/useApi';

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetchApi = useApi();
  
  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await fetchApi('/courses/mine');
        setCourses(data || []);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Courses</h1>
          <p className="text-slate-400">Pick up right where you left off.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary shadow-brand-500/20"
        >
          <Plus className="w-5 h-5" />
          Generate Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center border-dashed border-2 border-white/10 bg-dark-800/30">
          <div className="bg-dark-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-slate-400 max-w-md mb-6">You haven't generated any courses. Use the AI course generator to start learning anything.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-secondary">
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map(course => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}

      <CreateCourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

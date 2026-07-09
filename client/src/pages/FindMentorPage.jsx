import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Search, Star, Clock, GraduationCap, ArrowRight, Video } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';

export default function FindMentorPage() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  
  const fetchApi = useApi();

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const data = await fetchApi('/mentors');
      setMentors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.mentorProfile?.expertise?.some(e => e.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Find a Mentor</h1>
          <p className="text-slate-500 mt-1">Book 1-on-1 sessions with experts to accelerate your learning.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or skill..." 
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map(mentor => (
          <div key={mentor._id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              {mentor.profilePicture ? (
                <img src={mentor.profilePicture} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold text-xl">
                  {mentor.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{mentor.name}</h3>
                <div className="flex gap-2 mt-1">
                  {mentor.mentorProfile?.expertise?.slice(0, 2).map((skill, i) => (
                    <span key={i} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {skill}
                    </span>
                  ))}
                  {mentor.mentorProfile?.expertise?.length > 2 && (
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      +{mentor.mentorProfile.expertise.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 flex-grow line-clamp-3">
              {mentor.mentorProfile?.bio}
            </p>

            <div className="border-t border-slate-100 pt-4 mt-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Rate</span>
                  <div className="font-bold text-slate-900">
                    💎 {mentor.mentorProfile?.rateCredits}/hr
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Or Pay</span>
                  <div className="font-bold text-slate-900">
                    ₹{mentor.mentorProfile?.rateINR}/hr
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedMentor(mentor)}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" /> Book Session
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMentors.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <p className="text-slate-500 text-lg">No mentors found matching your search.</p>
        </div>
      )}

      {selectedMentor && (
        <BookingModal 
          mentor={selectedMentor} 
          isOpen={true} 
          onClose={() => setSelectedMentor(null)} 
        />
      )}
    </div>
  );
}

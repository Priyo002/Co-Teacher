import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Video, Calendar as CalendarIcon, Clock, MapPin, Search, CalendarClock } from 'lucide-react';
import ListSkeleton from '../components/skeletons/ListSkeleton';
import RescheduleModal from '../components/RescheduleModal';
import Pagination from '../components/Pagination';

export default function StudentSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleSession, setRescheduleSession] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const paginatedSessions = sessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchApi = useApi();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await fetchApi('/mentors/sessions');
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ListSkeleton />;

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">My Mentorship Sessions</h1>
        <p className="text-slate-500 mt-2 text-lg">View and manage your upcoming 1-on-1 mentorship bookings.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Booked Sessions</h2>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No sessions booked yet</h3>
            <p className="text-slate-500 font-medium">Head over to the Explore Mentors page to book your first session!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {paginatedSessions.map(session => (
              <div key={session._id} className="border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between md:items-start gap-6 hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200 mt-1">
                    {session.mentor?.profilePicture ? (
                      <img src={session.mentor.profilePicture} alt={session.mentor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xl text-brand-500 bg-brand-50">
                        {session.mentor?.name?.charAt(0) || 'M'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-slate-900 truncate">{session.mentor?.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {session.mentor?.mentorProfile?.location || 'Remote'}</span>
                      <span>•</span>
                      <span className="font-medium text-brand-600">{session.mentor?.mentorProfile?.jobTitle || 'Expert'}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600 mt-3">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg"><CalendarIcon className="w-4 h-4 text-brand-600" /> {new Date(session.startTime).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} IST</span>
                      <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg"><Clock className="w-4 h-4 text-brand-600" /> {session.durationMins} mins</span>
                    </div>
                    {session.notes && (
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 max-w-2xl">
                        <span className="font-semibold block mb-2 text-slate-900">Your Note:</span>
                        <div className="whitespace-pre-wrap leading-relaxed">{session.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 flex-col sm:flex-row">
                  <button 
                    onClick={() => setRescheduleSession(session)}
                    className="w-full sm:w-auto py-3 px-4 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2"
                  >
                    <CalendarClock className="w-4 h-4" /> Reschedule
                  </button>
                  {session.meetingLink ? (
                    <a href={session.meetingLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
                      <Video className="w-4 h-4" />
                      Join Meeting
                    </a>
                  ) : (
                    <span className="w-full sm:w-auto text-sm font-semibold text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200 text-center">
                      Waiting for mentor link
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {sessions.length > 0 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
          />
        )}
      </div>

      {rescheduleSession && (
        <RescheduleModal 
          session={rescheduleSession} 
          onClose={() => setRescheduleSession(null)} 
          onRescheduled={loadSessions} 
        />
      )}
    </div>
  );
}

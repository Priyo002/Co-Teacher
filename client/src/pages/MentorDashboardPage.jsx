import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { Clock, Calendar as CalendarIcon, User, Settings, Video, IndianRupee, Check, Plus, LayoutDashboard, Layout, Briefcase, MapPin, Globe, GraduationCap, X } from 'lucide-react';
import toast from 'react-hot-toast';
import RescheduleModal from '../components/RescheduleModal';
import Pagination from '../components/Pagination';
import MentorDashboardSkeleton from '../components/skeletons/MentorDashboardSkeleton';

export default function MentorDashboardPage() {
  const { user, setUser } = useAuth();
  const fetchApi = useApi();
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions', 'schedule', 'profile'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleSession, setRescheduleSession] = useState(null);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  
  const [currentSessionPage, setCurrentSessionPage] = useState(1);
  const sessionsPerPage = 5;
  const totalSessionPages = Math.ceil(sessions.length / sessionsPerPage);
  const paginatedSessions = sessions.slice((currentSessionPage - 1) * sessionsPerPage, currentSessionPage * sessionsPerPage);
  
  const totalEarningsINR = useMemo(() => {
    return sessions
      .filter(s => s.status === 'confirmed' || s.status === 'completed')
      .filter(s => s.payment?.currency === 'INR')
      .reduce((sum, s) => sum + (s.payment?.amount || 0), 0);
  }, [sessions]);

  const totalSessionsCount = sessions.length;

  // Profile form state
  const [bio, setBio] = useState('');
  const [rateINR, setRateINR] = useState(500);
  const [meetingLink, setMeetingLink] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  
  // New Profile Fields
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [languages, setLanguages] = useState('');
  const [domains, setDomains] = useState('');
  const [skills, setSkills] = useState('');
  const [targetAudience, setTargetAudience] = useState([]);
  const [experienceYears, setExperienceYears] = useState(0);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [proofOfWork, setProofOfWork] = useState('');

  const [availability, setAvailability] = useState([
    { dayOfWeek: 1, slots: [], active: false },
    { dayOfWeek: 2, slots: [], active: false },
    { dayOfWeek: 3, slots: [], active: false },
    { dayOfWeek: 4, slots: [], active: false },
    { dayOfWeek: 5, slots: [], active: false },
    { dayOfWeek: 6, slots: [], active: false },
    { dayOfWeek: 0, slots: [], active: false },
  ]);
  const [dateOverrides, setDateOverrides] = useState([]);

  useEffect(() => {
    if (user && user.isMentor) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const data = await fetchApi('/mentors/profile/details');
      const p = data.mentorProfile || {};
      
      setBio(p.bio || '');
      setRateINR(p.rateINR !== undefined ? p.rateINR : 500);
      setMeetingLink(p.meetingLink || '');
      setUpiId(p.upiId || '');
      setBankDetails(p.bankDetails || '');
      
      setJobTitle(p.jobTitle || '');
      setCompany(p.company || '');
      setLocation(p.location || '');
      setLanguages((p.languages || []).join(', '));
      setDomains((p.domains || []).join(', '));
      setSkills((p.skills || []).join(', '));
      setTargetAudience(p.targetAudience || []);
      setExperienceYears(p.experienceYears || 0);
      setLinkedinUrl(p.linkedinUrl || '');
      setPortfolioUrl(p.portfolioUrl || '');
      setProofOfWork(p.proofOfWork || '');

      if (p.availability?.length > 0) {
        const merged = [...availability];
        p.availability.forEach(dbAvail => {
          const index = merged.findIndex(a => a.dayOfWeek === dbAvail.dayOfWeek);
          if (index !== -1) {
            merged[index] = { ...dbAvail, active: true };
          }
        });
        setAvailability(merged);
      }
      
      if (p.dateOverrides?.length > 0) {
        setDateOverrides(p.dateOverrides);
      }

      const sessionsData = await fetchApi(`/mentors/sessions?role=mentor&t=${Date.now()}`);
      setSessions(sessionsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    if(e) e.preventDefault();
    try {
      const activeAvailability = availability.filter(a => a.active).map(({ dayOfWeek, slots }) => ({ dayOfWeek, slots }));
      await fetchApi('/mentors/profile', {
        method: 'PUT',
        body: JSON.stringify({ 
          bio, 
          rateINR: Number(rateINR), 
          meetingLink, 
          upiId, 
          bankDetails, 
          availability: activeAvailability, 
          dateOverrides,
          jobTitle,
          company,
          location,
          languages: languages.split(',').map(s => s.trim()).filter(Boolean),
          domains: domains.split(',').map(s => s.trim()).filter(Boolean),
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          targetAudience,
          experienceYears: Number(experienceYears),
          linkedinUrl,
          portfolioUrl,
          proofOfWork
        })
      });
      toast.success('Profile & Settings updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  const handleConnectCalendar = async () => {
    setConnectingCalendar(true);
    try {
      const data = await fetchApi('/mentors/auth/google/connect');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to connect Google Calendar');
      setConnectingCalendar(false);
    }
  };

  const handleToggleDay = (dayOfWeek) => {
    setAvailability(prev => prev.map(a => {
      if (a.dayOfWeek === dayOfWeek) {
        const toggled = !a.active;
        let newSlots = [...(a.slots || [])];
        if (toggled && newSlots.length === 0) {
          newSlots = [{ startTime: '09:00', endTime: '17:00' }];
        }
        return { ...a, active: toggled, slots: newSlots };
      }
      return a;
    }));
  };

  const handleTimeChange = (dayOfWeek, slotIndex, field, value) => {
    setAvailability(prev => prev.map(a => {
      if (a.dayOfWeek === dayOfWeek) {
        const newSlots = [...a.slots];
        newSlots[slotIndex][field] = value;
        return { ...a, slots: newSlots };
      }
      return a;
    }));
  };

  const handleAddSlot = (dayOfWeek) => {
    setAvailability(prev => prev.map(a => {
      if (a.dayOfWeek === dayOfWeek) {
        return { ...a, slots: [...(a.slots || []), { startTime: '09:00', endTime: '17:00' }] };
      }
      return a;
    }));
  };

  const handleRemoveSlot = (dayOfWeek, slotIndex) => {
    setAvailability(prev => prev.map(a => {
      if (a.dayOfWeek === dayOfWeek) {
        const newSlots = [...a.slots];
        newSlots.splice(slotIndex, 1);
        return { ...a, slots: newSlots, active: newSlots.length > 0 };
      }
      return a;
    }));
  };

  const handleAddOverride = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDateOverrides(prev => [...prev, { date: todayStr, slots: [] }]);
  };

  const handleOverrideDateChange = (index, newDate) => {
    setDateOverrides(prev => prev.map((o, i) => i === index ? { ...o, date: newDate } : o));
  };

  const handleRemoveOverride = (index) => {
    setDateOverrides(prev => {
      const clone = [...prev];
      clone.splice(index, 1);
      return clone;
    });
  };

  const handleAddOverrideSlot = (overrideIndex) => {
    setDateOverrides(prev => prev.map((o, i) => {
      if (i === overrideIndex) {
        return { ...o, slots: [...(o.slots || []), { startTime: '09:00', endTime: '17:00' }] };
      }
      return o;
    }));
  };

  const handleOverrideTimeChange = (overrideIndex, slotIndex, field, value) => {
    setDateOverrides(prev => prev.map((o, i) => {
      if (i === overrideIndex) {
        const newSlots = [...o.slots];
        newSlots[slotIndex][field] = value;
        return { ...o, slots: newSlots };
      }
      return o;
    }));
  };

  const handleRemoveOverrideSlot = (overrideIndex, slotIndex) => {
    setDateOverrides(prev => prev.map((o, i) => {
      if (i === overrideIndex) {
        const newSlots = [...o.slots];
        newSlots.splice(slotIndex, 1);
        return { ...o, slots: newSlots };
      }
      return o;
    }));
  };

  const handleAudienceToggle = (aud) => {
    setTargetAudience(prev => 
      prev.includes(aud) ? prev.filter(x => x !== aud) : [...prev, aud]
    );
  };

  const daysMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  const audiences = ['High School', 'College', 'Professional', 'Hobbyist'];

  if (!user?.isMentor) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center">
        <h1 className="text-2xl font-bold text-rose-500 mb-4">Access Denied</h1>
        <p className="text-slate-600">You are not registered as a mentor. Please apply to become a mentor first.</p>
      </div>
    );
  }

  const hasActiveAvailability = availability.some(a => a.active && a.slots?.length > 0) || dateOverrides.some(o => o.slots?.length > 0);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      {!hasActiveAvailability && !loading && (
        <div className="mb-8 bg-rose-50 border border-rose-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-rose-100 shrink-0 mx-auto sm:mx-0">
            <Settings className="w-8 h-8 text-rose-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-rose-800 mb-1">Action Required: Set up your availability schedule</h3>
            <p className="text-rose-700 font-medium">
              You must configure your available time slots to be listed on the Mentor Discovery page. 
              Mentors without any active slots in the next 14 days are automatically hidden from students.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('schedule')}
            className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors whitespace-nowrap"
          >
            Set Up Schedule
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Dashboard</h1>
            
            <div className="flex flex-col gap-2">
              {[
                { id: 'sessions', icon: <Video className="w-5 h-5" />, label: 'Upcoming Sessions' },
                { id: 'schedule', icon: <Clock className="w-5 h-5" />, label: 'Manage Schedule' },
                { id: 'profile', icon: <User className="w-5 h-5" />, label: 'Profile & Details' },
                { id: 'payouts', icon: <IndianRupee className="w-5 h-5" />, label: 'Pricing & Payouts' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-colors ${
                    activeTab === tab.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <MentorDashboardSkeleton />
          ) : (
            <div className="space-y-6">
              
              {/* SESSIONS TAB */}
              {activeTab === 'sessions' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Video className="w-5 h-5" /></div>
                      <h2 className="text-2xl font-extrabold text-slate-900">Mentor Dashboard</h2>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-4">Upcoming Sessions</h3>

                  {sessions.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 text-center">
                      <p className="text-slate-500 font-medium">No upcoming sessions booked yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {paginatedSessions.map(session => (
                        <div key={session._id} className="border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between md:items-start gap-6 hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>
                          <div className="flex items-start gap-5 flex-1 min-w-0">
                            <div className="w-14 h-14 shrink-0 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden mt-1">
                              <img 
                                src={session.student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.student.name || 'S')}&background=random`} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.student.name || 'S')}&background=random`; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-xl text-slate-900 truncate">{session.student?.name}</h3>
                              <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600 mt-2">
                                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg"><CalendarIcon className="w-4 h-4 text-brand-600" /> {new Date(session.startTime).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} IST</span>
                                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg"><Clock className="w-4 h-4 text-brand-600" /> {session.durationMins} mins</span>
                              </div>
                              {session.notes && (
                                <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 max-w-2xl">
                                  <span className="font-semibold block mb-2 text-slate-900">Student's Note:</span>
                                  <div className="whitespace-pre-wrap leading-relaxed">{session.notes}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                            <button 
                              onClick={() => setRescheduleSession(session)}
                              className="w-full sm:w-auto py-3 px-4 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2"
                            >
                              <Clock className="w-4 h-4" /> Reschedule
                            </button>
                            {session.meetingLink ? (
                              <a href={session.meetingLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all">
                                <Video className="w-4 h-4" /> Join Meeting
                              </a>
                            ) : (
                              <span className="w-full sm:w-auto text-sm font-semibold text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200 text-center">
                                Meeting Link Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sessions.length > 0 && (
                    <Pagination 
                      currentPage={currentSessionPage} 
                      totalPages={totalSessionPages} 
                      onPageChange={(page) => {
                        setCurrentSessionPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} 
                    />
                  )}
                </div>
              )}

              {/* SCHEDULE TAB */}
              {activeTab === 'schedule' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900">Manage Schedule</h2>
                      <p className="text-slate-500 text-sm">Set your weekly recurring availability and specific date overrides.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><Video className="w-5 h-5 text-brand-600" /> Google Meet Integration</h3>
                    <p className="text-sm text-slate-600 mb-5">Automatically generate unique Google Meet links for every booked session. This is required before students can book sessions with you.</p>
                    
                    {user?.mentorProfile?.googleRefreshToken ? (
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl font-bold max-w-fit">
                        <Check className="w-5 h-5" />
                        Google Calendar Connected
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={handleConnectCalendar}
                        disabled={connectingCalendar}
                        className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold shadow-sm transition-all disabled:opacity-50"
                      >
                        {connectingCalendar ? (
                           <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            <path fill="none" d="M1 1h22v22H1z" />
                          </svg>
                        )}
                        Connect Google Calendar
                      </button>
                    )}
                  </div>

                  {!user?.mentorProfile?.googleRefreshToken ? (
                    <div className="bg-orange-50 border-2 border-orange-200 border-dashed rounded-2xl p-8 text-center text-orange-700 mb-8">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-orange-100">
                        <Video className="w-8 h-8 text-orange-500" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Google Calendar Required</h3>
                      <p className="font-medium max-w-md mx-auto">Please connect your Google Calendar in the section above to unlock your schedule and allow students to book sessions with you.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10">
                    <div className="divide-y divide-slate-100">
                      {availability.map((day) => (
                        <div key={day.dayOfWeek} className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50 transition-colors gap-4">
                          <div className="flex items-center gap-4 w-40 shrink-0">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={day.active}
                                onChange={() => handleToggleDay(day.dayOfWeek)}
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                            </label>
                            <span className={`font-bold ${day.active ? 'text-slate-900' : 'text-slate-400'}`}>
                              {daysMap[day.dayOfWeek]}
                            </span>
                          </div>

                          {day.active ? (
                            <div className="flex-1 flex flex-col gap-3 md:items-end">
                              {(day.slots || []).map((slot, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <input 
                                    type="time" 
                                    value={slot.startTime}
                                    onChange={(e) => handleTimeChange(day.dayOfWeek, index, 'startTime', e.target.value)}
                                    className="border border-slate-200 rounded-lg px-3 py-2 font-medium text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                                  />
                                  <span className="text-slate-400 font-bold">-</span>
                                  <input 
                                    type="time" 
                                    value={slot.endTime}
                                    onChange={(e) => handleTimeChange(day.dayOfWeek, index, 'endTime', e.target.value)}
                                    className="border border-slate-200 rounded-lg px-3 py-2 font-medium text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                                  />
                                  <button onClick={() => handleRemoveSlot(day.dayOfWeek, index)} className="text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors p-2 text-lg leading-none flex items-center justify-center w-9 h-9 shadow-sm" title="Remove slot">
                                    &times;
                                  </button>
                                </div>
                              ))}
                              <button onClick={() => handleAddSlot(day.dayOfWeek)} className="text-sm bg-brand-50 text-brand-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-100 transition-colors w-fit">
                                <Plus className="w-4 h-4" /> Add hours
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm font-semibold text-slate-400 flex-1 md:text-right py-2">Unavailable</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Date Overrides</h3>
                      <p className="text-slate-500 text-sm mt-1">Add specific dates when your availability changes from the weekly schedule.</p>
                    </div>
                    <button onClick={handleAddOverride} className="btn-secondary py-2 px-4 text-sm font-bold flex items-center gap-2 shadow-sm shrink-0">
                      <Plus className="w-4 h-4" /> Add Date Override
                    </button>
                  </div>

                  {dateOverrides.length > 0 ? (
                    <div className="space-y-4 mb-8">
                      {dateOverrides.map((override, overrideIndex) => (
                        <div key={overrideIndex} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-slate-200 gap-4">
                            <div className="flex items-center gap-4">
                              <input 
                                type="date"
                                value={override.date}
                                onChange={(e) => handleOverrideDateChange(overrideIndex, e.target.value)}
                                className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"
                              />
                              <span className="text-sm text-slate-500 font-bold">
                                {override.slots?.length > 0 ? 'Available Hours' : <span className="text-rose-500 font-bold bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm">Unavailable (Full Day)</span>}
                              </span>
                            </div>
                            <button onClick={() => handleRemoveOverride(overrideIndex)} className="text-slate-500 hover:text-rose-600 font-semibold text-sm transition-colors flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-rose-50 shadow-sm">
                              <X className="w-4 h-4" /> Remove
                            </button>
                          </div>

                          <div className="space-y-3">
                            {(override.slots || []).map((slot, slotIndex) => (
                              <div key={slotIndex} className="flex items-center gap-3">
                                <input 
                                  type="time" 
                                  value={slot.startTime}
                                  onChange={(e) => handleOverrideTimeChange(overrideIndex, slotIndex, 'startTime', e.target.value)}
                                  className="border border-slate-200 rounded-lg px-3 py-2 font-medium text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500 bg-white"
                                />
                                <span className="text-slate-400 font-bold">-</span>
                                <input 
                                  type="time" 
                                  value={slot.endTime}
                                  onChange={(e) => handleOverrideTimeChange(overrideIndex, slotIndex, 'endTime', e.target.value)}
                                  className="border border-slate-200 rounded-lg px-3 py-2 font-medium text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500 bg-white"
                                />
                                <button onClick={() => handleRemoveOverrideSlot(overrideIndex, slotIndex)} className="text-slate-400 hover:text-rose-500 bg-white border border-slate-200 rounded-lg transition-colors flex items-center justify-center w-9 h-9 hover:bg-rose-50 shadow-sm" title="Remove slot">
                                  &times;
                                </button>
                              </div>
                            ))}
                            <button onClick={() => handleAddOverrideSlot(overrideIndex)} className="text-sm text-brand-700 bg-white border border-slate-200 shadow-sm hover:bg-brand-50 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors w-fit">
                              <Plus className="w-4 h-4" /> Add hours
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-500 font-medium mb-8">
                      No specific date overrides added yet.
                    </div>
                  )}
                  
                  <div className="pt-6 border-t border-slate-200 flex justify-end">
                    <button onClick={handleUpdateProfile} className="btn-primary py-3 px-6 flex items-center gap-2 shadow-lg">
                      <Check className="w-5 h-5" /> Save Schedule Updates
                    </button>
                  </div>
                    </>
                  )}
                </div>
              )}

              {/* PROFILE & DETAILS TAB */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><User className="w-5 h-5" /></div>
                      <div>
                        <h2 className="text-2xl font-extrabold text-slate-900">Professional Profile</h2>
                        <p className="text-slate-500 text-sm">Update your public details and bio.</p>
                      </div>
                    </div>
                    <button onClick={handleUpdateProfile} className="btn-primary py-2 px-5 hidden md:flex items-center gap-2 shadow-md">
                      <Check className="w-4 h-4" /> Save Profile
                    </button>
                  </div>

                  <form className="space-y-8" onSubmit={handleUpdateProfile}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" /> Job Title</label>
                        <input type="text" className="input-field shadow-sm bg-slate-50/50" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-slate-400" /> Company</label>
                        <input type="text" className="input-field shadow-sm bg-slate-50/50" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Location</label>
                        <input type="text" className="input-field shadow-sm bg-slate-50/50" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Remote, India" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Years of Experience</label>
                        <input type="number" className="input-field shadow-sm bg-slate-50/50" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} min="0" />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Skills & Mentorship</h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">Domains (comma separated)</label>
                          <input type="text" className="input-field shadow-sm bg-slate-50/50" value={domains} onChange={e => setDomains(e.target.value)} placeholder="Frontend, System Design, Career Guidance" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">Core Skills (comma separated)</label>
                          <input type="text" className="input-field shadow-sm bg-slate-50/50" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, Python, AWS" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-slate-400" /> Target Audience</label>
                          <div className="flex flex-wrap gap-3">
                            {audiences.map(aud => (
                              <button
                                key={aud}
                                type="button"
                                onClick={() => handleAudienceToggle(aud)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold border shadow-sm transition-all flex items-center gap-2 ${
                                  targetAudience.includes(aud) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {aud}
                                {targetAudience.includes(aud) && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Globe className="w-4 h-4 text-slate-400" /> Spoken Languages (comma separated)</label>
                          <input type="text" className="input-field shadow-sm bg-slate-50/50" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Hindi, Bengali" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Mentor Bio</label>
                      <textarea 
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className="input-field shadow-sm bg-slate-50/50 min-h-[150px] leading-relaxed"
                        placeholder="Tell students about yourself, your background, and how you can help them..."
                      />
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">External Links</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">LinkedIn URL</label>
                          <input type="url" className="input-field shadow-sm bg-slate-50/50" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">Portfolio/GitHub URL</label>
                          <input type="url" className="input-field shadow-sm bg-slate-50/50" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://github.com/..." />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">Proof of Work (Link)</label>
                          <input type="url" className="input-field shadow-sm bg-slate-50/50" value={proofOfWork} onChange={e => setProofOfWork(e.target.value)} placeholder="Link to an article, project, or video..." />
                        </div>
                      </div>
                    </div>
                    
                    <button type="submit" className="w-full md:hidden btn-primary py-3 flex items-center justify-center gap-2 shadow-lg mt-8">
                      <Check className="w-5 h-5" /> Save Profile
                    </button>
                  </form>
                </div>
              )}

              {/* PAYOUTS TAB */}
              {activeTab === 'payouts' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><IndianRupee className="w-5 h-5" /></div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900">Pricing & Payouts</h2>
                      <p className="text-slate-500 text-sm">Set your session rates and payout methods.</p>
                    </div>
                  </div>

                  {/* Earnings Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-slate-500 uppercase">Total Sessions</p>
                      <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalSessionsCount}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-emerald-600 uppercase">Earnings (INR)</p>
                      <p className="text-3xl font-extrabold text-emerald-700 mt-1">₹{totalEarningsINR.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-xl p-4 mb-8 text-sm flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 shrink-0"><IndianRupee className="w-full h-full text-blue-600" /></div>
                    <div>
                      <p className="font-bold mb-1">Payout Information</p>
                      <p>All mentor payouts are processed at the end of every month. Please ensure your Bank Details or UPI ID are correctly filled below to avoid any delays in receiving your earnings.</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-2xl">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-emerald-900 mb-4">Session Pricing</h3>
                      <label className="block text-sm font-bold text-emerald-800 mb-2">Rate per 60 Minute Session (INR)</label>
                      <div className="relative max-w-xs">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">₹</span>
                        <input 
                          type="number" 
                          value={rateINR}
                          onChange={e => setRateINR(e.target.value)}
                          className="input-field pl-10 bg-white font-bold text-lg shadow-sm"
                          min="0"
                        />
                      </div>
                      <p className="text-xs text-emerald-700 mt-2 font-medium">This is the amount students will pay to book a 1-hour session with you.</p>
                    </div>



                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Payout Details</h3>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">UPI ID</label>
                        <input 
                          type="text" 
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                          className="input-field shadow-sm bg-slate-50/50 font-mono"
                          placeholder="name@okbank"
                        />
                        <p className="text-xs text-slate-500 mt-2 font-medium">Your earnings will be transferred here at the end of each month.</p>
                      </div>
                    </div>

                    <div className="pt-8">
                      <button type="submit" className="btn-primary py-3 px-8 flex items-center gap-2 shadow-lg">
                        <Check className="w-5 h-5" /> Save Pricing & Payouts
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
      
      {rescheduleSession && (
        <RescheduleModal 
          session={rescheduleSession} 
          onClose={() => setRescheduleSession(null)} 
          onRescheduled={loadData} 
        />
      )}
    </div>
  );
}

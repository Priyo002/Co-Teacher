import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { Clock, Calendar as CalendarIcon, User, Settings, Video, IndianRupee, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MentorDashboardPage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile form state
  const [bio, setBio] = useState(user?.mentorProfile?.bio || '');
  const [rateCredits, setRateCredits] = useState(user?.mentorProfile?.rateCredits || 0);
  const [rateINR, setRateINR] = useState(user?.mentorProfile?.rateINR || 0);
  const [meetingLink, setMeetingLink] = useState(user?.mentorProfile?.meetingLink || '');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [availability, setAvailability] = useState([
    { dayOfWeek: 1, slots: [{ startTime: '09:00', endTime: '17:00' }], active: true },
    { dayOfWeek: 2, slots: [{ startTime: '09:00', endTime: '17:00' }], active: true },
    { dayOfWeek: 3, slots: [{ startTime: '09:00', endTime: '17:00' }], active: true },
    { dayOfWeek: 4, slots: [{ startTime: '09:00', endTime: '17:00' }], active: true },
    { dayOfWeek: 5, slots: [{ startTime: '09:00', endTime: '17:00' }], active: true },
    { dayOfWeek: 6, slots: [{ startTime: '09:00', endTime: '17:00' }], active: false },
    { dayOfWeek: 0, slots: [{ startTime: '09:00', endTime: '17:00' }], active: false },
  ]);
  const [dateOverrides, setDateOverrides] = useState([]);

  const fetchApi = useApi();

  useEffect(() => {
    if (user && user.isMentor) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const data = await fetchApi('/mentors/profile/details');
      setBio(data.mentorProfile?.bio || '');
      setRateCredits(data.mentorProfile?.rateCredits || 0);
      setRateINR(data.mentorProfile?.rateINR || 0);
      setMeetingLink(data.mentorProfile?.meetingLink || '');
      setUpiId(data.mentorProfile?.upiId || '');
      setBankDetails(data.mentorProfile?.bankDetails || '');
      
      if (data.mentorProfile?.availability?.length > 0) {
        const merged = [...availability];
        data.mentorProfile.availability.forEach(dbAvail => {
          const index = merged.findIndex(a => a.dayOfWeek === dbAvail.dayOfWeek);
          if (index !== -1) {
            merged[index] = { ...dbAvail, active: true };
          }
        });
        setAvailability(merged);
      }
      
      if (data.mentorProfile?.dateOverrides?.length > 0) {
        setDateOverrides(data.mentorProfile.dateOverrides);
      }

      const sessionsData = await fetchApi('/mentors/sessions?role=mentor');
      setSessions(sessionsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const activeAvailability = availability.filter(a => a.active).map(({ dayOfWeek, slots }) => ({ dayOfWeek, slots }));
      await fetchApi('/mentors/profile', {
        method: 'PUT',
        body: JSON.stringify({ bio, rateCredits, rateINR, meetingLink, upiId, bankDetails, availability: activeAvailability, dateOverrides })
      });
      toast.success('Profile & Availability updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
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

  const daysMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

  if (!user?.isMentor) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center">
        <h1 className="text-2xl font-bold text-rose-500 mb-4">Access Denied</h1>
        <p className="text-slate-600">You are not registered as a mentor. Please apply to become a mentor first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Mentor Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-8">
        {[
          { id: 'sessions', icon: <Video className="w-4 h-4" />, label: 'Upcoming Sessions' },
          { id: 'schedule', icon: <Clock className="w-4 h-4" />, label: 'Manage Slots' },
          { id: 'profile', icon: <Settings className="w-4 h-4" />, label: 'Profile & Payouts' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          
          {/* SESSIONS TAB */}
          {activeTab === 'sessions' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Upcoming Sessions</h2>
              {sessions.length === 0 ? (
                <p className="text-slate-500">No upcoming sessions booked yet.</p>
              ) : (
                <div className="grid gap-4">
                  {sessions.map(session => (
                    <div key={session._id} className="border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        {session.student?.profilePicture ? (
                          <img src={session.student.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                            {session.student?.name?.charAt(0) || 'S'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-lg">{session.student?.name}</h3>
                          <div className="flex gap-3 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> {new Date(session.startTime).toLocaleString()}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {session.durationMins} mins</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {session.meetingLink ? (
                          <a href={session.meetingLink} target="_blank" rel="noreferrer" className="btn-primary py-2 px-4 text-sm">
                            Join Meeting
                          </a>
                        ) : (
                          <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">No meeting link set</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold">Weekly Availability</h2>
                <p className="text-slate-500 text-sm mt-1">Set your recurring weekly schedule. Students can book 60m sessions within these hours.</p>
              </div>

              <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {availability.map((day) => (
                    <div key={day.dayOfWeek} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 w-32">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={day.active}
                            onChange={() => handleToggleDay(day.dayOfWeek)}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                        </label>
                        <span className={`font-semibold ${day.active ? 'text-slate-900' : 'text-slate-400'}`}>
                          {daysMap[day.dayOfWeek]}
                        </span>
                      </div>

                      {day.active ? (
                        <div className="flex-1 flex flex-col gap-2 items-end">
                          {(day.slots || []).map((slot, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <input 
                                type="time" 
                                value={slot.startTime}
                                onChange={(e) => handleTimeChange(day.dayOfWeek, index, 'startTime', e.target.value)}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                              />
                              <span className="text-slate-400">-</span>
                              <input 
                                type="time" 
                                value={slot.endTime}
                                onChange={(e) => handleTimeChange(day.dayOfWeek, index, 'endTime', e.target.value)}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                              />
                              <button onClick={() => handleRemoveSlot(day.dayOfWeek, index)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 text-lg leading-none" title="Remove slot">
                                &times;
                              </button>
                            </div>
                          ))}
                          <button onClick={() => handleAddSlot(day.dayOfWeek)} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mt-1">
                            <Plus className="w-3 h-3" /> Add hours
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 flex-1 text-right">Unavailable</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-10 mb-6 flex items-center justify-between max-w-2xl">
                <div>
                  <h2 className="text-xl font-bold">Date Overrides</h2>
                  <p className="text-slate-500 text-sm mt-1">Add specific dates when your availability changes from the weekly schedule.</p>
                </div>
                <button onClick={handleAddOverride} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <Plus className="w-4 h-4" /> Add Date
                </button>
              </div>

              {dateOverrides.length > 0 ? (
                <div className="max-w-2xl space-y-4">
                  {dateOverrides.map((override, overrideIndex) => (
                    <div key={overrideIndex} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                          <input 
                            type="date"
                            value={override.date}
                            onChange={(e) => handleOverrideDateChange(overrideIndex, e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                          />
                          <span className="text-sm text-slate-500 font-medium">
                            {override.slots?.length > 0 ? 'Available Hours:' : <span className="text-rose-500 font-semibold bg-rose-50 px-2 py-1 rounded">Unavailable (Full Day)</span>}
                          </span>
                        </div>
                        <button onClick={() => handleRemoveOverride(overrideIndex)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 bg-slate-50 rounded-lg" title="Delete Override">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(override.slots || []).map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center gap-3">
                            <input 
                              type="time" 
                              value={slot.startTime}
                              onChange={(e) => handleOverrideTimeChange(overrideIndex, slotIndex, 'startTime', e.target.value)}
                              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            />
                            <span className="text-slate-400">-</span>
                            <input 
                              type="time" 
                              value={slot.endTime}
                              onChange={(e) => handleOverrideTimeChange(overrideIndex, slotIndex, 'endTime', e.target.value)}
                              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            />
                            <button onClick={() => handleRemoveOverrideSlot(overrideIndex, slotIndex)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 text-lg leading-none" title="Remove slot">
                              &times;
                            </button>
                          </div>
                        ))}
                        <button onClick={() => handleAddOverrideSlot(overrideIndex)} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mt-1">
                          <Plus className="w-3 h-3" /> Add hours
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-2xl bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 text-center text-slate-500 text-sm">
                  No specific date overrides added yet.
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end max-w-2xl">
                <button onClick={handleUpdateProfile} className="btn-primary flex items-center gap-2">
                  <Check className="w-4 h-4" /> Save Schedule
                </button>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Profile & Payout Settings</h2>
              <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mentor Bio</label>
                  <textarea 
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="input-field min-h-[100px]"
                    placeholder="Tell students about yourself..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Rate per Hour (Credits)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">💎</span>
                      <input 
                        type="number" 
                        value={rateCredits}
                        onChange={e => setRateCredits(e.target.value)}
                        className="input-field pl-10"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Rate per Hour (INR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                      <input 
                        type="number" 
                        value={rateINR}
                        onChange={e => setRateINR(e.target.value)}
                        className="input-field pl-8"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Default Meeting Link (Google Meet / Zoom)</label>
                  <input 
                    type="url" 
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    className="input-field"
                    placeholder="https://meet.google.com/..."
                  />
                  <p className="text-xs text-slate-500 mt-1">This link will be shared with students after they book a session.</p>
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-bold mb-4">Payout Details</h3>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">UPI ID</label>
                    <input 
                      type="text" 
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="input-field"
                      placeholder="name@okbank"
                    />
                    <p className="text-xs text-slate-500 mt-1">Your earnings will be transferred here at the end of each month.</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" className="btn-primary">
                    <Check className="w-4 h-4 mr-2" /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

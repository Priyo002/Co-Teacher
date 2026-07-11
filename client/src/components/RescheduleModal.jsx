import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { X, Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RescheduleModal({ session, onClose, onRescheduled }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const fetchApi = useApi();

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      const data = await fetchApi(`/mentors/${session.mentor._id || session.mentor}/slots`);
      setSlots(data);
    } catch (err) {
      toast.error('Failed to load mentor availability');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setRescheduling(true);
    try {
      await fetchApi(`/mentors/sessions/${session._id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ newStartTime: selectedSlot.startTime, newSlotId: selectedSlot._id })
      });
      toast.success('Session rescheduled successfully!');
      onRescheduled();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to reschedule session');
    } finally {
      setRescheduling(false);
    }
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    const dateStr = new Date(slot.startTime).toLocaleDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(slot);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">Reschedule Session</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm font-semibold text-slate-500 uppercase mb-4 tracking-wider">Select New Time Slot (IST)</p>
          
          {loading ? (
            <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div></div>
          ) : Object.keys(groupedSlots).length === 0 ? (
            <p className="text-center text-slate-500 p-8">No availability found.</p>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedSlots).map(dateStr => (
                <div key={dateStr}>
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-brand-500" /> {dateStr}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {groupedSlots[dateStr].map(slot => (
                      <button
                        key={slot._id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                          selectedSlot?._id === slot._id 
                          ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-500' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleReschedule}
            disabled={!selectedSlot || rescheduling}
            className="flex-1 py-3 px-4 btn-primary rounded-xl font-bold shadow-md flex justify-center items-center gap-2"
          >
            {rescheduling ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check className="w-5 h-5" /> Confirm Reschedule</>}
          </button>
        </div>
      </div>
    </div>
  );
}

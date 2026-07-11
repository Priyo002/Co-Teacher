import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar as CalendarIcon, Clock, CreditCard, Gem } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

export default function BookingModal({ mentor, isOpen, onClose }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [context, setContext] = useState('');
  const duration = 60; // Hardcoded to 60 mins
  const [booking, setBooking] = useState(false);
  
  const fetchApi = useApi();

  useEffect(() => {
    if (isOpen && mentor) {
      fetchSlots();
    }
  }, [isOpen, mentor]);

  const fetchSlots = async () => {
    try {
      const data = await fetchApi(`/mentors/${mentor._id}/slots`);
      setSlots(data);
      if (data.length > 0) {
        const firstDate = new Date(data[0].startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        setSelectedDateStr(firstDate);
      }
    } catch (err) {
      toast.error("Failed to load mentor availability");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return toast.error("Please select a time slot");
    
    setBooking(true);
    try {
      const res = await fetchApi('/mentors/sessions/book', {
        method: 'POST',
        body: JSON.stringify({
          mentorId: mentor._id,
          startTime: selectedSlot.startTime,
          durationMins: duration,
          context,
          paymentMethod: 'razorpay'
        })
      });

      if (res.freeSession) {
        toast.success("Free session successfully booked!");
        onClose();
        return;
      }

      // Implement Razorpay flow
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: res.amount,
        currency: res.currency,
        name: "Co-Teacher",
        description: `Mentorship with ${mentor.name}`,
          order_id: res.orderId,
          timeout: 300, // 5 minutes in seconds
          handler: async function (response) {
            try {
              await fetchApi('/mentors/verify', {
                method: 'POST',
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  sessionId: res.sessionId
                })
              });
              toast.success("Payment verified and session booked!");
              onClose();
            } catch (err) {
              toast.error("Payment verification failed");
            }
          },
          theme: { color: "#4F46E5" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (err) {
      toast.error(err.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (!isOpen) return null;

  const inrCost = mentor?.mentorProfile?.rateINR !== undefined 
    ? Math.round(mentor.mentorProfile.rateINR) 
    : 500;

  const groupedSlots = slots.reduce((acc, slot) => {
    const date = new Date(slot.startTime);
    const dateString = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[dateString]) acc[dateString] = [];
    acc[dateString].push(slot);
    return acc;
  }, {});

  const dates = Object.keys(groupedSlots);

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">Book Session</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow flex flex-col min-h-0 pl-6 pt-6 pb-6 pr-2">
          <div className="overflow-y-auto flex-grow custom-scrollbar pr-4 pb-2">
          {/* Mentor Summary */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 bg-gradient-to-br from-slate-50 to-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            {mentor?.profilePicture ? (
              <img src={mentor.profilePicture} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm shrink-0" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 rounded-full flex items-center justify-center font-extrabold text-3xl border-4 border-white shadow-sm shrink-0">
                {mentor?.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-extrabold text-xl text-slate-900">{mentor?.name}</h3>
              <p className="text-sm font-semibold text-brand-600 mt-0.5">
                {mentor?.mentorProfile?.jobTitle || 'Expert'} {mentor?.mentorProfile?.company && `at ${mentor.mentorProfile.company}`}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-medium text-slate-500 mt-3">
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  {mentor?.mentorProfile?.location || 'Remote'}
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  {mentor?.mentorProfile?.languages?.join(', ') || 'English'}
                </span>
              </div>
            </div>
          </div>
          {/* Duration selection removed - defaulted to 60 minutes */}

          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Available Slots (IST)
          </h3>
          {loading ? (
            <div className="flex flex-col md:flex-row gap-6 mb-8 border border-slate-200 rounded-2xl p-4 bg-white shadow-sm animate-pulse">
              {/* Skeleton Left: Date selector */}
              <div className="w-full md:w-1/3 md:border-r border-slate-100 md:pr-6 flex flex-col gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-11 bg-slate-100 rounded-xl w-full"></div>
                ))}
              </div>
              {/* Skeleton Right: Time slots */}
              <div className="w-full md:w-2/3 md:pl-2 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-11 bg-slate-100 rounded-xl w-full"></div>
                ))}
              </div>
            </div>
          ) : slots.length === 0 ? (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm border border-amber-200 mb-8">
              No available slots at the moment.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 mb-8 border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
              {/* Left: Date selector */}
              <div className="w-full md:w-1/3 md:border-r border-slate-100 md:pr-6 flex flex-col">
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-64 pb-2 md:pb-0 pr-2 custom-scrollbar">
                  {dates.map(date => (
                    <button 
                      key={date}
                      onClick={() => { setSelectedDateStr(date); setSelectedSlot(null); }}
                      className={`shrink-0 w-[120px] md:w-full text-center md:text-left p-3 rounded-xl text-sm font-bold transition-all
                        ${selectedDateStr === date 
                          ? 'bg-brand-50 text-brand-700 border border-brand-500' 
                          : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                        }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Right: Time slots */}
              <div className="w-full md:w-2/3 md:pl-2 flex flex-col">
                <div className="max-h-64 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start custom-scrollbar">
                {groupedSlots[selectedDateStr]?.map(slot => {
                  const canBook = slot.bookedDuration + duration <= 60;
                  return (
                    <button
                      key={slot._id}
                      disabled={!canBook}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-sm font-bold flex justify-center items-center transition-all
                        ${selectedSlot?._id === slot._id 
                          ? 'border-brand-500 bg-brand-600 text-white shadow-md' 
                          : canBook 
                            ? 'border-brand-200 text-brand-700 hover:border-brand-400 hover:bg-brand-50' 
                            : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                        }
                      `}
                    >
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Note for Mentor (Optional)
            </h3>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 focus:bg-white transition-all resize-none"
              rows="3"
              placeholder="Briefly describe what you'd like to discuss or need help with..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            ></textarea>
          </div>

          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Order Summary
          </h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center mb-2">
            <span className="text-slate-600 font-medium">1 Hour Mentorship Session</span>
            {inrCost === 0 ? (
              <span className="font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg text-lg border border-emerald-200">Free</span>
            ) : (
              <span className="font-bold text-slate-900 text-lg">₹{inrCost}</span>
            )}
          </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleBook}
            disabled={!selectedSlot || booking}
            className="w-full btn-primary py-4 text-lg"
          >
            {booking ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

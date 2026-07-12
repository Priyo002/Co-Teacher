import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Zap, Trophy, Settings, CreditCard, Activity, LogOut, ChevronDown, ShieldAlert, Award, Video, BrainCircuit, TerminalSquare } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import PaymentModal from '../PaymentModal';

export default function DashboardLayout({ children }) {
  const { logout, user } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isTestPage = location.pathname.endsWith('/test');

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <div className="absolute top-0 right-0 w-[800px] h-[400px] bg-brand-100/40 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      
      {!isTestPage && (
        <header className="border-b border-slate-200 bg-white/70 backdrop-blur-xl sticky top-0 z-[100] print:hidden">
        <div className="w-full px-6 md:px-12 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-brand-600 p-2 rounded-xl shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Co-Teacher</span>
          </Link>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-full transition-colors shadow-sm"
              title="Buy more credits"
            >
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-semibold">{user?.credits ?? 0}</span>
            </button>
            <Link 
              to="/ide"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 rounded-full transition-colors shadow-sm"
              title="Standalone Code IDE"
            >
              <TerminalSquare className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-semibold hidden sm:block">IDE</span>
            </Link>
            <Link 
              to="/leaderboard"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 rounded-full transition-colors shadow-sm"
              title="Global Leaderboard"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold hidden sm:block">Leaderboard</span>
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 bg-white border border-slate-200 hover:border-slate-300 rounded-full transition-colors shadow-sm focus:outline-none"
              >
                {user?.profilePicture ? (
                  <>
                    <img 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover" 
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.style.display = 'none'; 
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = 'flex'; 
                        }
                      }} 
                    />
                    <div className="w-8 h-8 rounded-full bg-brand-100 items-center justify-center font-bold text-brand-700 hidden">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 mr-1 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[100] animate-slide-up origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-100 mb-2">
                    <div className="font-bold text-slate-900 truncate">{user?.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  >
                    <Settings className="w-4 h-4" /> My Profile
                  </Link>
                  <Link 
                    to="/my-sessions" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  >
                    <Video className="w-4 h-4" /> My Mentorships
                  </Link>
                  <Link 
                    to="/analytics" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  >
                    <BrainCircuit className="w-4 h-4" /> Study Analytics
                  </Link>
                  <Link 
                    to="/billing" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" /> Billing History
                  </Link>
                  <Link 
                    to="/credit-history" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  >
                    <Activity className="w-4 h-4" /> Credit History
                  </Link>
                  <Link 
                    to="/mentors" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  >
                    <Video className="w-4 h-4" /> Hire a Mentor
                  </Link>
                  <div className="h-px bg-slate-100 my-2"></div>

                  {user?.isAdmin && (
                    <Link 
                      to="/admin" 
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4" /> Admin Dashboard
                    </Link>
                  )}

                  {user?.isMentor ? (
                    <Link 
                      to="/mentor-dashboard" 
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Video className="w-4 h-4" /> Mentor Dashboard
                    </Link>
                  ) : (
                    <Link 
                      to="/become-mentor" 
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Award className="w-4 h-4" /> Become a Mentor
                    </Link>
                  )}
                  
                  <div className="h-px bg-slate-100 my-2"></div>
                  
                  <button 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }} 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      )}

      <main className="flex-1 w-full">
        {children}
      </main>

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
      />
    </div>
  );
}

import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Zap, User, Trophy } from 'lucide-react';
import { useState } from 'react';
import PaymentModal from '../PaymentModal';

export default function DashboardLayout({ children }) {
  const { logout, user } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const location = useLocation();
  const isTestPage = location.pathname.endsWith('/test');
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <div className="absolute top-0 right-0 w-[800px] h-[400px] bg-brand-100/40 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      
      {!isTestPage && (
        <header className="border-b border-slate-200 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
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
              to="/leaderboard"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 rounded-full transition-colors shadow-sm"
              title="Global Leaderboard"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold hidden sm:block">Leaderboard</span>
            </Link>
            <Link 
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 rounded-full transition-colors shadow-sm"
              title="Profile Settings"
            >
              <User className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-semibold hidden sm:block">{user?.name}</span>
            </Link>
            <button onClick={logout} className="px-5 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-full text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all">
              Log Out
            </button>
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

import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { logout, user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <div className="absolute top-0 right-0 w-[800px] h-[400px] bg-brand-100/40 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="w-full px-6 md:px-12 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-brand-600 p-2 rounded-xl shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Co-Teacher</span>
          </Link>
          <div className="flex items-center gap-6">
            <div className="text-sm font-semibold text-slate-600 hidden sm:block">{user?.name}</div>
            <button onClick={logout} className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-full text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}

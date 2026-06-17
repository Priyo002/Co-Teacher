import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function DashboardLayout({ children }) {
  const { logout, user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="ambient-light opacity-50"></div>
      
      <header className="border-b border-white/5 bg-dark-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-gradient-brand">TextToLearn</Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-300 hidden sm:block">{user?.name}</div>
            <button onClick={logout} className="btn-secondary py-2 px-4 text-xs">
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

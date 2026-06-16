import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden">
      <div className="ambient-light"></div>
      <div className="ambient-light-bottom"></div>
      
      <div className="glass-panel w-full max-w-md p-8 relative z-10 text-center animate-slide-up">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-slate-400 mb-8">Sign in to continue your learning journey.</p>
        
        <button onClick={() => login()} className="btn-primary w-full shadow-brand-500/20">
          Sign In with Auth0
        </button>
      </div>
    </div>
  );
}

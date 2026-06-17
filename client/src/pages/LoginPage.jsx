import { useAuth } from '../hooks/useAuth';
import { Sparkles, BookOpen, GraduationCap, Target, Video, ArrowRight, Zap, Code, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-dark-950 text-slate-200 overflow-x-hidden selection:bg-brand-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[80%] h-[20%] bg-blue-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-brand-500/10 p-2 rounded-xl border border-brand-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <GraduationCap className="w-6 h-6 text-brand-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Co-Teacher</span>
        </div>
        <button 
          onClick={() => login()} 
          className="px-6 py-2 rounded-full font-medium transition-all hover:bg-white/5 border border-white/10"
        >
          Sign In
        </button>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-6 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 animate-fade-in shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            <Sparkles className="w-4 h-4" />
            <span>The future of learning is here</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Learn anything, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-blue-400 to-purple-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              instantly generated.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
            Enter any topic, and our AI will craft a comprehensive, structured course with interactive lessons, curated videos, and knowledge checks in under 30 seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <button 
              onClick={() => login()} 
              className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-400 text-dark-900 font-bold rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:-translate-y-1"
            >
              Start Learning for Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 bg-dark-900/50 border-y border-white/5 relative backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Supercharge your studies</h2>
              <p className="text-slate-400">Everything you need to master a new skill, all in one place.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <BookOpen className="w-6 h-6 text-blue-400" />, title: "Structured Curriculum", desc: "No more endless googling. Get a perfectly structured roadmap from fundamentals to advanced concepts.", color: "blue" },
                { icon: <Video className="w-6 h-6 text-purple-400" />, title: "Curated Videos", desc: "Every lesson is paired with the best, most relevant YouTube videos automatically embedded.", color: "purple" },
                { icon: <Target className="w-6 h-6 text-brand-400" />, title: "Interactive Quizzes", desc: "Test your knowledge immediately with AI-generated quizzes designed to reinforce what you just read.", color: "brand" },
                { icon: <Code className="w-6 h-6 text-green-400" />, title: "Code & Examples", desc: "Learn technical skills with rich code snippets, interactive tabs, and detailed real-world examples.", color: "green" },
                { icon: <Zap className="w-6 h-6 text-yellow-400" />, title: "Lightning Fast", desc: "From typing a prompt to a full 10-module course in under 30 seconds. Zero loading screens.", color: "yellow" },
                { icon: <Shield className="w-6 h-6 text-red-400" />, title: "Track Progress", desc: "Mark lessons as complete, track your study streak, and pick up exactly where you left off.", color: "red" }
              ].map((feature, i) => (
                <div key={i} className="bg-dark-800/50 p-8 rounded-2xl hover:-translate-y-1 transition-transform group border border-white/5 hover:border-white/10 shadow-xl">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-dark-900 border border-white/5 group-hover:scale-110 transition-transform shadow-inner`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-32 px-6 text-center max-w-4xl mx-auto relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to expand your mind?</h2>
          <p className="text-xl text-slate-400 mb-10">Join thousands of students and professionals learning faster with AI.</p>
          <button 
            onClick={() => login()} 
            className="px-10 py-4 bg-white hover:bg-slate-200 text-dark-900 font-bold rounded-full transition-all text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]"
          >
            Create Your Account
          </button>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-500 text-sm bg-dark-950">
        <p>© {new Date().getFullYear()} Co-Teacher. All rights reserved.</p>
      </footer>
    </div>
  );
}

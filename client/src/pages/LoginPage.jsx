import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Sparkles, BookOpen, GraduationCap, Target, Video, ArrowRight, Zap, Code, Shield, Bot, Layout, Award, CheckCircle2, Users, Mic, Volume2, Trophy, Headphones, Compass, Play } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname + (location.state?.from?.search || '') || '/';

  const handleLogin = () => {
    login({ appState: { returnTo: from } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-brand-100 selection:text-brand-900 font-sans">
      
      {/* Navbar with Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-xl shadow-lg shadow-brand-500/30">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Co-Teacher</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
          <a href="#proctoring" className="hover:text-brand-600 transition-colors">Proctoring</a>
          <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it works</a>
          <a href="#about-us" className="hover:text-brand-600 transition-colors">About Us</a>
        </div>

        <button 
          onClick={handleLogin} 
          className="px-6 py-2.5 rounded-full font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          Sign In
        </button>
      </nav>

      <main className="relative z-10 flex flex-col items-center pt-24">
        {/* Hero Section: Massive Typography & Glassmorphism */}
        <section className="relative pt-32 pb-24 px-6 text-center max-w-5xl mx-auto w-full">
          {/* Decorative background blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-200/50 rounded-[100%] blur-[100px] -z-10 pointer-events-none"></div>
          
          <h1 className="text-6xl md:text-[5rem] lg:text-[6rem] font-extrabold text-slate-900 tracking-tighter leading-[1] mb-8">
            Learn anything, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">
              instantly.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Generate highly-structured courses, curated videos, interactive code snippets, and quizzes from a single prompt in under 30 seconds.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-6 mt-4">
            <button 
              onClick={handleLogin} 
              className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white text-lg font-bold rounded-full transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-500/30 hover:shadow-2xl hover:shadow-brand-500/40 hover:-translate-y-1"
            >
              Start Generating for Free
              <Sparkles className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 border border-brand-100 rounded-full text-sm font-bold text-brand-700">
              <Zap className="w-4 h-4" /> Get 5 Free Courses
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <div className="flex -space-x-3">
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://randomuser.me/api/portraits/women/44.jpg" alt="User 1" />
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://randomuser.me/api/portraits/men/32.jpg" alt="User 2" />
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://randomuser.me/api/portraits/women/68.jpg" alt="User 3" />
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-bold">+2k</div>
              </div>
              <p>Trusted by thousands of learners</p>
            </div>
          </div>

          {/* Glassmorphic Search Mockup */}
          <div className="mt-20 relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-purple-500 rounded-3xl blur opacity-20 -z-10 transform rotate-1"></div>
            <div className="bg-white/80 backdrop-blur-2xl border border-white p-6 md:p-8 rounded-3xl shadow-2xl flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 font-mono text-sm mb-1">Enter any topic...</p>
                <p className="text-slate-800 text-lg md:text-xl font-medium">"I want to learn Quantum Physics from scratch"</p>
              </div>
              <div className="hidden md:flex shrink-0 px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-400 gap-2 items-center">
                <div className="w-5 h-5 rounded-full bg-slate-300 animate-pulse flex items-center justify-center mr-1"></div>
                Voice or Type ↵
              </div>
            </div>
          </div>
        </section>

        {/* AI Capabilities Showcase */}
        <section className="py-24 w-full bg-slate-900 text-white relative overflow-hidden border-y border-slate-800">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-400 via-slate-900 to-slate-900"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col gap-24">
            
            {/* Feature 1: Adaptive Intelligence */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm font-bold text-brand-300 tracking-widest uppercase mb-4 backdrop-blur-md">
                  <Target className="w-4 h-4" /> Adaptive Intelligence
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white">Your course, tailored to your level.</h2>
                <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto md:mx-0">
                  Co-Teacher assesses your current knowledge with a quick diagnostic test before generating the curriculum. Whether you are a complete beginner or an advanced professional, the content adapts perfectly to you.
                </p>
              </div>
              <div className="flex-1 w-full max-w-md bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
                <div className="absolute -top-4 -right-4 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce shadow-lg">Beginner detected!</div>
                <h4 className="text-slate-300 font-medium mb-4">Diagnostic Test</h4>
                <div className="space-y-3">
                  <div className="w-full bg-slate-700/50 p-4 rounded-xl border border-slate-600 flex justify-between items-center text-sm cursor-not-allowed opacity-50">
                    <span>Advanced Quantum Mechanics</span>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-500"></div>
                  </div>
                  <div className="w-full bg-brand-500/20 p-4 rounded-xl border border-brand-500/50 flex justify-between items-center text-sm shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                    <span className="text-brand-300 font-bold">Introduction to Physics</span>
                    <CheckCircle2 className="w-5 h-5 text-brand-400" />
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 w-full animate-pulse rounded-full"></div>
                  </div>
                  <p className="text-center text-xs text-brand-400 font-bold mt-2 uppercase tracking-wider">Generating tailored beginner course...</p>
                </div>
              </div>
            </div>

            {/* Feature 2: Voice AI Tutor */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm font-bold text-brand-300 tracking-widest uppercase mb-4 backdrop-blur-md">
                  <Mic className="w-4 h-4" /> AI Voice Tutor
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white">Speak naturally. Learn instantly.</h2>
                <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto md:mx-0">
                  Stuck on a concept? Just ask. Our context-aware AI tutor supports real-time voice interactions, providing spoken explanations in multiple languages so you never lose your learning momentum.
                </p>
              </div>
              <div className="flex-1 w-full max-w-md bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl relative flex flex-col justify-center items-center h-[280px]">
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="absolute top-4 right-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-xs font-bold text-brand-300">
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                  Listening...
                </div>
                <div className="w-24 h-24 bg-brand-500/20 border border-brand-500/50 rounded-full flex items-center justify-center mb-8 relative shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                  <div className="absolute inset-0 rounded-full border-2 border-brand-400 animate-ping opacity-20"></div>
                  <Mic className="w-10 h-10 text-brand-400" />
                </div>
                <div className="flex items-center gap-2 h-10">
                  <div className="w-1.5 h-4 bg-brand-400 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-8 bg-brand-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1.5 h-10 bg-brand-400 rounded-full animate-pulse delay-150"></div>
                  <div className="w-1.5 h-5 bg-brand-400 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-7 bg-brand-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1.5 h-3 bg-brand-400 rounded-full animate-pulse delay-150"></div>
                  <div className="w-1.5 h-8 bg-brand-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-slate-400 text-sm mt-6 font-medium italic">"Explain Quantum Entanglement..."</p>
              </div>
            </div>

          </div>
        </section>

        {/* Feature Showcase: Bento Box Grid */}
        <section id="features" className="py-24 w-full px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold tracking-widest text-brand-600 uppercase mb-4 block">Everything you need</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">The ultimate learning platform.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[280px]">
            
            {/* Bento Card 1: AI Course Generation (Large) */}
            <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-32 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110"></div>
              
              {/* Mock UI Graphic */}
              <div className="relative w-full flex-1 min-h-[200px] mt-4 mb-8 bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 shadow-inner overflow-hidden">
                <div className="w-full h-8 bg-white rounded-lg border border-slate-100 flex items-center px-3 shadow-sm transform transition-all group-hover:-translate-y-1 duration-500">
                  <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center mr-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div></div>
                  <div className="h-2 w-1/3 bg-slate-200 rounded-full"></div>
                </div>
                <div className="w-[90%] h-8 bg-white rounded-lg border border-slate-100 flex items-center px-3 shadow-sm transform transition-all group-hover:-translate-y-1 duration-500 delay-75">
                  <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center mr-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div></div>
                  <div className="h-2 w-1/2 bg-slate-200 rounded-full"></div>
                </div>
                <div className="w-[80%] h-8 bg-white rounded-lg border border-slate-100 flex items-center px-3 shadow-sm transform transition-all group-hover:-translate-y-1 duration-500 delay-150">
                  <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center mr-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div></div>
                  <div className="h-2 w-1/4 bg-slate-200 rounded-full"></div>
                </div>
                {/* Floating generating icon */}
                <div className="absolute bottom-4 right-4 w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/40 animate-bounce">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
                  <Layout className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Instant Curriculum</h3>
                <p className="text-lg text-slate-600 leading-relaxed max-w-md">
                  Turn any prompt into a complete, structured course roadmap with modules and lessons in seconds.
                </p>
              </div>
            </div>

            {/* Bento Card 2: AI Tutor Chat */}
            <div className="md:col-span-2 md:row-span-1 bg-slate-900 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800 z-0"></div>
              
              {/* Floating Chat Mockup */}
              <div className="absolute -right-6 -bottom-6 w-56 h-36 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 rotate-[-6deg] hover:rotate-0 transition-transform duration-500 z-10 shadow-2xl">
                <div className="flex gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center shrink-0"><Bot className="w-3 h-3 text-white" /></div>
                  <div className="flex-1 bg-white/10 rounded-lg rounded-tl-none p-2 text-[10px] text-white">
                    Explain this like I'm 5...
                  </div>
                </div>
                <div className="flex gap-2 items-center justify-end">
                  <div className="bg-brand-500 rounded-lg rounded-tr-none px-3 py-1.5 flex items-center gap-1">
                    <span className="w-1 h-2 bg-white rounded-full animate-pulse"></span>
                    <span className="w-1 h-3 bg-white rounded-full animate-pulse delay-75"></span>
                    <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-150"></span>
                    <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-75"></span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0"><Mic className="w-3 h-3 text-white" /></div>
                </div>
              </div>

              <div className="relative z-10 max-w-[60%]">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 relative">
                  <Bot className="w-6 h-6 text-white" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">AI Voice Tutor</h3>
                <p className="text-slate-400">Ask questions and get instant audio explanations directly within your lesson context.</p>
              </div>
            </div>

            {/* Bento Card 3: Multilingual Audio (TTS) */}
            <div className="md:col-span-1 md:row-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
              
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-4 relative z-10 shadow-inner group-hover:scale-110 transition-transform">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-1 tracking-tight flex items-center gap-2">
                  Listen & Learn <Volume2 className="w-4 h-4 animate-pulse" />
                </h3>
                <p className="text-sm text-indigo-100">Full multilingual text-to-speech for every lesson.</p>
              </div>
            </div>

            {/* Bento Card 4: Global Leaderboard & Gamification */}
            <div className="md:col-span-1 md:row-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                <Trophy className="w-40 h-40 text-amber-500" />
              </div>
              
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 relative z-10 shadow-inner group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Gamified</h3>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-bold">12 🔥</span>
                </div>
                <p className="text-sm text-slate-600">Global leaderboards and streak tracking.</p>
              </div>
            </div>

            {/* Bento Card 3: Curated Videos */}
            <div className="md:col-span-1 md:row-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                <Video className="w-32 h-32 text-red-500" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4 relative z-10">
                <Video className="w-6 h-6 text-red-500" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Curated Videos</h3>
                <p className="text-sm text-slate-600">Automatic YouTube embedding for every lesson topic.</p>
              </div>
            </div>

            {/* Bento Card 4: Interactive Code */}
            <div className="md:col-span-1 md:row-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                <Code className="w-32 h-32 text-blue-600" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 relative z-10">
                <Code className="w-6 h-6 text-blue-600" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Interactive Code</h3>
                <p className="text-sm text-slate-600">Multi-language code snippets with 1-click copy.</p>
              </div>
            </div>

            {/* Bento Card 7: Knowledge Checks */}
            <div className="md:col-span-2 md:row-span-1 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50 rounded-full blur-3xl -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-125"></div>
              <div className="relative z-10 flex gap-6 items-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Target className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Knowledge Checks</h3>
                  <p className="text-slate-600 mb-4">Interactive quizzes after lessons and comprehensive final tests to assess learning.</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-100 rounded-lg text-xs font-bold text-purple-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                    AI Video Proctored
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 8: Course Recommendations */}
            <div className="md:col-span-2 md:row-span-1 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-125"></div>
              <div className="relative z-10 flex gap-6 items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Compass className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Smart Recommendations</h3>
                  <p className="text-slate-600 mb-4">Discover curated course suggestions based on your interests and past learning.</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-700">
                    <Shield className="w-3 h-3" /> Secure Prompting
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 9: Certification */}
            <div className="md:col-span-2 md:row-span-1 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex items-center justify-between overflow-hidden relative">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-50 rounded-full blur-3xl -mr-12 -mb-12 transition-transform duration-700 group-hover:scale-125"></div>
              <div className="relative z-10 flex gap-6 items-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Award className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Certification</h3>
                  <p className="text-slate-600">Download and print PDF certificates upon passing your final test.</p>
                </div>
              </div>
            </div>

            {/* Bento Card 10: Human Mentorship (Full Width) */}
            <div className="md:col-span-4 md:row-span-1 bg-gradient-to-br from-brand-600 to-indigo-800 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl transition-transform duration-1000 group-hover:translate-x-12"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl transition-transform duration-1000 group-hover:-translate-x-12"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left flex-1">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Hire a Human Mentor</h3>
                  <p className="text-brand-100 text-lg max-w-xl">
                    Need a human touch? Connect 1-on-1 with expert mentors for personalized guidance on any specific topic, lesson, or full course.
                  </p>
                </div>
              </div>
              
              {/* Interactive Visual/Avatars */}
              <div className="relative z-10 shrink-0 flex flex-col items-center gap-4">
                <div className="flex -space-x-4">
                  <img className="w-16 h-16 rounded-full border-4 border-indigo-700 object-cover shadow-lg transform group-hover:-translate-y-2 transition-transform duration-500" src="https://randomuser.me/api/portraits/men/46.jpg" alt="Mentor 1" />
                  <img className="w-16 h-16 rounded-full border-4 border-indigo-700 object-cover shadow-lg relative -top-3 transform group-hover:-translate-y-4 transition-transform duration-500 delay-75" src="https://randomuser.me/api/portraits/women/65.jpg" alt="Mentor 2" />
                  <img className="w-16 h-16 rounded-full border-4 border-indigo-700 object-cover shadow-lg transform group-hover:-translate-y-2 transition-transform duration-500 delay-150" src="https://randomuser.me/api/portraits/women/90.jpg" alt="Mentor 3" />
                </div>
                <button 
                  onClick={() => login({ appState: { returnTo: '/mentors' } })}
                  className="px-8 py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:bg-brand-50 transition-all w-full"
                >
                  Find a Mentor
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Secure Proctoring Section */}
        <section id="proctoring" className="py-24 w-full bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm font-bold text-brand-300 tracking-widest uppercase mb-6 backdrop-blur-md">
                <Shield className="w-4 h-4" /> Academic Integrity
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">Secure your certifications with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">AI Video Proctoring.</span></h2>
              <p className="text-xl text-slate-400 leading-relaxed mb-8 max-w-xl">
                Ensure trust and credibility for every certificate issued. Our advanced AI proctoring uses your webcam to passively monitor final exams, guaranteeing academic integrity without intrusive software.
              </p>
              <ul className="flex flex-col gap-4 text-slate-300 font-medium">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-400" /> Identity verification before testing</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-400" /> Continuous background AI monitoring</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-400" /> Tamper-proof digital certificates</li>
              </ul>
            </div>
            
            <div className="flex-1 w-full max-w-lg relative">
              <div className="aspect-[4/3] bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden relative flex flex-col">
                {/* Mock Browser/Camera Header */}
                <div className="h-10 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                {/* Camera Feed Mock */}
                <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  
                  {/* Fake Face Tracking Box */}
                  <div className="w-48 h-48 border-2 border-brand-400/50 rounded-2xl absolute flex items-center justify-center animate-pulse">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-400"></div>
                  </div>
                  
                  <img src="https://i.pravatar.cc/400?img=68" alt="Student" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
                  
                  {/* Recording Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-white tracking-widest uppercase">REC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (Micro-interactions) */}
        <section id="how-it-works" className="py-24 w-full bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Four steps to mastery.</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  num: "01",
                  icon: <BookOpen className="w-8 h-8 text-brand-600" />, 
                  title: "Enter a topic", 
                  desc: "Paper-based, any subject, any language. Tell Co-Teacher what you want to learn." 
                },
                { 
                  num: "02",
                  icon: <Zap className="w-8 h-8 text-brand-600" />, 
                  title: "Instant Course", 
                  desc: "Within seconds, receive a structured curriculum with rich text, videos, and code." 
                },
                { 
                  num: "03",
                  icon: <CheckCircle2 className="w-8 h-8 text-brand-600" />, 
                  title: "Learn & Test", 
                  desc: "Read lessons, chat with the AI tutor, take quizzes, and earn your certificate." 
                },
                { 
                  num: "04",
                  icon: <Users className="w-8 h-8 text-brand-600" />, 
                  title: "Human Mentors", 
                  desc: "Stuck on a tough concept? Hire an expert human mentor for 1-on-1 guidance." 
                }
              ].map((step, i) => (
                <div key={i} className="group relative p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <div className="absolute top-8 right-8 text-6xl font-black text-slate-200 group-hover:text-brand-100 transition-colors duration-300">
                    {step.num}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 relative z-10">{step.title}</h3>
                  <p className="text-slate-600 text-lg relative z-10">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about-us" className="py-24 w-full bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span className="text-sm font-bold tracking-widest text-brand-600 uppercase mb-4 block">Our Mission</span>
            <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Empowering learners everywhere.</h2>
            <p className="text-xl text-slate-600 leading-relaxed mb-10">
              Co-Teacher was built with a simple idea: that anyone should be able to learn anything, instantly. By harnessing the power of AI, we break down complex topics into perfectly structured curricula, complete with curated videos, interactive code, and quizzes. We believe that self-guided education should be engaging, beautiful, and completely accessible.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-700 font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Built for the modern learner
            </div>
          </div>
        </section>

        {/* CTA Footer: Monochromatic Dark Blue */}
        <section className="py-32 w-full bg-brand-900 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Ready to start learning?</h2>
            <p className="text-xl text-brand-100 mb-12 font-medium max-w-2xl mx-auto">
              Join Co-Teacher today and turn any topic into a powerful, interactive learning experience.
            </p>
            <button 
              onClick={() => login()} 
              className="px-10 py-5 bg-white text-brand-900 hover:bg-brand-50 font-bold rounded-full transition-all text-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
            >
              Get Started for Free
            </button>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-brand-800 bg-brand-950 py-10 text-center text-brand-200/50 text-sm font-medium">
        <p>© {new Date().getFullYear()} Co-Teacher. Built for the modern learner.</p>
      </footer>
    </div>
  );
}

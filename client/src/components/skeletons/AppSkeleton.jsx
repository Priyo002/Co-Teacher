export default function AppSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Fake Header */}
      <header className="border-b border-slate-200 bg-white/70 h-20 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
          <div className="w-32 h-6 bg-slate-200 rounded-md"></div>
        </div>
        <div className="flex items-center gap-6 animate-pulse">
          <div className="w-24 h-8 bg-slate-200 rounded-full"></div>
          <div className="w-20 h-4 bg-slate-200 rounded-md hidden sm:block"></div>
          <div className="w-24 h-10 bg-slate-200 rounded-full"></div>
        </div>
      </header>

      {/* Fake Body Area */}
      <main className="flex-1 w-full p-6 md:p-12 animate-pulse">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Block */}
          <div className="w-1/3 h-10 bg-slate-200 rounded-lg"></div>
          <div className="w-1/4 h-5 bg-slate-200 rounded-md"></div>
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 h-64 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl mb-4"></div>
                  <div className="w-3/4 h-6 bg-slate-200 rounded-md mb-2"></div>
                  <div className="w-1/2 h-4 bg-slate-200 rounded-md"></div>
                </div>
                <div className="w-full h-10 bg-slate-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

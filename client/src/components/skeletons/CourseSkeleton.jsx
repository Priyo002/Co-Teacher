export default function CourseSkeleton() {
  return (
    <div className="p-4 sm:p-8 animate-pulse max-w-4xl mx-auto">
      {/* Back button */}
      <div className="w-32 h-5 bg-slate-200 rounded-md mb-6"></div>

      {/* Header Info */}
      <div className="p-6 sm:p-8 mb-8 bg-white border border-slate-200 shadow-sm rounded-3xl">
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex gap-2 mb-3">
              <div className="w-16 h-6 bg-slate-100 rounded-full"></div>
              <div className="w-16 h-6 bg-slate-100 rounded-full"></div>
            </div>
            <div className="w-3/4 h-10 bg-slate-200 rounded-lg mb-4"></div>
            <div className="space-y-2 mb-6 max-w-2xl">
              <div className="w-full h-5 bg-slate-100 rounded-md"></div>
              <div className="w-5/6 h-5 bg-slate-100 rounded-md"></div>
              <div className="w-2/3 h-5 bg-slate-100 rounded-md"></div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
            <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <div className="w-32 h-4 bg-slate-200 rounded-md"></div>
            <div className="w-10 h-4 bg-slate-200 rounded-md"></div>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full"></div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-8">
        {[1, 2].map(m => (
          <div key={m}>
            {/* Module Header */}
            <div className="mb-4">
              <div className="w-16 h-4 bg-slate-200 rounded-md mb-2"></div>
              <div className="w-64 h-8 bg-slate-200 rounded-lg"></div>
            </div>
            
            {/* Lessons */}
            <div className="space-y-3">
              {[1, 2, 3].map(l => (
                <div key={l} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                    <div className="space-y-2 flex-1 max-w-sm">
                      <div className="w-full h-5 bg-slate-200 rounded-md"></div>
                      <div className="w-24 h-4 bg-slate-100 rounded-md"></div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                    <div className="w-24 h-10 bg-slate-100 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

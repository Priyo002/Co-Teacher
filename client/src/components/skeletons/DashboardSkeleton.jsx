export default function DashboardSkeleton() {
  return (
    <div className="p-8 md:p-12 animate-pulse max-w-[1400px] mx-auto w-full">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
        <div>
          <div className="h-12 w-64 bg-slate-200 rounded-xl mb-3"></div>
          <div className="h-6 w-80 bg-slate-100 rounded-md"></div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="h-12 w-full sm:w-96 md:w-[400px] bg-slate-100 rounded-xl"></div>
          <div className="h-12 w-48 bg-slate-200 rounded-xl shrink-0"></div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-40 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100"></div>
              <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
            </div>
            <div className="h-10 w-16 bg-slate-200 rounded-xl"></div>
          </div>
        ))}
      </div>

      {/* Recommended for You */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100"></div>
            <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-40 flex flex-col justify-between">
              <div>
                <div className="h-5 w-3/4 bg-slate-200 rounded-md mb-3"></div>
                <div className="h-3 w-full bg-slate-100 rounded-md"></div>
                <div className="h-3 w-5/6 bg-slate-100 rounded-md mt-2"></div>
              </div>
              <div className="h-6 w-20 bg-slate-200 rounded-full mt-auto"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Continue Learning & Study Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        
        {/* Continue Learning */}
        <div className="xl:col-span-2 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100"></div>
            <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          </div>
          {/* Mock Wide Course Card */}
          <div className="bg-white rounded-3xl border border-slate-200 h-[280px] p-8 flex flex-col flex-1 shadow-sm">
             <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
             </div>
             <div className="h-8 w-3/4 bg-slate-200 rounded-lg mb-4"></div>
             <div className="space-y-3 mb-10">
                <div className="h-4 w-full bg-slate-100 rounded-md"></div>
                <div className="h-4 w-5/6 bg-slate-100 rounded-md"></div>
             </div>
             <div className="mt-auto flex justify-between items-center border-t border-slate-100 pt-6">
                <div className="w-24 h-5 bg-slate-100 rounded-md"></div>
                <div className="w-28 h-10 bg-slate-100 rounded-xl"></div>
             </div>
          </div>
        </div>

        {/* Study Activity Calendar */}
        <div className="xl:col-span-1 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100"></div>
            <div className="h-8 w-40 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 flex-1 p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between mb-8">
               <div className="space-y-2"><div className="h-4 w-20 bg-slate-100 rounded-md"></div><div className="h-8 w-24 bg-slate-200 rounded-lg"></div></div>
               <div className="space-y-2 text-right"><div className="h-4 w-16 bg-slate-100 rounded-md ml-auto"></div><div className="h-6 w-20 bg-slate-200 rounded-md"></div></div>
            </div>
            <div className="grid grid-cols-7 gap-1 mt-auto">
               {Array.from({ length: 35 }).map((_, i) => (
                 <div key={i} className="h-8 w-8 bg-slate-100 rounded-full mx-auto mb-2"></div>
               ))}
            </div>
          </div>
        </div>

      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6 pb-3">
        <div className="h-8 w-32 bg-slate-200 rounded-md"></div>
        <div className="h-8 w-32 bg-slate-100 rounded-md"></div>
        <div className="h-8 w-32 bg-slate-100 rounded-md"></div>
      </div>

      {/* Cards Grid (All Courses) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm h-80 p-8 flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
            </div>
            
            <div className="h-6 w-full bg-slate-200 rounded-lg mb-2"></div>
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg mb-4"></div>
            
            <div className="space-y-2 mb-8">
              <div className="h-3 w-full bg-slate-100 rounded-md"></div>
              <div className="h-3 w-5/6 bg-slate-100 rounded-md"></div>
            </div>

            <div className="mt-auto">
              <div className="h-2 w-full bg-slate-100 rounded-full mb-6"></div>
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="w-20 h-4 bg-slate-100 rounded-md"></div>
                <div className="w-24 h-10 bg-slate-100 rounded-xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

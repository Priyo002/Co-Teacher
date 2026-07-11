export default function MentorDiscoverySkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-10 px-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-10 w-64 bg-slate-200 rounded-xl mb-3"></div>
        <div className="h-6 w-96 bg-slate-100 rounded-md"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN: Mentor List Skeleton */}
        <div className="flex-1">
          {/* Search Bar Skeleton */}
          <div className="h-[58px] w-full bg-white border border-slate-200 rounded-xl mb-6 shadow-sm"></div>

          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 shadow-sm">
                {/* Image Skeleton */}
                <div className="w-full sm:w-32 sm:h-32 rounded-2xl shrink-0 bg-slate-100 border-4 border-slate-50"></div>
                
                {/* Info Skeleton */}
                <div className="flex-1 flex flex-col space-y-4">
                  <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                    <div className="h-5 w-64 bg-slate-100 rounded-md"></div>
                    <div className="h-4 w-56 bg-slate-100 rounded-md"></div>
                  </div>
                  <div className="h-12 w-full bg-slate-50 rounded-lg"></div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-slate-100 rounded-lg"></div>
                    <div className="h-6 w-20 bg-slate-100 rounded-lg"></div>
                    <div className="h-6 w-16 bg-slate-100 rounded-lg"></div>
                  </div>
                </div>

                {/* Right Action Skeleton */}
                <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6 flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
                    <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-12 w-full bg-slate-100 rounded-xl"></div>
                    <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Filters Sidebar Skeleton */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm sticky top-24 space-y-8">
            <div className="h-8 w-32 bg-slate-200 rounded-lg mb-6"></div>
            
            {[1, 2, 3, 4].map((section) => (
              <div key={section} className="space-y-4">
                <div className="h-6 w-24 bg-slate-200 rounded-md"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-slate-100 rounded-md"></div>
                      <div className="h-4 w-32 bg-slate-100 rounded-md"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

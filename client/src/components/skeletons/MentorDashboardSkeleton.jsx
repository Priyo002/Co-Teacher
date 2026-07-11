export default function MentorDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="h-10 w-64 bg-slate-200 rounded-xl mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

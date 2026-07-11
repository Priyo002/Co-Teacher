export default function ListSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-6 animate-pulse">
      <div className="mb-8">
        <div className="h-10 w-64 bg-slate-200 rounded-xl mb-3"></div>
        <div className="h-6 w-96 bg-slate-100 rounded-md"></div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        <div className="h-10 w-48 bg-slate-200 rounded-xl mb-8"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200"></div>
        ))}
      </div>
    </div>
  );
}

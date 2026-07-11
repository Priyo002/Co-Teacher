export default function FormSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 animate-pulse">
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="h-10 w-64 bg-slate-200 rounded-xl mb-4"></div>
        <div className="h-6 w-96 bg-slate-100 rounded-md"></div>
      </div>
      <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm h-[500px]"></div>
    </div>
  );
}

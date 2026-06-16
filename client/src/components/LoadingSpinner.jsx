import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-900 text-slate-200">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full border-t-2 border-brand-500 opacity-20 blur-xl"></div>
        <Loader2 className="h-12 w-12 animate-spin text-brand-500" />
      </div>
      {text && (
        <p className="mt-6 animate-pulse text-sm font-medium tracking-wide text-slate-400">
          {text}
        </p>
      )}
    </div>
  );
}

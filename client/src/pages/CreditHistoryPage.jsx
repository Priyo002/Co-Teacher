import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Activity, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreditHistoryPage() {
  const fetchApi = useApi();
  const [loading, setLoading] = useState(true);
  const [creditHistory, setCreditHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const historyData = await fetchApi(`/user/credit-history?page=${page}&limit=10`);
        setCreditHistory(historyData.history || []);
        setTotalPages(historyData.totalPages || 1);
      } catch (err) {
        console.error('Failed to load credit history', err);
        toast.error('Failed to load credit history');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [page]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Credit History</h1>
        <p className="text-slate-500">Track how you have earned and spent your credits.</p>
      </div>

      <div className="glass-panel p-6 sm:p-8 bg-white border border-slate-200">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-600" />
          Activity Log
        </h2>
        
        {loading && creditHistory.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 sm:p-6 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 animate-pulse">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2">
                    <div className="h-6 w-40 bg-slate-200 rounded-md"></div>
                    <div className="h-6 w-64 bg-slate-200 rounded-lg"></div>
                  </div>
                  <div className="h-4 w-48 bg-slate-200 rounded-md mt-3"></div>
                </div>
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="h-6 w-24 bg-slate-200 rounded-md"></div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : creditHistory.length > 0 ? (
          <div className="space-y-4">
            {creditHistory.map(item => (
              <div key={item._id} className="p-4 sm:p-6 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  {(() => {
                    const parts = item.reason.split(': ');
                    const title = parts[0];
                    const detail = parts.slice(1).join(': ');
                    return (
                      <div className="flex flex-col gap-2">
                        <span className="font-bold text-lg text-slate-900">{title}</span>
                        {detail && (
                          <span className="text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg w-fit">
                            {detail}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="text-sm text-slate-500 mt-3">
                    {new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} (IST)
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <span className={`font-black text-xl ${item.amount > 0 ? 'text-brand-600' : 'text-red-500'}`}>
                    {item.amount > 0 ? '+' : ''}{item.amount} cr
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit ${
                    item.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {item.amount > 0 ? 'EARNED' : 'SPENT'}
                  </span>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center bg-slate-50 rounded-2xl border border-slate-100">
            <Activity className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">No credit history yet.</p>
            <p className="text-sm mt-1">Your credit activity will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

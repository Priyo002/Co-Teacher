import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingHistoryPage() {
  const fetchApi = useApi();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const txData = await fetchApi('/payment/transactions');
        setTransactions(txData.transactions || []);
      } catch (err) {
        console.error('Failed to load billing data', err);
        toast.error('Failed to load billing data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Billing History</h1>
        <p className="text-slate-500">View your past transactions and purchased plans.</p>
      </div>

      <div className="glass-panel p-6 sm:p-8 bg-white border border-slate-200">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-600" />
          Transactions
        </h2>
        
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map(t => (
              <div key={t._id} className="p-4 sm:p-6 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="font-bold text-lg text-slate-900 capitalize">{t.packageId} Plan</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {new Date(t.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} (IST)
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <span className="font-bold text-xl text-brand-600">+{t.creditsAdded} credits</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit ${
                    t.status === 'success' ? 'bg-green-100 text-green-700' :
                    t.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center bg-slate-50 rounded-2xl border border-slate-100">
            <CreditCard className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">No transactions yet.</p>
            <p className="text-sm mt-1">Your purchase history will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

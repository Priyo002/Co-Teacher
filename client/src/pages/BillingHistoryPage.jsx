import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { CreditCard, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

export default function BillingHistoryPage() {
  const fetchApi = useApi();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const txData = await fetchApi(`/payment/transactions?page=${page}&limit=10`);
        setTransactions(txData.transactions || []);
        setTotalPages(txData.totalPages || 1);
      } catch (err) {
        console.error('Failed to load billing data', err);
        toast.error('Failed to load billing data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [page]);

  const generateReceipt = (t) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      pdf.setFontSize(22);
      pdf.setTextColor(30, 41, 59); // slate-900
      pdf.setFont('helvetica', 'bold');
      pdf.text('Co-Teacher', 20, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.setFont('helvetica', 'normal');
      pdf.text('Payment Receipt', 20, 28);

      // Divider
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.line(20, 35, 190, 35);

      // Receipt Details
      pdf.setFontSize(12);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`Order ID: ${t.razorpay_order_id}`, 20, 45);
      if (t.razorpay_payment_id) {
        pdf.text(`Payment ID: ${t.razorpay_payment_id}`, 20, 52);
      }
      
      const dateStr = new Date(t.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      pdf.text(`Date: ${dateStr}`, 20, t.razorpay_payment_id ? 59 : 52);
      pdf.text(`Status: ${t.status.toUpperCase()}`, 20, t.razorpay_payment_id ? 66 : 59);

      // Table Header
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.rect(20, 75, 170, 10, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description', 25, 82);
      pdf.text('Credits', 130, 82);
      pdf.text('Amount', 160, 82);

      // Table Row
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${t.packageId.toUpperCase()} Plan`, 25, 93);
      pdf.text(`+${t.creditsAdded}`, 130, 93);
      pdf.text(`Rs. ${t.amount}`, 160, 93);

      // Divider
      pdf.line(20, 100, 190, 100);

      // Total
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Paid:', 130, 110);
      pdf.text(`Rs. ${t.amount}`, 160, 110);

      // Footer
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text('Thank you for learning with Co-Teacher!', 105, 280, { align: 'center' });

      pdf.save(`Receipt_${t.razorpay_order_id}.pdf`);
      toast.success('Receipt downloaded!');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate receipt');
    }
  };

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
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit ${
                      t.status === 'success' ? 'bg-green-100 text-green-700' :
                      t.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {t.status}
                    </span>
                    {t.status === 'success' && (
                      <button 
                        onClick={() => generateReceipt(t)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Download Receipt"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                  </div>
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
            <CreditCard className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">No transactions yet.</p>
            <p className="text-sm mt-1">Your purchase history will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

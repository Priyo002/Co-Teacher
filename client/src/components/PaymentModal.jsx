import { useState, useEffect } from 'react';
import { X, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const PACKAGES = [
  { id: 'basic', credits: 100, price: 50, tag: 'Starter' },
  { id: 'pro', credits: 500, price: 200, tag: 'Popular', highlight: true },
  { id: 'ultra', credits: 1500, price: 500, tag: 'Best Value' },
];

export default function PaymentModal({ isOpen, onClose }) {
  const fetchApi = useApi();
  const { user, refreshProfile } = useAuth();
  const [loadingPkg, setLoadingPkg] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = async (pkg) => {
    if (!scriptLoaded) return toast.error("Payment gateway is still loading...");
    
    setLoadingPkg(pkg.id);
    try {
      // 1. Create order on our backend
      const orderData = await fetchApi('/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ packageId: pkg.id })
      });

      if (!orderData || !orderData.id) throw new Error("Failed to create order");

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Default to test if env is missing
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Co-Teacher AI",
        description: `Purchase ${pkg.credits} Credits`,
        image: "https://your-logo-url.com/logo.png",
        order_id: orderData.id,
        handler: async function (response) {
          // 3. Verify payment on backend
          try {
            const verifyData = await fetchApi('/payment/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg.id
              })
            });

            if (verifyData.success) {
              toast.success(`Success! Added ${pkg.credits} credits to your wallet.`);
              await refreshProfile(); // Refreshes user credits
              onClose();
            }
          } catch (verifyErr) {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: "#4f46e5" // Brand color
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error("Payment failed or was cancelled.");
      });
      rzp.open();

    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoadingPkg(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="p-8 pb-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-100/40 rounded-full blur-[80px] -z-10"></div>
          
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
              Power Up Your Learning
            </h2>
            <p className="text-slate-500 mt-2 font-medium">Buy credits to generate highly personalized AI courses. 100 Credits = 1 Full Course.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors z-10"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="p-8 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKAGES.map(pkg => (
              <div 
                key={pkg.id} 
                className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${pkg.highlight ? 'border-brand-500 bg-brand-50 shadow-xl shadow-brand-500/10 scale-105 z-10' : 'border-slate-100 hover:border-slate-300'}`}
              >
                {pkg.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 text-white text-xs font-bold uppercase tracking-widest rounded-full">
                    {pkg.tag}
                  </div>
                )}
                {!pkg.highlight && (
                  <div className="text-brand-600 text-xs font-bold uppercase tracking-widest mb-1">
                    {pkg.tag}
                  </div>
                )}

                <div className="mt-4 mb-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">₹{pkg.price}</span>
                </div>
                
                <div className="text-slate-600 font-medium mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="text-xl font-bold text-slate-900">{pkg.credits}</span> Credits
                </div>

                <div className="flex-1 space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-brand-500" />
                    <span>Generate {pkg.credits / 100} Full Courses</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-brand-500" />
                    <span>Advanced AI Personalization</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-brand-500" />
                    <span>Never expires</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePayment(pkg)}
                  disabled={loadingPkg === pkg.id}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${pkg.highlight ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                >
                  {loadingPkg === pkg.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Buy Now"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

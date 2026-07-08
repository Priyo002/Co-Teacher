import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { countryCodes } from '../utils/countryCodes';
import { User, Phone, BookOpen, Target, CheckCircle, Smartphone, CreditCard, Save, Loader2, Sparkles, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const fetchApi = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [creditHistory, setCreditHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '+91',
    phoneNumber: '',
    educationLevel: 'High School',
    fieldOfStudy: '',
    learningStyle: [],
    learningGoal: ''
  });

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, txData, historyData] = await Promise.all([
          fetchApi('/user/profile'),
          fetchApi('/payment/transactions'),
          fetchApi('/user/credit-history')
        ]);
        
        const profilePhone = profileData.phone || '';
        let extractedCountryCode = '+91';
        let extractedPhone = profilePhone;
        
        // Simple extraction for +XX or +X format
        if (profilePhone.startsWith('+')) {
          const spaceIndex = profilePhone.indexOf(' ');
          if (spaceIndex > 0) {
            extractedCountryCode = profilePhone.substring(0, spaceIndex);
            extractedPhone = profilePhone.substring(spaceIndex + 1);
          }
        }

        setFormData({
          name: profileData.name || '',
          countryCode: extractedCountryCode,
          phoneNumber: extractedPhone,
          educationLevel: profileData.educationLevel || 'High School',
          fieldOfStudy: profileData.fieldOfStudy || '',
          learningStyle: profileData.learningStyle || [],
          learningGoal: profileData.learningGoal || ''
        });
        
        setTransactions(txData.transactions || []);
        setCreditHistory(historyData.history || []);
      } catch (err) {
        console.error('Failed to load profile data', err);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?._id, user?.credits]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullPhone = formData.phoneNumber ? `${formData.countryCode} ${formData.phoneNumber}` : '';
      const payload = {
        ...formData,
        phone: fullPhone
      };
      await fetchApi('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phoneNumber) {
      toast.error("Please enter your phone number first.");
      return;
    }
    
    // Auto save the phone number first
    try {
      const fullPhone = `${formData.countryCode} ${formData.phoneNumber}`;
      await fetchApi('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ phone: fullPhone })
      });
      
      await fetchApi('/user/send-otp', { method: 'POST' });
      setOtpSent(true);
      toast.success("OTP sent! Check the server console.");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setVerifying(true);
    try {
      await fetchApi('/user/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp })
      });
      await refreshProfile();
      setOtpSent(false);
      setOtp('');
      toast.success("Phone verified! You earned 100 credits.");
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  const toggleLearningStyle = (style) => {
    setFormData(prev => {
      const current = prev.learningStyle;
      if (current.includes(style)) {
        return { ...prev, learningStyle: current.filter(s => s !== style) };
      } else {
        return { ...prev, learningStyle: [...current, style] };
      }
    });
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Your Profile</h1>
        <p className="text-slate-500">Manage your account settings, learning preferences, and billing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col h-full">
          {/* General Info */}
          <div className="glass-panel p-6 sm:p-8 bg-white border border-slate-200 flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-600" />
              General Information
            </h2>
            <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col">
              <div className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                <div className="flex gap-3">
                  <div className="relative flex-1 flex shadow-sm rounded-xl">
                    <select
                      value={formData.countryCode}
                      onChange={e => setFormData({...formData, countryCode: e.target.value})}
                      className="input-field rounded-r-none border-r-0 bg-slate-50 w-[120px] pl-3 pr-8 font-semibold text-slate-700 cursor-pointer appearance-none"
                    >
                      {countryCodes.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={e => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '')})}
                        placeholder="9876543210"
                        className="input-field pl-10 rounded-l-none border-l border-slate-200"
                      />
                    </div>
                  </div>
                  {user?.isPhoneVerified ? (
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-4 rounded-xl border border-green-200 font-semibold whitespace-nowrap">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="btn-secondary whitespace-nowrap px-6"
                    >
                      Verify (+100 Credits)
                    </button>
                  )}
                </div>
                
                {otpSent && !user?.isPhoneVerified && (
                  <div className="mt-4 p-4 bg-brand-50 border border-brand-100 rounded-xl flex items-end gap-3 animate-slide-up">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-brand-800 mb-2">Enter 6-digit OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        placeholder="123456"
                        className="input-field bg-white"
                        maxLength={6}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifying || otp.length < 6}
                      className="btn-primary"
                    >
                      {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
                    </button>
                  </div>
                )}
              </div>

              {/* Onboarding Fields */}
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-600" />
                  Learning Preferences
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Education Level</label>
                    <select
                      value={formData.educationLevel}
                      onChange={e => setFormData({...formData, educationLevel: e.target.value})}
                      className="input-field cursor-pointer bg-white appearance-none"
                    >
                      <option value="High School">High School</option>
                      <option value="College">College</option>
                      <option value="Professional">Professional</option>
                      <option value="Hobbyist">Hobbyist</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Field of Study</label>
                    <input
                      type="text"
                      value={formData.fieldOfStudy}
                      onChange={e => setFormData({...formData, fieldOfStudy: e.target.value})}
                      className="input-field"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Learning Style</label>
                  <div className="flex gap-3 flex-wrap">
                    {['Visual', 'Reading', 'Hands-on'].map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleLearningStyle(style)}
                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                          formData.learningStyle.includes(style)
                            ? 'bg-brand-50 border-brand-500 text-brand-700 ring-2 ring-brand-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" />
                    Primary Learning Goal
                  </label>
                  <textarea
                    value={formData.learningGoal}
                    onChange={e => setFormData({...formData, learningGoal: e.target.value})}
                    className="input-field resize-none h-24"
                    placeholder="e.g. I want to become a full-stack developer..."
                  />
                </div>
              </div>
            </div>

              <div className="pt-6 flex justify-end mt-auto">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-8">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Billing History */}
          <div className="glass-panel p-6 bg-white border border-slate-200 flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              Billing History
            </h2>
            
            {transactions.length > 0 ? (
              <div className="space-y-4 max-h-[270px] overflow-y-auto pr-2 custom-scrollbar">
                {transactions.map(t => (
                  <div key={t._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 capitalize">{t.packageId} Plan</span>
                      <span className="font-bold text-brand-600">+{t.creditsAdded} cr</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-slate-500">
                        {new Date(t.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} (IST)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
              <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                <CreditCard className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm">No transactions yet.</p>
              </div>
            )}
          </div>

          {/* Credit History Section */}
          <div className="glass-panel p-6 bg-white border border-slate-200 flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" />
              Credit History
            </h2>
            
            {creditHistory.length > 0 ? (
              <div className="space-y-4 max-h-[270px] overflow-y-auto pr-2 custom-scrollbar">
                {creditHistory.map(item => (
                  <div key={item._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-4">
                      {(() => {
                        const parts = item.reason.split(': ');
                        const title = parts[0];
                        const detail = parts.slice(1).join(': ');
                        return (
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="font-bold text-slate-900 truncate">{title}</span>
                            {detail && (
                              <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md truncate w-fit max-w-full shadow-sm" title={detail}>
                                {detail}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <span className={`font-bold shrink-0 ${item.amount > 0 ? 'text-brand-600' : 'text-red-500'}`}>
                        {item.amount > 0 ? '+' : ''}{item.amount} cr
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-slate-500">
                        {new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} (IST)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.amount > 0 ? 'EARNED' : 'SPENT'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                <Activity className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm">No credit history yet.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

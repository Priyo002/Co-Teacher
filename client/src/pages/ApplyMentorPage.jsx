import { useState, useEffect } from 'react';
import { Briefcase, BookOpen, CheckCircle, ArrowRight, Award, MapPin, Globe, Users, Code, Layers } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CooldownTimer = ({ rejectedAt, setAppStatus }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [canApply, setCanApply] = useState(false);

  useEffect(() => {
    if (!rejectedAt) return;

    const cooldownMs = 30 * 24 * 60 * 60 * 1000;
    const targetDate = new Date(rejectedAt).getTime() + cooldownMs;

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setCanApply(true);
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [rejectedAt]);

  if (canApply || !rejectedAt) {
    return (
      <button onClick={() => setAppStatus('none')} className="btn-primary">
        Apply Again
      </button>
    );
  }

  return (
    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl inline-block mt-4 w-full max-w-sm">
      <p className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Cooldown Period Active</p>
      <div className="flex items-center justify-center gap-2 sm:gap-3 text-slate-800">
        <div className="flex flex-col items-center bg-white border border-slate-200 rounded-xl p-2 w-[65px] shadow-sm">
          <span className="text-2xl font-bold">{timeLeft.days}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">DAYS</span>
        </div>
        <span className="text-xl font-bold text-slate-300">:</span>
        <div className="flex flex-col items-center bg-white border border-slate-200 rounded-xl p-2 w-[65px] shadow-sm">
          <span className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">HOURS</span>
        </div>
        <span className="text-xl font-bold text-slate-300">:</span>
        <div className="flex flex-col items-center bg-white border border-slate-200 rounded-xl p-2 w-[65px] shadow-sm">
          <span className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">MINS</span>
        </div>
        <span className="text-xl font-bold text-slate-300">:</span>
        <div className="flex flex-col items-center bg-white border border-slate-200 rounded-xl p-2 w-[65px] shadow-sm">
          <span className="text-2xl font-bold text-brand-500">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">SECS</span>
        </div>
      </div>
    </div>
  );
};

export default function ApplyMentorPage() {
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    languages: '',
    experienceYears: '',
    targetAudience: [],
    domains: '',
    skills: '',
    linkedinUrl: '',
    portfolioUrl: '',
    proofOfWork: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appStatus, setAppStatus] = useState('loading'); // 'loading', 'none', 'pending', 'approved', 'rejected'
  const [rejectedAt, setRejectedAt] = useState(null);
  const fetchApi = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetchApi('/mentors/application/status');
        setAppStatus(res.status);
        if (res.updatedAt) setRejectedAt(res.updatedAt);
      } catch (err) {
        console.error("Failed to fetch application status", err);
        setAppStatus('none');
      }
    };
    checkStatus();
  }, [fetchApi]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAudienceChange = (audience) => {
    setFormData(prev => {
      const current = prev.targetAudience;
      if (current.includes(audience)) {
        return { ...prev, targetAudience: current.filter(a => a !== audience) };
      } else {
        return { ...prev, targetAudience: [...current, audience] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jobTitle || !formData.company || !formData.location || !formData.languages || !formData.experienceYears || !formData.domains || !formData.skills || formData.targetAudience.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    try {
      await fetchApi('/mentors/apply', {
        method: 'POST',
        body: JSON.stringify({ 
          jobTitle: formData.jobTitle,
          company: formData.company,
          location: formData.location,
          languages: formData.languages.split(',').map(s => s.trim()).filter(Boolean),
          experienceYears: Number(formData.experienceYears),
          targetAudience: formData.targetAudience,
          domains: formData.domains.split(',').map(s => s.trim()).filter(Boolean),
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          linkedinUrl: formData.linkedinUrl,
          portfolioUrl: formData.portfolioUrl,
          proofOfWork: formData.proofOfWork
        })
      });
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Received!</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Thanks for applying to become a mentor. Our team will review your application and get back to you shortly.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (appStatus === 'loading') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (appStatus === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Layers className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Under Review</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Your application is currently being reviewed by our team. We'll notify you once a decision is made.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (appStatus === 'approved') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">You are Approved!</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Congratulations! Your mentor application has been approved.
          </p>
          <button onClick={() => navigate('/mentor/dashboard')} className="btn-primary">
            Go to Mentor Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (appStatus === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Not Accepted</h2>
          <p className="text-slate-600 mb-4 text-lg">
            Unfortunately, your previous application was not accepted at this time.
          </p>
          <CooldownTimer rejectedAt={rejectedAt} setAppStatus={setAppStatus} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Become a Mentor</h1>
        <p className="text-lg text-slate-600">Share your knowledge, help students learn faster, and earn money.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Professional Background */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Briefcase className="w-5 h-5 text-brand-500" /> Professional Background
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title *</label>
              <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} placeholder="e.g. Senior Software Engineer" className="input-field" required disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Company *</label>
              <input type="text" name="company" value={formData.company} onChange={handleInputChange} placeholder="e.g. Google" className="input-field" required disabled={loading} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Location *</label>
              <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Karnataka, India" className="input-field" required disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Languages *</label>
              <input type="text" name="languages" value={formData.languages} onChange={handleInputChange} placeholder="e.g. English, Hindi" className="input-field" required disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Years of Exp *</label>
              <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleInputChange} placeholder="e.g. 5" className="input-field" required disabled={loading} min="0" />
            </div>
          </div>
        </div>

        {/* Section 2: Mentorship Details */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <BookOpen className="w-5 h-5 text-brand-500" /> Mentorship Details
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" /> Target Audience *
            </label>
            <p className="text-xs text-slate-500 mb-3">Who are you looking to mentor?</p>
            <div className="flex flex-wrap gap-3">
              {['High School', 'College', 'Professional', 'Hobbyist'].map(aud => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => handleAudienceChange(aud)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${formData.targetAudience.includes(aud) ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {aud}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-500" /> Domains *
            </label>
            <input type="text" name="domains" value={formData.domains} onChange={handleInputChange} placeholder="e.g. Backend Developer, Data Scientist (comma separated)" className="input-field" required disabled={loading} />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Code className="w-4 h-4 text-brand-500" /> Core Skills *
            </label>
            <input type="text" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="e.g. Java, System Design, DSA (comma separated)" className="input-field" required disabled={loading} />
          </div>
        </div>

        {/* Section 3: Links */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Globe className="w-5 h-5 text-brand-500" /> Links & Proof of Work
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn Profile (Optional)</label>
              <input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleInputChange} placeholder="https://linkedin.com/in/yourprofile" className="input-field" disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">GitHub / Portfolio (Optional)</label>
              <input type="url" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleInputChange} placeholder="https://github.com/yourusername" className="input-field" disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Proof of Work (Optional)</label>
              <input type="text" name="proofOfWork" value={formData.proofOfWork} onChange={handleInputChange} placeholder="Link to a project, article, or credential" className="input-field" disabled={loading} />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto text-lg py-4 px-12 shadow-xl hover:-translate-y-1 transition-transform">
            {loading ? 'Submitting...' : 'Submit Application'}
            {!loading && <ArrowRight className="w-5 h-5 ml-2 inline" />}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { Briefcase, BookOpen, CheckCircle, ArrowRight, Award } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ApplyMentorPage() {
  const [expertise, setExpertise] = useState('');
  const [experience, setExperience] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [proofOfWork, setProofOfWork] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fetchApi = useApi();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expertise.trim() || !experience.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      await fetchApi('/mentors/apply', {
        method: 'POST',
        body: JSON.stringify({ 
          expertise: expertise.split(',').map(s => s.trim()).filter(Boolean),
          experience,
          linkedinUrl,
          portfolioUrl,
          proofOfWork
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

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Become a Mentor</h1>
        <p className="text-lg text-slate-600">Share your knowledge, help students learn faster, and earn money.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-500" />
              What are your areas of expertise?
            </label>
            <input 
              type="text" 
              placeholder="e.g. React, Node.js, Python, Marketing (comma separated)" 
              className="input-field"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-2">Separate multiple skills with commas.</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-500" /> Tell us about your experience
            </label>
            <textarea
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all min-h-[120px]"
              placeholder="Briefly describe your professional background and why you'd be a great mentor..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-500" /> LinkedIn Profile (Optional)
            </label>
            <input
              type="url"
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-500" /> GitHub / Portfolio (Optional)
            </label>
            <input
              type="url"
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              placeholder="https://github.com/yourusername"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-500" /> Additional Proof of Work (Optional)
            </label>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              placeholder="Link to a project, article, or credential"
              value={proofOfWork}
              onChange={(e) => setProofOfWork(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full text-lg py-4"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              By submitting, you agree to our Mentor Terms of Service.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

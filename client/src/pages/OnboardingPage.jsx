import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, BookOpen, BrainCircuit, Loader2, Sparkles, Briefcase, GraduationCap, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

const EDU_LEVELS = [
  { id: 'High School', icon: BookOpen, desc: 'Foundational concepts and exam prep' },
  { id: 'College', icon: GraduationCap, desc: 'Advanced academic topics' },
  { id: 'Professional', icon: Briefcase, desc: 'Career-focused upskilling' },
  { id: 'Hobbyist', icon: Sparkles, desc: 'Learning for fun and passion' },
];

const LEARNING_STYLES = [
  { id: 'Visual', desc: 'I learn best through videos and diagrams' },
  { id: 'Reading', desc: 'I prefer detailed text and explanations' },
  { id: 'Hands-on', desc: 'I want to build and practice immediately' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const fetchApi = useApi();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    educationLevel: '',
    fieldOfStudy: '',
    learningStyle: [],
    learningGoal: '',
  });

  // If somehow they arrive here but already completed it
  if (user?.hasCompletedOnboarding) {
    navigate('/');
    return null;
  }

  const handleNext = () => {
    if (step === 1 && !formData.educationLevel) return toast.error('Please select an education level');
    if (step === 2 && !formData.fieldOfStudy) return toast.error('Please enter your field of study or industry');
    if (step === 3 && formData.learningStyle.length === 0) return toast.error('Please select at least one learning style');
    
    setStep(s => s + 1);
  };

  const handleFinish = async () => {
    if (!formData.learningGoal) return toast.error('Please enter your learning goal');
    
    setIsLoading(true);
    try {
      await fetchApi('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      await refreshProfile();
      toast.success('Profile personalized successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[800px] h-[400px] bg-brand-100/40 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <BrainCircuit className="w-10 h-10 text-brand-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Let's personalize your experience.</h1>
          <p className="text-lg text-slate-500 font-medium">Tell us a bit about yourself so Co-Teacher can generate the perfect curriculum for you.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 px-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-colors duration-500 ${step >= i ? 'bg-brand-500' : 'bg-slate-200'}`}></div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-8">What is your current education level?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EDU_LEVELS.map(level => {
                  const Icon = level.icon;
                  const isSelected = formData.educationLevel === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setFormData({ ...formData, educationLevel: level.id })}
                      className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected 
                        ? 'bg-brand-50 border-brand-500 shadow-md shadow-brand-500/10' 
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <Icon className={`w-7 h-7 mb-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                      <div className={`text-lg font-bold mb-1 ${isSelected ? 'text-brand-900' : 'text-slate-900'}`}>{level.id}</div>
                      <div className="text-sm font-medium text-slate-500">{level.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-3">What is your Field of Study or Industry?</h2>
              <p className="text-slate-500 font-medium mb-8">This helps us use analogies and examples you already understand.</p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="e.g. Computer Science, Finance, Healthcare, Arts..."
                  value={formData.fieldOfStudy}
                  onChange={e => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 text-lg font-medium placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                  onKeyDown={e => { if (e.key === 'Enter') handleNext(); }}
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-3">How do you prefer to learn?</h2>
              <p className="text-slate-500 font-medium mb-8">Select all that apply.</p>
              <div className="space-y-4">
                {LEARNING_STYLES.map(style => {
                  const isSelected = formData.learningStyle.includes(style.id);
                  return (
                    <button
                      key={style.id}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          learningStyle: isSelected 
                            ? prev.learningStyle.filter(s => s !== style.id)
                            : [...prev.learningStyle, style.id]
                        }));
                      }}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${
                        isSelected 
                        ? 'bg-brand-50 border-brand-500 shadow-md shadow-brand-500/10' 
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className={`text-lg font-bold ${isSelected ? 'text-brand-900' : 'text-slate-900'}`}>{style.id}</div>
                        <div className="text-sm font-medium text-slate-500 mt-1">{style.desc}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-[0.4rem] border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white'}`}>
                        {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-3">What is your primary goal right now?</h2>
              <p className="text-slate-500 font-medium mb-8">e.g. "I want to switch careers to Data Science" or "I need to pass my final exams".</p>
              
              <div className="space-y-4">
                <textarea
                  placeholder="My goal is..."
                  value={formData.learningGoal}
                  onChange={e => setFormData({ ...formData, learningGoal: e.target.value })}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 text-lg font-medium placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm resize-none h-40"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-12 flex justify-between items-center">
            {step > 1 ? (
              <button 
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-3 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
            ) : <div></div>}
            
            {step < 4 ? (
              <button 
                onClick={handleNext}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Continue
              </button>
            ) : (
              <button 
                onClick={handleFinish}
                disabled={isLoading}
                className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-full font-bold transition-all shadow-lg shadow-brand-500/30 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
                Save & Start Learning
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

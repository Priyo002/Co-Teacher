import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export default function CreateCourseModal({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const fetchApi = useApi();
  const navigate = useNavigate();

  const SUPPORTED_LANGUAGES = [
    "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", 
    "Gujarati", "Kannada", "Odia", "Malayalam", "Punjabi", "Assamese",
    "Spanish", "French", "German", "Mandarin", "Japanese", 
    "Arabic", "Portuguese", "Russian", "Korean"
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (prompt.trim().length < 10) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const newCourse = await fetchApi('/courses/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, language })
      });
      onClose();
      navigate(`/course/${newCourse._id}`);
    } catch (err) {
      setError(err.message || 'Failed to generate course');
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isGenerating && onClose()}
      />
      
      <div className="glass-panel relative w-full max-w-lg p-6 sm:p-8 animate-slide-up bg-white shadow-2xl">
        <button 
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
            <Sparkles className="w-6 h-6 z-10" />
            <div className="absolute inset-0 bg-brand-100 blur-md"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900">What do you want to learn?</h2>
          <p className="text-slate-500 text-sm">
            Describe the topic in detail. Our AI will generate a structured curriculum instantly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
          
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. I want to learn the fundamentals of Quantum Computing, including qubits, entanglement, and quantum logic gates..."
              className="input-field min-h-[120px] resize-none pb-12"
              disabled={isGenerating}
            />
            <div className="absolute bottom-3 right-3 text-xs font-medium text-slate-500">
              {prompt.length} / 2000
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Course Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isGenerating}
              className="input-field cursor-pointer appearance-none bg-white"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={prompt.length < 10 || isGenerating}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Drafting Curriculum...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                Generate Course
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

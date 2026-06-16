import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

export default function CreateCourseModal({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (prompt.trim().length < 10) return;
    
    setIsGenerating(true);
    // TODO: Connect to backend API
    setTimeout(() => {
      setIsGenerating(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm transition-opacity"
        onClick={() => !isGenerating && onClose()}
      />
      
      <div className="glass-panel relative w-full max-w-lg p-6 sm:p-8 animate-slide-up shadow-[0_0_50px_rgba(45,212,191,0.1)]">
        <button 
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 bg-brand-500/20 text-brand-400 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
            <Sparkles className="w-6 h-6 z-10" />
            <div className="absolute inset-0 bg-brand-500/20 blur-md"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2">What do you want to learn?</h2>
          <p className="text-slate-400 text-sm">
            Describe the topic in detail. Our AI will generate a structured curriculum instantly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <button
            type="submit"
            disabled={prompt.length < 10 || isGenerating}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed shadow-brand-500/20 group"
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

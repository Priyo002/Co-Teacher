import { useState, useEffect, useRef } from 'react';
import { X, Target, Loader2, Sparkles, AlertCircle, Mic } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import CustomSelect from './CustomSelect';

export default function CreatePathModal({ isOpen, onClose }) {
  const [goal, setGoal] = useState('');
  const [language, setLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (newTranscript) {
          setGoal(prev => (prev ? prev + ' ' + newTranscript.trim() : newTranscript.trim()));
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = (e) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setGoal('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech recognition error", err);
      }
    }
  };
  
  const { user, refreshProfile } = useAuth();
  const fetchApi = useApi();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isGenerating) {
      setGoal('');
      setLanguage('English');
      setError(null);
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      onClose();
    }
  };

  const handleGenerate = async () => {
    if (goal.trim().length < 3) {
      setError("Please describe your career or learning goal in more detail.");
      return;
    }

    if (user.credits < 50) {
      setError("You need 50 credits to generate a Learning Path roadmap.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const newPath = await fetchApi('/paths/generate', {
        method: 'POST',
        body: JSON.stringify({ goal, language })
      });
      refreshProfile();
      handleClose();
      navigate(`/path/${newPath._id}`);
    } catch (err) {
      setError(err.message || 'Failed to generate learning path');
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose}></div>
      
      <div className="bg-white rounded-3xl w-full max-w-2xl relative shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Learning Path</h2>
              <p className="text-sm text-slate-500">Generate a complete multi-course roadmap</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {isGenerating ? (
            <div className="py-12 text-center">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 bg-brand-50 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white rounded-full p-4 border border-slate-100 shadow-xl">
                  <Sparkles className="w-16 h-16 text-brand-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Architecting your roadmap...</h3>
              <p className="text-slate-500">Curating a multi-course degree program for your goal.</p>
            </div>
          ) : (
            <div>
              <div className="relative mb-6">
                {isListening ? (
                  <div className="w-full min-h-[140px] bg-brand-50/50 border border-brand-200 rounded-2xl flex items-center justify-between px-6 shadow-inner animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex-1 flex items-center gap-1.5 overflow-hidden pr-4 opacity-80 justify-start">
                      {[...Array(40)].map((_, i) => (
                        <div 
                          key={i} 
                          className="w-1.5 bg-brand-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]" 
                          style={{ 
                            height: `${Math.max(4, Math.random() * 24)}px`, 
                            animationDelay: `${i * 0.05}s` 
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        type="button"
                        onClick={toggleListening}
                        className="w-12 h-12 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors shadow-sm"
                        title="Stop Listening"
                      >
                        <div className="w-4 h-4 bg-red-600 rounded-[3px]" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. Become a Full Stack Web Developer focusing on React and Node.js..."
                      className="input-field min-h-[140px] resize-none pb-12 pr-12 transition-colors"
                      disabled={isGenerating}
                    />
                    <button
                      type="button"
                      onClick={toggleListening}
                      className="absolute right-3 top-3 p-2 rounded-xl transition-all text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                      title="Start voice input"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 text-xs font-medium text-slate-500">
                      {goal.length} / 2000
                    </div>
                  </>
                )}
              </div>

              <CustomSelect
                label="Language"
                value={language}
                onChange={setLanguage}
                disabled={isGenerating}
                options={[
                  { value: 'English', label: 'English' },
                  { value: 'Spanish', label: 'Spanish (Español)' },
                  { value: 'French', label: 'French (Français)' },
                  { value: 'German', label: 'German (Deutsch)' },
                  { value: 'Hindi', label: 'Hindi (हिंदी)' },
                  { value: 'Japanese', label: 'Japanese (日本語)' },
                  { value: 'Mandarin', label: 'Mandarin (中文)' },
                  { value: 'Arabic', label: 'Arabic (العربية)' },
                  { value: 'Bengali', label: 'Bengali (বাংলা)' },
                  { value: 'Telugu', label: 'Telugu (తెలుగు)' },
                  { value: 'Marathi', label: 'Marathi (मराठी)' },
                  { value: 'Tamil', label: 'Tamil (தமிழ்)' },
                  { value: 'Urdu', label: 'Urdu (اردو)' },
                  { value: 'Gujarati', label: 'Gujarati (ગુજરાતી)' },
                  { value: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' },
                  { value: 'Odia', label: 'Odia (ଓଡ଼ିଆ)' },
                  { value: 'Malayalam', label: 'Malayalam (മലയാളം)' },
                  { value: 'Punjabi', label: 'Punjabi (ਪੰਜਾਬੀ)' },
                  { value: 'Assamese', label: 'Assamese (অসমীয়া)' },
                  { value: 'Portuguese', label: 'Portuguese (Português)' },
                  { value: 'Russian', label: 'Russian (Русский)' },
                  { value: 'Korean', label: 'Korean (한국어)' }
                ]}
              />

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  <span className="font-bold text-slate-900">50 Credits</span> required to map out the curriculum.
                </span>
                <span className="text-slate-500">
                  Balance: <span className="font-bold text-slate-900">{user.credits}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {!isGenerating && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button 
              onClick={handleClose}
              className="px-6 py-2.5 font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleGenerate}
              disabled={goal.trim().length < 3 || user.credits < 50}
              className="btn-primary px-8 py-2.5 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Path
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

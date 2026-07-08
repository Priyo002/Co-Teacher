import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Loader2, Mic, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

export default function CreateCourseModal({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [level, setLevel] = useState('Beginner');
  const [step, setStep] = useState('input'); // input, assessment, evaluating, warning
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  
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
          setPrompt(prev => (prev ? prev + ' ' + newTranscript.trim() : newTranscript.trim()));
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };
      
      recognitionRef.current.onend = () => {
        // Continuous mode might still end automatically after a pause in some browsers,
        // we keep the UI in sync. The user will have to press start again if it times out.
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
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const fetchApi = useApi();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const SUPPORTED_LANGUAGES = [
    "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", 
    "Gujarati", "Kannada", "Odia", "Malayalam", "Punjabi", "Assamese",
    "Spanish", "French", "German", "Mandarin", "Japanese", 
    "Arabic", "Portuguese", "Russian", "Korean"
  ];
  const SUPPORTED_LEVELS = ["Auto-detect", "Beginner", "Intermediate", "Advanced"];

  if (!isOpen) return null;

  const resetState = () => {
    setPrompt('');
    setLanguage('English');
    setLevel('Auto-detect');
    setStep('input');
    setAssessmentQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setScore(0);
    setError('');
  };

  const handleClose = () => {
    if (!isGenerating) {
      resetState();
      onClose();
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (prompt.trim().length < 10) return;
    
    setError('');
    
    if (level === 'Beginner') {
      await generateFinalCourse(level);
    } else {
      await fetchPreAssessment();
    }
  };

  const fetchPreAssessment = async () => {
    setIsGenerating(true);
    try {
      const data = await fetchApi('/courses/pre-assessment', {
        method: 'POST',
        body: JSON.stringify({ prompt, language, level })
      });
      refreshProfile(); // deducted 10 credits
      setAssessmentQuestions(data.questions);
      setStep('assessment');
    } catch (err) {
      setError(err.message || 'Failed to generate pre-assessment');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFinalCourse = async (finalLevel) => {
    setIsGenerating(true);
    setError('');
    
    try {
      const newCourse = await fetchApi('/courses/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, language, level: finalLevel })
      });
      refreshProfile(); // Update user credits locally
      handleClose();
      navigate(`/course/${newCourse._id}`);
    } catch (err) {
      setError(err.message || 'Failed to generate course');
      setIsGenerating(false);
    }
  };

  const handleAnswer = (optionIndex) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      evaluateAssessment();
    }
  };

  const evaluateAssessment = () => {
    let correct = 0;
    assessmentQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    
    const percentage = (correct / assessmentQuestions.length) * 100;
    setScore(percentage);
    
    if (level === 'Auto-detect') {
      let calculatedLevel = 'Beginner';
      if (percentage >= 80) calculatedLevel = 'Advanced';
      else if (percentage >= 40) calculatedLevel = 'Intermediate';
      
      setLevel(calculatedLevel); // Update level to calculated
      setStep('success'); // Show calculated level screen
    } else {
      if (percentage >= 70) {
        generateFinalCourse(level);
      } else {
        setStep('warning');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      <div className="glass-panel relative w-full max-w-lg p-6 sm:p-8 animate-slide-up bg-white shadow-2xl">
        <button 
          onClick={handleClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'input' && (
          <>
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

            <form onSubmit={handleInitialSubmit} className="space-y-6">
              {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
              
              <div className="relative">
                {isListening ? (
                  <div className="w-full min-h-[120px] bg-brand-50/50 border border-brand-200 rounded-2xl flex items-center justify-between px-6 shadow-inner animate-in fade-in zoom-in-95 duration-200">
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
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. I want to learn the fundamentals of Quantum Computing..."
                      className="input-field min-h-[120px] resize-none pb-12 pr-12 transition-colors"
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
                      {prompt.length} / 2000
                    </div>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Language</label>
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
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    disabled={isGenerating}
                    className="input-field cursor-pointer appearance-none bg-white"
                  >
                    {SUPPORTED_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl === 'Auto-detect' ? 'Judge My Level' : lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={prompt.length < 10 || isGenerating}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {level === 'Beginner' ? 'Drafting Curriculum...' : 'Preparing Pre-assessment...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                    {level === 'Beginner' ? 'Generate Course' : (level === 'Auto-detect' ? 'Judge My Level' : 'Take Pre-assessment')}
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {step === 'assessment' && assessmentQuestions.length > 0 && (
          <div className="space-y-6">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold mb-2 text-slate-900">Readiness Check</h2>
              <p className="text-slate-500 text-sm">
                Question {currentQuestionIndex + 1} of {assessmentQuestions.length}
              </p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900 mb-4">
                {assessmentQuestions[currentQuestionIndex].question}
              </h3>
              
              <div className="space-y-3">
                {assessmentQuestions[currentQuestionIndex].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      answers[currentQuestionIndex] === idx
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={nextQuestion}
              disabled={answers[currentQuestionIndex] === undefined || isGenerating}
              className="btn-primary w-full"
            >
              {currentQuestionIndex < assessmentQuestions.length - 1 ? 'Next Question' : 'Submit & Evaluate'}
            </button>
          </div>
        )}

        {step === 'warning' && (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Score: {score}%</h2>
            <p className="text-slate-600 mb-8">
              It looks like you might need to brush up on some basics before tackling the <strong>{level}</strong> level. We recommend starting with the Beginner course!
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => generateFinalCourse('Beginner')}
                disabled={isGenerating}
                className="btn-primary w-full flex justify-center items-center gap-2"
              >
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate Beginner Course
              </button>
              <button
                onClick={() => handleClose()}
                disabled={isGenerating}
                className="btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Score: {score}%</h2>
            <p className="text-slate-600 mb-8">
              Based on your results, we recommend generating an <strong>{level}</strong> level course for this topic!
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => generateFinalCourse(level)}
                disabled={isGenerating}
                className="btn-primary w-full flex justify-center items-center gap-2"
              >
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate {level} Course
              </button>
              <button
                onClick={() => handleClose()}
                disabled={isGenerating}
                className="btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Loader2, RefreshCcw } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function TestModal({ isOpen, onClose, courseId, lessonId, onSuccess, isReviewMode }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fetchApi = useApi();

  useEffect(() => {
    if (isOpen) {
      loadTest();
    } else {
      // Reset state when closed
      setQuestions([]);
      setAnswers({});
      setResult(null);
      setError(null);
    }
  }, [isOpen, courseId, lessonId]);

  const loadTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi(`/courses/${courseId}/lessons/${lessonId}/test/start`, {
        method: 'POST'
      });
      
      // Shuffle the questions for the frontend attempt, unless in review mode
      let testQs = res.testQuestions || [];
      if (!isReviewMode) {
        testQs = testQs.map((q, idx) => ({ ...q, originalIndex: idx })).sort(() => Math.random() - 0.5);
      } else {
        testQs = testQs.map((q, idx) => ({ ...q, originalIndex: idx }));
      }
      setQuestions(testQs);
      
      if (isReviewMode) {
        // Automatically mock a passed result to show explanations
        setResult({ passed: true, isMaxAttempts: false, score: 100 });
        // Fill answers with correct ones just to show them
        const correctAnswers = {};
        testQs.forEach((q, idx) => {
          correctAnswers[idx] = q.correctAnswer;
        });
        setAnswers(correctAnswers);
      }
    } catch (err) {
      setError(err.message || 'Failed to load test questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIdx, optionIdx) => {
    if (result) return; // Prevent changing answers after submission
    setAnswers(prev => ({
      ...prev,
      [qIdx]: optionIdx
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      // Format answers for backend
      const submission = questions.map((q, idx) => ({
        questionIndex: q.originalIndex,
        selectedOption: answers[idx]
      }));

      const res = await fetchApi(`/courses/${courseId}/lessons/${lessonId}/test/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: submission })
      });

      setResult(res);
      if (res.passed || res.isMaxAttempts) {
        onSuccess(res);
      }
    } catch (err) {
      alert("Failed to submit test: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    // Re-shuffle on retry
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 no-print">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={result?.passed ? onClose : undefined} />
      
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{isReviewMode ? 'Review Test' : 'Lesson Test'}</h2>
            <p className="text-slate-500 text-sm mt-1">{isReviewMode ? 'Review the questions and correct answers for this lesson.' : 'Pass this test with 70% or higher to unlock the next lesson.'}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
              <p className="text-slate-500">Preparing your test...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">{error}</div>
          ) : questions.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No questions available for this lesson.</div>
          ) : (
            <div className="space-y-8">
              {result && !result.passed && !result.isMaxAttempts && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                  <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Test Failed</h4>
                    <p className="text-sm mt-1">You scored {result.score}%. You need 70% to pass. Please review the lesson and try again!</p>
                  </div>
                </div>
              )}

              {result && result.isMaxAttempts && !result.passed && (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Maximum Attempts Reached</h4>
                    <p className="text-sm mt-1">You've reached the maximum number of attempts. We've unlocked the next lesson for you. Below are the correct answers for your review.</p>
                  </div>
                </div>
              )}

              {result && result.passed && !result.isMaxAttempts && !isReviewMode && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Test Passed!</h4>
                    <p className="text-sm mt-1">Excellent job! You scored {result.score}% and unlocked the next lesson.</p>
                  </div>
                </div>
              )}

              {questions.map((q, qIdx) => {
                const isCorrect = result?.isMaxAttempts || result?.passed ? answers[qIdx] === q.correctAnswer : null;
                const showExplanation = result?.isMaxAttempts || result?.passed;

                return (
                  <div key={qIdx} className={`p-6 rounded-2xl border ${result && !result.passed && !result.isMaxAttempts ? 'border-slate-200' : showExplanation ? (isCorrect ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30') : 'border-slate-200'}`}>
                    <h4 className="font-semibold text-lg text-slate-900 mb-4">{qIdx + 1}. {q.question}</h4>
                    <div className="space-y-3">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = answers[qIdx] === optIdx;
                        const isActualCorrect = showExplanation && optIdx === q.correctAnswer;
                        const isWrongSelection = showExplanation && isSelected && optIdx !== q.correctAnswer;

                        let borderClass = 'border-slate-200';
                        let bgClass = 'bg-white hover:bg-slate-50';
                        if (isSelected) {
                          borderClass = 'border-brand-500';
                          bgClass = 'bg-brand-50';
                        }

                        if (showExplanation) {
                          if (isActualCorrect) {
                            borderClass = 'border-green-500';
                            bgClass = 'bg-green-50';
                          } else if (isWrongSelection) {
                            borderClass = 'border-red-300';
                            bgClass = 'bg-red-50 opacity-50';
                          } else {
                            bgClass = 'bg-slate-50 opacity-50 cursor-default hover:bg-slate-50';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            disabled={!!result}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${borderClass} ${bgClass}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={showExplanation && isActualCorrect ? 'text-green-700 font-medium' : isSelected ? 'text-brand-700 font-medium' : 'text-slate-700'}>
                                {opt}
                              </span>
                              {showExplanation && isActualCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                              {showExplanation && isWrongSelection && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {showExplanation && q.explanation && (
                      <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 text-sm text-slate-700">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-between items-center">
          <div className="text-slate-500 font-medium">
            {isReviewMode ? `${questions.length} Questions` : result ? `Score: ${result.score}%` : `${Object.keys(answers).length} / ${questions.length} Answered`}
          </div>
          <div>
            {isReviewMode ? (
              <button onClick={onClose} className="btn-primary">
                Close
              </button>
            ) : !result ? (
              <button 
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length < questions.length}
                className="btn-primary"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Test'}
              </button>
            ) : result.passed || result.isMaxAttempts ? (
              <button onClick={onClose} className="btn-primary">
                Continue to Course
              </button>
            ) : (
              <button onClick={handleRetry} className="btn-secondary">
                <RefreshCcw className="w-4 h-4 mr-2 inline" /> Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

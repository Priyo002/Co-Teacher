import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, RefreshCcw, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import TestResultModal from '../components/TestResultModal';
import ProctoringWrapper from '../components/ProctoringWrapper';

export default function LessonTestPage() {
  const { courseId, id: lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isReviewMode = location.state?.isReviewMode || false;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [error, setError] = useState(null);
  const fetchApi = useApi();

  useEffect(() => {
    loadTest();
  }, [courseId, lessonId]);

  const loadTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi(`/courses/${courseId}/lessons/${lessonId}/test/start`, {
        method: 'POST'
      });
      
      let testQs = res.testQuestions || [];
      if (!isReviewMode) {
        testQs = testQs.map((q, idx) => ({ ...q, originalIndex: idx })).sort(() => Math.random() - 0.5);
      } else {
        testQs = testQs.map((q, idx) => ({ ...q, originalIndex: idx }));
      }
      setQuestions(testQs);
      
      if (res.testQuestions) {
        setQuestions(res.testQuestions.map((q, idx) => ({ ...q, originalIndex: idx })));
      }
      if (isReviewMode && res.previousResult) {
        setResult(res.previousResult);
        const mappedAnswers = {};
        res.previousResult.answers.forEach(a => {
          if (a.questionIndex !== undefined) mappedAnswers[a.questionIndex] = a.selectedOption;
        });
        setAnswers(mappedAnswers);
      }
    } catch (err) {
      setError(err.message || 'Failed to load test questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIdx, optionIdx) => {
    if (result) return;
    setAnswers(prev => ({
      ...prev,
      [qIdx]: optionIdx
    }));
    setMissedQuestions(prev => prev.filter(id => id !== qIdx));
  };

  const handleSubmit = async (isViolation = false) => {
    const isForcedFail = isViolation === true;
    
    if (!isForcedFail) {
      const missing = [];
      questions.forEach((_, idx) => {
        if (answers[idx] === undefined) {
          missing.push(idx);
        }
      });

      if (missing.length > 0) {
        setMissedQuestions(missing);
        const firstMissed = document.getElementById(`question-${missing[0]}`);
        if (firstMissed) {
          firstMissed.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }
    
    setMissedQuestions([]);

    setSubmitting(true);
    try {
      const submission = questions.map((q, idx) => ({
        questionIndex: q.originalIndex !== undefined ? q.originalIndex : idx,
        selectedOption: isForcedFail ? -1 : (answers[idx] ?? -1)
      }));

      const res = await fetchApi(`/courses/${courseId}/lessons/${lessonId}/test/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: submission })
      });

      setResult(res);
      setShowResultModal(true);
    } catch (err) {
      alert("Failed to submit test: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setShowResultModal(false);
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const content = (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(`/course/${courseId}/lesson/${lessonId}`)}
          className="flex items-center text-slate-500 hover:text-brand-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lesson
        </button>
        <div className="flex items-center gap-2 text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full text-sm font-medium">
          <ShieldCheck className="w-4 h-4" />
          AI Proctoring Ready
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h1 className="text-3xl font-bold text-slate-900">{isReviewMode ? 'Review Test' : 'Lesson Test'}</h1>
          <p className="text-slate-500 mt-2">{isReviewMode ? 'Review the questions and correct answers for this lesson.' : 'Pass this test with 70% or higher to unlock the next lesson. AI proctoring will be enabled here soon.'}</p>
        </div>

        <div className="p-8">
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
                <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 flex items-start gap-4">
                  <XCircle className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg">Test Failed</h4>
                    <p className="mt-1">You scored {result.score}%. You need 70% to pass. Please review the lesson and try again!</p>
                  </div>
                </div>
              )}

              {result && result.isMaxAttempts && !result.passed && (
                <div className="bg-amber-50 text-amber-700 p-6 rounded-2xl border border-amber-200 flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg">Maximum Attempts Reached</h4>
                    <p className="mt-1">You've reached the maximum number of attempts. We've unlocked the next lesson for you. Below are the correct answers for your review.</p>
                  </div>
                </div>
              )}

              {result && result.passed && !result.isMaxAttempts && !isReviewMode && (
                <div className="bg-green-50 text-green-700 p-6 rounded-2xl border border-green-200 flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg">Test Passed!</h4>
                    <p className="mt-1">Excellent job! You scored {result.score}% and unlocked the next lesson.</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {questions.map((q, qIdx) => {
                  const isCorrect = result?.isMaxAttempts || result?.passed ? answers[qIdx] === q.correctAnswer : null;
                  const showExplanation = result?.isMaxAttempts || result?.passed;

                  return (
                    <div id={`question-${qIdx}`} key={qIdx} className={`p-6 md:p-8 rounded-2xl border-2 transition-colors ${missedQuestions.includes(qIdx) ? 'border-red-400 ring-4 ring-red-50' : result && !result.passed && !result.isMaxAttempts ? 'border-slate-200' : showExplanation ? (isCorrect ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30') : 'border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <h4 className="font-semibold text-lg md:text-xl text-slate-900">{qIdx + 1}. {q.question}</h4>
                        {missedQuestions.includes(qIdx) && <span className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full whitespace-nowrap ml-4">Required</span>}
                      </div>
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
                              className={`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all ${borderClass} ${bgClass}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-base md:text-lg ${showExplanation && isActualCorrect ? 'text-green-700 font-medium' : isSelected ? 'text-brand-700 font-medium' : 'text-slate-700'}`}>
                                  {opt}
                                </span>
                                {showExplanation && isActualCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 ml-4" />}
                                {showExplanation && isWrongSelection && <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-4" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {showExplanation && q.explanation && (
                        <div className="mt-6 p-5 bg-white rounded-xl border border-slate-200 text-slate-700">
                          <strong className="text-slate-900">Explanation:</strong> <span className="text-slate-600">{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-between items-center mt-8">
                <div className="text-slate-500 font-medium">
                  {isReviewMode ? `${questions.length} Questions` : result ? `Final Score: ${result.score}%` : `${Object.keys(answers).length} / ${questions.length} Answered`}
                </div>
                <div>
                  {isReviewMode ? (
                    <button onClick={() => navigate(`/course/${courseId}/lesson/${lessonId}`)} className="btn-primary">
                      Back to Lesson
                    </button>
                  ) : !result ? (
                    <button 
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="btn-primary px-8"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Test'}
                    </button>
                  ) : result.passed || result.isMaxAttempts ? (
                    <button 
                      onClick={() => {
                        if (result?.nextLessonId) {
                          navigate(`/course/${courseId}/lesson/${result.nextLessonId}`);
                        } else {
                          navigate(`/course/${courseId}/test`);
                        }
                      }} 
                      className="btn-primary"
                    >
                      {result?.nextLessonId ? 'Continue Learning' : 'Take Final Test'}
                    </button>
                  ) : (
                    <button onClick={handleRetry} className="btn-secondary">
                      <RefreshCcw className="w-4 h-4 mr-2 inline" /> Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <TestResultModal 
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        result={result}
        onRetry={handleRetry}
        onContinue={() => {
          if (result?.nextLessonId) {
            navigate(`/course/${courseId}/lesson/${result.nextLessonId}`);
          } else {
            navigate(`/course/${courseId}`);
          }
        }}
        onReviewMaterial={() => navigate(`/course/${courseId}/lesson/${lessonId}`)}
        onTakeFinalTest={() => navigate(`/course/${courseId}/test`)}
      />
    </div>
  );

  if (isReviewMode) return content;

  return (
    <ProctoringWrapper onForceSubmit={handleSubmit} timeLimitMinutes={10}>
      {content}
    </ProctoringWrapper>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, RefreshCcw, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
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
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [attemptKey, setAttemptKey] = useState(0);
  const [error, setError] = useState(null);
  const fetchApi = useApi();
  const { user } = useAuth();

  const handleAutoFill = () => {
    const newAnswers = {};
    questions.forEach((q, idx) => {
      const correctIdx = q.shuffledOptions.findIndex(o => o.originalIndex === q.correctAnswer);
      newAnswers[idx] = correctIdx;
    });
    setAnswers(newAnswers);
    setMissedQuestions([]);
  };

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
      if (res.testQuestions) {
        const shuffledQuestions = res.testQuestions.map((q, i) => {
          const optionsWithIndex = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
          if (!isReviewMode) optionsWithIndex.sort(() => Math.random() - 0.5);
          return {
            ...q,
            originalIndex: i,
            shuffledOptions: optionsWithIndex
          };
        });
        if (!isReviewMode) shuffledQuestions.sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
      }
      
      if (res.previousResult && (isReviewMode || res.previousResult.isMaxAttempts || res.previousResult.passed)) {
        setResult(res.previousResult);
        const mappedAnswers = {};
        res.previousResult.answers.forEach(a => {
          if (a && typeof a === 'object' && a.questionIndex !== undefined) {
            // We need to map from original question index and original option index 
            // back to the shuffled question index and shuffled option index.
            const shuffledQIdx = shuffledQuestions.findIndex(q => q.originalIndex === a.questionIndex);
            if (shuffledQIdx !== -1) {
              const shuffledOIdx = shuffledQuestions[shuffledQIdx].shuffledOptions.findIndex(o => o.originalIndex === a.selectedOption);
              if (shuffledOIdx !== -1) {
                mappedAnswers[shuffledQIdx] = shuffledOIdx;
              }
            }
          }
        });
        setAnswers(mappedAnswers);
        if (!isReviewMode) {
          setShowResultModal(true);
        }
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

  const handleSubmit = async (isViolation = false, isNavigateAway = false) => {
    const isForcedFail = isViolation === true;
    
    if (!isForcedFail && !isNavigateAway) {
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
      const submission = questions.map((q, idx) => {
        let originalSelectedOption = -1;
        if (!isForcedFail && !isNavigateAway && answers[idx] !== undefined) {
          originalSelectedOption = q.shuffledOptions[answers[idx]].originalIndex;
        }
        return {
          questionIndex: q.originalIndex,
          selectedOption: originalSelectedOption
        };
      });

      const res = await fetchApi(`/courses/${courseId}/lessons/${lessonId}/test/submit`, {
        method: 'POST',
        body: JSON.stringify({ 
          answers: submission,
          cheated: isForcedFail,
          navigatedAway: isNavigateAway
        })
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
    setAttemptKey(prev => prev + 1);
    loadTest();
  };

  const content = (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => {
            if (!result && isTestStarted) {
              setShowLeaveModal(true);
            } else {
              navigate(`/course/${courseId}/lesson/${lessonId}`);
            }
          }}
          className="flex items-center text-slate-500 hover:text-brand-600 transition-colors font-medium relative z-10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lesson
        </button>
        <div className="flex items-center gap-2">
          {user?.isAdmin && (
            <button 
              onClick={handleAutoFill}
              className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-full font-medium shadow-sm hover:bg-amber-600 transition-colors"
            >
              Admin Auto-Fill
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h1 className="text-3xl font-bold text-slate-900">{isReviewMode ? 'Review Test' : 'Lesson Test'}</h1>
          <p className="text-slate-500 mt-2">{isReviewMode ? 'Review the questions and correct answers for this lesson.' : 'Pass this test with 70% or higher to unlock the next lesson.'}</p>
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
                        {q.shuffledOptions.map((optObj, optIdx) => {
                          const originalIdx = optObj.originalIndex;
                          const isSelected = answers[qIdx] === optIdx;
                          const isActualCorrect = showExplanation && originalIdx === q.correctAnswer;
                          const isWrongSelection = showExplanation && isSelected && originalIdx !== q.correctAnswer;

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
                                  {optObj.text}
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

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Leave Test?</h3>
            <p className="text-slate-500 mb-6">
              If you leave the test now, it will be marked as a failed attempt and you will not earn any credit points. Are you sure you want to leave?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  handleSubmit(false, true).then(() => navigate(`/course/${courseId}/lesson/${lessonId}`));
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Leave Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isReviewMode) return content;

  return (
    <ProctoringWrapper key={attemptKey} onForceSubmit={handleSubmit} timeLimitMinutes={10} isSubmitted={!!result}>
      {content}
    </ProctoringWrapper>
  );
}

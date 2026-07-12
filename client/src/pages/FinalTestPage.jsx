import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle2, Trophy, Flame, Star, Sparkles, RotateCcw, ShieldCheck } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import ProctoringWrapper from '../components/ProctoringWrapper';

export default function FinalTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fetchApi = useApi();
  const { user } = useAuth();
  const { width, height } = useWindowSize();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { score, passed, certificateId }
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);

  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  const questions = shuffledQuestions.length > 0 ? shuffledQuestions : (course?.finalTest?.questions || []);

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setShowExplanation(false);
    setAttemptKey(prev => prev + 1);
    setShuffledQuestions(prev => {
      const shuffled = prev.map(q => {
        const newOptions = [...q.shuffledOptions].sort(() => Math.random() - 0.5);
        return { ...q, shuffledOptions: newOptions };
      });
      return shuffled.sort(() => Math.random() - 0.5);
    });
  };

  const handleSelectOption = (qIdx, oIdx) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

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
    async function loadTest() {
      try {
        let data = await fetchApi(`/courses/${id}`);
        if (!data.finalTest || !data.finalTest.questions || data.finalTest.questions.length === 0) {
          // Auto-generate if missing
          await fetchApi(`/courses/${id}/test/generate`, { method: 'POST' });
          data = await fetchApi(`/courses/${id}`);
          if (!data.finalTest || !data.finalTest.questions || data.finalTest.questions.length === 0) {
            throw new Error('Failed to generate final test.');
          }
        }
        let sQuestions = [];
        if (data.finalTest?.questions) {
          sQuestions = data.finalTest.questions.map((q, i) => {
            const optionsWithIndex = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
            optionsWithIndex.sort(() => Math.random() - 0.5);
            return {
              ...q,
              originalIndex: i,
              shuffledOptions: optionsWithIndex
            };
          });
          sQuestions.sort(() => Math.random() - 0.5);
          setShuffledQuestions(sQuestions);
        }
        
        if (data.finalTest?.attempts && data.finalTest.attempts.length > 0) {
          const attempts = data.finalTest.attempts;
          const passed = attempts.some(a => a.passed);
          const isMaxAttempts = attempts.length >= 3;
          
          if (passed || isMaxAttempts) {
            const lastAttempt = attempts[attempts.length - 1];
            setResult({
              score: lastAttempt.score,
              passed: lastAttempt.passed,
              certificateId: data.earnedCertificateId,
              attemptsCount: attempts.length,
              isMaxAttempts: isMaxAttempts,
              creditsEarned: 0
            });
            if (lastAttempt.answers) {
              const mappedAnswers = {};
              lastAttempt.answers.forEach((originalSelectedOption, originalQIdx) => {
                if (originalSelectedOption !== -1 && originalSelectedOption !== null) {
                  const shuffledQIdx = sQuestions.findIndex(q => q.originalIndex === originalQIdx);
                  if (shuffledQIdx !== -1) {
                    const shuffledOIdx = sQuestions[shuffledQIdx].shuffledOptions.findIndex(o => o.originalIndex === originalSelectedOption);
                    if (shuffledOIdx !== -1) {
                      mappedAnswers[shuffledQIdx] = shuffledOIdx;
                    }
                  }
                }
              });
              setAnswers(mappedAnswers);
            }
            setShowExplanation(true);
          }
        }
        
        setCourse(data);
      } catch (err) {
        setError(err.message || 'Failed to load test');
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [id]);

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
      const answersArray = new Array(course.finalTest.questions.length).fill(-1);
      if (!isForcedFail && !isNavigateAway) {
        questions.forEach((q, idx) => {
          if (answers[idx] !== undefined) {
            answersArray[q.originalIndex] = q.shuffledOptions[answers[idx]].originalIndex;
          }
        });
      }
      
      const res = await fetchApi(`/certificates/claim/${id}`, {
        method: 'POST',
        body: JSON.stringify({ 
          answers: answersArray,
          cheated: isForcedFail,
          navigatedAway: isNavigateAway
        })
      });

      setShowExplanation(true);
      setResult({
        score: res.averageScore,
        passed: res.passed,
        certificateId: res.certificateId,
        attemptsCount: res.attemptsCount,
        isMaxAttempts: res.isMaxAttempts,
        creditsEarned: res.creditsEarned
      });
    } catch (err) {
      setResult({
        score: null,
        passed: false,
        error: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
        <p className="text-slate-300 mb-6">{error}</p>
        <button onClick={() => navigate(`/course/${id}`)} className="btn-secondary">Back to Course</button>
      </div>
    );
  }

  const questionsList = (
    <div className="space-y-10 mt-8">
      {questions.map((q, qIdx) => {
        return (
          <div key={qIdx} id={`question-${qIdx}`} className={`bg-white p-6 sm:p-8 rounded-2xl border shadow-sm transition-colors ${missedQuestions.includes(qIdx) ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between mb-6 gap-4">
              <p className="text-xl font-bold text-slate-900 flex gap-4">
                <span className="text-brand-600 shrink-0">{qIdx + 1}.</span> 
                <span>{q.question}</span>
              </p>
              {missedQuestions.includes(qIdx) && (
                <span className="shrink-0 bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Required
                </span>
              )}
            </div>
            <div className="space-y-3">
                  {q.shuffledOptions && q.shuffledOptions.map((optObj, optIdx) => {
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
                        </div>
                      </button>
                    );
                  })}
                </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-4 sm:p-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => {
            if (!result && isTestStarted) {
              setShowLeaveModal(true);
            } else {
              navigate(`/course/${id}`);
            }
          }}
          className="flex items-center text-slate-500 hover:text-brand-600 transition-colors font-medium z-10 relative"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </button>
        {!result && (
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
        )}
      </div>

      {result ? (
        <>
          <div className="mt-10 p-8 bg-white border border-brand-200 rounded-2xl text-center relative overflow-hidden group shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-50 via-purple-50 to-brand-50 opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 shadow-sm ${result.passed ? 'bg-brand-50 border-brand-500 text-brand-600' : 'bg-red-50 border-red-500 text-red-600'}`}>
                {result.passed ? <Trophy className="w-12 h-12" /> : <RotateCcw className="w-12 h-12" />}
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                {result.passed ? 'Congratulations!' : 'Keep Learning!'}
              </h1>
              
              <p className="text-xl text-slate-700 mb-8 max-w-lg">
                {result.passed 
                  ? `You passed the Final Certification Test with a score of ${result.score}%!${result.creditsEarned ? ` You earned ${result.creditsEarned} credit points!` : ''}` 
                  : result.isMaxAttempts
                    ? `You scored ${result.score}%. You didn't pass and have exhausted your 3 attempts. You will not receive a certificate. Please review the correct answers below.`
                    : `You scored ${result.score !== null ? result.score : 'under 70'}%, which didn't quite hit the 70% mark. Review the course material and try again! (${3 - (result.attemptsCount || 1)} attempts left)`}
              </p>

              <div className="flex gap-4">
                {result.passed ? (
                  <button 
                    onClick={() => navigate(`/certificate/${result.certificateId}`)}
                    className="btn-primary shadow-md shadow-brand-500/20 transform hover:-translate-y-0.5"
                  >
                    <Sparkles className="w-5 h-5 mr-2 inline" /> View Certificate
                  </button>
                ) : result.isMaxAttempts ? (
                  <button 
                    onClick={() => navigate(`/course/${id}`)}
                    className="btn-primary"
                  >
                    Review Course
                  </button>
                ) : (
                  <button 
                    onClick={handleRetry}
                    className="btn-primary"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
            {result.passed && <Confetti width={width} height={height} recycle={false} numberOfPieces={800} />}
          </div>
          {(result.isMaxAttempts || result.passed) && questionsList}
        </>
      ) : (
        <ProctoringWrapper
          key={attemptKey}
          onForceSubmit={() => handleSubmit(false, true)}
          timeLimitMinutes={30}
          isSubmitted={submitting}
          onStart={() => setIsTestStarted(true)}
        >
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Final Certification Test</h1>
              <span className="inline-block bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm border border-brand-200">
                Attempt {(course?.finalTest?.attempts?.length || 0) + 1} of 3
              </span>
            </div>
            <p className="text-slate-700 text-lg">{course.title}</p>
            <p className="text-slate-600 mt-2">Answer the following questions to verify your understanding. You have 3 attempts to pass. Earn 20 credit points by passing on your first attempt!</p>
          </div>

          {questionsList}

          <div className="mt-12 flex justify-end pb-20">
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary px-10 py-4 text-lg shadow-md shadow-brand-500/20 transform hover:-translate-y-0.5"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin inline mr-2" /> : <CheckCircle2 className="w-6 h-6 inline mr-2" />}
              {submitting ? 'Submitting...' : 'Submit Final Test'}
            </button>
          </div>
        </ProctoringWrapper>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Leave Final Test?</h3>
            <p className="text-slate-500 mb-6">
              If you leave the test now, it will be marked as a failed attempt and you will lose your chance to earn the certificate for this attempt. Are you sure you want to leave?
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
                  handleSubmit(false, true).then(() => navigate(`/course/${id}`));
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
}

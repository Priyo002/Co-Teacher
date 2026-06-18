import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle2, Trophy, Flame, Star, Sparkles, RotateCcw } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useApi } from '../hooks/useApi';

export default function FinalTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fetchApi = useApi();
  const { width, height } = useWindowSize();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { score, passed, certificateId }

  useEffect(() => {
    async function loadTest() {
      try {
        const data = await fetchApi(`/courses/${id}`);
        if (!data.finalTest || !data.finalTest.questions || data.finalTest.questions.length === 0) {
          throw new Error('No final test generated for this course yet.');
        }
        setCourse(data);
      } catch (err) {
        setError(err.message || 'Failed to load test');
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [id, fetchApi]);

  const handleSubmit = async () => {
    const questions = course.finalTest.questions;
    const answeredCount = Object.keys(answers).length;
    
    if (answeredCount < questions.length) {
      if (!window.confirm(`You have only answered ${answeredCount} out of ${questions.length} questions. Are you sure you want to submit?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const answersArray = questions.map((_, idx) => answers[idx] !== undefined ? answers[idx] : -1);
      
      const res = await fetchApi(`/certificates/claim/${id}`, {
        method: 'POST',
        body: JSON.stringify({ answers: answersArray })
      });

      // The response returns 200 OK whether they pass or fail
      setResult({
        score: res.averageScore,
        passed: res.passed,
        certificateId: res.certificateId
      });
    } catch (err) {
      // Real API errors
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

  const questions = course.finalTest.questions;

  return (
    <div className="p-4 sm:p-8 animate-fade-in max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(`/course/${id}`)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </button>

      {result ? (
        <div className="mt-10 p-8 bg-dark-900 border border-brand-500/30 rounded-2xl text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-brand-500/10 opacity-50"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 shadow-2xl ${result.passed ? 'bg-dark-800 border-brand-500 text-brand-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]' : 'bg-dark-800 border-red-500 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]'}`}>
              {result.passed ? <Trophy className="w-12 h-12" /> : <RotateCcw className="w-12 h-12" />}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {result.passed ? 'Congratulations!' : 'Keep Learning!'}
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-lg">
              {result.passed 
                ? `You passed the Final Certification Test with a score of ${result.score}%!` 
                : `You scored ${result.score !== null ? result.score : 'under 70'}%, which didn't quite hit the 70% mark. Review the course material and try again!`}
            </p>

            <div className="flex gap-4">
              {result.passed ? (
                <button 
                  onClick={() => navigate(`/certificate/${result.certificateId}`)}
                  className="btn-primary shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse-glow"
                >
                  <Sparkles className="w-5 h-5 mr-2 inline" /> View Certificate
                </button>
              ) : (
                <button 
                  onClick={() => { setResult(null); setAnswers({}); }}
                  className="btn-primary"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
          {result.passed && <Confetti width={width} height={height} recycle={false} numberOfPieces={800} />}
        </div>
      ) : (
        <>
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Final Certification Test</h1>
            <p className="text-slate-300 text-lg">{course.title}</p>
            <p className="text-slate-400 mt-2">Answer all {questions.length} questions. You need at least 70% to pass and earn your certificate.</p>
          </div>

          <div className="space-y-10">
            {questions.map((q, qIdx) => {
              const selectedAns = answers[qIdx];

              return (
                <div key={qIdx} className="bg-dark-900 p-6 sm:p-8 rounded-2xl border border-white/5 shadow-xl">
                  <p className="text-xl font-bold text-slate-200 mb-6 flex gap-4">
                    <span className="text-brand-400">{qIdx + 1}.</span> 
                    <span>{q.question}</span>
                  </p>
                  <div className="space-y-3">
                    {q.options.map((opt, oIdx) => {
                      let btnClass = "w-full text-left p-4 rounded-xl border transition-all break-words whitespace-pre-wrap ";
                      if (selectedAns === oIdx) {
                        btnClass += "border-brand-500 bg-brand-500/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]";
                      } else {
                        btnClass += "border-white/5 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10";
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => setAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                          className={btnClass}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex justify-end pb-20">
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary px-10 py-4 text-lg shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse-glow"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin inline mr-2" /> : <CheckCircle2 className="w-6 h-6 inline mr-2" />}
              {submitting ? 'Submitting...' : 'Submit Final Test'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

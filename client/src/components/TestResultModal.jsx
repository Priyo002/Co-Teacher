import { CheckCircle2, AlertTriangle, XCircle, ChevronRight, RotateCcw, Eye, ShieldCheck, BookOpen } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export default function TestResultModal({ isOpen, onClose, result, onRetry, onContinue, onReviewMaterial, onTakeFinalTest }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !result) return null;

  const isPass = result.score >= 70;
  const isMaxAttempts = !isPass && (result.isMaxAttempts || result.attemptsCount >= 3);
  const isFailWithAttempts = !isPass && !isMaxAttempts;
  const isLastLesson = !result.nextLessonId;

  let Icon = null;
  let iconColor = '';
  let title = '';
  let description = '';

  if (isPass) {
    Icon = CheckCircle2;
    iconColor = 'text-green-500 bg-green-100';
    title = 'Awesome Job!';
    const creditText = result.creditsEarned ? ` You earned ${result.creditsEarned} credit points!` : '';
    description = isLastLesson 
      ? `You scored ${result.score}% and passed the final lesson! Take the final test to earn your certificate.${creditText}`
      : `You scored ${result.score}% and passed the test. The next lesson is now unlocked!${creditText}`;
  } else if (isMaxAttempts) {
    Icon = ShieldCheck;
    iconColor = 'text-red-500 bg-red-100';
    title = 'Maximum Attempts Reached';
    description = isLastLesson 
      ? `You scored ${result.score}%. You didn't pass and have exhausted your 3 attempts. You will not receive a certificate. Please review the correct answers below.`
      : `You scored ${result.score}%. You didn't pass and have exhausted your 3 attempts, but we've unlocked the next lesson for you. Please review the correct answers below.`;
  } else {
    const attemptsLeft = 3 - (result.attemptsCount || 1);
    const attemptsText = attemptsLeft === 1 ? '1 attempt left' : `${attemptsLeft} attempts left`;
    Icon = AlertTriangle;
    iconColor = 'text-amber-500 bg-amber-100';
    title = 'Not Quite There!';
    description = `You scored ${result.score}%. You need 70% to pass. Review the material and try again. (${attemptsText})`;
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 fade-in">
        <div className="p-8 text-center flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${iconColor}`}>
            <Icon className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-500 text-lg mb-8 leading-relaxed">{description}</p>
          
          <div className="w-full space-y-3">
            {(isPass || isMaxAttempts) ? (
              <button
                onClick={isPass ? (isLastLesson ? onTakeFinalTest : onContinue) : onClose}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5"
              >
                {isPass ? (isLastLesson ? 'Take Final Test' : 'Continue Learning') : 'Close'}
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5"
              >
                <RotateCcw className="w-5 h-5" />
                Try Again
              </button>
            )}

            {isFailWithAttempts && (
              <button
                onClick={onReviewMaterial}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Review Material
              </button>
            )}
            
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition-colors"
            >
              <Eye className="w-5 h-5" />
              Review Answers
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Eye, Loader2, X, BrainCircuit, Maximize2, Minimize2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function FocusMode({ isActive, courseId, lessonId, courseTitle, lessonTitle, onRequestAITutor, onDeactivate }) {
  const fetchApi = useApi();
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState(null);
  const [focusScore, setFocusScore] = useState(100);
  const [showNudge, setShowNudge] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [needsFullscreenGesture, setNeedsFullscreenGesture] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const focusHistoryRef = useRef([]);
  const sessionStartTimeRef = useRef(null);
  const [sessionTime, setSessionTime] = useState(0);
  
  const lastNudgeTimeRef = useRef(0);
  const dataPointsRef = useRef([]);
  const nudgeCountRef = useRef(0);
  const currentFocusScoreRef = useRef(100);
  const sessionInfoRef = useRef({ courseId, lessonId, courseTitle, lessonTitle });
  
  const [widgetPosition, setWidgetPosition] = useState({ x: 24, y: window.innerHeight - 380 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handlePointerDown = (e) => {
    if (e.target.closest('button')) return; // Ignore drag if clicking a button
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: widgetPosition.x,
      initialY: widgetPosition.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setWidgetPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const handleResize = () => {
      setWidgetPosition(prev => ({
        x: Math.min(Math.max(0, prev.x), window.innerWidth - 270),
        y: Math.min(Math.max(0, prev.y), window.innerHeight - 380)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const startSetup = async () => {
    try {
      // 1. Load Models
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
      
      // 2. Request Camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Auto-resume fullscreen if the permission popup forced an exit
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(e => {
          console.log("Could not auto-resume fullscreen, requires user gesture:", e);
          setNeedsFullscreenGesture(true);
        });
      }
      
      setIsSetup(true);
      sessionStartTimeRef.current = Date.now();
      
      startDetectionLoop();
    } catch (err) {
      console.error("Focus mode setup failed:", err);
      setError("Failed to access camera or load models.");
    }
  };
  
  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (sessionStartTimeRef.current) {
      const endTime = Date.now();
      const duration = Math.floor((endTime - sessionStartTimeRef.current) / 1000);
      
      // Ensure we have at least one data point
      if (duration > 0) {
        dataPointsRef.current.push({
          timestamp: endTime,
          timeOffset: duration,
          score: currentFocusScoreRef.current
        });
      }

      if (dataPointsRef.current.length > 0) {
        const avgScore = dataPointsRef.current.reduce((acc, dp) => acc + dp.score, 0) / dataPointsRef.current.length;
        
        const payload = {
          courseId: sessionInfoRef.current.courseId,
          lessonId: sessionInfoRef.current.lessonId,
          courseTitle: sessionInfoRef.current.courseTitle,
          lessonTitle: sessionInfoRef.current.lessonTitle,
          startTime: sessionStartTimeRef.current,
        endTime,
        duration,
        averageScore: Math.round(avgScore),
        nudgeCount: nudgeCountRef.current,
        dataPoints: dataPointsRef.current
      };

        fetchApi('/focus', {
          method: 'POST',
          body: JSON.stringify(payload)
        }).catch(console.error);
      }
    }

    setIsSetup(false);
    setFocusScore(100);
    currentFocusScoreRef.current = 100;
    setShowNudge(false);
    focusHistoryRef.current = [];
    dataPointsRef.current = [];
    nudgeCountRef.current = 0;
    sessionStartTimeRef.current = null;
  };
  
  useEffect(() => {
    if (isActive) {
      startSetup();
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [isActive]);

  // Seamlessly split the session when the user changes lessons
  useEffect(() => {
    if (sessionInfoRef.current.lessonId !== lessonId) {
      if (isActive && isSetup && sessionStartTimeRef.current) {
        // 1. Submit the old session
        const endTime = Date.now();
        const duration = Math.floor((endTime - sessionStartTimeRef.current) / 1000);
        
        if (duration > 0) {
          dataPointsRef.current.push({
            timestamp: endTime,
            timeOffset: duration,
            score: currentFocusScoreRef.current
          });
        }

        if (dataPointsRef.current.length > 0) {
          const avgScore = dataPointsRef.current.reduce((acc, dp) => acc + dp.score, 0) / dataPointsRef.current.length;
          const payload = {
            courseId: sessionInfoRef.current.courseId,
            lessonId: sessionInfoRef.current.lessonId,
            courseTitle: sessionInfoRef.current.courseTitle,
            lessonTitle: sessionInfoRef.current.lessonTitle,
            startTime: sessionStartTimeRef.current,
            endTime,
            duration,
            averageScore: Math.round(avgScore),
            nudgeCount: nudgeCountRef.current,
            dataPoints: [...dataPointsRef.current]
          };
          fetchApi('/focus', { method: 'POST', body: JSON.stringify(payload) }).catch(console.error);
        }

        // 2. Start a new session seamlessly for the new lesson
        sessionStartTimeRef.current = Date.now();
        dataPointsRef.current = [];
        nudgeCountRef.current = 0;
        focusHistoryRef.current = [];
        setSessionTime(0);
      }
    }
    
    // 3. Always update the reference to point to the latest props
    // This is crucial because lessonTitle updates asynchronously AFTER lessonId changes!
    sessionInfoRef.current = { courseId, lessonId, courseTitle, lessonTitle };
  }, [lessonId, courseId, courseTitle, lessonTitle, isActive, isSetup]);
  
  useEffect(() => {
    if (isSetup && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isSetup]);
  
  // Timer and Data Point Collection
  useEffect(() => {
    if (!isSetup) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const offset = Math.floor((now - sessionStartTimeRef.current) / 1000);
      setSessionTime(offset);
      
      // Collect data point approximately every 10 seconds
      if (offset >= (dataPointsRef.current.length + 1) * 10) {
        dataPointsRef.current.push({
          timestamp: now,
          timeOffset: offset,
          score: currentFocusScoreRef.current
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isSetup]);
  
  const calculateFocus = (detections) => {
    if (!detections || detections.length === 0) return 0; // No face -> 0 focus
    
    const det = detections[0]; // Assuming single user
    let score = 40; // Base score for being present
    
    // Expression analysis (max 25 points)
    const exps = det.expressions;
    if (exps) {
      const positiveExp = (exps.neutral || 0) + (exps.happy || 0);
      const negativeExp = (exps.sad || 0) + (exps.angry || 0) + (exps.fearful || 0) + (exps.disgusted || 0);
      score += (positiveExp * 25);
      score -= (negativeExp * 10);
    }
    
    // Gaze/Pose analysis via landmarks (max 35 points)
    if (det.landmarks) {
      const nose = det.landmarks.getNose()[0];
      const jaw = det.landmarks.getJawOutline();
      const leftJaw = jaw[0];
      const rightJaw = jaw[16];
      
      const distLeft = nose.x - leftJaw.x;
      const distRight = rightJaw.x - nose.x;
      
      const symmetryRatio = Math.min(distLeft, distRight) / Math.max(distLeft, distRight);
      
      if (!isNaN(symmetryRatio) && isFinite(symmetryRatio)) {
         score += (symmetryRatio * 35);
      } else {
         score += 35;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  };
  
  const startDetectionLoop = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      
      try {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();
          
        const score = calculateFocus(detections);
        
        // Keep history of last 5 scores for smoothing
        focusHistoryRef.current.push(score);
        if (focusHistoryRef.current.length > 5) focusHistoryRef.current.shift();
        const avg = Math.round(focusHistoryRef.current.reduce((a, b) => a + b, 0) / focusHistoryRef.current.length);
        
        setFocusScore(avg);
        currentFocusScoreRef.current = avg;
        
        // Nudge logic: if average score < 40% for the last 4 readings (approx 8 seconds)
        if (focusHistoryRef.current.length >= 4) {
          const recentLow = focusHistoryRef.current.slice(-4).every(s => s < 40);
          const now = Date.now();
          if (recentLow && (now - lastNudgeTimeRef.current > 60000) && !showNudge) {
            setShowNudge(true);
            nudgeCountRef.current++;
          }
        }
        
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 2000);
  };
  
  const handleAITutorClick = () => {
    setShowNudge(false);
    lastNudgeTimeRef.current = Date.now();
    if (onRequestAITutor) onRequestAITutor();
  };
  
  const handleDismissNudge = () => {
    setShowNudge(false);
    lastNudgeTimeRef.current = Date.now();
  };
  
  if (!isActive) return null;
  
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-500 stroke-green-500';
    if (score >= 40) return 'text-yellow-500 stroke-yellow-500';
    return 'text-red-500 stroke-red-500';
  };
  
  const getScoreBgColor = (score) => {
    if (score >= 70) return 'stroke-green-100';
    if (score >= 40) return 'stroke-yellow-100';
    return 'stroke-red-100';
  };

  return (
    <>
      {/* Fullscreen Resume Overlay */}
      {needsFullscreenGesture && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer text-white transition-all animate-in fade-in duration-300"
          onClick={() => {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(console.error);
            }
            setNeedsFullscreenGesture(false);
          }}
        >
          <div className="bg-brand-500/20 p-6 rounded-full mb-8 border border-brand-500/30 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <Maximize2 className="w-16 h-16 text-brand-400 animate-pulse" />
          </div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Ready to Focus</h2>
          <p className="text-xl text-slate-300 font-medium">Click anywhere to resume full screen</p>
        </div>
      )}

      {/* Nudge Popup */}
      {showNudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Looks like this part is tricky!</h3>
                <p className="text-slate-600">Want the AI Tutor to summarize it?</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={handleDismissNudge}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Dismiss
              </button>
              <button 
                onClick={handleAITutorClick}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors"
              >
                Open AI Tutor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focus Widget */}
      <div 
        className={`fixed z-40 touch-none ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ left: `${widgetPosition.x}px`, top: `${widgetPosition.y}px` }}
      >
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-300 w-64">
          <div 
            className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-600" />
              <span className="font-semibold text-sm text-slate-700">Focus Mode</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={onDeactivate}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className={`p-4 flex flex-col items-center gap-4 ${isMinimized ? 'hidden' : ''}`}>
            {!isSetup ? (
              <div className="flex flex-col items-center justify-center py-4 text-slate-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                <span className="text-sm">Initializing models...</span>
              </div>
              ) : error ? (
                <div className="text-red-500 text-sm text-center py-2">{error}</div>
              ) : (
                <>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        className={`transition-colors duration-500 ${getScoreBgColor(focusScore)}`} 
                        strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" 
                      />
                      <circle 
                        className={`transition-all duration-500 ease-out ${getScoreColor(focusScore)}`}
                        strokeWidth="8" strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * focusScore) / 100}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(focusScore).split(' ')[0]}`}>
                        {focusScore}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex w-full justify-between items-center text-sm px-2">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Status</span>
                      <span className="text-slate-700 font-medium">
                        {focusScore >= 70 ? 'Engaged' : focusScore >= 40 ? 'Distracted' : 'Away'}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Session</span>
                      <span className="text-slate-700 font-medium font-mono">{formatTime(sessionTime)}</span>
                    </div>
                  </div>
                  
                  <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100 relative mt-2 group border border-slate-200">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover mirror"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-lg"></div>
                  </div>
                </>
              )}
            </div>
        </div>
      </div>
    </>
  );
}

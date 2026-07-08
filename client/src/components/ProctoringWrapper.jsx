import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, Mic, Maximize, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProctoringWrapper({ children, onForceSubmit, timeLimitMinutes }) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [warningMessage, setWarningMessage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes ? timeLimitMinutes * 60 : null);
  
  // Drag state for PIP
  const [pipPosition, setPipPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const intervalRef = useRef(null);
  const strikesRef = useRef(0);
  
  const MAX_STRIKES = 3;

  // Audio setup
  const initAudioMonitoring = (stream) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
  };

  const getAudioVolume = () => {
    if (!analyserRef.current) return 0;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    return sum / bufferLength;
  };

  const loadModels = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    } catch (error) {
      console.error("Failed to load models:", error);
      toast.error("Failed to load AI proctoring models.");
      throw error;
    }
  };

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      // 1. Request Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      // 2. Load Models
      await loadModels();
      
      // 3. Request Camera/Mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      initAudioMonitoring(stream);
      setHasStarted(true);
      startProctoringLoop();
      
    } catch (error) {
      console.error("Setup failed:", error);
      toast.error("You must allow Camera, Microphone, and Fullscreen to take this test.");
    } finally {
      setIsLoading(false);
    }
  };

  const issueStrike = (reason) => {
    if (strikesRef.current >= MAX_STRIKES) return; // Already failed

    const currentStrikes = strikesRef.current + 1;
    strikesRef.current = currentStrikes;
    setStrikes(currentStrikes);
    
    setWarningMessage(`Warning ${currentStrikes}/${MAX_STRIKES}: ${reason}`);
    
    if (currentStrikes >= MAX_STRIKES) {
      toast.error("Maximum strikes reached. Test auto-submitting...");
      cleanup();
      if (onForceSubmit) onForceSubmit(true);
    }
    
    // Always auto-hide warning after 4 seconds so it doesn't permanently block the screen
    setTimeout(() => setWarningMessage(null), 4000);
  };

  const startProctoringLoop = () => {
    // Check every 1.5 seconds
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || strikesRef.current >= MAX_STRIKES) return;
      
      // 1. Check Audio
      const volume = getAudioVolume();
      if (volume > 50) { // Arbitrary threshold for talking
        issueStrike("Loud noise or talking detected.");
        return;
      }
      
      // 2. Check Faces
      try {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
        if (detections.length === 0) {
          issueStrike("Face not detected in camera frame.");
        } else if (detections.length > 1) {
          issueStrike("Multiple faces detected in camera frame.");
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    }, 1500); 
  };

  // Event Listeners for Tab Switching & Fullscreen
  useEffect(() => {
    if (!hasStarted) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) issueStrike("You left the test tab.");
    };
    
    const handleBlur = () => {
      issueStrike("You clicked outside the test window.");
    };
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        issueStrike("You exited fullscreen mode.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [hasStarted]);

  // Attach video stream once the video element is rendered or warning clears
  useEffect(() => {
    if (hasStarted && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      if (!warningMessage) {
        videoRef.current.play().catch(err => console.error("Video play error:", err));
      }
    }
  }, [hasStarted, warningMessage]);

  // Countdown Timer logic
  useEffect(() => {
    if (hasStarted && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            toast.error("Time's up! Auto-submitting...");
            cleanup();
            if (onForceSubmit) onForceSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [hasStarted, timeLeft]);

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      // Defer hardware teardown to prevent blocking the UI thread during navigation
      setTimeout(() => {
        tracks.forEach(track => track.stop());
      }, 1500);
    }
    if (audioContextRef.current) {
      if(audioContextRef.current.state !== 'closed') {
         setTimeout(() => {
           if(audioContextRef.current && audioContextRef.current.state !== 'closed') {
             audioContextRef.current.close().catch(console.error);
           }
         }, 1500);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative z-[99999]">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-brand-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Proctored Test</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            This test is strictly monitored by AI. To begin, you must grant access to your <b>Camera</b> and <b>Microphone</b>, and remain in <b>Fullscreen mode</b>.
          </p>
          
          <div className="space-y-4 mb-8 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 text-slate-700">
              <Camera className="w-5 h-5 text-brand-500" />
              <span>Face must be visible at all times</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Mic className="w-5 h-5 text-brand-500" />
              <span>No talking or loud background noise</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Maximize className="w-5 h-5 text-brand-500" />
              <span>Do not exit fullscreen or switch tabs</span>
            </div>
          </div>
          
          <button 
            onClick={handleStartSetup} 
            disabled={isLoading}
            className="w-full btn-primary py-4 text-lg"
          >
            {isLoading ? "Loading AI Models..." : "Start Setup & Begin Test"}
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pipPosition.x,
      initialY: pipPosition.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPipPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY - dy // Subtract dy because y is measured from the bottom
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <>
      {/* Floating Timer */}
      {hasStarted && timeLeft !== null && (
        <div className={`fixed top-20 right-4 z-[9999] px-5 py-2.5 rounded-full font-mono font-bold text-xl border-2 shadow-xl flex items-center gap-2 transition-colors duration-500 ${
          timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-500 animate-pulse' : 'bg-white text-slate-800 border-slate-200'
        }`}>
          <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-500' : 'text-slate-400'}`} />
          {formatTime(timeLeft)}
        </div>
      )}

      {/* Floating PIP Webcam */}
      <div 
        className={`fixed z-[9999] w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-brand-500/50 touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-105'} transition-transform`}
        style={{ left: `${pipPosition.x}px`, bottom: `${pipPosition.y}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover transform -scale-x-100 pointer-events-none"
        ></video>
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 font-mono pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          RECORDING
        </div>
      </div>

      {/* Warning Overlay */}
      {warningMessage && (
        <div className="fixed inset-0 z-[10000] bg-red-600/95 flex flex-col items-center justify-center p-4 animate-fade-in">
          <AlertTriangle className="w-24 h-24 text-white mb-6 animate-bounce" />
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 uppercase tracking-wider">
            Violation Detected
          </h2>
          <p className="text-xl text-red-100 text-center max-w-2xl bg-red-900/50 px-6 py-4 rounded-xl border border-red-500/50 shadow-inner">
            {warningMessage}
          </p>
          <p className="text-white mt-8 opacity-80 text-sm font-medium">
            This warning will disappear in 5 seconds...
          </p>
        </div>
      )}

      {/* Actual Test Component */}
      <div className={warningMessage ? 'pointer-events-none filter blur-md transition-all duration-300' : ''}>
        {children}
      </div>
    </>
  );
}

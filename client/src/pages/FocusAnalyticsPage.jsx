import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { BrainCircuit, Clock, AlertCircle, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FocusAnalyticsPage() {
  const fetchApi = useApi();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('lessons'); // 'lessons' | 'courses'
  const [selectedCourse, setSelectedCourse] = useState(null);

  const courses = React.useMemo(() => {
    const courseMap = {};
    sessions.forEach(session => {
      const cId = session.courseId || session.courseTitle || 'Unknown Course';
      if (!courseMap[cId]) {
        courseMap[cId] = {
          _id: cId,
          title: session.courseTitle || 'Unknown Course',
          sessions: [],
          totalDuration: 0,
          totalNudges: 0,
          scoreSum: 0
        };
      }
      courseMap[cId].sessions.push(session);
      courseMap[cId].totalDuration += session.duration;
      courseMap[cId].totalNudges += session.nudgeCount;
      courseMap[cId].scoreSum += session.averageScore * session.duration;
    });

    return Object.values(courseMap).map(c => ({
      ...c,
      averageScore: c.totalDuration > 0 ? Math.round(c.scoreSum / c.totalDuration) : 0
    })).sort((a, b) => {
       const aTime = a.sessions[0]?.startTime || 0;
       const bTime = b.sessions[0]?.startTime || 0;
       return new Date(bTime) - new Date(aTime);
    });
  }, [sessions]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchApi('/focus/me');
        if (data.success && data.data) {
          setSessions(data.data);
          if (data.data.length > 0) {
            setSelectedSession(data.data[0]); // default to most recent
          }
        }
      } catch (err) {
        console.error("Failed to load focus analytics", err);
        setError("Failed to load focus data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0]);
    }
  }, [courses, selectedCourse]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto animate-pulse bg-slate-50 min-h-screen">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="w-64 h-10 bg-slate-200 rounded-xl"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="w-24 h-4 bg-slate-100 rounded"></div>
                <div className="w-16 h-8 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="w-40 h-6 bg-slate-200 rounded mb-4"></div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4 h-[400px]">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2 pb-4 border-b border-slate-100">
                  <div className="flex justify-between">
                    <div className="w-32 h-5 bg-slate-200 rounded"></div>
                    <div className="w-12 h-5 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="w-48 h-4 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[500px]">
              <div className="flex justify-between mb-6">
                <div className="space-y-2">
                  <div className="w-64 h-6 bg-slate-200 rounded"></div>
                  <div className="w-40 h-4 bg-slate-100 rounded"></div>
                </div>
                <div className="space-y-2 items-end flex flex-col">
                  <div className="w-24 h-4 bg-slate-100 rounded"></div>
                  <div className="w-32 h-5 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="w-full h-80 bg-slate-100 rounded-xl mb-6"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-slate-100 rounded-xl"></div>
                <div className="h-20 bg-slate-100 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center max-w-4xl mx-auto mt-10">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <Link to="/" className="btn-secondary">Back to Dashboard</Link>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-8 text-center max-w-4xl mx-auto mt-10 bg-white rounded-2xl shadow-sm border border-slate-200">
        <BrainCircuit className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Focus Data Yet</h2>
        <p className="text-slate-500 mb-6">Start a lesson with Focus Mode enabled to see your analytics here.</p>
        <Link to="/" className="btn-primary inline-flex">Go to Courses</Link>
      </div>
    );
  }

  const totalTime = sessions.reduce((acc, s) => acc + s.duration, 0);
  const avgScoreAll = Math.round(sessions.reduce((acc, s) => acc + s.averageScore, 0) / sessions.length);
  const totalNudges = sessions.reduce((acc, s) => acc + s.nudgeCount, 0);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const chartData = selectedSession?.dataPoints?.map(dp => ({
    time: `${Math.floor(dp.timeOffset / 60)}:${(dp.timeOffset % 60).toString().padStart(2, '0')}`,
    score: dp.score
  })) || [];

  const courseChartData = selectedCourse?.sessions?.slice().reverse().map((s, idx) => ({
    name: `Session ${idx + 1}`,
    score: s.averageScore,
    duration: Math.floor(s.duration / 60)
  })) || [];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto animate-fade-in bg-slate-50 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-brand-600" />
          Study Analytics
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
          <div className="bg-brand-100 p-3 rounded-xl text-brand-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Focus Time</p>
            <p className="text-2xl font-bold text-slate-900">{formatDuration(totalTime)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Average Focus Score</p>
            <p className="text-2xl font-bold text-slate-900">{avgScoreAll}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total AI Nudges</p>
            <p className="text-2xl font-bold text-slate-900">{totalNudges}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('lessons')} 
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'lessons' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Lessons
              </button>
              <button 
                onClick={() => setViewMode('courses')} 
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'courses' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Courses
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {viewMode === 'lessons' ? sessions.map((session, idx) => (
              <button
                key={session._id || idx}
                onClick={() => setSelectedSession(session)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4 ${selectedSession?._id === session._id ? 'bg-brand-50 !border-l-brand-500' : '!border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-900 truncate pr-2">
                    {session.lessonTitle || 'Lesson Focus'}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                    session.averageScore >= 80 ? 'bg-green-100 text-green-700' : 
                    session.averageScore >= 50 ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {session.averageScore}%
                  </span>
                </div>
                <div className="text-sm text-slate-500 truncate mb-2">
                  {session.courseTitle || 'Course'}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.startTime).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(session.duration)}
                  </span>
                </div>
              </button>
            )) : courses.map((course, idx) => (
              <button
                key={course._id || idx}
                onClick={() => setSelectedCourse(course)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4 ${selectedCourse?._id === course._id ? 'bg-brand-50 !border-l-brand-500' : '!border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-900 truncate pr-2">
                    {course.title}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                    course.averageScore >= 80 ? 'bg-green-100 text-green-700' : 
                    course.averageScore >= 50 ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {course.averageScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3" />
                    {course.sessions.length} sessions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(course.totalDuration)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {viewMode === 'lessons' && selectedSession && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedSession.lessonTitle || 'Lesson Focus'}</h3>
                  <p className="text-slate-500">{selectedSession.courseTitle}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 mb-1">Session Date</div>
                  <div className="font-medium text-slate-700">
                    {new Date(selectedSession.startTime).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="h-80 w-full mb-6">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#64748B', marginBottom: '4px' }}
                      />
                      <ReferenceLine y={40} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Low Focus Threshold', fill: '#EF4444', fontSize: 10 }} />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="Focus Score" 
                        stroke="#6366F1" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col justify-center items-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-slate-500">Not enough data points collected for this session.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="text-sm text-slate-500 mb-1">Session Duration</div>
                  <div className="font-bold text-slate-800 text-lg">{formatDuration(selectedSession.duration)}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="text-sm text-slate-500 mb-1">AI Interventions</div>
                  <div className="font-bold text-slate-800 text-lg">{selectedSession.nudgeCount} nudges</div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'courses' && selectedCourse && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedCourse.title}</h3>
                  <p className="text-slate-500">{selectedCourse.sessions.length} sessions recorded</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 mb-1">Last Studied</div>
                  <div className="font-medium text-slate-700">
                    {new Date(selectedCourse.sessions[0].startTime).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="h-80 w-full mb-6">
                {courseChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={courseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#64748B', marginBottom: '4px' }}
                      />
                      <ReferenceLine y={40} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Low Focus Threshold', fill: '#EF4444', fontSize: 10 }} />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="Avg Session Score" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col justify-center items-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-slate-500">Not enough data points collected.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="text-sm text-slate-500 mb-1">Total Course Duration</div>
                  <div className="font-bold text-slate-800 text-lg">{formatDuration(selectedCourse.totalDuration)}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="text-sm text-slate-500 mb-1">Total AI Interventions</div>
                  <div className="font-bold text-slate-800 text-lg">{selectedCourse.totalNudges} nudges</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { Trophy, Medal, Crown, Star, Target, Activity, Info } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [currentUserScore, setCurrentUserScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchApi = useApi();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetchApi('/leaderboard');
        setLeaderboard(res.leaderboard || []);
        setCurrentUserRank(res.currentUserRank);
        setCurrentUserScore(res.currentUserScore || 0);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [fetchApi]);

  const top3 = leaderboard.slice(0, 3);
  const restOfUsers = leaderboard.slice(3);

  const userIndexInLeaderboard = leaderboard.findIndex(u => user && u._id === user._id);
  const actualCurrentUserRank = userIndexInLeaderboard !== -1 ? userIndexInLeaderboard + 1 : currentUserRank;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 animate-pulse">
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="w-64 h-12 bg-slate-200 rounded-lg mb-4"></div>
          <div className="w-96 h-6 bg-slate-100 rounded-md"></div>
        </div>
        
        {/* Skeleton Podium */}
        <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 mb-16 pt-10">
          {/* Rank 2 */}
          <div className="flex-1 max-w-[220px] order-2 md:order-1 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-slate-100 mb-4 z-10 relative top-6"></div>
            <div className="bg-slate-100 rounded-2xl w-full h-40 pt-10 pb-6 flex flex-col items-center gap-3">
               <div className="w-24 h-5 bg-slate-200 rounded"></div>
               <div className="w-16 h-4 bg-slate-200 rounded"></div>
               <div className="w-20 h-6 bg-slate-200 rounded"></div>
            </div>
          </div>
          {/* Rank 1 */}
          <div className="flex-1 max-w-[260px] order-1 md:order-2 flex flex-col items-center z-10">
            <div className="w-28 h-28 rounded-full bg-slate-200 border-4 border-slate-100 mb-6 z-10 relative top-10"></div>
            <div className="bg-slate-100 rounded-2xl w-full h-48 pt-14 pb-8 flex flex-col items-center gap-3">
               <div className="w-32 h-6 bg-slate-200 rounded"></div>
               <div className="w-20 h-4 bg-slate-200 rounded"></div>
               <div className="w-24 h-8 bg-slate-200 rounded"></div>
            </div>
          </div>
          {/* Rank 3 */}
          <div className="flex-1 max-w-[220px] order-3 md:order-3 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-slate-100 mb-4 z-10 relative top-6"></div>
            <div className="bg-slate-100 rounded-2xl w-full h-36 pt-10 pb-4 flex flex-col items-center gap-3">
               <div className="w-24 h-5 bg-slate-200 rounded"></div>
               <div className="w-16 h-4 bg-slate-200 rounded"></div>
               <div className="w-20 h-6 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Skeleton List */}
        <div className="bg-white/70 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="w-8 h-4 bg-slate-200 rounded"></div>
                <div className="flex items-center gap-3 flex-1 px-8">
                  <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                  <div className="w-32 h-5 bg-slate-200 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-slate-200 rounded hidden md:block"></div>
                <div className="w-20 h-6 bg-slate-200 rounded ml-4"></div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
      <div className="text-center mb-12 relative">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 flex items-center justify-center gap-4">
          <Trophy className="w-10 h-10 md:w-12 md:h-12 text-amber-500" />
          Global Leaderboard
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto flex items-center justify-center gap-2">
          Compete with learners worldwide and earn Magic Points!
          <div className="group relative flex items-center justify-center cursor-help">
            <Info className="w-5 h-5 text-slate-400 hover:text-brand-500 transition-colors" />
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-slate-900 text-slate-100 text-sm rounded-xl p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-left leading-relaxed">
              <div className="font-bold text-white mb-2">How points are calculated:</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li><span className="text-white">Lesson Tests:</span> Up to 20 pts</li>
                <li><span className="text-white">Final Exams:</span> Up to 100 pts</li>
                <li><span className="text-white">Formula:</span> Base Pts × Accuracy %</li>
                <li><span className="text-white">Pass Bonus:</span> 1.5x multiplier if you pass!</li>
              </ul>
              <div className="mt-2 text-xs text-slate-400 italic">Points are only awarded on your first attempt.</div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900"></div>
            </div>
          </div>
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200">
          <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-700 mb-2">No scores yet</h2>
          <p className="text-slate-500">Be the first to take a test and claim the #1 spot!</p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 mb-16 pt-10">
            {/* Rank 2 */}
            {top3[1] && (
              <div className="flex-1 max-w-[220px] order-2 md:order-1 flex flex-col items-center transform transition-transform hover:-translate-y-2">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-slate-300 flex items-center justify-center shadow-lg shadow-slate-200 overflow-hidden">
                    <img 
                      src={top3[1].profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[1].name)}&background=random`} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[1].name)}&background=random`; }}
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-2 bg-slate-300 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-white">
                    2
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 w-full text-center border-t-4 border-slate-300 shadow-xl pb-8">
                  <h3 className="font-bold text-slate-800 truncate w-full px-1" title={top3[1].name}>{top3[1].name}</h3>
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-1 mb-2">
                    <Target className="w-3 h-3" /> {top3[1].totalTestsTaken} tests
                  </div>
                  <div className="text-xl font-black text-brand-600">{top3[1].globalScore.toLocaleString()} pts</div>
                </div>
              </div>
            )}

            {/* Rank 1 */}
            {top3[0] && (
              <div className="flex-1 max-w-[260px] order-1 md:order-2 flex flex-col items-center transform transition-transform hover:-translate-y-2 z-10">
                <div className="relative mb-6">
                  <Crown className="w-12 h-12 text-amber-500 absolute -top-10 left-1/2 -translate-x-1/2 drop-shadow-md" />
                  <div className="w-28 h-28 rounded-full bg-amber-50 border-4 border-amber-400 flex items-center justify-center shadow-xl shadow-amber-200 overflow-hidden">
                    <img 
                      src={top3[0].profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[0].name)}&background=random`} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[0].name)}&background=random`; }}
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-2 bg-amber-400 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-white">
                    1
                  </div>
                </div>
                <div className="bg-gradient-to-b from-amber-50 to-white backdrop-blur-md rounded-2xl p-5 w-full text-center border-t-4 border-amber-400 shadow-2xl shadow-amber-100/50 pb-12">
                  <h3 className="font-bold text-lg text-slate-900 truncate w-full px-1" title={top3[0].name}>{top3[0].name}</h3>
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-1 mb-3">
                    <Target className="w-4 h-4" /> {top3[0].totalTestsTaken} tests
                  </div>
                  <div className="text-3xl font-black text-amber-600">{top3[0].globalScore.toLocaleString()} pts</div>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {top3[2] && (
              <div className="flex-1 max-w-[220px] order-3 md:order-3 flex flex-col items-center transform transition-transform hover:-translate-y-2">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-orange-50 border-4 border-orange-300 flex items-center justify-center shadow-lg shadow-orange-100 overflow-hidden">
                    <img 
                      src={top3[2].profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[2].name)}&background=random`} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[2].name)}&background=random`; }}
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-2 bg-orange-300 text-orange-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-white">
                    3
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 w-full text-center border-t-4 border-orange-300 shadow-xl pb-6">
                  <h3 className="font-bold text-slate-800 truncate w-full px-1" title={top3[2].name}>{top3[2].name}</h3>
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-1 mb-2">
                    <Target className="w-3 h-3" /> {top3[2].totalTestsTaken} tests
                  </div>
                  <div className="text-xl font-black text-brand-600">{top3[2].globalScore.toLocaleString()} pts</div>
                </div>
              </div>
            )}
          </div>

          {/* List for Rank 4+ */}
          {restOfUsers.length > 0 && (
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-8">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 font-semibold text-slate-500 text-sm uppercase tracking-wider bg-slate-50/50">
                <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                <div className="col-span-6 md:col-span-5">Learner</div>
                <div className="col-span-4 md:col-span-3 text-center hidden md:block">Tests Taken</div>
                <div className="col-span-4 md:col-span-3 text-right pr-4">Magic Score</div>
              </div>
              <div className="divide-y divide-slate-100">
                {/* Pinned Current User Row (if outside top 3) */}
                {(actualCurrentUserRank && actualCurrentUserRank > 3) && (
                  <div className="bg-brand-50/80 border-l-4 border-l-brand-500 border-b-2 border-b-brand-100 grid grid-cols-12 gap-4 p-4 items-center relative shadow-sm">
                    <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">You</div>
                    <div className="col-span-2 md:col-span-1 text-center font-mono font-bold text-slate-600">
                      #{actualCurrentUserRank}
                    </div>
                    <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 shadow-sm overflow-hidden shrink-0">
                        <img 
                          src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`; }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 truncate" title={user?.name}>
                        {user?.name}
                      </span>
                    </div>
                    <div className="col-span-4 md:col-span-3 text-center hidden md:block text-slate-600 font-semibold">
                      {(user && leaderboard.find(u => u._id === user._id)?.totalTestsTaken) ?? "-"}
                    </div>
                    <div className="col-span-4 md:col-span-3 text-right pr-4 font-black text-brand-600 text-lg">
                      {currentUserScore.toLocaleString()}
                    </div>
                  </div>
                )}

                {restOfUsers.map((u, i) => {
                  const rank = i + 4;
                  const isCurrentUser = user && user._id === u._id;
                  
                  return (
                    <div 
                      key={u._id} 
                      className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                        isCurrentUser ? 'bg-brand-50/50 border-l-4 border-l-brand-500' : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="col-span-2 md:col-span-1 text-center font-mono font-bold text-slate-400">
                        #{rank}
                      </div>
                      <div className="col-span-6 md:col-span-5 flex items-center gap-3 w-full overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 overflow-hidden">
                          <img 
                            src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`; }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800 truncate w-full" title={u.name}>
                          {u.name}
                          {isCurrentUser && <span className="ml-2 text-xs font-bold text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full shrink-0">YOU</span>}
                        </span>
                      </div>
                      <div className="col-span-4 md:col-span-3 text-center hidden md:block text-slate-500 font-medium">
                        {u.totalTestsTaken}
                      </div>
                      <div className="col-span-4 md:col-span-3 text-right pr-4 font-black text-brand-600">
                        {u.globalScore.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note: The old banner at the bottom for users rank > 50 is removed since we now pin them at the top! */}
        </>
      )}
    </div>
  );
}

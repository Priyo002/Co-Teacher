import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Check, X, ShieldAlert, Users, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchApi = useApi();

  useEffect(() => {
    if (user?.isAdmin) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, usersRes, mentorsRes] = await Promise.all([
        fetchApi('/mentors/admin/applications').catch(() => []),
        fetchApi('/mentors/admin/users').catch(() => []),
        fetchApi('/mentors').catch(() => [])
      ]);
      setApplications(Array.isArray(appsRes) ? appsRes : []);
      setUsersList(Array.isArray(usersRes) ? usersRes : []);
      setMentorsList(Array.isArray(mentorsRes) ? mentorsRes : []);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await fetchApi('/mentors/admin/approve', {
        method: 'POST',
        body: JSON.stringify({ applicationId: id, status })
      });
      toast.success(`Application ${status}!`);
      setApplications(applications.filter(app => app._id !== id));
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!user?.isAdmin) {
    return (
      <div className="p-8 text-center text-rose-500 font-bold">
        Access Denied. You are not an admin.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 flex flex-col md:flex-row gap-8">
      {/* Admin Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          Admin Panel
        </h1>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'applications' 
                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-5 h-5" /> Applications
          </button>
          <button 
            onClick={() => setActiveTab('mentors')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'mentors' 
                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Users className="w-5 h-5" /> Mentors
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'users' 
                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Users className="w-5 h-5" /> All Users
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {activeTab === 'applications' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Mentor Applications</h2>
              <p className="text-slate-500 mt-1">Approve or reject users applying to be mentors.</p>
            </div>

            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <p className="text-slate-500 text-lg">No pending applications at the moment.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map(app => (
                  <div key={app._id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-sm">
                    <div>
                      <h3 className="font-bold text-lg">{app.user?.name || 'Unknown User'}</h3>
                      <p className="text-sm text-slate-500 mb-2">{app.user?.email}</p>
                      <div className="mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expertise:</span>
                        <div className="flex gap-2 mt-1">
                          {app.expertise.map((skill, i) => (
                            <span key={i} className="bg-brand-50 text-brand-700 px-2 py-1 rounded-md text-xs font-medium border border-brand-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Experience:</span>
                        <p className="text-sm text-slate-700 mt-1">{app.experience}</p>
                      </div>
                      
                      {(app.linkedinUrl || app.portfolioUrl || app.proofOfWork) && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {app.linkedinUrl && (
                            <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-600 hover:underline">LinkedIn</a>
                          )}
                          {app.portfolioUrl && (
                            <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-600 hover:underline">Portfolio</a>
                          )}
                          {app.proofOfWork && (
                            <a href={app.proofOfWork.startsWith('http') ? app.proofOfWork : `https://${app.proofOfWork}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-600 hover:underline">Proof of Work</a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        app.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {app.status}
                      </span>
                      
                      {app.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button 
                            onClick={() => handleAction(app._id, 'approved')}
                            className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-medium rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button 
                            onClick={() => handleAction(app._id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-medium rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mentors' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Approved Mentors</h2>
              <p className="text-slate-500 mt-1">Users who are currently active mentors on the platform.</p>
            </div>
            
            <div className="grid gap-4">
              {mentorsList.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                  <p className="text-slate-500 text-lg">No active mentors found.</p>
                </div>
              ) : (
                mentorsList.map(mentor => (
                  <div key={mentor._id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                    {mentor.profilePicture ? (
                      <img src={mentor.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold">
                        {mentor.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{mentor.name}</h3>
                      <p className="text-sm text-slate-500">{mentor.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">Rate</span>
                      <div className="font-bold">₹{mentor.mentorProfile?.rateINR}/hr</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">All Users</h2>
              <p className="text-slate-500 mt-1">Manage users signed up on Co-Teacher.</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-200">Name</th>
                    <th className="px-6 py-4 border-b border-slate-200">Email</th>
                    <th className="px-6 py-4 border-b border-slate-200">Credits</th>
                    <th className="px-6 py-4 border-b border-slate-200">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        {u.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{u.email}</td>
                      <td className="px-6 py-4 font-bold text-amber-500">{u.credits}</td>
                      <td className="px-6 py-4">
                        {u.isAdmin ? (
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-xs font-bold uppercase">Admin</span>
                        ) : u.isMentor ? (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold uppercase">Mentor</span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold uppercase">Student</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

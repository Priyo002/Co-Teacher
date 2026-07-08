import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { countryCodes } from '../utils/countryCodes';
import { User, Phone, BookOpen, Target, CheckCircle, Smartphone, Save, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshProfile, getToken } = useAuth();
  const fetchApi = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    educationLevel: 'High School',
    fieldOfStudy: '',
    learningStyle: [],
    learningGoal: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        const profileData = await fetchApi('/user/profile');
        setFormData({
          name: profileData.name || '',
          educationLevel: profileData.educationLevel || 'High School',
          fieldOfStudy: profileData.fieldOfStudy || '',
          learningStyle: profileData.learningStyle || [],
          learningGoal: profileData.learningGoal || ''
        });
      } catch (err) {
        console.error('Failed to load profile data', err);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?._id, user?.credits]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleLearningStyle = (style) => {
    setFormData(prev => {
      const current = prev.learningStyle;
      if (current.includes(style)) {
        return { ...prev, learningStyle: current.filter(s => s !== style) };
      } else {
        return { ...prev, learningStyle: [...current, style] };
      }
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image must be smaller than 5MB");
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = await getToken();
      const res = await fetch(import.meta.env.VITE_API_URL + '/user/profile/picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');
      
      await refreshProfile();
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Your Profile</h1>
        <p className="text-slate-500">Manage your account settings, learning preferences, and billing.</p>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col h-full gap-6">
          {/* Profile Picture Section */}
          <div className="glass-panel p-6 sm:p-8 bg-white border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-100 border-4 border-white shadow-md flex items-center justify-center font-bold text-3xl text-brand-700">
                {uploadingImage ? (
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                ) : user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-brand-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-brand-700 transition-colors transform translate-x-1 translate-y-1">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-slate-500 text-sm mb-3">{user?.email}</p>
              <label className="text-sm font-semibold text-brand-600 hover:text-brand-700 cursor-pointer inline-flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
                <Camera className="w-4 h-4" />
                Update Picture
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
          </div>

          {/* General Info */}
          <div className="glass-panel p-6 sm:p-8 bg-white border border-slate-200 flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-600" />
              General Information
            </h2>
            <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col">
              <div className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              {/* Onboarding Fields */}
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-600" />
                  Learning Preferences
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Education Level</label>
                    <select
                      value={formData.educationLevel}
                      onChange={e => setFormData({...formData, educationLevel: e.target.value})}
                      className="input-field cursor-pointer bg-white appearance-none"
                    >
                      <option value="High School">High School</option>
                      <option value="College">College</option>
                      <option value="Professional">Professional</option>
                      <option value="Hobbyist">Hobbyist</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Field of Study</label>
                    <input
                      type="text"
                      value={formData.fieldOfStudy}
                      onChange={e => setFormData({...formData, fieldOfStudy: e.target.value})}
                      className="input-field"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Learning Style</label>
                  <div className="flex gap-3 flex-wrap">
                    {['Visual', 'Reading', 'Hands-on'].map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleLearningStyle(style)}
                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                          formData.learningStyle.includes(style)
                            ? 'bg-brand-50 border-brand-500 text-brand-700 ring-2 ring-brand-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" />
                    Primary Learning Goal
                  </label>
                  <textarea
                    value={formData.learningGoal}
                    onChange={e => setFormData({...formData, learningGoal: e.target.value})}
                    className="input-field resize-none h-24"
                    placeholder="e.g. I want to become a full-stack developer..."
                  />
                </div>
              </div>
            </div>

              <div className="pt-6 flex justify-end mt-auto">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-8">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
      </div>
    </div>
  );
}

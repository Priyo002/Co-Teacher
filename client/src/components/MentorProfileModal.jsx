import { createPortal } from 'react-dom';
import { X, MapPin, Briefcase, Users, Star, GraduationCap, Link as LinkIcon, Video } from 'lucide-react';

export default function MentorProfileModal({ mentor, isOpen, onClose, onBookSession }) {
  if (!isOpen || !mentor) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-900">Mentor Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Left: Image & Quick Info */}
            <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                {mentor.profilePicture ? (
                  <img src={mentor.profilePicture} alt={mentor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-6xl text-brand-500 bg-brand-50">
                    {mentor.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {mentor.mentorProfile?.rateINR === 0 ? (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                    <span className="text-xs text-emerald-600 uppercase font-semibold">Session Rate</span>
                    <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                      Free <span className="text-sm font-medium text-emerald-600">/ 60 mins</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-brand-50 rounded-xl p-4 border border-brand-100 text-center">
                    <span className="text-xs text-brand-600 uppercase font-semibold">Session Rate</span>
                    <div className="text-2xl font-extrabold text-brand-900 mt-1">
                      ₹{mentor.mentorProfile?.rateINR !== undefined ? mentor.mentorProfile.rateINR : 500} <span className="text-sm font-medium text-brand-700">/ 60 mins</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={onBookSession}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base shadow-lg hover:-translate-y-1 transition-transform"
                >
                  <Video className="w-5 h-5" /> Book Session
                </button>
              </div>
            </div>

            {/* Right: Full Details */}
            <div className="flex-1 space-y-8">
              {/* Basic Info */}
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">{mentor.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mt-2">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {mentor.mentorProfile?.location || 'Remote'}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {mentor.mentorProfile?.languages?.join(', ') || 'English'}</span>
                </div>
              </div>

              {/* Roles */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex-1 min-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Briefcase className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{mentor.mentorProfile?.jobTitle || 'Expert'}</p>
                    <p className="text-xs text-slate-500">{mentor.mentorProfile?.company || 'Independent'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex-1 min-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Star className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{mentor.mentorProfile?.experienceYears || 0}+ Years</p>
                    <p className="text-xs text-slate-500">Professional Experience</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">About Me</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {mentor.mentorProfile?.bio || "No biography provided."}
                </p>
              </div>

              {/* Skills */}
              {mentor.mentorProfile?.skills?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Core Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.mentorProfile.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Domains */}
              {mentor.mentorProfile?.domains?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Expertise Domains</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.mentorProfile.domains.map((domain, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentorship Audience */}
              {mentor.mentorProfile?.targetAudience?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Mentoring For</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.mentorProfile.targetAudience.map((aud, i) => (
                      <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-sm font-medium flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" /> {aud}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {(mentor.mentorProfile?.linkedinUrl || mentor.mentorProfile?.portfolioUrl) && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Links</h3>
                  <div className="flex flex-wrap gap-4">
                    {mentor.mentorProfile?.linkedinUrl && (
                      <a href={mentor.mentorProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline font-medium">
                        <LinkIcon className="w-4 h-4" /> LinkedIn
                      </a>
                    )}
                    {mentor.mentorProfile?.portfolioUrl && (
                      <a href={mentor.mentorProfile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline font-medium">
                        <LinkIcon className="w-4 h-4" /> Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

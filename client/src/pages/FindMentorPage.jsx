import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { Search, Star, Clock, GraduationCap, MapPin, Briefcase, Video, Filter, ChevronDown, CheckCircle, Users } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import MentorProfileModal from '../components/MentorProfileModal';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import MentorDiscoverySkeleton from '../components/skeletons/MentorDiscoverySkeleton';
import Pagination from '../components/Pagination';

export default function FindMentorPage() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedAudience, setSelectedAudience] = useState('All');
  
  // Pricing & Experience Sort & Filter
  const [priceSort, setPriceSort] = useState('none'); // 'none', 'low-to-high', 'high-to-low'
  const [priceMax, setPriceMax] = useState(40000);
  const [expMin, setExpMin] = useState(0);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedMentorProfile, setSelectedMentorProfile] = useState(null);
  
  const fetchApi = useApi();

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const data = await fetchApi('/mentors');
      setMentors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Derive all unique domains from mentors for the filter
  const allDomains = useMemo(() => {
    const domains = new Set();
    mentors.forEach(m => {
      m.mentorProfile?.domains?.forEach(d => domains.add(d));
    });
    return Array.from(domains).sort();
  }, [mentors]);

  // Derive all unique skills from mentors for the filter
  const allSkills = useMemo(() => {
    const skills = new Set();
    mentors.forEach(m => {
      m.mentorProfile?.skills?.forEach(s => skills.add(s));
    });
    return Array.from(skills).sort();
  }, [mentors]);

  const filteredMentors = mentors.filter(m => {
    const p = m.mentorProfile;
    if (!p) return false;
    
    // Search
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      m.name.toLowerCase().includes(searchLower) || 
      p.skills?.some(s => s.toLowerCase().includes(searchLower)) ||
      p.domains?.some(d => d.toLowerCase().includes(searchLower)) ||
      p.jobTitle?.toLowerCase().includes(searchLower);
      
    // Domain Filter
    const matchesDomain = selectedDomains.length === 0 || 
      selectedDomains.some(d => p.domains?.includes(d));
      
    // Skill Filter
    const matchesSkill = selectedSkills.length === 0 || 
      selectedSkills.some(s => p.skills?.includes(s));
      
    // Audience Filter
    const matchesAudience = selectedAudience === 'All' || 
      p.targetAudience?.includes(selectedAudience);

    // Price & Experience Filter
    const rate = p.rateINR !== undefined ? p.rateINR : 500;
    const matchesPrice = rate <= priceMax;
    
    const exp = p.experienceYears || 0;
    const matchesExp = exp >= expMin;

    return matchesSearch && matchesDomain && matchesSkill && matchesAudience && matchesPrice && matchesExp;
  });

  // Sort Mentors
  const sortedMentors = [...filteredMentors].sort((a, b) => {
    if (priceSort === 'none') return 0;
    const rateA = a.mentorProfile?.rateINR !== undefined ? a.mentorProfile.rateINR : 500;
    const rateB = b.mentorProfile?.rateINR !== undefined ? b.mentorProfile.rateINR : 500;
    
    if (priceSort === 'low-to-high') return rateA - rateB;
    if (priceSort === 'high-to-low') return rateB - rateA;
    return 0;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDomains, selectedSkills, selectedAudience, priceMax, expMin]);

  const totalPages = Math.ceil(sortedMentors.length / itemsPerPage);
  const paginatedMentors = sortedMentors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <MentorDiscoverySkeleton />;

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Find your ideal Mentor</h1>
        <p className="text-slate-500 mt-2 text-lg">Book 1-on-1 sessions to accelerate your career.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: Mentor List */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by any Skill, domain or name..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-6">
            {paginatedMentors.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-500 font-medium">
                No mentors found matching your filters. Try adjusting your search!
              </div>
            ) : 
              paginatedMentors.map(mentor => (
                <div key={mentor._id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-shadow">
                
                <div className="w-full sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 border-4 border-slate-50 shadow-sm">
                  {mentor.profilePicture ? (
                    <img src={mentor.profilePicture} alt={mentor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-extrabold text-4xl text-brand-500 bg-gradient-to-br from-brand-50 to-brand-100">
                      {mentor.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Mentor Info */}
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900">{mentor.name}</h2>
                      <div className="text-sm font-bold text-brand-600 mt-1">
                        {mentor.mentorProfile?.jobTitle || 'Expert'} {mentor.mentorProfile?.company && `at ${mentor.mentorProfile.company}`}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 mt-2">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {mentor.mentorProfile?.location || 'Remote'}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {mentor.mentorProfile?.languages?.join(', ') || 'English'}</span>
                        <span className="flex items-center gap-1 text-amber-600"><Star className="w-3.5 h-3.5" /> {mentor.mentorProfile?.experienceYears || 0}+ Yrs Exp</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mt-4 line-clamp-2 leading-relaxed font-medium">
                    {mentor.mentorProfile?.bio}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {mentor.mentorProfile?.skills?.slice(0, 6).map((skill, i) => (
                      <span key={i} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                        {skill}
                      </span>
                    ))}
                    {mentor.mentorProfile?.skills?.length > 6 && (
                      <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-brand-100 transition-colors">
                        +{mentor.mentorProfile.skills.length - 6} More
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action Column */}
                <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6 flex flex-col justify-center">
                  
                  {mentor.mentorProfile?.rateINR === 0 ? (
                    <div className="mb-6">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Session Rate</span>
                      <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                        Free <span className="text-sm font-medium text-emerald-500">/ 60 mins</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Session Rate</span>
                      <div className="text-3xl font-extrabold text-slate-900 mt-1">
                        ₹{mentor.mentorProfile?.rateINR !== undefined ? mentor.mentorProfile.rateINR : 500} <span className="text-sm font-medium text-slate-500">/ 60 mins</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button 
                      onClick={() => setSelectedMentorProfile(mentor)}
                      className="w-full btn-secondary py-3 flex items-center justify-center gap-2 text-base shadow-sm hover:shadow-md transition-all"
                    >
                      View Full Profile
                    </button>
                    <button 
                      onClick={() => setSelectedMentor(mentor)}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base shadow-lg hover:-translate-y-1 transition-transform"
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
          />
        </div>

        {/* RIGHT COLUMN: Filters Sidebar */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Filter className="w-5 h-5" /> Filter By</h3>
              {(selectedDomains.length > 0 || selectedSkills.length > 0 || selectedAudience !== 'All' || priceMax !== 40000 || expMin !== 0 || priceSort !== 'none') && (
                <button 
                  onClick={() => { setSelectedDomains([]); setSelectedSkills([]); setSelectedAudience('All'); setPriceMax(40000); setExpMin(0); setPriceSort('none'); }}
                  className="text-xs text-brand-600 hover:underline font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Pricing Filters & Sort */}
            <div className="mb-6 z-40 relative">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-900">Pricing</h4>
              </div>
              
              <div className="flex flex-col gap-5 border border-slate-200 rounded-xl p-4">
                <select 
                  value={priceSort}
                  onChange={e => setPriceSort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-700 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer"
                >
                  <option value="none">Sort by Price: Default</option>
                  <option value="low-to-high">Sort: Low to High</option>
                  <option value="high-to-low">Sort: High to Low</option>
                </select>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>₹0</span>
                    <span>₹{priceMax.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="40000" step="500"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Min</span>
                    <span>Max</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Experience Filter */}
            <div className="mb-6 z-40 relative">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Experience</h4>
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>0 Years</span>
                  <span>{expMin === 15 ? '15+ Years' : `${expMin} Years`}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="15" step="1"
                  value={expMin}
                  onChange={(e) => setExpMin(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>

            {/* Domains */}
            <div className="mb-6 z-30 relative">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Domain</h4>
              <MultiSelectDropdown 
                options={allDomains}
                selected={selectedDomains}
                onChange={setSelectedDomains}
                placeholder="Select domains..."
              />
            </div>

            {/* Skills */}
            <div className="mb-6 z-20 relative">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Skills</h4>
              <MultiSelectDropdown 
                options={allSkills}
                selected={selectedSkills}
                onChange={setSelectedSkills}
                placeholder="Select skills..."
              />
            </div>

            {/* Audience */}
            <div className="mb-8">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Offering Mentorship For</h4>
              <div className="relative">
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-sm text-slate-700 appearance-none focus:outline-none focus:border-brand-500 transition-colors"
                  value={selectedAudience}
                  onChange={(e) => setSelectedAudience(e.target.value)}
                >
                  <option value="All">All Cohorts</option>
                  <option value="High School">High School</option>
                  <option value="College">College</option>
                  <option value="Professional">Professional</option>
                  <option value="Hobbyist">Hobbyist</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100 mt-8">
              <div className="flex gap-3">
                <Star className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-brand-900 mb-1">Why book a session?</h5>
                  <p className="text-xs text-brand-700 leading-relaxed">Find your ideal Co-Teacher for personalized guidance, tech stack mastery, and career advice from experienced industry veterans and professors.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {selectedMentor && (
        <BookingModal 
          mentor={selectedMentor} 
          isOpen={true} 
          onClose={() => setSelectedMentor(null)} 
        />
      )}

      {selectedMentorProfile && (
        <MentorProfileModal 
          mentor={selectedMentorProfile} 
          isOpen={true} 
          onClose={() => setSelectedMentorProfile(null)}
          onBookSession={() => {
            const m = selectedMentorProfile;
            setSelectedMentorProfile(null);
            setSelectedMentor(m);
          }}
        />
      )}
    </div>
  );
}

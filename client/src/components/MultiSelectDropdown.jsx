import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function MultiSelectDropdown({ options, selected, onChange, placeholder = "Select..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(query.toLowerCase())
  );

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(i => i !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const removeOption = (e, opt) => {
    e.stopPropagation();
    onChange(selected.filter(i => i !== opt));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="min-h-[46px] w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 cursor-pointer flex items-center justify-between transition-colors hover:border-slate-300 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 pr-2 max-h-24 overflow-y-auto custom-scrollbar">
          {selected.length === 0 && <span className="text-slate-400 py-1 px-1">{placeholder}</span>}
          {selected.map(sel => (
            <span key={sel} className="bg-brand-50 text-brand-700 border border-brand-100 rounded-lg px-2 py-1 flex items-center gap-1 font-medium text-xs">
              {sel}
              <button 
                onClick={(e) => removeOption(e, sel)} 
                className="hover:bg-brand-200 hover:text-brand-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-72">
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-slate-500">No results found</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selected.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={(e) => { e.stopPropagation(); toggleOption(opt); }}
                    className="px-3 py-2.5 text-sm rounded-lg cursor-pointer hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <span className={`font-medium ${isSelected ? 'text-brand-700' : 'text-slate-700 group-hover:text-slate-900'}`}>{opt}</span>
                    {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

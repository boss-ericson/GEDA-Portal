import fs from 'fs';

let content = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

// Update modal container classes
content = content.replace(
  /className="relative w-full max-w-5xl max-h-\[92vh\] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200\/80 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"/g,
  'className="relative w-full h-[100dvh] sm:h-auto sm:max-w-5xl max-h-[100dvh] sm:max-h-[92vh] bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"'
);

// We need to replace the Attitude, Conduct, Interest <select>s with a custom popover component.
// We can define a CustomSelect component at the top of the file, right after imports.

const customSelectCode = `

function CustomDropdown({ label, options, value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.custom-dropdown-' + label.replace(/\\s+/g, '-'))) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, label]);

  return (
    <div className={"relative custom-dropdown-" + label.replace(/\\s+/g, '-')}>
      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-8 py-1 px-2.5 flex justify-between items-center text-left border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
      >
        <span className="truncate">{value || \`Select \${label}...\`}</span>
        <svg className="w-3 h-3 ml-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto p-1">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={"w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 " + (value === opt ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium" : "text-slate-700 dark:text-slate-300")}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-900/50 flex gap-1">
            <input
              type="text"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (customValue.trim()) {
                    onChange(customValue.trim());
                    setCustomValue('');
                    setIsOpen(false);
                  }
                }
              }}
              placeholder="Custom..."
              className="w-full flex-1 min-w-0 h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => {
                if (customValue.trim()) {
                  onChange(customValue.trim());
                  setCustomValue('');
                  setIsOpen(false);
                }
              }}
              className="h-7 px-2 bg-amber-500 text-slate-950 font-medium text-xs rounded hover:bg-amber-600 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`;

if (!content.includes('function CustomDropdown')) {
  // Add CustomDropdown before AcademicCenter component
  content = content.replace('export default function AcademicCenter', customSelectCode + '\nexport default function AcademicCenter');
}

// Replace Attitude select
content = content.replace(
  /<label className="block text-\[10px\] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Attitude<\/label>[\s\S]*?<\/select>/,
  `
    <CustomDropdown 
      label="Attitude" 
      options={ATTITUDES} 
      value={editRecord.attitude} 
      onChange={(val) => setEditRecord({...editRecord, attitude: val})} 
      disabled={!isOtherFieldsEditable()} 
    />
  `.trim()
);

// Replace Conduct select
content = content.replace(
  /<label className="block text-\[10px\] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Conduct<\/label>[\s\S]*?<\/select>/,
  `
    <CustomDropdown 
      label="Conduct" 
      options={CONDUCTS} 
      value={editRecord.conduct} 
      onChange={(val) => setEditRecord({...editRecord, conduct: val})} 
      disabled={!isOtherFieldsEditable()} 
    />
  `.trim()
);

// Replace Interest select
content = content.replace(
  /<label className="block text-\[10px\] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Interest<\/label>[\s\S]*?<\/select>/,
  `
    <CustomDropdown 
      label="Interest" 
      options={INTERESTS} 
      value={editRecord.interest} 
      onChange={(val) => setEditRecord({...editRecord, interest: val})} 
      disabled={!isOtherFieldsEditable()} 
    />
  `.trim()
);

fs.writeFileSync('src/components/AcademicCenter.tsx', content);


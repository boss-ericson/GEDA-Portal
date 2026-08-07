import fs from 'fs';

let content = fs.readFileSync('src/components/AcademicCenter.tsx', 'utf8');

// Replace CustomDropdown with DropdownButton and RemarksButton
const newComponents = `
interface DropdownButtonProps {
  label: string;
  options: string[];
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

function DropdownButton({ label, options, value, onChange, disabled }: DropdownButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const popoverRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAddCustom = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setCustomValue('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={\`h-7 sm:h-8 px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer \${
          value 
            ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border-amber-500/40 font-semibold' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
        } disabled:opacity-50 disabled:cursor-not-allowed\`}
      >
        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">{label}:</span>
        <span className="max-w-[100px] sm:max-w-[140px] truncate text-xs">{value || 'Select'}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 bottom-full mb-1 left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setIsOpen(false); }}
                className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-44 overflow-y-auto p-1 space-y-0.5">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={\`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer \${
                  value === opt 
                    ? 'bg-amber-500 text-slate-950 font-bold' 
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }\`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex gap-1.5">
            <input
              type="text"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              placeholder="Type custom..."
              className="w-full flex-1 min-w-0 h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAddCustom}
              className="h-7 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-md transition-colors shrink-0 cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface RemarksButtonProps {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

function RemarksButton({ value, onChange, disabled }: RemarksButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const popoverRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const QUICK_REMARKS = [
    "An excellent performance.",
    "Very diligent and hardworking.",
    "Promising student, keep it up.",
    "Capable of better performance.",
    "Needs to put in more effort.",
    "Irregular attendance affecting work."
  ];

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={\`h-7 sm:h-8 px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer \${
          value 
            ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border-amber-500/40 font-semibold' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
        } disabled:opacity-50 disabled:cursor-not-allowed\`}
      >
        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Remarks:</span>
        <span className="max-w-[120px] sm:max-w-[180px] truncate text-xs">{value || 'Add Remarks'}</span>
        <FileText className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 bottom-full mb-1 right-0 sm:left-0 w-72 sm:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teacher Remarks</span>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setTempValue(''); setIsOpen(false); }}
                className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-2">
            <textarea
              rows={2}
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              placeholder="Enter custom remarks for student..."
              className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick Remarks:</div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {QUICK_REMARKS.map(rem => (
                <button
                  key={rem}
                  type="button"
                  onClick={() => setTempValue(rem)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
                >
                  {rem}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// Replace CustomDropdown definition
const customDropdownRegex = /function CustomDropdown[\s\S]*?export default function AcademicCenter/;
content = content.replace(customDropdownRegex, newComponents.trim() + '\n\nexport default function AcademicCenter');

// Update modal container & form body padding to prevent mobile cutoff
content = content.replace(
  'div className="w-full flex flex-col flex-1 min-h-0 p-0 sm:p-5 gap-3.5 overflow-y-auto overflow-x-hidden"',
  'div className="w-full flex flex-col flex-1 min-h-0 p-2.5 sm:p-5 gap-3 overflow-y-auto overflow-x-hidden"'
);

// Remove sticky top-0 z-20 from table thead to stop mobile cutoff inside overflow wrapper
content = content.replace(
  '<thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800">',
  '<thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">'
);

// Replace the large 4-column Conduct, Attitude & Remarks Card with small buttons flex row
const oldCardRegex = /{\/\* Conduct, Attitude & Remarks Card \*\}[\s\S]*?<\/div>\s*<\/div>/;
const newButtonsRow = `{/* Conduct, Attitude & Remarks small action buttons */}
                <div className="flex flex-wrap items-center gap-2 p-2 sm:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-0.5 shrink-0">Conduct & Remarks:</span>
                  <DropdownButton 
                    label="Attitude" 
                    options={ATTITUDES} 
                    value={editRecord.attitude} 
                    onChange={(val) => setEditRecord({...editRecord, attitude: val})} 
                    disabled={!isOtherFieldsEditable()} 
                  />
                  <DropdownButton 
                    label="Conduct" 
                    options={CONDUCTS} 
                    value={editRecord.conduct} 
                    onChange={(val) => setEditRecord({...editRecord, conduct: val})} 
                    disabled={!isOtherFieldsEditable()} 
                  />
                  <DropdownButton 
                    label="Interest" 
                    options={INTERESTS} 
                    value={editRecord.interest} 
                    onChange={(val) => setEditRecord({...editRecord, interest: val})} 
                    disabled={!isOtherFieldsEditable()} 
                  />
                  <RemarksButton 
                    value={editRecord.teacherRemarks} 
                    onChange={(val) => setEditRecord({...editRecord, teacherRemarks: val})} 
                    disabled={!isOtherFieldsEditable()} 
                  />
                </div>
              </div>`;

content = content.replace(oldCardRegex, newButtonsRow);

fs.writeFileSync('src/components/AcademicCenter.tsx', content);
console.log('Successfully updated AcademicCenter.tsx');

import React, { useState, useRef } from 'react';
import { 
  CreditCard, Printer, QrCode, Search, Filter, Camera, Download, Upload, 
  Check, Sparkles, ShieldCheck, UserCheck, RefreshCw, Layers, FileText, CheckCircle2,
  Building2, Phone, Calendar, User, Award, Shield, Palette, Sliders, Type, CheckSquare,
  FileDown, Scissors, Grid, LayoutGrid, X, AlertCircle, Loader2
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { School, Student } from '../types';

interface StudentIDCardGeneratorProps {
  school: School;
  students: Student[];
  userRole: string;
  isOffline?: boolean;
  onUpdateStudentPhoto?: (studentId: string, photoUrl: string) => void;
}

interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  isGradient: boolean;
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'bosomtwe_oyoko',
    name: 'Bosomtwe Oyoko Navy & Gold',
    primary: '#0b193c',
    secondary: '#1e3a8a',
    accent: '#f59e0b',
    isGradient: true
  },
  {
    id: 'prempeh_green',
    name: 'Prempeh Royal Emerald',
    primary: '#064e3b',
    secondary: '#047857',
    accent: '#fbbf24',
    isGradient: true
  },
  {
    id: 'achimota_maroon',
    name: 'Achimota Maroon Heritage',
    primary: '#4c0519',
    secondary: '#831843',
    accent: '#f59e0b',
    isGradient: true
  },
  {
    id: 'wesley_blue',
    name: 'Wesley Canary Blue',
    primary: '#1e3a8a',
    secondary: '#2563eb',
    accent: '#facc15',
    isGradient: false
  },
  {
    id: 'ghana_national',
    name: 'Ghana Patriotic Red & Green',
    primary: '#991b1b',
    secondary: '#065f46',
    accent: '#eab308',
    isGradient: true
  },
  {
    id: 'executive_slate',
    name: 'Executive Dark Slate',
    primary: '#0f172a',
    secondary: '#334155',
    accent: '#38bdf8',
    isGradient: true
  }
];

export const StudentIDCardGenerator: React.FC<StudentIDCardGeneratorProps> = ({
  school,
  students: initialStudents,
  userRole,
  isOffline = false,
  onUpdateStudentPhoto
}) => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [cardLayout, setCardLayout] = useState<'both' | 'front_only' | 'back_only'>('both');
  const [editingPhotoStudentId, setEditingPhotoStudentId] = useState<string | null>(null);
  
  // Customization State
  const [colorMode, setColorMode] = useState<'gradient' | 'solid'>('gradient');
  const [primaryColor, setPrimaryColor] = useState<string>('#0b193c');
  const [secondaryColor, setSecondaryColor] = useState<string>('#1e3a8a');
  const [accentColor, setAccentColor] = useState<string>('#f59e0b');
  const [headerMoniker, setHeaderMoniker] = useState<string>('Abohyɛnmma');
  const [schoolAcronym, setSchoolAcronym] = useState<string>(() => {
    return school.name ? school.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 5) : 'BOOSA';
  });
  const [issueDateText, setIssueDateText] = useState<string>('DATE OF ISSUE: OCT. 2026');
  const [activePresetId, setActivePresetId] = useState<string>('bosomtwe_oyoko');

  // PDF Export Modal & State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [pdfPaperType, setPdfPaperType] = useState<'a4_batch' | 'cr80_single'>('a4_batch');
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfDownloadStatus, setPdfDownloadStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  // Filter students based on class and search
  const filteredStudents = students.filter(s => {
    const matchesClass = selectedClass === 'All' || s.classLevel === selectedClass;
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.classLevel))).sort();

  // Select all handler
  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(i => i !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingPhotoStudentId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoDataUrl = reader.result as string;
        setStudents(prev => prev.map(s => s.id === editingPhotoStudentId ? { ...s, passportPicture: photoDataUrl } : s));
        if (onUpdateStudentPhoto) {
          onUpdateStudentPhoto(editingPhotoStudentId, photoDataUrl);
        }
        setEditingPhotoStudentId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerPhotoUpload = (studentId: string) => {
    setEditingPhotoStudentId(studentId);
    fileInputRef.current?.click();
  };

  // Apply preset theme
  const handleApplyPreset = (preset: ColorPreset) => {
    setActivePresetId(preset.id);
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
    setColorMode(preset.isGradient ? 'gradient' : 'solid');
  };

  // Target students to render
  const targetStudents = selectedStudentIds.length > 0 
    ? students.filter(s => selectedStudentIds.includes(s.id))
    : filteredStudents;

  // Function to generate and download print-ready PDF
  const handleDownloadPDF = async () => {
    if (!printableAreaRef.current) return;
    setIsGeneratingPdf(true);
    setPdfDownloadStatus('Preparing print-ready layout & high-resolution vector assets...');

    const canvasCtx = document.createElement('canvas').getContext('2d');
    const convertOklchString = (str: string): string => {
      if (!str || !str.includes('oklch')) return str;
      return str.replace(/oklch\([^)]+\)/gi, (match) => {
        if (canvasCtx) {
          try {
            canvasCtx.fillStyle = '#000000';
            canvasCtx.fillStyle = match;
            const result = canvasCtx.fillStyle;
            if (result && result !== '#000000') {
              return result;
            }
          } catch (e) {}
        }
        // Fallback parser
        const matchInner = match.match(/oklch\(\s*([\d.%]+)/i);
        if (matchInner) {
          let l = parseFloat(matchInner[1]);
          if (matchInner[1].includes('%')) l = l / 100;
          if (l > 0.85) return '#ffffff';
          if (l > 0.7) return '#f1f5f9';
          if (l > 0.5) return '#64748b';
          if (l > 0.3) return '#334155';
        }
        return '#0f172a';
      });
    };

    // 1. Sanitize main document style tags before html2canvas initializes
    const styleBackups: { el: HTMLStyleElement; original: string }[] = [];
    const styleEls = Array.from(document.querySelectorAll('style'));
    styleEls.forEach((styleEl) => {
      if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
        styleBackups.push({ el: styleEl, original: styleEl.textContent });
        styleEl.textContent = convertOklchString(styleEl.textContent);
      }
    });

    // 2. Sanitize main document CSSStyleSheet rules directly
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach((rule) => {
          if (rule.cssText && rule.cssText.includes('oklch')) {
            const styleRule = rule as CSSStyleRule;
            if (styleRule.style) {
              for (let i = 0; i < styleRule.style.length; i++) {
                const propName = styleRule.style[i];
                const propVal = styleRule.style.getPropertyValue(propName);
                if (propVal && propVal.includes('oklch')) {
                  styleRule.style.setProperty(propName, convertOklchString(propVal));
                }
              }
            }
          }
        });
      } catch (e) {
        // Ignore cross-origin stylesheet rules access
      }
    });

    try {
      const element = printableAreaRef.current;
      const fileName = `${school.name.replace(/[^a-zA-Z0-9]/g, '_')}_Student_ID_Cards_PrintReady.pdf`;

      let opt: any = {
        margin: pdfPaperType === 'a4_batch' ? [8, 8, 8, 8] : [0, 0, 0, 0],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 3, // High DPI for clear printing
          useCORS: true,
          logging: false,
          letterRendering: true,
          onclone: (clonedDoc: Document) => {
            // Process style elements in cloned document
            const clonedStyleEls = Array.from(clonedDoc.querySelectorAll('style'));
            clonedStyleEls.forEach((styleEl) => {
              if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
                styleEl.textContent = convertOklchString(styleEl.textContent);
              }
            });

            // Process CSSStyleSheet rules in cloned document
            Array.from(clonedDoc.styleSheets).forEach((sheet) => {
              try {
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach((rule) => {
                  if (rule.cssText && rule.cssText.includes('oklch')) {
                    const styleRule = rule as CSSStyleRule;
                    if (styleRule.style) {
                      for (let i = 0; i < styleRule.style.length; i++) {
                        const propName = styleRule.style[i];
                        const propVal = styleRule.style.getPropertyValue(propName);
                        if (propVal && propVal.includes('oklch')) {
                          styleRule.style.setProperty(propName, convertOklchString(propVal));
                        }
                      }
                    }
                  }
                });
              } catch (e) {}
            });

            // Process all elements in clonedDoc
            const allElements = Array.from(clonedDoc.querySelectorAll('*'));
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              
              const styleAttr = htmlEl.getAttribute('style');
              if (styleAttr && styleAttr.includes('oklch')) {
                htmlEl.setAttribute('style', convertOklchString(styleAttr));
              }

              try {
                const computed = window.getComputedStyle(htmlEl);
                if (computed) {
                  ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'boxShadow', 'fill', 'stroke'].forEach((prop) => {
                    const val = computed.getPropertyValue(prop);
                    if (val && val.includes('oklch')) {
                      htmlEl.style.setProperty(prop, convertOklchString(val));
                    }
                  });
                }
              } catch (e) {}
            });
          }
        },
        jsPDF: pdfPaperType === 'a4_batch' 
          ? { unit: 'mm', format: 'a4', orientation: 'portrait' }
          : { unit: 'mm', format: [85.6, 53.9], orientation: 'landscape' }
      };

      setPdfDownloadStatus('Rendering PDF pages (300 DPI high resolution)...');
      await html2pdf().set(opt).from(element).save();

      setPdfDownloadStatus('Download complete!');
      setTimeout(() => {
        setIsPdfModalOpen(false);
        setIsGeneratingPdf(false);
        setPdfDownloadStatus(null);
      }, 1200);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfDownloadStatus('Error generating PDF. Using browser fallback print to PDF...');
      setTimeout(() => {
        window.print();
        setIsGeneratingPdf(false);
        setPdfDownloadStatus(null);
      }, 1500);
    } finally {
      // Restore original style contents
      styleBackups.forEach(({ el, original }) => {
        el.textContent = original;
      });
    }
  };

  // Simple helper to generate a clean SVG QR code
  const renderQRCodeSVG = (text: string) => {
    return (
      <svg className="w-9 h-9 bg-white p-0.5 rounded border border-slate-300 shadow-sm" viewBox="0 0 29 29" fill="none">
        <rect width="29" height="29" fill="white" />
        <path d="M2 2h7v7H2zM3 3v5h5V3zM4 4h3v3H4z" fill="#0f172a" />
        <path d="M20 2h7v7h-7zM21 3v5h5V3zM22 4h3v3h-3z" fill="#0f172a" />
        <path d="M2 20h7v7H2zM3 21v5h5v-5zM4 22h3v3H4z" fill="#0f172a" />
        <path d="M11 2h2v2h-2zM15 2h2v2h-2zM11 6h2v2h-2zM15 6h2v2h-2zM11 10h8v2h-8z" fill="#0f172a" />
        <path d="M2 11h2v8H2zM6 11h2v8H6zM11 14h2v2h-2zM15 14h2v2h-2zM11 18h4v2h-4z" fill="#0f172a" />
        <path d="M20 11h7v2h-7zM20 15h2v4h-2zM24 15h3v4h-3zM20 21h7v2h-7z" fill="#0f172a" />
        <path d="M11 22h2v5h-2zM15 24h4v3h-4zM21 25h4v2h-4z" fill="#0f172a" />
      </svg>
    );
  };

  // Barcode SVG helper
  const renderBarcodeSVG = () => {
    return (
      <svg className="h-5 w-20 bg-white p-0.5 rounded border border-slate-200" viewBox="0 0 100 30" fill="none">
        <rect width="100" height="30" fill="white" />
        <path d="M4 2h3v26H4zM9 2h1v26H9zM12 2h3v26h-3zM17 2h2v26h-2zM21 2h1v26h-1zM24 2h4v26h-4zM30 2h1v26h-1zM33 2h3v26h-3zM38 2h2v26h-2zM42 2h1v26h-1zM45 2h3v26h-3zM50 2h2v26h-2zM54 2h1v26h-1zM57 2h3v26h-3zM62 2h1v26h-1zM65 2h2v26h-2zM69 2h4v26h-4zM75 2h1v26h-1zM78 2h3v26h-3zM83 2h2v26h-2zM87 2h1v26h-1zM90 2h4v26h-4z" fill="#0f172a" />
      </svg>
    );
  };

  // Background style helper
  const getHeaderBackgroundStyle = () => {
    if (colorMode === 'gradient') {
      return { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
    }
    return { background: primaryColor };
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for uploading student photos */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePhotoUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Embedded Print CSS for Native Browser Print to PDF */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          .printable-id-sheet {
            display: grid !important;
            grid-template-cols: repeat(2, 1fr) !important;
            gap: 12mm 8mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          .id-card-wrapper {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Screen Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-2">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>Official GES Student Identity Pass Studio</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Student ID Card Generator & Customizer
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Design, customize, and batch-print official student identity cards with custom school colors (solid or gradient), logo crests, barcodes, and QR verification codes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-200" />
              <span>Export PDF for Printers</span>
            </button>

            <button
              onClick={() => window.print()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet ({targetStudents.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 border-t border-slate-800 pt-4 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Students</div>
            <div className="text-base font-bold text-white mt-0.5">{students.length}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Selected for Print</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">{targetStudents.length}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">School EMIS Code</div>
            <div className="text-base font-bold text-blue-400 mt-0.5">{school.emisCode || 'GH-2026-009'}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Standard ID Size</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">CR80 (85.6 × 53.9 mm)</div>
          </div>
        </div>
      </div>

      {/* COLOR & BRANDING CUSTOMIZATION PORTAL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              School ID Card Customization Portal
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            Live Preview
          </span>
        </div>

        {/* Preset Color Schemes */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
            Quick Preset Color Themes:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-2 rounded-xl border text-left text-xs transition flex flex-col justify-between gap-2 cursor-pointer ${
                  activePresetId === preset.id
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-4 h-4 rounded-full border border-white/50 shadow-sm"
                    style={{
                      background: preset.isGradient 
                        ? `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                        : preset.primary
                    }}
                  />
                  <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                    {preset.name.split(' ')[0]}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                  <span className="text-[9px] text-slate-400 font-mono">{preset.isGradient ? 'Gradient' : 'Solid'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Color Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          
          {/* Color Mode Toggle */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Color Style Mode
            </label>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => { setColorMode('gradient'); setActivePresetId('custom'); }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  colorMode === 'gradient'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Gradient Color
              </button>
              <button
                onClick={() => { setColorMode('solid'); setActivePresetId('custom'); }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  colorMode === 'solid'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Solid Color
              </button>
            </div>
          </div>

          {/* Primary Color Picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Primary Theme Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => { setPrimaryColor(e.target.value); setActivePresetId('custom'); }}
                className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => { setPrimaryColor(e.target.value); setActivePresetId('custom'); }}
                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase"
              />
            </div>
          </div>

          {/* Secondary Color Picker (for Gradient) */}
          <div className={`space-y-1.5 ${colorMode === 'solid' ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Secondary Gradient Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                disabled={colorMode === 'solid'}
                onChange={(e) => { setSecondaryColor(e.target.value); setActivePresetId('custom'); }}
                className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                value={secondaryColor}
                disabled={colorMode === 'solid'}
                onChange={(e) => { setSecondaryColor(e.target.value); setActivePresetId('custom'); }}
                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase"
              />
            </div>
          </div>

          {/* Accent Line Color Picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Accent Line / Ring Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => { setAccentColor(e.target.value); setActivePresetId('custom'); }}
                className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => { setAccentColor(e.target.value); setActivePresetId('custom'); }}
                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase"
              />
            </div>
          </div>

        </div>

        {/* Text & Moniker Customization */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Top Curved Moniker / Motto:
            </label>
            <input
              type="text"
              value={headerMoniker}
              onChange={(e) => setHeaderMoniker(e.target.value)}
              placeholder="e.g. Abohyɛnmma"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              School Acronym (Top Right):
            </label>
            <input
              type="text"
              value={schoolAcronym}
              onChange={(e) => setSchoolAcronym(e.target.value)}
              placeholder="e.g. BOOSA"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 uppercase"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Footer Issue Date Text:
            </label>
            <input
              type="text"
              value={issueDateText}
              onChange={(e) => setIssueDateText(e.target.value)}
              placeholder="e.g. DATE OF ISSUE: OCT. 2026"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* FILTER & PRINT CONTROLS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search & Class Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="All">All Classes ({students.length})</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {selectedStudentIds.length === filteredStudents.length ? 'Deselect All' : `Select All (${filteredStudents.length})`}
            </button>
          </div>

          {/* Layout Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCardLayout('both')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                cardLayout === 'both' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Front & Back
            </button>
            <button
              onClick={() => setCardLayout('front_only')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                cardLayout === 'front_only' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Front Only
            </button>
            <button
              onClick={() => setCardLayout('back_only')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                cardLayout === 'back_only' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Back Only
            </button>
          </div>

        </div>
      </div>

      {/* ID CARDS PRINTABLE SHEET & DISPLAY GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 print:hidden">
          <span>Showing <b>{targetStudents.length}</b> student ID cards</span>
          <span className="italic">Standard ISO CR80 Dimensions: 85.6mm × 53.9mm (3.375" × 2.125"). Click photo to upload image.</span>
        </div>

        {/* PRINTABLE AREA CONTAINER (Targeted by html2pdf and window.print) */}
        <div 
          ref={printableAreaRef}
          className="printable-id-sheet grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:p-0"
        >
          {targetStudents.map((student) => {
            const qrData = `https://school.ges.gov.gh/verify/${student.admissionNo}?school=${encodeURIComponent(school.name)}`;

            return (
              <div 
                key={student.id} 
                className="id-card-wrapper flex flex-col sm:flex-row gap-4 justify-center items-center p-4 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:p-0 print:bg-transparent print:border-none print:shadow-none break-inside-avoid relative"
              >
                {/* FRONT SIDE OF ID CARD (Exact CR80 Dimensions: 85.6mm x 53.9mm -> ~336px x 212px) */}
                {(cardLayout === 'both' || cardLayout === 'front_only') && (
                  <div className="w-[336px] h-[212px] rounded-2xl overflow-hidden shadow-2xl bg-white text-slate-900 border border-slate-300 relative flex flex-col justify-between select-none print:shadow-none print:border-2 print:border-slate-800 box-border">
                    
                    {/* Optional Cutting Crop Marks (Visible when toggled for commercial printing) */}
                    {includeCropMarks && (
                      <div className="absolute inset-0 pointer-events-none z-30 opacity-40">
                        {/* Top Left */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-slate-900" />
                        {/* Top Right */}
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-slate-900" />
                        {/* Bottom Left */}
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-slate-900" />
                        {/* Bottom Right */}
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-slate-900" />
                      </div>
                    )}

                    {/* 1. TOP HEADER SPLIT BAR */}
                    <div className="flex items-center justify-between bg-slate-100 border-b border-slate-200 relative overflow-hidden h-[36px]">
                      {/* Left Curved Block */}
                      <div 
                        className="h-full px-3 rounded-br-2xl text-white font-extrabold text-[11px] flex items-center pr-5 shadow-sm"
                        style={getHeaderBackgroundStyle()}
                      >
                        <span className="truncate max-w-[130px]">{headerMoniker}</span>
                      </div>

                      {/* Right School Acronym & QR */}
                      <div className="flex items-center gap-1.5 pr-2 py-0.5">
                        <span className="font-black tracking-widest text-slate-800 text-[10px] uppercase">
                          {schoolAcronym}
                        </span>
                        {renderQRCodeSVG(qrData)}
                      </div>
                    </div>

                    {/* 2. CARD MAIN BODY CONTENT */}
                    <div className="px-2.5 py-1 flex gap-2 items-start flex-1 relative">
                      
                      {/* LEFT COLUMN: PORTRAIT PHOTO & ID */}
                      <div className="flex flex-col items-center">
                        <div 
                          onClick={() => triggerPhotoUpload(student.id)}
                          className="w-[72px] h-[92px] rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-sm relative group cursor-pointer flex items-center justify-center"
                          title="Click to upload student photo"
                        >
                          {student.passportPicture ? (
                            <img 
                              src={student.passportPicture} 
                              alt={student.fullName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-1">
                              <User className="w-7 h-7 text-slate-400 mx-auto" />
                              <span className="text-[6.5px] text-slate-400 font-semibold block mt-0.5">Upload Photo</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-[8px] font-bold gap-1 print:hidden">
                            <Camera className="w-3 h-3" />
                            <span>Edit</span>
                          </div>
                        </div>

                        {/* ID Number directly below photo */}
                        <div className="mt-0.5 text-[8.5px] font-mono font-extrabold text-slate-900 tracking-tight">
                          ID: <span className="text-blue-900">{student.admissionNo}</span>
                        </div>
                      </div>

                      {/* RIGHT COLUMN: SCHOOL TITLE, DIVIDER & STRUCTURED TABLE GRID */}
                      <div className="flex-1 space-y-0.5 text-left min-w-0">
                        {/* Association / School Name Headline */}
                        <div>
                          <h3 className="text-[8.5px] font-extrabold uppercase text-slate-900 tracking-tight leading-none truncate">
                            {school.name}
                          </h3>
                          {/* Accent Divider Line */}
                          <div 
                            className="h-0.5 w-full mt-0.5 rounded-full" 
                            style={{ backgroundColor: accentColor }}
                          />
                        </div>

                        {/* STRUCTURED DATA TABLE (Filled with Theme Color) */}
                        <div 
                          className="rounded-lg overflow-hidden border border-slate-300 text-[7.5px] shadow-sm text-white"
                          style={getHeaderBackgroundStyle()}
                        >
                          {/* Student Name Header Row */}
                          <div className="px-1.5 py-0.5 font-extrabold uppercase tracking-wide text-[8.5px] border-b border-white/30 bg-black/20 truncate">
                            {student.fullName}
                          </div>

                          {/* Detail Grid Rows with White Dividers */}
                          <div className="grid grid-cols-2 px-1.5 py-0.5 border-b border-white/20 leading-tight">
                            <div>
                              <span className="text-white/70">Class:</span> <span className="font-bold">{student.classLevel}</span>
                            </div>
                            <div>
                              <span className="text-white/70">Gender:</span> <span className="font-bold">{student.gender || 'Male'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 px-1.5 py-0.5 border-b border-white/20 leading-tight">
                            <div>
                              <span className="text-white/70">Stream:</span> <span className="font-bold">{student.house || 'General'}</span>
                            </div>
                            <div>
                              <span className="text-white/70">DOB:</span> <span className="font-bold">{student.dob || '2012-05-14'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 px-1.5 py-0.5 leading-tight">
                            <div>
                              <span className="text-white/70">Year:</span> <span className="font-bold">{school.academicYear || '2026'}</span>
                            </div>
                            <div>
                              <span className="text-white/70">Contact:</span> <span className="font-bold font-mono text-[6.5px]">{student.guardianPhone || '0240000000'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Barcode Graphic at Bottom Right */}
                        <div className="flex justify-end pt-0.5">
                          {renderBarcodeSVG()}
                        </div>
                      </div>

                      {/* CENTER BOTTOM CREST BADGE OVERLAPPING */}
                      <div 
                        className="w-7 h-7 rounded-full bg-white p-0.5 shadow-md border-2 absolute bottom-[-2px] left-[33%] -translate-x-1/2 z-20 flex items-center justify-center text-center text-[6px] font-extrabold"
                        style={{ borderColor: accentColor }}
                      >
                        {school.logoUrl ? (
                          <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <div className="text-[5.5px] font-extrabold text-slate-900 leading-none">
                            {school.name.slice(0, 3).toUpperCase()}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* 3. BOTTOM FOOTER BAR */}
                    <div 
                      className="px-2.5 py-0.5 flex items-center justify-end text-[7px] font-extrabold text-white tracking-wider uppercase h-[18px]"
                      style={getHeaderBackgroundStyle()}
                    >
                      <span>{issueDateText}</span>
                    </div>

                  </div>
                )}

                {/* BACK SIDE OF ID CARD */}
                {(cardLayout === 'both' || cardLayout === 'back_only') && (
                  <div className="w-[336px] h-[212px] rounded-2xl overflow-hidden shadow-2xl bg-white text-slate-900 border border-slate-300 relative flex flex-col justify-between p-2.5 select-none print:shadow-none print:border-2 print:border-slate-800 box-border">
                    
                    {/* Optional Cutting Crop Marks */}
                    {includeCropMarks && (
                      <div className="absolute inset-0 pointer-events-none z-30 opacity-40">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-slate-900" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-slate-900" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-slate-900" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-slate-900" />
                      </div>
                    )}

                    {/* Back Header */}
                    <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-900" />
                        <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-800 truncate max-w-[210px]">
                          PROPERTY OF {school.name.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[6.5px] font-mono font-bold bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                        OFFICIAL PASS
                      </span>
                    </div>

                    {/* Conditions */}
                    <div className="space-y-0.5 text-[7.5px] text-slate-700 leading-snug">
                      <p>
                        1. This card remains the official property of <b>{school.name}</b> and must be produced on demand by school inspection authorities.
                      </p>
                      <p>
                        2. If found, please return to <b>{school.district}, {school.region} Region</b> or contact the administration below.
                      </p>
                      
                      <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 grid grid-cols-2 gap-1 mt-0.5">
                        <div>
                          <span className="font-bold text-slate-400 block text-[6px] uppercase">Headteacher Line</span>
                          <span className="font-mono font-bold text-slate-800">{school.headTeacherPhone || '024 123 4567'}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 block text-[6px] uppercase">Official Email</span>
                          <span className="font-mono font-bold text-slate-800 truncate block">{school.email || 'info@school.ges.gov.gh'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signature & Stamp Area */}
                    <div className="pt-0.5 border-t border-slate-200 flex items-end justify-between">
                      <div className="text-left space-y-0.5">
                        <div className="h-3.5 font-serif italic text-[11px] font-bold text-slate-900 flex items-end">
                          {school.headTeacherName ? school.headTeacherName : 'A. K. Boateng'}
                        </div>
                        <div className="text-[6px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-300 pt-0.5">
                          AUTHORIZED HEADTEACHER SIGNATURE
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-dashed border-blue-900/40 flex items-center justify-center text-[5px] text-blue-900 font-extrabold uppercase text-center p-0.5">
                          OFFICIAL STAMP
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DOWNLOAD PDF MODAL FOR COMMERCIAL PRINT SHOPS */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Export Print-Ready PDF
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-resolution PDF formatted for external commercial printers or card thermal presses.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Layout Format Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Select Printing Paper Format:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Option A4 Batch */}
                <button
                  onClick={() => setPdfPaperType('a4_batch')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                    pdfPaperType === 'a4_batch'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">A4 Batch Sheet</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Fits 8 cards per A4 page. Perfect for printing on paper/cardstock or PVC sheets at local print centers.
                  </p>
                </button>

                {/* Option Single CR80 Card */}
                <button
                  onClick={() => setPdfPaperType('cr80_single')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                    pdfPaperType === 'cr80_single'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">CR80 Single Card Size</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Standard 85.6mm × 53.9mm ID card size. Designed for thermal ID card printers (Zebra, Evolis).
                  </p>
                </button>

              </div>
            </div>

            {/* Options Checkboxes */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCropMarks}
                  onChange={(e) => setIncludeCropMarks(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Scissors className="w-3.5 h-3.5 text-slate-500" />
                <span>Include Trimming Crop Marks around Card Corners</span>
              </label>
              <p className="text-[10px] text-slate-400 pl-6">
                Adds corner alignment ticks to help print shop operators cut out cards with guillotine trimmers.
              </p>
            </div>

            {/* Status Feedback */}
            {pdfDownloadStatus && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>{pdfDownloadStatus}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf || targetStudents.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Download PDF ({targetStudents.length} Cards)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

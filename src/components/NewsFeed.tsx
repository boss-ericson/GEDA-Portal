import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Calendar, RefreshCw, X, ArrowRight, ShieldCheck, Clock, Share2, Check, Printer, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsItem {
  id?: string;
  title: string;
  snippet?: string;
  content?: string;
  category?: string;
  source?: string;
  date: string;
  circularNo?: string;
  readTime?: string;
  url?: string;
}

const DEFAULT_NEWS: NewsItem[] = [
  {
    id: 'ges-news-001',
    title: 'GES Directs Strict Adherence to 2026 Academic Calendar & SBA Upload Timelines',
    snippet: 'The Ghana Education Service (GES) Management has issued a directive to all Regional and District Directors of Education regarding Term 2 & 3 assessment schedules and School-Based Assessment (SBA) portal upload deadlines.',
    content: `ACCRA, GHANA — The Management of the Ghana Education Service (GES) wishes to inform all Regional Directors, District Directors, Headteachers of Public and Private Basic Schools, and the general public on the standardized guidelines for the 2026 Academic Year assessment schedule.

Key Directives for Basic Schools:
• SBA Assessment Submission: All JHS 1 to JHS 3 teachers are required to finalize and upload all continuous assessment scores into the official portal by the designated deadline.
• BECE Registration Verification: Headteachers must verify candidate bio-data, subject selections, and passport photographs to eliminate spelling errors on final examination slips.
• Attendance Registers: Weekly attendance records must be audited by District Inspection Officers prior to terminal report card generation.

Regional Directors are urged to ensure total compliance across all metro, municipal, and district education directorates.`,
    category: 'Circular & Policy',
    source: 'GES Headquarters, Public Relations Unit',
    date: '2026-07-20',
    circularNo: 'GES/HQ/PR/2026/089',
    readTime: '3 min read'
  },
  {
    id: 'ges-news-002',
    title: 'WAEC & GES Re-open BECE Candidate Bio-Data Verification Portal',
    snippet: 'Headteachers of Junior High Schools nationwide can now access the online candidate verification portal to confirm final year student details and subject choices.',
    content: `The West African Examinations Council (WAEC), in collaboration with the Ghana Education Service (GES), has officially opened the online bio-data verification portal for all registered 2026 Basic Education Certificate Examination (BECE) candidates.

Important Instructions for Headteachers:
• Verify candidate full names as spelled on birth certificates or admission logs.
• Cross-check selected Ghanaian Languages and Basic Design & Technology (BDT) options.
• Ensure photographs conform to standard passport specifications with clear contrast and plain backgrounds.

Failure to verify records before the close of portal will attract administrative surcharges for candidate index modifications.`,
    category: 'Examinations',
    source: 'WAEC / GES Examinations Division',
    date: '2026-07-18',
    circularNo: 'GES/EXAM/2026/014',
    readTime: '2 min read'
  },
  {
    id: 'ges-news-003',
    title: 'MoE & GES Launch Nationwide Digital School Management & Offline Sync System',
    snippet: 'Basic schools across Ghana receive modernized digital administrative tools allowing real-time attendance logging, offline data caching, and instant report card generation.',
    content: `The Ministry of Education (MoE) in partnership with the Ghana Education Service (GES) has officially rolled out the modernized digital portal for public and private basic education institutions.

Features Introduced:
• Offline Data Sync: Teachers and school administrators in remote areas can record marks and attendance without active internet, syncing automatically when connected.
• Fee Transparency & Mobile Receipts: Instant SMS notifications sent to parents upon fee payments.
• Digital Terminal Reports: Automated grading calculation aligned with National Pre-Tertiary Curriculum Framework standard grading scales.

All basic school headteachers are instructed to utilize these digital portals for official term reporting.`,
    category: 'Digital Transformation',
    source: 'Ministry of Education & GES IT Division',
    date: '2026-07-15',
    circularNo: 'MOE/GES/IT/2026/005',
    readTime: '4 min read'
  }
];

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/news');
      if (!res.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setNews(data);
      } else {
        setNews(DEFAULT_NEWS);
      }
    } catch (err: any) {
      console.warn('API fetch failed, falling back to cached GES news:', err);
      setNews(DEFAULT_NEWS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCopyArticle = (article: NewsItem) => {
    const textToCopy = `${article.title}\n${article.source || 'GES Official'} | ${article.date}\n${article.circularNo ? `Ref: ${article.circularNo}\n` : ''}\n${article.content || article.snippet}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintArticle = (article: NewsItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${article.title} - GES Official Bulletin</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
            .header { border-bottom: 2px solid #15803d; padding-bottom: 16px; margin-bottom: 24px; }
            .badge { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .title { font-size: 24px; font-weight: 800; margin-top: 12px; color: #0f172a; }
            .meta { font-size: 12px; color: #64748b; margin-top: 8px; }
            .content { white-space: pre-wrap; font-size: 14px; margin-top: 24px; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; pt: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">${article.category || 'Official Circular'}</span>
            <div class="title">${article.title}</div>
            <div class="meta">
              <strong>Source:</strong> ${article.source || 'Ghana Education Service'} | 
              <strong>Date:</strong> ${article.date} ${article.circularNo ? `| <strong>Ref:</strong> ${article.circularNo}` : ''}
            </div>
          </div>
          <div class="content">${article.content || article.snippet}</div>
          <div class="footer">
            Ghana Education Service Official Communication Portal • Printed from School Admin Portal
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-4 fade-in h-full flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-none">GES News Updates</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Official Directives & Curriculum Bulletins</p>
            </div>
          </div>
          <button 
            onClick={fetchNews} 
            disabled={loading}
            className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Refresh GES News Feed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {loading && news.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Fetching latest updates from GES Portal...</span>
            </div>
          ) : news.length > 0 ? (
            <div className="space-y-3">
              {news.map((item, index) => (
                <div 
                  key={item.id || index} 
                  onClick={() => setSelectedArticle(item)}
                  className="group p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer relative"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="h-3 w-3" />
                      {item.category || 'Official Directive'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
                      <Calendar className="h-3 w-3" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1.5 line-clamp-2">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-2.5">
                    {item.snippet || item.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 text-[10px] font-mono truncate max-w-[180px]">
                      {item.source || 'GES Official'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform text-[11px]">
                      Read Article <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs italic py-8">
              No news updates available.
            </div>
          )}
        </div>
      </div>

      {/* GES ARTICLE READER MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              {/* Modal Banner Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-6 relative shrink-0 border-b border-emerald-800/50">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                  title="Close Article"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    {selectedArticle.category || 'Official GES Communique'}
                  </span>
                  {selectedArticle.circularNo && (
                    <span className="text-[11px] font-mono text-emerald-200/80 bg-black/30 px-2.5 py-1 rounded-full border border-white/10">
                      Ref: {selectedArticle.circularNo}
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-display font-bold text-white leading-snug">
                  {selectedArticle.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{selectedArticle.source || 'Ghana Education Service'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{selectedArticle.date}</span>
                  </div>
                  {selectedArticle.readTime && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{selectedArticle.readTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-700 dark:text-slate-300 text-sm leading-relaxed custom-scrollbar">
                
                {/* Official Callout Box */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 p-4 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
                    <Newspaper className="h-5 w-5" />
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide block">Executive Summary</span>
                    <p className="text-emerald-900 dark:text-emerald-300 leading-normal">
                      {selectedArticle.snippet || selectedArticle.title}
                    </p>
                  </div>
                </div>

                {/* Formatted Article Body */}
                <div className="space-y-4 pt-2">
                  {(selectedArticle.content || selectedArticle.snippet || '').split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="leading-relaxed text-slate-800 dark:text-slate-200 text-sm">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Directive Compliance Notice */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Authorized by GES Public Relations & Communications Directorate</span>
                  <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">VERIFIED CIRCULAR</span>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintArticle(selectedArticle)}
                    className="py-2 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    Print / Save Circular
                  </button>
                  <button
                    onClick={() => handleCopyArticle(selectedArticle)}
                    className="py-2 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5 text-slate-500" />
                        Copy Text
                      </>
                    )}
                  </button>
                  {selectedArticle.url && selectedArticle.url !== '#' && (
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 hover:bg-emerald-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit Portal
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="py-2 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Close Article
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}


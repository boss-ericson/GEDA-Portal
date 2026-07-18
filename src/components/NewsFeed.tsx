import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Calendar, RefreshCw } from 'lucide-react';

interface NewsItem {
  title: string;
  date: string;
  snippet: string;
  url?: string;
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/news');
      if (!res.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setNews(data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching news.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none space-y-4 fade-in h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Newspaper className="h-5 w-5 text-brand-green-700" />
          <h3 className="font-display font-bold text-lg">GES News Updates</h3>
        </div>
        <button 
          onClick={fetchNews} 
          disabled={loading}
          className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition cursor-pointer"
          title="Refresh Feed"
        >
          <RefreshCw className={`h-4 w-4 \${loading ? 'animate-spin text-brand-green-600' : ''}`} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {loading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
            <span className="text-xs font-medium">Fetching latest updates via AI Search...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs flex flex-col gap-2">
            <span className="font-semibold">Error Loading News</span>
            <span>{error}</span>
          </div>
        ) : news.length > 0 ? (
          <div className="space-y-4">
            {news.map((item, index) => (
              <div key={index} className="group p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-200 hover:bg-amber-50/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight group-hover:text-brand-green-700 transition-colors">
                    {item.title}
                  </h4>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-400 hover:text-brand-green-600">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-2">
                  {item.snippet}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>{item.date}</span>
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
  );
}

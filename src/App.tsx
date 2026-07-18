import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { School, Role } from './types';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function App() {
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSchool, setActiveSchool] = useState<School | null>(null);
  const [activeRole, setActiveRole] = useState<Role>('Admin');
  const [activeUser, setActiveUser] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('geda_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('geda_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('geda_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  

  // Load registered schools on mount
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/v1/schools');
        if (res.ok) {
          const data = await res.json();
          setSchools(data);
        }
      } catch (err) {
        console.error('Failed to load school tenants from Firebase via API.', err);
      } finally {
        setLoading(false);
      }

      const storedAuth = localStorage.getItem('geda_auth');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          if (parsed.school && parsed.role) {
            setActiveSchool(parsed.school);
            setActiveRole(parsed.role);
            setActiveUser(parsed.user || null);
            setIsDemo(parsed.isDemo ?? false);
          }
        } catch(e) {
          console.error("Failed to parse auth", e);
        }
      }
    }
    init();
  }, []);

  // Ensure touch events on mobile devices trigger focus on input fields immediately to summon the soft keyboard/keypad.
  useEffect(() => {
    const forceFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        // Prevent default tap behaviors if blocking, then focus immediately
        (target as HTMLElement).focus();
        // Scroll slightly into view on mobile so the viewport accommodates the keypad smoothly
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    };

    document.addEventListener('touchstart', forceFocus, { passive: true });
    document.addEventListener('click', forceFocus);

    return () => {
      document.removeEventListener('touchstart', forceFocus);
      document.removeEventListener('click', forceFocus);
    };
  }, []);

  const handleLogin = (school: School, role: Role, isDemoSession: boolean = true, user?: any) => {
    setActiveSchool(school);
    setActiveRole(role);
    setActiveUser(user || null);
    setIsDemo(isDemoSession);
    localStorage.setItem('geda_auth', JSON.stringify({ school, role, isDemo: isDemoSession, user: user || null }));
  };

  const handleLogout = () => {
    setActiveSchool(null);
    setActiveRole('Admin');
    setActiveUser(null);
    setIsDemo(true);
    localStorage.removeItem('geda_auth');
  };

  const handleRoleChange = (newRole: Role) => {
    setActiveRole(newRole);
  };

  const handleSchoolUpdate = (updatedSchool: School) => {
    setActiveSchool(updatedSchool);
    setSchools((prev) => prev.map((s) => s.id === updatedSchool.id ? updatedSchool : s));
  };

  const handleRegisterSchool = async (name: string, region: string, district: string, email: string, password: string): Promise<{ success: boolean; school?: School; error?: string }> => {
    try {
      const res = await fetch('/api/v1/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, region, district, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSchools((prev) => [...prev, data]);
        return { success: true, school: data };
      } else {
        return { success: false, error: data.error || 'Failed to register school.' };
      }
    } catch (err) {
      console.error('Failed to register school tenant.', err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans text-white">
        <div className="space-y-4 text-center">
          <div className="h-10 w-10 border-4 border-amber-400 border-t-green-700 rounded-full animate-spin mx-auto"></div>
          <div>
            <h1 className="font-display font-bold text-lg">GEDA Ghana Portal</h1>
            <p className="text-xs text-slate-400">Loading Multi-Tenant School Registries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-[9999] p-3 rounded-full shadow-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
        title="Toggle Theme"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      {activeRole === 'SuperAdmin' ? (
        <SuperAdminDashboard onLogout={handleLogout} />
      ) : activeSchool ? (
        <Dashboard
          school={activeSchool}
          role={activeRole}
          user={activeUser}
          isDemo={isDemo}
          onLogout={handleLogout}
          onRoleChange={handleRoleChange}
          onSchoolUpdate={handleSchoolUpdate}
        />
      ) : (
        <LandingPage
          schools={schools}
          onLogin={handleLogin}
          onRegisterSchool={handleRegisterSchool}
        />
      )}
    </div>
  );
}

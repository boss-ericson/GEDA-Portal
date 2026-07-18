const fs = require('fs');

const code = `import React, { useState } from 'react';
import { School, Role } from '../types';
import { GraduationCap, ArrowRight, CheckCircle2, School as SchoolIcon, Globe } from 'lucide-react';

interface LandingPageProps {
  schools: School[];
  onLogin: (school: School, role: Role, isDemo?: boolean) => void;
  onRegisterSchool: (name: string, region: string, district: string, email: string, password: string) => Promise<{ success: boolean; school?: School; error?: string }>;
}

export default function LandingPage({ schools, onLogin, onRegisterSchool }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginMode, setLoginMode] = useState<'secure' | 'demo'>('secure');
  
  // Login form state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const [selectedRole, setSelectedRole] = useState<Role>('Admin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration form state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolRegion, setNewSchoolRegion] = useState('Greater Accra');
  const [newSchoolDistrict, setNewSchoolDistrict] = useState('');
  const [newSchoolEmail, setNewSchoolEmail] = useState('');
  const [newSchoolPassword, setNewSchoolPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const ghanaRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Northern', 'Volta', 
    'Eastern', 'Central', 'Ahafo', 'Bono', 'Bono East', 
    'North East', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Western North'
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);

    if (!newSchoolName.trim() || !newSchoolDistrict.trim() || !newSchoolEmail.trim() || !newSchoolPassword.trim()) {
      setRegisterError('Please fill in all school registration fields.');
      return;
    }
    
    setIsRegistering(true);
    try {
      const result = await onRegisterSchool(newSchoolName, newSchoolRegion, newSchoolDistrict, newSchoolEmail, newSchoolPassword);
      if (result.success && result.school) {
        setRegisterSuccess(true);
        // Switch to login tab and prefill
        setActiveTab('login');
        setLoginMode('secure');
        setLoginEmail(newSchoolEmail);
        setLoginPassword(newSchoolPassword);
        
        setNewSchoolName('');
        setNewSchoolDistrict('');
        setNewSchoolEmail('');
        setNewSchoolPassword('');
      } else {
        setRegisterError(result.error || 'A school with this name or email already exists.');
      }
    } catch (err) {
      setRegisterError('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (loginMode === 'demo') {
      const school = schools.find(s => s.id === selectedSchoolId);
      if (school) {
        onLogin(school, selectedRole, true);
      }
    } else {
      if (!loginEmail.trim() || !loginPassword.trim()) {
        setLoginError('Please enter your school email and password.');
        return;
      }
      
      setIsLoggingIn(true);
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
        });
        const data = await res.json();
        if (res.ok && data.success && data.school) {
          const actualRole = data.role || selectedRole;
          onLogin(data.school, actualRole, false);
        } else {
          setLoginError(data.error || 'Invalid official school email or password.');
        }
      } catch (err) {
        setLoginError('Failed to log in. Please check your connection and try again.');
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="w-full py-4 px-6 sm:px-8 flex justify-between items-center bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg text-slate-900 tracking-tight">GEDA Portal</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 gap-12 lg:gap-24 max-w-7xl mx-auto w-full">
        
        {/* Left Side: Hero content */}
        <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium">
            <Globe className="w-4 h-4" />
            Official Education Framework
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight">
            Modernize your school\\\'s administration.
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
            A centralized platform for student admissions, payment tracking, and secure academic records designed for the modern educational institution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Secure Authentication</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Offline Capabilities</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="lg:w-[450px] w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-lg mb-8">
              <button 
                onClick={() => setActiveTab('login')}
                className={\`flex-1 py-2 text-sm font-medium rounded-md transition-all \${activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setActiveTab('register')}
                className={\`flex-1 py-2 text-sm font-medium rounded-md transition-all \${activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
              >
                Register School
              </button>
            </div>

            {/* Login Form */}
            {activeTab === 'login' && (
              <div className="space-y-6 fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
                  <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your portal</p>
                </div>
                
                {registerSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    School registered! You can now log in.
                  </div>
                )}
                {loginError && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                    {loginError}
                  </div>
                )}

                {/* Secure / Demo toggles under login */}
                <div className="flex gap-4 border-b border-slate-100 pb-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={loginMode === 'secure'} onChange={() => setLoginMode('secure')} className="text-indigo-600 focus:ring-indigo-600" />
                    Secure Login
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={loginMode === 'demo'} onChange={() => setLoginMode('demo')} className="text-indigo-600 focus:ring-indigo-600" />
                    Demo Access
                  </label>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {loginMode === 'secure' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                          placeholder="admin@school.edu.gh"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                          placeholder="••••••••"
                          required
                        />
                        {loginEmail.includes('@geda.edu.gh') && (
                          <p className="text-xs text-slate-500 mt-2">Demo password: password123</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select School</label>
                      <select
                        value={selectedSchoolId}
                        onChange={e => setSelectedSchoolId(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      >
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Login As</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Admin', 'Staff', 'Teacher'] as Role[]).map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSelectedRole(role)}
                          className={\`py-2 text-xs font-medium rounded-lg border transition-all \${selectedRole === role ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}\`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoggingIn}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-6"
                  >
                    {isLoggingIn ? 'Authenticating...' : 'Sign In'}
                    {!isLoggingIn && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <div className="space-y-6 fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900">Create Account</h2>
                  <p className="text-sm text-slate-500 mt-1">Register your institution to get started</p>
                </div>

                {registerError && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                    {registerError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                    <input
                      type="text"
                      value={newSchoolName}
                      onChange={e => setNewSchoolName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Methodist Basic School"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                      <select
                        value={newSchoolRegion}
                        onChange={e => setNewSchoolRegion(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      >
                        {ghanaRegions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        value={newSchoolDistrict}
                        onChange={e => setNewSchoolDistrict(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="Accra Metro"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email</label>
                    <input
                      type="email"
                      value={newSchoolEmail}
                      onChange={e => setNewSchoolEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="admin@school.edu.gh"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={newSchoolPassword}
                      onChange={e => setNewSchoolPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isRegistering}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-70 mt-6 cursor-pointer"
                  >
                    {isRegistering ? 'Registering...' : 'Complete Registration'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
`;

fs.writeFileSync('src/components/LandingPage.tsx', code);

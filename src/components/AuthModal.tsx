import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getStoredAllUsers } from '../services/storage';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  X,
  LogIn,
  UserPlus,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  initialMode?: 'login' | 'create';
  onGoogleSignIn?: () => Promise<void> | void;
  googleError?: string;
  isGoogleLoading?: boolean;
}

const AVATAR_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'create',
  onGoogleSignIn,
  googleError,
  isGoogleLoading = false,
}) => {
  const [tab, setTab] = useState<'create' | 'login'>(initialMode);

  // Sync tab with initialMode if it changes
  React.useEffect(() => {
    if (isOpen) {
      setTab(initialMode);
    }
  }, [isOpen, initialMode]);

  // Form state for Create Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [subject, setSubject] = useState('');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  // Form state for Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Stored users for quick switch/login
  const existingUsers = getStoredAllUsers();

  if (!isOpen) return null;

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: UserProfile = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@tuitiontrack.local`,
      phone: phone.trim() || undefined,
      institution: institution.trim() || undefined,
      subject: subject.trim() || undefined,
      bio: bio.trim() || undefined,
      avatarColor,
      createdAt: new Date().toISOString(),
    };

    onAuthSuccess(newProfile);
    onClose();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim()) {
      setLoginError('অনুগ্রহ করে আপনার ইমেইল বা ফোন নম্বর প্রদান করুন');
      return;
    }

    const found = existingUsers.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.toLowerCase().trim() ||
        (u.phone && u.phone === loginEmail.trim()) ||
        u.name.toLowerCase() === loginEmail.toLowerCase().trim()
    );

    if (found) {
      onAuthSuccess(found);
      onClose();
    } else {
      // If not previously found, create a lightweight profile with this identifier
      const autoProfile: UserProfile = {
        id: `user_${Date.now()}`,
        name: loginEmail.split('@')[0],
        email: loginEmail.includes('@') ? loginEmail.trim() : `${loginEmail.trim()}@tuitiontrack.local`,
        phone: !loginEmail.includes('@') ? loginEmail.trim() : undefined,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        createdAt: new Date().toISOString(),
      };
      onAuthSuccess(autoProfile);
      onClose();
    }
  };

  const handleQuickSelect = (user: UserProfile) => {
    onAuthSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-1 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTab('create');
                setLoginError('');
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'create'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('login');
                setLoginError('');
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'login'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Create Profile */}
        {tab === 'create' && (
          <form onSubmit={handleCreateProfile} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-tight">Create Tutor Profile</h3>
              <p className="text-xs text-slate-400">
                Setup your tutor account to personalize attendance records and sync with Google Workspace.
              </p>
            </div>

            {onGoogleSignIn && (
              <div className="space-y-3 pb-1 border-b border-slate-800">
                <GoogleSignInButton
                  onClick={onGoogleSignIn}
                  isLoading={isGoogleLoading}
                  text="Continue with Google"
                  className="w-full"
                />

                {googleError && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Google Notice:</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{googleError}</p>
                  </div>
                )}

                <div className="relative flex items-center justify-center pt-1">
                  <div className="border-t border-slate-800 w-full"></div>
                  <span className="bg-slate-900 px-2 text-[11px] text-slate-500 font-semibold uppercase tracking-wider absolute">
                    or fill profile below
                  </span>
                </div>
              </div>
            )}

            {/* Avatar Color Picker */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Choose Profile Color</label>
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-md shrink-0 transition"
                  style={{ backgroundColor: avatarColor }}
                >
                  {name ? name.charAt(0).toUpperCase() : 'T'}
                </div>
                <div className="flex items-center space-x-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAvatarColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-xl transition transform ${
                        avatarColor === color
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Full Name (আপনার নাম) *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arjun Shil / অর্জুন শীল"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Email (ইমেইল)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tutor@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phone (মোবাইল নম্বর)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Institution & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>University / College (প্রতিষ্ঠান)</span>
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. DU, BUET, NSU, DMC..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Teaching Subject (বিষয়)</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics, Math, Chemistry..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Bio / Tagline */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Short Bio / Tagline (অপশনাল)</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. HSC & SSC Science Mentor"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2">
              <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>100% private: stored safely on your device without server tracking.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2 transition active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Profile & Continue</span>
            </button>
          </form>
        )}

        {/* Tab 2: Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-tight">Log In to TuitionTrack</h3>
              <p className="text-xs text-slate-400">
                Sign in with Google or your email, phone number, or tutor name.
              </p>
            </div>

            {onGoogleSignIn && (
              <div className="space-y-3 pb-1 border-b border-slate-800">
                <GoogleSignInButton
                  onClick={onGoogleSignIn}
                  isLoading={isGoogleLoading}
                  text="Log In with Google"
                  className="w-full"
                />

                {googleError && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Google Notice:</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{googleError}</p>
                  </div>
                )}

                <div className="relative flex items-center justify-center pt-2">
                  <div className="border-t border-slate-800 w-full"></div>
                  <span className="bg-slate-900 px-2 text-[11px] text-slate-500 font-semibold uppercase tracking-wider absolute">
                    or continue with credentials
                  </span>
                </div>
              </div>
            )}

            {/* Existing Accounts List if available */}
            {existingUsers.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Saved Profiles on this Device
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {existingUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleQuickSelect(u)}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500 cursor-pointer flex items-center justify-between transition group"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                          style={{ backgroundColor: u.avatarColor || '#10b981' }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white block group-hover:text-emerald-400 transition">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                            {u.institution || u.email}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-semibold uppercase">
                {existingUsers.length > 0 ? 'Or enter credentials' : 'Sign in'}
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email, Phone, or Name</label>
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. arjun@example.com or 01712345678"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 font-medium">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2 transition active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setTab('create')}
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                Don't have a profile yet? Create Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { UserProfile, Tuition } from '../types';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Edit3,
  LogOut,
  X,
  Check,
  Shield,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  tuitions: Tuition[];
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  onOpenSwitchAccount: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  tuitions,
  onUpdateProfile,
  onLogout,
  onOpenSwitchAccount,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [institution, setInstitution] = useState(profile?.institution || '');
  const [subject, setSubject] = useState(profile?.subject || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updated: UserProfile = {
      ...profile,
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
      phone: phone.trim() || undefined,
      institution: institution.trim() || undefined,
      subject: subject.trim() || undefined,
      bio: bio.trim() || undefined,
    };

    onUpdateProfile(updated);
    setIsEditing(false);
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 2500);
  };

  const activeTuitionsCount = tuitions.filter((t) => t.active).length;
  const totalMonthlyPotential = tuitions.reduce((sum, t) => sum + (t.fee || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-md"
              style={{ backgroundColor: profile?.avatarColor || '#10b981' }}
            >
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{profile?.name || 'Tutor Profile'}</h3>
              <p className="text-xs text-slate-400">{profile?.institution || 'TuitionTrack Member'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setName(profile?.name || '');
                  setEmail(profile?.email || '');
                  setPhone(profile?.phone || '');
                  setInstitution(profile?.institution || '');
                  setSubject(profile?.subject || '');
                  setBio(profile?.bio || '');
                  setIsEditing(true);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Edit Profile"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs text-emerald-400 font-semibold flex items-center space-x-1.5">
            <Check className="w-4 h-4" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {/* Body */}
        {isEditing ? (
          <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Edit Tutor Profile</h4>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">University / College</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Teaching Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Short Bio</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-5">
            {/* Summary Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Overview</span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Verified Tutor
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Tuitions</span>
                  <span className="text-lg font-black text-white block mt-0.5">{tuitions.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Monthly Expected</span>
                  <span className="text-lg font-black text-emerald-400 block mt-0.5">৳{totalMonthlyPotential.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Profile Info Rows */}
            <div className="space-y-2.5 text-xs">
              {profile?.email && (
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Email</span>
                    <span className="text-slate-200 font-medium">{profile.email}</span>
                  </div>
                </div>
              )}

              {profile?.phone && (
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Phone</span>
                    <span className="text-slate-200 font-medium">{profile.phone}</span>
                  </div>
                </div>
              )}

              {profile?.institution && (
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Institution</span>
                    <span className="text-slate-200 font-medium">{profile.institution}</span>
                  </div>
                </div>
              )}

              {profile?.subject && (
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Specialization</span>
                    <span className="text-slate-200 font-medium">{profile.subject}</span>
                  </div>
                </div>
              )}

              {profile?.bio && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-300 italic">
                  "{profile.bio}"
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSwitchAccount();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Switch or Add Another Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center space-x-2 border border-rose-500/20 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

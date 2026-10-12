import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  ShieldCheck, 
  Database, 
  Save, 
  CheckCircle2, 
  Loader2, 
  Lock,
  Scale,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface SettingsViewProps {
  onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const { user, updateRole } = useAuth();

  const [role, setRole] = useState<Role>(user?.role || 'Sub-Inspector');
  const [station, setStation] = useState(user?.station || 'Parliament Street Police Station');
  const [badgeNumber, setBadgeNumber] = useState(user?.badgeNumber || 'DL-8492');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await updateRole(role, station, badgeNumber);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-4xl mx-auto space-y-8 pb-20 text-[#171A1E] dark:text-[#E8ECEF] font-sans"
    >
      {/* Header */}
      <div className="bg-[#FCFBF8] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm shadow-sm">
        <div className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4 mb-3 flex items-start gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-1 px-3 py-2 text-xs font-mono font-medium rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#101C29] shrink-0 shadow-sm"
              title="Back to previous view"
            >
              <ArrowLeft className="w-4 h-4 text-[#C6A15B]" />
              <span>Back</span>
            </button>
          )}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A38038] dark:text-[#D5B875] font-bold block">
              OFFICER CREDENTIALS & JURISDICTION
            </span>
            <h1 className="font-serif-legal text-3xl sm:text-4xl font-bold text-[#08121D] dark:text-white">
              Station Profile & Security Settings
            </h1>
            <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-1">
              Configure investigating officer credentials, station jurisdictional assignment, and review cloud security.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-mono rounded-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Officer profile and jurisdictional deployment successfully updated in Firestore.</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4">
          <div className="w-10 h-10 border border-[#C6A15B]/50 bg-[#101C29] rounded-sm flex items-center justify-center text-[#D5B875]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-legal font-bold text-lg text-[#08121D] dark:text-white">
              Investigating Officer Profile
            </h3>
            <p className="text-xs text-[#8C96A3] font-mono">
              Authenticated Session: <span className="text-[#A38038] dark:text-[#D5B875]">{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#6D7278] dark:text-[#8C96A3] block font-semibold">
              OFFICER NAME (VERIFIED GOOGLE ID)
            </label>
            <input 
              type="text" 
              value={user?.name || ''} 
              disabled 
              className="w-full bg-[#E5E7EB] dark:bg-[#08121D]/60 border border-[#DDD8CE] dark:border-[#1E2D3E] p-3 text-xs text-[#6D7278] dark:text-[#8C96A3] cursor-not-allowed rounded-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#6D7278] dark:text-[#8C96A3] block font-semibold">
              OPERATIONAL DESIGNATION / ROLE
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-3 text-xs font-semibold focus:border-[#C6A15B] focus:outline-none rounded-sm"
            >
              <option value="Constable">Constable (Intake & First Response)</option>
              <option value="Sub-Inspector">Sub-Inspector (Investigating Officer)</option>
              <option value="Legal Officer">Legal Officer (Prosecution & Verification)</option>
              <option value="Admin">Admin (Full System & Audit Access)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#6D7278] dark:text-[#8C96A3] block font-semibold">
              BADGE / IDENTIFICATION NUMBER
            </label>
            <input 
              type="text" 
              value={badgeNumber} 
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="e.g. DL-8492" 
              className="w-full bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-3 text-xs font-mono font-semibold focus:border-[#C6A15B] focus:outline-none rounded-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#6D7278] dark:text-[#8C96A3] block font-semibold">
              ASSIGNED POLICE STATION JURISDICTION
            </label>
            <input 
              type="text" 
              value={station} 
              onChange={(e) => setStation(e.target.value)}
              placeholder="e.g. Parliament Street Police Station" 
              className="w-full bg-[#FFFFFF] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-3 text-xs font-semibold focus:border-[#C6A15B] focus:outline-none rounded-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
          <button 
            type="submit"
            disabled={isSaving}
            className="btn-legal-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#08121D]" /> : <Save className="w-4 h-4 text-[#08121D]" />}
            <span>Save Profile Configuration</span>
          </button>
        </div>
      </form>

      {/* Security Architecture Seal */}
      <div className="bg-[#08121D] border border-[#1E2D3E] p-6 rounded-sm space-y-3 text-[#E8ECEF]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D5B875]">
          <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
          <span>ZERO-TRUST ATTRIBUTE-BASED ACCESS CONTROL (ABAC)</span>
        </div>
        <p className="text-xs text-[#8C96A3] leading-relaxed">
          All case dockets, investigation findings, and suspect records stored in Firestore are strictly partitioned by jurisdiction and signed with cryptographically stamped audit logs.
        </p>
      </div>

    </motion.div>
  );
};

import React from 'react';
import { 
  BarChart3, 
  Database, 
  Lock, 
  CheckCircle2, 
  Cpu, 
  Activity, 
  Scale, 
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface AdminViewProps {
  onBack?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
  const { user, cases, auditLogs } = useAuth();

  const totalCases = cases.length;
  const verifiedCount = cases.filter(c => c.status === 'Verified' || c.status === 'Registered').length;
  const draftCount = cases.filter(c => c.status === 'Draft').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-7xl mx-auto space-y-8 pb-20 text-[#171A1E] dark:text-[#E8ECEF] font-sans"
    >
      {/* Header */}
      <div className="bg-[#FCFBF8] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-4 mb-4">
          <div className="flex items-start gap-4">
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
                SECURITY PROTOCOL & COMPLIANCE
              </span>
              <h1 className="font-serif-legal text-3xl sm:text-4xl font-bold text-[#08121D] dark:text-white">
                System Audits & Security Governance
              </h1>
              <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-1">
                Centralized administrative ledger, zero-trust permission monitoring, and immutable cloud audit records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#101C29] border border-[#C6A15B]/30 rounded-sm text-[#D5B875] text-xs font-mono">
            <Activity className="w-4 h-4 text-[#C6A15B]" />
            <span>ABAC Protocol Active</span>
          </div>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 rounded-sm">
          <div className="flex items-center justify-between mb-3">
            <Database className="w-5 h-5 text-[#C6A15B]" />
            <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 border border-[#10B981]/30">CONNECTED</span>
          </div>
          <span className="text-[10px] font-mono text-[#8C96A3] uppercase font-bold">DATABASE PIPELINE</span>
          <h4 className="font-serif-legal font-bold text-xl text-[#08121D] dark:text-white mt-1">Firestore Cloud Native</h4>
          <p className="text-[11px] font-mono text-[#6D7278] dark:text-[#8C96A3] mt-2">Zero-Trust Rules Enforced</p>
        </div>

        <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 rounded-sm">
          <div className="flex items-center justify-between mb-3">
            <Lock className="w-5 h-5 text-[#10B981]" />
            <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 border border-[#10B981]/30">ACTIVE</span>
          </div>
          <span className="text-[10px] font-mono text-[#8C96A3] uppercase font-bold">SECURITY RULES</span>
          <h4 className="font-serif-legal font-bold text-xl text-[#08121D] dark:text-white mt-1">Default-Deny Model</h4>
          <p className="text-[11px] font-mono text-[#6D7278] dark:text-[#8C96A3] mt-2">RBAC & ABAC Schema Validation</p>
        </div>

        <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 rounded-sm">
          <div className="flex items-center justify-between mb-3">
            <Cpu className="w-5 h-5 text-[#3B82F6]" />
            <span className="text-[10px] font-mono text-[#3B82F6] bg-[#3B82F6]/15 px-2 py-0.5 border border-[#3B82F6]/30">OPERATIONAL</span>
          </div>
          <span className="text-[10px] font-mono text-[#8C96A3] uppercase font-bold">AI LEGAL ENGINE</span>
          <h4 className="font-serif-legal font-bold text-xl text-[#08121D] dark:text-white mt-1">Legal Intelligence Engine</h4>
          <p className="text-[11px] font-mono text-[#6D7278] dark:text-[#8C96A3] mt-2">BNS 2023 Statutory Grounding</p>
        </div>
      </div>

      {/* Immutable Audit Trail */}
      <div className="bg-[#FCFBF8] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 sm:p-8 rounded-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
          <div>
            <h3 className="font-serif-legal font-bold text-xl text-[#08121D] dark:text-white">
              Official Immutable Audit Trail Ledger
            </h3>
            <p className="text-xs text-[#5B636E] dark:text-[#8C96A3] mt-0.5">
              All events cryptographically signed and stored in Firestore `audit_logs`
            </p>
          </div>
          <span className="text-xs font-mono text-[#8C96A3]">
            {auditLogs.length} Records Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] text-[10px] font-mono uppercase text-[#6D7278] dark:text-[#8C96A3]">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Officer / User</th>
                <th className="py-3 px-3">Station</th>
                <th className="py-3 px-3">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD8CE] dark:divide-[#1E2D3E]">
              {auditLogs.length > 0 ? (
                auditLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-[#FFFFFF] dark:hover:bg-[#101C29] transition-colors">
                    <td className="py-3 px-3 font-mono text-[#6D7278] dark:text-[#8C96A3]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-[#A38038] dark:text-[#D5B875] bg-[#C6A15B]/10 px-2 py-0.5 border border-[#C6A15B]/20 rounded-sm">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#171A1E] dark:text-[#E8ECEF]">
                      {log.userName} ({log.userRole})
                    </td>
                    <td className="py-3 px-3 text-[#5B636E] dark:text-[#8C96A3]">
                      {log.station || 'State HQ'}
                    </td>
                    <td className="py-3 px-3 text-[#5B636E] dark:text-[#B4BCC6]">
                      {log.details || 'System event recorded'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#8C96A3] text-xs font-mono">
                    No audit records logged yet. Actions will populate automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
};

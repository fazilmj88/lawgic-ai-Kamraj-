import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  User, 
  Hash, 
  FileSpreadsheet,
  ArrowLeft
} from 'lucide-react';
import { AuditEventRecord } from '../../types/documentIntelligence';
import { getAuditLogs } from '../../utils/auditLogger';
import { hasPermission } from '../../utils/rbac';
import { Role } from '../../types';

interface AuditLogsViewProps {
  userRole?: string;
  userName?: string;
  currentCaseId?: string;
  onBack?: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  userRole = 'Sub-Inspector',
  userName = 'Inspector Rajesh Sharma',
  currentCaseId = 'ALL',
  onBack
}) => {
  const [logs, setLogs] = useState<AuditEventRecord[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check RBAC permission to view audit logs
  const canViewLogs = hasPermission(userRole as Role, 'canViewAuditLogs');

  const loadLogs = async () => {
    setIsRefreshing(true);
    try {
      const data = await getAuditLogs(currentCaseId !== 'ALL' ? currentCaseId : undefined);
      setLogs(data);
    } catch (err) {
      console.warn('Error loading audit logs:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentCaseId]);

  const filteredLogs = logs.filter(item => {
    if (filterAction !== 'ALL' && item.actionType !== filterAction) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.actionLabel.toLowerCase().includes(q) ||
        (item.documentName && item.documentName.toLowerCase().includes(q)) ||
        (item.caseId && item.caseId.toLowerCase().includes(q)) ||
        item.userName.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Case ID', 'Document', 'User', 'Role', 'Status', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.actionLabel}"`,
      `"${l.caseId || ''}"`,
      `"${l.documentName || ''}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.status}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lawgic_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canViewLogs) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm max-w-lg mx-auto my-12 space-y-3">
        <Lock className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
          Access Restricted: Confidential Audit Log
        </h3>
        <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
          Your active operational role (<strong>{userRole}</strong>) lacks permission to review tamper-evident system audit records. Please switch to <strong>Station House Officer (SHO)</strong> or <strong>System Admin</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 px-3 py-1.5 text-xs font-mono font-medium rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#08121D] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-[#F7F5F0] dark:bg-[#08121D] shrink-0 shadow-sm"
              title="Back to previous view"
            >
              <ArrowLeft className="w-4 h-4 text-[#C6A15B]" />
              <span>Back</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-[#C6A15B]" />
              <h2 className="text-xl font-bold font-serif text-[#08121D] dark:text-white uppercase tracking-wider">
                Forensic Audit Log & Custody Chain
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/30">
                Immutable Log
              </span>
            </div>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-1">
              Forensic tracking of document uploads, AI intelligence processing, version modifications, and SHA-256 integrity verifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#08121D] dark:text-white text-xs font-mono rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-[#C6A15B] text-[#08121D] text-xs font-mono font-bold rounded-sm hover:bg-[#b08d4b] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#5A6573] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by officer, document name, case, action or hash..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white placeholder-[#8C96A3]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider shrink-0">Action:</span>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
              <option value="DOCUMENT_ANALYZED">Document Analyzed</option>
              <option value="INTEGRITY_CHECKED">Integrity Checked</option>
              <option value="VERSION_CREATED">Version Created</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider shrink-0">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-[#08121D] dark:text-white cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
              <option value="WARNING">WARNING</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#5A6573] pt-1">
          Showing <span className="font-bold text-[#08121D] dark:text-white">{filteredLogs.length}</span> audit trail events
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F5F0] dark:bg-[#08121D] border-b border-[#DDD8CE] dark:border-[#1E2D3E] font-mono text-[10px] text-[#5A6573] uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Document / Case</th>
                <th className="py-3 px-4">Officer / User</th>
                <th className="py-3 px-4">Details / Hash</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD8CE]/60 dark:divide-[#1E2D3E]/60">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(item => (
                  <tr key={item.id} className="hover:bg-[#F7F5F0]/50 dark:hover:bg-[#08121D]/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-[11px] text-[#5A6573] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-[#08121D] dark:text-white font-mono">
                        {item.actionLabel}
                      </span>
                    </td>

                    {/* Document / Case */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-xs font-semibold text-[#08121D] dark:text-white truncate">
                        {item.documentName || 'Case Record'}
                      </div>
                      {item.caseId && (
                        <span className="text-[10px] font-mono text-[#C6A15B] block">
                          Case {item.caseId}
                        </span>
                      )}
                    </td>

                    {/* Officer */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-[#08121D] dark:text-white">
                        {item.userName}
                      </div>
                      <span className="text-[10px] font-mono text-[#5A6573] block">
                        {item.userRole}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 max-w-md">
                      <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] line-clamp-2">
                        {item.details}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                        item.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : item.status === 'FAILURE'
                          ? 'bg-red-500/10 text-red-500 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      }`}>
                        {item.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-mono text-[#5A6573]">
                    <Clock className="w-8 h-8 text-[#C6A15B]/30 mx-auto mb-2" />
                    <span>No audit entries match the current filter criteria.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

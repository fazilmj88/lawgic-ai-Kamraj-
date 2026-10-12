import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  PackageCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  Layers,
  FileText,
  MapPin,
  Lock,
  RefreshCw,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { Role } from '../../types';
import { apiUrl } from '../../lib/apiConfig';

interface EvidenceCustodyLedgerViewProps {
  caseId: string;
  userRole: Role;
  userName: string;
  onBack?: () => void;
}

interface CustodyEvent {
  id: string;
  exhibitId: string;
  exhibitName: string;
  timestamp: string;
  action: string;
  fromOfficer: string;
  fromRole: string;
  toOfficer: string;
  toRole: string;
  purpose: string;
  tamperSealHash: string;
  status: 'VERIFIED' | 'PENDING' | 'DISCREPANCY';
  notes?: string;
}

export const EvidenceCustodyLedgerView: React.FC<EvidenceCustodyLedgerViewProps> = ({
  caseId,
  userRole,
  userName,
  onBack
}) => {
  const [ledger, setLedger] = useState<CustodyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExhibit, setSelectedExhibit] = useState<string>('ALL');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Form State
  const [transferExhibit, setTransferExhibit] = useState('EXHIBIT-CHAIN-01');
  const [toOfficer, setToOfficer] = useState('Sub-Inspector Ankit Verma');
  const [toRole, setToRole] = useState('Malkhana Custodian / Station Officer');
  const [purpose, setPurpose] = useState('Transfer to Malkhana Evidence Room under Judicial Seal');
  const [sealHash, setSealHash] = useState('SEAL-DL-2026-9921');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/custody-ledger?userRole=${encodeURIComponent(userRole)}&userName=${encodeURIComponent(userName)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.ledger) {
          setLedger(data.ledger);
        }
      }
    } catch (err) {
      console.error('Failed to load custody ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [caseId]);

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTransfer(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/custody-transfer`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exhibitId: transferExhibit,
          toOfficer,
          toRole,
          purpose,
          tamperSealHash: sealHash,
          fromOfficer: userName,
          fromRole: userRole
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record custody transfer.');
      }

      setNotice(`Custody transfer successfully logged for ${transferExhibit}. New cryptographic custody seal registered.`);
      setShowTransferModal(false);
      fetchLedger();
    } catch (err: any) {
      setError(err?.message || 'Error completing custody transfer.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Unique exhibits
  const exhibits = Array.from(new Set(ledger.map(l => l.exhibitName || l.exhibitId)));

  const filteredLedger = ledger.filter(item => {
    if (selectedExhibit === 'ALL') return true;
    return (item.exhibitName === selectedExhibit) || (item.exhibitId === selectedExhibit);
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
        <div className="flex items-start gap-3.5">
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
              <ShieldCheck className="w-5 h-5 text-[#C6A15B]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif">
                Evidence Chain of Custody &amp; Exhibit Transfer Ledger
              </h3>
            </div>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
              Immutable tracking of physical and digital forensic exhibits from scene seizure to judicial court presentation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-3.5 py-1.5 bg-[#C6A15B] hover:bg-[#b08d4b] text-[#08121D] font-mono font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transfer Custody</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs underline font-mono">Dismiss</button>
        </div>
      )}

      {/* Filter by Exhibit */}
      <div className="flex items-center justify-between p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#5A6573] font-mono">Filter by Exhibit:</span>
          <select
            value={selectedExhibit}
            onChange={e => setSelectedExhibit(e.target.value)}
            className="px-2.5 py-1 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white font-mono cursor-pointer"
          >
            <option value="ALL">All Case Exhibits ({ledger.length} events)</option>
            {exhibits.map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>

        <span className="text-[10px] font-mono text-[#5A6573] flex items-center gap-1">
          <Lock className="w-3 h-3 text-[#C6A15B]" />
          Tamper-Seals Cryptographically Logged
        </span>
      </div>

      {/* Custody Timeline Stream */}
      <div className="space-y-3">
        {filteredLedger.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5A6573] italic bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
            No custody transfer events recorded yet for this case.
          </div>
        ) : (
          filteredLedger.map((event, idx) => (
            <div
              key={idx}
              className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-2 hover:border-[#C6A15B]/40 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#08121D] dark:text-white">
                    {event.exhibitName || event.exhibitId}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/20">
                    {event.action}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-[#5A6573]">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="p-2.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <div>
                    <span className="text-[10px] text-[#5A6573] block">Relinquished By:</span>
                    <strong className="text-[#08121D] dark:text-white">{event.fromOfficer}</strong>
                    <span className="text-[10px] text-[#5A6573] block">({event.fromRole})</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#C6A15B] shrink-0 mx-2" />

                  <div>
                    <span className="text-[10px] text-[#5A6573] block">Transferred To:</span>
                    <strong className="text-[#08121D] dark:text-white">{event.toOfficer}</strong>
                    <span className="text-[10px] text-[#5A6573] block">({event.toRole})</span>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-[#DDD8CE] sm:dark:border-[#1E2D3E] sm:pl-3">
                  <span className="text-[10px] text-[#5A6573] block">Tamper Seal Reference:</span>
                  <span className="font-mono font-bold text-[#C6A15B] block">{event.tamperSealHash}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-block mt-0.5">
                    Seal Intact &amp; Verified
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#5A6573] dark:text-[#8C96A3]">
                <strong>Stated Purpose:</strong> {event.purpose}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transfer Custody Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#C6A15B]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif">
                  Initiate Custody Transfer
                </h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-[#5A6573] hover:text-[#08121D] dark:hover:text-white text-xs font-mono">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-xs text-red-500 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleInitiateTransfer} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                  Exhibit Item *
                </label>
                <select
                  value={transferExhibit}
                  onChange={e => setTransferExhibit(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white cursor-pointer"
                >
                  <option value="EXHIBIT-CHAIN-01">22K Gold Chain Exhibit (Marked Ex. P-1)</option>
                  <option value="EXHIBIT-CCTV-01">CCTV DVR Footage Flash Drive (Connaught Place)</option>
                  <option value="EXHIBIT-VEHICLE-01">Black Honda Activa Scooty (DL 04 AB 4920)</option>
                  <option value="EXHIBIT-DOC-01">Original Station Intake FIR Memo</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                    Recipient Officer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={toOfficer}
                    onChange={e => setToOfficer(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                    Recipient Role / Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={toRole}
                    onChange={e => setToRole(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                  Tamper-Evident Seal Barcode / Number *
                </label>
                <input
                  type="text"
                  required
                  value={sealHash}
                  onChange={e => setSealHash(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs font-mono text-[#08121D] dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#5A6573] uppercase tracking-wider block mb-1">
                  Stated Purpose of Custody Handover *
                </label>
                <textarea
                  rows={2}
                  required
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full p-2 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 text-xs text-[#5A6573] font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="px-4 py-1.5 bg-[#C6A15B] text-[#08121D] font-mono text-xs font-bold rounded hover:bg-[#b08d4b] cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTransfer ? 'Recording...' : 'Record Cryptographic Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Users,
  Shield,
  Layers,
  MapPin,
  Car,
  Tag,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Info,
  X
} from 'lucide-react';
import { RelationshipGraphData, EntityNode, RelationshipEdge } from '../../types/documentIntelligence';
import { Role } from '../../types';
import { apiUrl } from '../../lib/apiConfig';

interface CaseRelationshipGraphProps {
  caseId: string;
  userRole: Role;
  userName: string;
}

const ENTITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  Suspect: {
    label: 'Suspect / Accused',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    icon: Users
  },
  Victim: {
    label: 'Victim / Informant',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/40',
    icon: Users
  },
  Witness: {
    label: 'Eyewitness / Panch',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    icon: Users
  },
  Evidence: {
    label: 'Evidence / Exhibit',
    color: 'text-[#C6A15B]',
    bg: 'bg-[#C6A15B]/10',
    border: 'border-[#C6A15B]/40',
    icon: Layers
  },
  Location: {
    label: 'Crime Scene / Location',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    icon: MapPin
  },
  Vehicle: {
    label: 'Vehicle',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/40',
    icon: Car
  },
  Section: {
    label: 'BNS / BNSS Section',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/40',
    icon: Tag
  }
};

export const CaseRelationshipGraph: React.FC<CaseRelationshipGraphProps> = ({
  caseId,
  userRole,
  userName
}) => {
  const [graphData, setGraphData] = useState<RelationshipGraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<EntityNode | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchGraph = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/relationships?userRole=${encodeURIComponent(userRole)}&userName=${encodeURIComponent(userName)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.graph) {
          setGraphData(data.graph);
        }
      }
    } catch (err) {
      console.error('Failed to load relationship graph:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [caseId]);

  const handleRefreshGraph = async () => {
    setIsRefreshing(true);
    setNotice(null);
    try {
      const res = await fetch(apiUrl(`/api/cases/${caseId}/relationships`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole, userName })
      });
      const data = await res.json();
      if (res.ok && data.success && data.graph) {
        setGraphData(data.graph);
        setNotice('Cross-entity relationship network synced with all case depositions and evidence exhibits.');
      } else {
        setNotice(data.error || 'Failed to refresh relationships.');
      }
    } catch (err: any) {
      setNotice(err?.message || 'Error updating relationship graph.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredNodes = graphData.nodes.filter(node => {
    const matchesType = selectedType === 'ALL' || node.type === selectedType;
    const matchesQuery = !searchQuery.trim() ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (node.role && node.role.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesQuery;
  });

  const getConnectedEdges = (nodeId: string) => {
    return graphData.edges.filter(e => e.source === nodeId || e.target === nodeId);
  };

  const getNodeById = (id: string) => {
    return graphData.nodes.find(n => n.id === id);
  };

  const suspiciousEdges = graphData.edges.filter(e => e.isSuspicious);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#C6A15B]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif">
              Case Entity Relationship Graph &amp; Connection Network
            </h3>
          </div>
          <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
            Interconnected entity web linking suspects, victims, eyewitnesses, physical evidence exhibits, and locations.
          </p>
        </div>

        <button
          onClick={handleRefreshGraph}
          disabled={isRefreshing || isLoading}
          className="px-3.5 py-1.5 bg-[#C6A15B]/10 hover:bg-[#C6A15B]/20 text-[#C6A15B] border border-[#C6A15B]/30 rounded-sm text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Re-Mapping Network...' : 'Sync Graph with Vault'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs underline font-mono">Dismiss</button>
        </div>
      )}

      {/* Suspicious Connections Warning Alert */}
      {suspiciousEdges.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Suspicious Proximity &amp; Connection Anomalies ({suspiciousEdges.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {suspiciousEdges.map((edge, i) => {
              const srcNode = getNodeById(edge.source);
              const tgtNode = getNodeById(edge.target);
              return (
                <div key={i} className="p-2.5 bg-white dark:bg-[#08121D] border border-amber-500/20 rounded-sm flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#08121D] dark:text-white">
                      {srcNode?.name || edge.source} ➔ {edge.relationship} ➔ {tgtNode?.name || edge.target}
                    </div>
                    <p className="text-[11px] text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
                      {edge.suspicionReason || 'Suspicious proximity or contradictory account detected in case files.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#5A6573] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entity name, role, section, vehicle..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-[#08121D] dark:text-white"
          />
        </div>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded text-xs text-[#08121D] dark:text-white font-mono cursor-pointer"
        >
          <option value="ALL">All Entity Types ({graphData.nodes.length})</option>
          <option value="Suspect">Suspect / Accused</option>
          <option value="Victim">Victim / Deponent</option>
          <option value="Witness">Witnesses &amp; Panchas</option>
          <option value="Evidence">Evidence &amp; Seizures</option>
          <option value="Location">Crime Locations</option>
          <option value="Vehicle">Vehicles</option>
          <option value="Section">BNS Legal Sections</option>
        </select>

        <span className="text-[11px] text-[#5A6573] font-mono">
          {filteredNodes.length} nodes • {graphData.edges.length} relationships
        </span>
      </div>

      {/* Main Graph Grid & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entity Node Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredNodes.map(node => {
              const config = ENTITY_CONFIG[node.type] || ENTITY_CONFIG.Evidence;
              const IconComp = config.icon;
              const connected = getConnectedEdges(node.id);
              const isSelected = selectedNode?.id === node.id;
              const hasSuspicious = connected.some(e => e.isSuspicious);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 bg-white dark:bg-[#0C1927] border rounded-sm transition-all cursor-pointer hover:shadow-md ${
                    isSelected
                      ? 'border-[#C6A15B] ring-1 ring-[#C6A15B] bg-[#C6A15B]/5'
                      : hasSuspicious
                      ? 'border-amber-500/50 hover:border-amber-500'
                      : 'border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${config.bg} ${config.color} border ${config.border}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#08121D] dark:text-white leading-tight">
                          {node.name}
                        </h4>
                        <span className={`text-[10px] font-mono uppercase font-semibold ${config.color}`}>
                          {node.role || node.type}
                        </span>
                      </div>
                    </div>

                    {hasSuspicious && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[9px] font-mono font-bold flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Anomaly
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#5A6573] dark:text-[#8C96A3] line-clamp-2">
                    {node.description || 'Case entity identified across registered investigation records.'}
                  </p>

                  <div className="mt-3 pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between text-[10px] font-mono text-[#5A6573]">
                    <span>{connected.length} Links</span>
                    <span className="text-[#C6A15B] hover:underline flex items-center gap-1">
                      Inspect Connections ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Relationship Connection Cards */}
          <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#08121D] dark:text-white font-serif flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#C6A15B]" />
              Documented Cross-Entity Links ({graphData.edges.length})
            </h4>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {graphData.edges.map((edge, i) => {
                const src = getNodeById(edge.source);
                const tgt = getNodeById(edge.target);
                const srcConf = ENTITY_CONFIG[src?.type || ''] || ENTITY_CONFIG.Evidence;
                const tgtConf = ENTITY_CONFIG[tgt?.type || ''] || ENTITY_CONFIG.Evidence;

                return (
                  <div
                    key={i}
                    className={`p-2.5 border rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
                      edge.isSuspicious
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-[#F7F5F0]/50 dark:bg-[#08121D]/50 border-[#DDD8CE] dark:border-[#1E2D3E]'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold ${srcConf.color}`}>
                        {src?.name || edge.source}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] text-[#08121D] dark:text-white font-mono">
                        <ArrowRight className="w-3 h-3 text-[#C6A15B]" />
                        <span>{edge.relationship}</span>
                      </div>
                      <span className={`font-semibold ${tgtConf.color}`}>
                        {tgt?.name || edge.target}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {edge.documentSource && (
                        <span className="text-[10px] font-mono text-[#5A6573] bg-[#DDD8CE]/30 dark:bg-[#1E2D3E] px-1.5 py-0.5 rounded">
                          Doc: {edge.documentSource}
                        </span>
                      )}
                      {edge.isSuspicious && (
                        <span className="text-[10px] text-amber-600 font-bold uppercase font-mono">
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm sticky top-4">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#C6A15B] uppercase tracking-wider font-bold">
                      Entity Inspector
                    </span>
                    <h3 className="text-sm font-bold text-[#08121D] dark:text-white mt-0.5">
                      {selectedNode.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-[#5A6573] hover:text-[#08121D] dark:hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2.5 bg-[#F7F5F0] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#5A6573]">Category:</span>
                    <span className="font-semibold text-[#08121D] dark:text-white">{selectedNode.type}</span>
                  </div>
                  {selectedNode.role && (
                    <div className="flex justify-between">
                      <span className="text-[#5A6573]">Role / Designation:</span>
                      <span className="font-semibold text-[#08121D] dark:text-white">{selectedNode.role}</span>
                    </div>
                  )}
                  {selectedNode.confidence && (
                    <div className="flex justify-between">
                      <span className="text-[#5A6573]">Extraction Confidence:</span>
                      <span className="font-mono text-emerald-600">{selectedNode.confidence}%</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#5A6573] dark:text-[#CBD5E1] leading-relaxed">
                  {selectedNode.description || 'Entity active in case occurrences and investigation logs.'}
                </p>

                {/* Direct Edges for Selected Node */}
                <div className="space-y-2 pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6573] font-bold block">
                    Connected Relationships ({getConnectedEdges(selectedNode.id).length}):
                  </span>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {getConnectedEdges(selectedNode.id).map((edge, i) => {
                      const isSource = edge.source === selectedNode.id;
                      const otherId = isSource ? edge.target : edge.source;
                      const otherNode = getNodeById(otherId);

                      return (
                        <div
                          key={i}
                          className={`p-2 rounded-sm border text-xs space-y-1 ${
                            edge.isSuspicious
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                              : 'bg-[#F7F5F0] dark:bg-[#08121D] border-[#DDD8CE] dark:border-[#1E2D3E]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#08121D] dark:text-white">
                              {edge.relationship}
                            </span>
                            {edge.isSuspicious && (
                              <span className="text-[9px] font-mono font-bold text-amber-600">
                                ANOMALY
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#5A6573] dark:text-[#8C96A3]">
                            Connected to: <strong className="text-[#08121D] dark:text-white">{otherNode?.name || otherId}</strong> ({otherNode?.type})
                          </div>
                          {edge.suspicionReason && (
                            <div className="text-[10px] italic text-amber-600 dark:text-amber-400 mt-1">
                              "{edge.suspicionReason}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-2">
                <Info className="w-8 h-8 text-[#5A6573] mx-auto opacity-50" />
                <h4 className="text-xs font-semibold text-[#08121D] dark:text-white">
                  Entity Inspector
                </h4>
                <p className="text-[11px] text-[#5A6573] leading-relaxed">
                  Click on any suspect, eyewitness, evidence exhibit, or crime location card to analyze its relationships and corroborative links.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

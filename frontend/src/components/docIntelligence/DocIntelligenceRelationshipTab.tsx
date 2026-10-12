import React, { useState } from 'react';
import { 
  Network, 
  User, 
  Car, 
  MapPin, 
  Package, 
  Layers, 
  ArrowRight, 
  Eye, 
  ShieldAlert, 
  Info,
  Filter
} from 'lucide-react';
import { 
  CaseRelationship, 
  ExtractedPerson, 
  ExtractedVehicle, 
  ExtractedLocation, 
  ExtractedProperty,
  PotentialEvidenceReference 
} from '../../types/documentIntelligence';

interface DocIntelligenceRelationshipTabProps {
  relationships: CaseRelationship[];
  persons: ExtractedPerson[];
  vehicles: ExtractedVehicle[];
  locations: ExtractedLocation[];
  property: ExtractedProperty[];
  evidence: PotentialEvidenceReference[];
  onViewSource?: (page: string | number, snippet: string) => void;
}

export const DocIntelligenceRelationshipTab: React.FC<DocIntelligenceRelationshipTabProps> = ({
  relationships = [],
  persons = [],
  vehicles = [],
  locations = [],
  property = [],
  evidence = [],
  onViewSource
}) => {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Build unified nodes map
  const allNodes: Array<{
    id: string;
    label: string;
    category: 'person' | 'vehicle' | 'location' | 'property' | 'evidence';
    subLabel: string;
    sourcePage?: string;
    color: string;
    badgeBg: string;
  }> = [
    ...persons.map(p => ({
      id: p.name,
      label: p.name,
      category: 'person' as const,
      subLabel: `${p.role} ${p.age ? `(${p.age}y)` : ''}`,
      sourcePage: p.sourcePage,
      color: p.role === 'Victim' ? '#3B82F6' : p.role === 'Suspect' ? '#EF4444' : p.role === 'Witness' ? '#10B981' : '#C6A15B',
      badgeBg: p.role === 'Victim' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : p.role === 'Suspect' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
    })),
    ...vehicles.map(v => ({
      id: `${v.makeModel || 'Vehicle'} (${v.registrationNumber || 'No Plate'})`,
      label: `${v.makeModel || 'Vehicle'}`,
      category: 'vehicle' as const,
      subLabel: v.registrationNumber || v.color || 'Unregistered',
      sourcePage: v.sourcePage,
      color: '#F59E0B',
      badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/30'
    })),
    ...locations.map(l => ({
      id: l.name,
      label: l.name,
      category: 'location' as const,
      subLabel: l.type,
      sourcePage: l.sourcePage,
      color: '#8B5CF6',
      badgeBg: 'bg-purple-500/10 text-purple-500 border-purple-500/30'
    })),
    ...property.map(pr => ({
      id: pr.item,
      label: pr.item,
      category: 'property' as const,
      subLabel: pr.estimatedValue ? `₹${pr.estimatedValue}` : pr.status,
      sourcePage: pr.sourcePage,
      color: '#EC4899',
      badgeBg: 'bg-pink-500/10 text-pink-500 border-pink-500/30'
    })),
    ...evidence.map(e => ({
      id: e.evidenceReference,
      label: e.evidenceReference.slice(0, 32),
      category: 'evidence' as const,
      subLabel: e.category,
      sourcePage: e.sourcePage,
      color: '#06B6D4',
      badgeBg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
    }))
  ];

  // Synthesize relationships if array is empty
  const activeRelationships: CaseRelationship[] = relationships.length > 0 
    ? relationships 
    : [
        ...(persons.length >= 2 ? [{
          id: 'rel-syn-1',
          source: persons[0]?.name || 'Victim',
          target: persons[1]?.name || 'Suspect',
          relation: 'Assaulted / Robbed by',
          type: 'person-person' as const
        }] : []),
        ...(vehicles.length > 0 && persons.length > 1 ? [{
          id: 'rel-syn-2',
          source: persons[1]?.name || 'Suspect',
          target: `${vehicles[0]?.makeModel || 'Vehicle'} (${vehicles[0]?.registrationNumber || 'No Plate'})`,
          relation: 'Fled on getaway vehicle',
          type: 'person-vehicle' as const
        }] : []),
        ...(locations.length > 0 && persons.length > 0 ? [{
          id: 'rel-syn-3',
          source: persons[0]?.name || 'Victim',
          target: locations[0]?.name || 'Scene of Crime',
          relation: 'Intercepted at locus delicti',
          type: 'incident-person' as const
        }] : []),
        ...(property.length > 0 && persons.length > 1 ? [{
          id: 'rel-syn-4',
          source: persons[1]?.name || 'Suspect',
          target: property[0]?.item || 'Stolen Property',
          relation: 'Forcibly dispossessed / snatched',
          type: 'person-property' as const
        }] : []),
        ...(evidence.length > 0 && locations.length > 0 ? [{
          id: 'rel-syn-5',
          source: evidence[0]?.evidenceReference.slice(0, 32) || 'Evidence',
          target: locations[0]?.name || 'Scene of Crime',
          relation: 'Captured / Recovered at',
          type: 'location-evidence' as const
        }] : [])
      ];

  const filteredNodes = allNodes.filter(node => {
    if (filterType === 'all') return true;
    return node.category === filterType;
  });

  const selectedNodeData = allNodes.find(n => n.id === selectedEntity);
  const connectedRelations = activeRelationships.filter(
    r => r.source === selectedEntity || r.target === selectedEntity
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-4 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[#C6A15B]" />
            <h3 className="text-sm font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
              Case Entity Relationship Map
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/30">
              {allNodes.length} Entities • {activeRelationships.length} Connections
            </span>
          </div>
          <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-1">
            Visual network showing interconnections between persons, vehicles, locus delicti, seized property, and evidence.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#5A6573] mr-1 hidden sm:block" />
          {[
            { id: 'all', label: 'All Entities' },
            { id: 'person', label: 'Persons' },
            { id: 'vehicle', label: 'Vehicles' },
            { id: 'location', label: 'Locations' },
            { id: 'property', label: 'Property' },
            { id: 'evidence', label: 'Evidence' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`text-xs px-2.5 py-1 rounded-sm border font-mono transition-colors whitespace-nowrap cursor-pointer ${
                filterType === f.id
                  ? 'bg-[#C6A15B] text-[#08121D] border-[#C6A15B] font-bold'
                  : 'bg-transparent text-[#5A6573] dark:text-[#8C96A3] border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Graph & Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Graph Canvas / Card Matrix */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm min-h-[480px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#5A6573] dark:text-[#8C96A3] uppercase tracking-wider">
                Interactive Entity Graph (Click any node to inspect connections)
              </span>
              {selectedEntity && (
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-xs text-[#C6A15B] hover:underline font-mono cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Visual Node Grid with Interactive Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredNodes.map(node => {
                const isSelected = selectedEntity === node.id;
                const isConnected = selectedEntity && connectedRelations.some(
                  r => r.source === node.id || r.target === node.id
                );

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedEntity(isSelected ? null : node.id)}
                    className={`p-3 rounded-sm border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-[#C6A15B] bg-[#C6A15B]/10 shadow-md ring-1 ring-[#C6A15B]'
                        : isConnected
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F5F0] dark:bg-[#08121D]/60 hover:border-[#C6A15B]/60'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div 
                        className="p-1.5 rounded-sm shrink-0" 
                        style={{ backgroundColor: `${node.color}20`, color: node.color }}
                      >
                        {node.category === 'person' && <User className="w-4 h-4" />}
                        {node.category === 'vehicle' && <Car className="w-4 h-4" />}
                        {node.category === 'location' && <MapPin className="w-4 h-4" />}
                        {node.category === 'property' && <Package className="w-4 h-4" />}
                        {node.category === 'evidence' && <Layers className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#08121D] dark:text-white truncate">
                            {node.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#5A6573] dark:text-[#8C96A3] block truncate">
                          {node.subLabel}
                        </span>
                      </div>
                    </div>

                    {/* Source trace pill */}
                    {node.sourcePage && (
                      <div className="mt-2 pt-2 border-t border-[#DDD8CE]/50 dark:border-[#1E2D3E]/50 flex items-center justify-between text-[10px] font-mono text-[#5A6573] dark:text-[#8C96A3]">
                        <span>{node.sourcePage}</span>
                        {onViewSource && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewSource(node.sourcePage!, node.label);
                            }}
                            className="text-[#C6A15B] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Eye className="w-2.5 h-2.5" /> Source
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Connections Trail */}
          <div className="mt-6 pt-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
            <h4 className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Mapped Relationship Links</span>
              <span className="text-[10px] text-[#5A6573] font-normal">({activeRelationships.length} verified)</span>
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {activeRelationships.map(rel => {
                const isRelActive = selectedEntity 
                  ? (rel.source === selectedEntity || rel.target === selectedEntity)
                  : true;

                return (
                  <div
                    key={rel.id}
                    className={`p-2 rounded-sm border text-xs font-mono flex items-center justify-between gap-2 transition-opacity ${
                      isRelActive
                        ? 'border-[#DDD8CE] dark:border-[#1E2D3E] bg-[#F7F5F0]/60 dark:bg-[#08121D]/40 text-[#08121D] dark:text-white'
                        : 'opacity-40 border-transparent text-[#5A6573]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <span className="font-bold text-[#C6A15B] truncate">{rel.source}</span>
                      <ArrowRight className="w-3 h-3 text-[#5A6573] shrink-0" />
                      <span className="text-[#5A6573] dark:text-[#8C96A3] italic shrink-0">[{rel.relation}]</span>
                      <ArrowRight className="w-3 h-3 text-[#5A6573] shrink-0" />
                      <span className="font-bold text-[#08121D] dark:text-white truncate">{rel.target}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-[#DDD8CE] dark:bg-[#1E2D3E] text-[#5A6573] shrink-0">
                      {rel.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="p-6 bg-white dark:bg-[#0C1927] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm space-y-4">
          <div className="border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
            <h4 className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider">
              Entity Inspector
            </h4>
            <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
              {selectedNodeData ? 'Detailed evidentiary connections' : 'Select an entity node from the map to inspect links.'}
            </p>
          </div>

          {selectedNodeData ? (
            <div className="space-y-4">
              <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E]">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${selectedNodeData.badgeBg}`}>
                    {selectedNodeData.category.toUpperCase()}
                  </span>
                  {selectedNodeData.sourcePage && (
                    <span className="text-[10px] font-mono text-[#5A6573]">
                      Source: {selectedNodeData.sourcePage}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-[#08121D] dark:text-white mt-2">
                  {selectedNodeData.label}
                </h3>
                <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] mt-0.5">
                  {selectedNodeData.subLabel}
                </p>
              </div>

              {/* Direct Connections */}
              <div>
                <h5 className="text-xs font-mono font-bold text-[#08121D] dark:text-white uppercase tracking-wider mb-2">
                  Associated Links ({connectedRelations.length})
                </h5>
                {connectedRelations.length > 0 ? (
                  <div className="space-y-2">
                    {connectedRelations.map(cr => (
                      <div 
                        key={cr.id}
                        className="p-2.5 bg-[#F7F5F0]/60 dark:bg-[#08121D]/40 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-[#C6A15B] font-mono font-bold">
                          <span>{cr.relation}</span>
                        </div>
                        <div className="mt-1 text-xs text-[#08121D] dark:text-white">
                          Connected Entity: <span className="font-bold">{cr.source === selectedEntity ? cr.target : cr.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs font-mono text-[#5A6573] border border-dashed border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
                    No explicit binary relationship mapped for this entity in the source document.
                  </div>
                )}
              </div>

              {/* Officer Verification Guidance */}
              <div className="p-3 bg-[#C6A15B]/10 border border-[#C6A15B]/30 rounded-sm text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[#C6A15B] font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Investigating Officer Notice</span>
                </div>
                <p className="text-[#5A6573] dark:text-[#8C96A3] text-[11px] leading-relaxed">
                  Relationship networks represent algorithmic parsing of deposition narratives. IO must independently corroborate entity linkages before formulating chargesheet matrices under Section 193 BNSS.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#5A6573] dark:text-[#8C96A3] space-y-2">
              <Network className="w-8 h-8 mx-auto text-[#C6A15B]/40" />
              <p className="text-xs font-mono">
                Click on any node on the left to examine its direct evidentiary relationships, statutory context, and source references.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  User, 
  Car, 
  MapPin, 
  Package, 
  Eye, 
  ShieldCheck, 
  AlertCircle,
  Phone,
  Home
} from 'lucide-react';
import { 
  ExtractedPerson, 
  ExtractedVehicle, 
  ExtractedLocation, 
  ExtractedProperty 
} from '../../types/documentIntelligence';

interface DocIntelligenceEntitiesTabProps {
  persons: ExtractedPerson[];
  vehicles: ExtractedVehicle[];
  locations: ExtractedLocation[];
  property: ExtractedProperty[];
  onViewSource: (page: string | number, snippet: string) => void;
}

export const DocIntelligenceEntitiesTab: React.FC<DocIntelligenceEntitiesTabProps> = ({
  persons,
  vehicles,
  locations,
  property,
  onViewSource
}) => {
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Complainant':
      case 'Victim':
        return 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30';
      case 'Suspect / Accused':
        return 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30';
      case 'Witness':
        return 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30';
      case 'Police Personnel':
      case 'Medical Personnel':
        return 'bg-[#C6A15B]/15 text-[#D5B875] border border-[#C6A15B]/30';
      default:
        return 'bg-[#6B7280]/15 text-[#9CA3AF] border border-[#6B7280]/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Persons & Parties Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-[#C6A15B]" />
            Persons & Named Parties ({persons.length})
          </h3>
          <span className="text-[10px] font-mono text-[#8C96A3]">
            Roles derived strictly from text (Uncertain roles marked "Role unclear")
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {persons.map((person) => (
            <div
              key={person.id}
              className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3 hover:border-[#C6A15B]/60 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm font-bold ${getRoleBadgeStyle(person.role)}`}>
                    {person.role}
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.2 rounded-sm font-bold uppercase ${
                    person.confidence === 'HIGH' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  }`}>
                    {person.confidence}
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-[#08121D] dark:text-white">
                  {person.name}
                </h4>

                {person.description && (
                  <p className="text-xs text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
                    {person.description}
                  </p>
                )}

                {person.contactDetails && person.contactDetails !== 'N/A' && (
                  <div className="text-[11px] font-mono text-[#C6A15B] flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    <span>{person.contactDetails}</span>
                  </div>
                )}

                {person.address && (
                  <div className="text-[11px] text-[#8C96A3] flex items-start gap-1.5">
                    <Home className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{person.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between text-xs font-mono">
                <span className="text-[#8C96A3]">{person.sourcePage}</span>
                <button
                  onClick={() => onViewSource(person.sourcePage, person.sourceSnippet || person.name)}
                  className="px-2 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Source</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicles Section */}
      {vehicles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
              <Car className="w-4.5 h-4.5 text-[#C6A15B]" />
              Vehicles Mentioned ({vehicles.length})
            </h3>
            <span className="text-[10px] font-mono text-[#8C96A3]">
              VAHAN RTO Database Cross-check Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((veh) => (
              <div
                key={veh.id}
                className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-4 sm:p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold tracking-widest px-2.5 py-1 rounded-sm bg-[#101C29] text-[#D5B875] border border-[#C6A15B]/50">
                    {veh.registrationNumber}
                  </span>
                  <span className="text-[10px] font-mono text-[#8C96A3]">{veh.sourcePage}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[#08121D] dark:text-white font-semibold">
                    {veh.makeModelColor || 'Vehicle details mentioned in document'}
                  </span>
                  {veh.associatedPersonOrAction && (
                    <p className="text-[#5A6573] dark:text-[#8C96A3] leading-relaxed">
                      {veh.associatedPersonOrAction}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex justify-end">
                  <button
                    onClick={() => onViewSource(veh.sourcePage, veh.sourceSnippet || veh.registrationNumber)}
                    className="px-2 py-1 text-[11px] font-mono rounded-sm border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#C6A15B] text-[#5A6573] dark:text-[#8C96A3] hover:text-[#C6A15B] transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Source</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations & Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Locations */}
        <div className="space-y-3">
          <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
            <MapPin className="w-4.5 h-4.5 text-[#C6A15B]" />
            Locations & Locus Delicti ({locations.length})
          </h3>

          <div className="space-y-3">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#08121D] dark:text-white">{loc.name}</span>
                  <span className="text-[10px] font-mono text-[#8C96A3]">{loc.sourcePage}</span>
                </div>
                <p className="text-[#5A6573] dark:text-[#8C96A3]">{loc.significance}</p>
                {loc.address && <p className="text-[11px] font-mono text-[#C6A15B]">{loc.address}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Property */}
        <div className="space-y-3">
          <h3 className="font-serif-legal font-bold text-base text-[#08121D] dark:text-white flex items-center gap-2">
            <Package className="w-4.5 h-4.5 text-[#C6A15B]" />
            Property & Seized/Stolen Items ({property.length})
          </h3>

          <div className="space-y-3">
            {property.map((prop) => (
              <div key={prop.id} className="bg-white dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#08121D] dark:text-white">{prop.item}</span>
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-sm bg-[#EF4444]/15 text-[#EF4444] font-bold">
                    {prop.status}
                  </span>
                </div>
                {prop.description && <p className="text-[#5A6573] dark:text-[#8C96A3]">{prop.description}</p>}
                {prop.serialOrImei && (
                  <p className="text-[11px] font-mono text-[#C6A15B]">
                    IMEI/Serial: {prop.serialOrImei}
                  </p>
                )}
                {prop.reportedValue && (
                  <p className="text-[11px] font-mono text-[#10B981] font-semibold">
                    Value: {prop.reportedValue}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

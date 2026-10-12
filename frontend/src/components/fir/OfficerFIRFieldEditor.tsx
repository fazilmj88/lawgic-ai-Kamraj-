import React from 'react';
import { OfficialFIRData } from '../../types/documentIntelligence';
import { validateFIRData } from '../../services/officialFIRPdfService';
import {
  FileText,
  Shield,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Sparkles,
  Loader2
} from 'lucide-react';

interface OfficerFIRFieldEditorProps {
  data: OfficialFIRData;
  onChange: (updated: OfficialFIRData) => void;
  onGeneratePreview: () => void;
  onSaveDraft?: () => void;
  isGenerating?: boolean;
  isSavingDraft?: boolean;
  generateStatus?: 'idle' | 'generating' | 'success' | 'failed';
  errorMessage?: string | null;
}

export const OfficerFIRFieldEditor: React.FC<OfficerFIRFieldEditorProps> = ({
  data,
  onChange,
  onGeneratePreview,
  onSaveDraft,
  isGenerating = false,
  isSavingDraft = false,
  generateStatus = 'idle',
  errorMessage = null
}) => {
  const validation = validateFIRData(data);
  const isValid = validation.valid;

  const getGenerateButtonText = () => {
    if (isGenerating) return 'Generating FIR...';
    if (generateStatus === 'success') return 'FIR Generated Successfully';
    if (generateStatus === 'failed') return 'Regenerate FIR';
    return 'Generate FIR';
  };
  const updateField = <K extends keyof OfficialFIRData>(field: K, value: OfficialFIRData[K]) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const updateNested = <K extends keyof OfficialFIRData>(
    parent: K,
    childKey: string,
    value: any
  ) => {
    onChange({
      ...data,
      [parent]: {
        ...(data[parent] as any),
        [childKey]: value
      }
    });
  };

  const handleAddSection = () => {
    const current = data.sections || [];
    onChange({
      ...data,
      sections: [...current, 'Section 303(2) BNS, 2023']
    });
  };

  const handleRemoveSection = (idx: number) => {
    const current = [...(data.sections || [])];
    current.splice(idx, 1);
    onChange({
      ...data,
      sections: current
    });
  };

  const handleSectionChange = (idx: number, val: string) => {
    const current = [...(data.sections || [])];
    current[idx] = val;
    onChange({
      ...data,
      sections: current
    });
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Top Action Bar: Clearly visible actions and status */}
      <div className="bg-[#FAF9F5] dark:bg-[#101823] p-4 rounded-xl border border-[#E5E0D8] dark:border-[#1D2633] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#B8955A]/20 border border-[#B8955A]/40 flex items-center justify-center text-[#B8955A]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#171717] dark:text-white">Officer Statutory FIR Review</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isValid
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
              }`}>
                {isValid ? 'All Required Fields Complete' : `${validation.missingFields.length} Required Field${validation.missingFields.length > 1 ? 's' : ''} Missing`}
              </span>
            </div>
            <div className="text-[11px] text-[#595959] dark:text-[#8E98A5] mt-0.5">
              Tamil Nadu Police Form-I • Section 173 BNSS (Official Printed Layout)
            </div>
          </div>
        </div>

        {/* Top-Right Action Area */}
        <div className="flex items-center gap-2.5">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSavingDraft}
              className="px-4 py-2.5 text-xs font-semibold text-[#171717] dark:text-white bg-white dark:bg-[#151F2D] hover:bg-[#F2EFE9] dark:hover:bg-[#1D2633] border border-[#DDD8CE] dark:border-[#1D2633] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Save current officer entries as draft"
            >
              <Save className="w-3.5 h-3.5 text-[#B8955A]" />
              <span>{isSavingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGeneratePreview}
            disabled={!isValid || isGenerating}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg cursor-pointer shadow-md transition-all ${
              !isValid
                ? 'bg-[#E5E0D8] dark:bg-[#1A2634] text-[#8E98A5] cursor-not-allowed border border-[#DDD8CE] dark:border-[#223042]'
                : isGenerating
                ? 'bg-[#B8955A]/80 text-black cursor-wait'
                : 'btn-legal-gold'
            }`}
            title={!isValid ? `Please fill: ${validation.missingFields.join(', ')}` : 'Generate official 3-page FIR PDF'}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : isValid ? (
              <Sparkles className="w-4 h-4 text-black" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#8E98A5]" />
            )}
            <span>{getGenerateButtonText()}</span>
          </button>
        </div>
      </div>

      {/* Explicit Generation Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900/60 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-900 dark:text-rose-200 text-xs">
              Official FIR Generation Failure
            </h4>
            <p className="text-[11px] text-rose-800 dark:text-rose-300 font-mono leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Validation Message Banner (when required fields are missing) */}
      {!isValid && !errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-900 dark:text-rose-200 text-xs">
              Required FIR Fields Missing for Official Registration
            </h4>
            <p className="text-[11px] text-rose-800 dark:text-rose-300/90 leading-relaxed">
              {validation.message}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {validation.missingFields.map((field, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Informational Guidance Notice */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-start gap-3">
        <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-xs">
            Officer Verification Mandatory (BNSS § 173)
          </h4>
          <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
            AI-extracted fields must be reviewed and verified by an authorized police officer before generating the official 3-page Tamil Nadu Police Integrated FIR. The generated document strictly preserves the official bilingual template.
          </p>
        </div>
      </div>

      {/* Grid: Police Station & Docket Info (Page 1 Mapping) */}
      <div className="bg-white dark:bg-[#101823] p-5 rounded-xl border border-[#E5E0D8] dark:border-[#1D2633] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-2">
          <FileText className="w-4 h-4 text-[#B8955A]" />
          <h3 className="font-semibold text-sm text-[#171717] dark:text-white">
            1. Police Station & Case Docket Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              District (மாவட்டம்)
            </label>
            <input
              type="text"
              value={data.district}
              onChange={e => updateField('district', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Police Station (காவல் நிலையம்)
            </label>
            <input
              type="text"
              value={data.policeStation}
              onChange={e => updateField('policeStation', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Year (ஆண்டு)
            </label>
            <input
              type="text"
              value={data.year}
              onChange={e => updateField('year', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              FIR No. (மு.த.அ.எண்)
            </label>
            <input
              type="text"
              value={data.firNumber}
              onChange={e => updateField('firNumber', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              FIR Date (நாள்)
            </label>
            <input
              type="date"
              value={data.firDate}
              onChange={e => updateField('firDate', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Statutory Sections (Page 1 Section 2) */}
      <div className="bg-white dark:bg-[#101823] p-5 rounded-xl border border-[#E5E0D8] dark:border-[#1D2633] space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-[#1D2633] pb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#B8955A]" />
            <h3 className="font-semibold text-sm text-[#171717] dark:text-white">
              2. Acts & Legal Provisions (சட்டம் & பிரிவுகள்)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddSection}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#B8955A] hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Section
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Act(s)
            </label>
            <input
              type="text"
              value={data.acts?.[0] || 'Bharatiya Nyaya Sanhita, 2023'}
              onChange={e => updateField('acts', [e.target.value])}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Section(s)
            </label>
            <div className="space-y-2">
              {data.sections?.map((sec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sec}
                    onChange={e => handleSectionChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white font-mono"
                  />
                  {data.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Occurrence of Offence & General Diary (Page 1 Section 3) */}
      <div className="bg-white dark:bg-[#101823] p-5 rounded-xl border border-[#E5E0D8] dark:border-[#1D2633] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-2">
          <Clock className="w-4 h-4 text-[#B8955A]" />
          <h3 className="font-semibold text-sm text-[#171717] dark:text-white">
            3. Occurrence & Information Receipt Timings
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Occurrence Day (குற்ற நிகழ்வு நாள்)
            </label>
            <input
              type="text"
              value={data.occurrence?.day}
              onChange={e => updateNested('occurrence', 'day', e.target.value)}
              placeholder="e.g. Wednesday"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Date From (நாள் முதல்)
            </label>
            <input
              type="date"
              value={data.occurrence?.dateFrom}
              onChange={e => updateNested('occurrence', 'dateFrom', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Date To (நாள் வரை)
            </label>
            <input
              type="date"
              value={data.occurrence?.dateTo}
              onChange={e => updateNested('occurrence', 'dateTo', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Time Period (குற்ற நிகழ்வு நேரம்)
            </label>
            <input
              type="text"
              value={data.occurrence?.timePeriod}
              onChange={e => updateNested('occurrence', 'timePeriod', e.target.value)}
              placeholder="e.g. Night hours / Morning"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Time From (நேரம் முதல்)
            </label>
            <input
              type="time"
              value={data.occurrence?.timeFrom}
              onChange={e => updateNested('occurrence', 'timeFrom', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Time To (நேரம் வரை)
            </label>
            <input
              type="time"
              value={data.occurrence?.timeTo}
              onChange={e => updateNested('occurrence', 'timeTo', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#E5E0D8] dark:border-[#1D2633]">
          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              3(b) PS Info Receipt Date
            </label>
            <input
              type="date"
              value={data.informationReceived?.date}
              onChange={e => updateNested('informationReceived', 'date', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Receipt Time
            </label>
            <input
              type="time"
              value={data.informationReceived?.time}
              onChange={e => updateNested('informationReceived', 'time', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              3(c) GD Entry No.
            </label>
            <input
              type="text"
              value={data.generalDiary?.entryNumber}
              onChange={e => updateNested('generalDiary', 'entryNumber', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              GD Entry Time
            </label>
            <input
              type="time"
              value={data.generalDiary?.time}
              onChange={e => updateNested('generalDiary', 'time', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Place of Occurrence (Page 1 Section 5) */}
      <div className="bg-white dark:bg-[#101823] p-5 rounded-xl border border-[#E5E0D8] dark:border-[#1D2633] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-2">
          <MapPin className="w-4 h-4 text-[#B8955A]" />
          <h3 className="font-semibold text-sm text-[#171717] dark:text-white">
            5. Place of Occurrence (குற்ற நிகழ்விடம்)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              5(a) Distance & Direction from PS
            </label>
            <input
              type="text"
              value={data.placeOfOccurrence?.directionDistanceFromPS}
              onChange={e => updateNested('placeOfOccurrence', 'directionDistanceFromPS', e.target.value)}
              placeholder="e.g. 1.2 Km East from Police Station"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Beat Number (முறை காவல் எண்)
            </label>
            <input
              type="text"
              value={data.placeOfOccurrence?.beatNumber}
              onChange={e => updateNested('placeOfOccurrence', 'beatNumber', e.target.value)}
              placeholder="e.g. Beat No. 3"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              5(b) Full Address (முகவரி)
            </label>
            <textarea
              rows={2}
              value={data.placeOfOccurrence?.address}
              onChange={e => updateNested('placeOfOccurrence', 'address', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Complainant Particulars (Page 1 Sec 6 & Page 2) */}
      <div className="bg-white dark:bg-[#101823] p-5 rounded-xl border border-[#E5E0D8] dark:border-[#1D2633] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-2">
          <User className="w-4 h-4 text-[#B8955A]" />
          <h3 className="font-semibold text-sm text-[#171717] dark:text-white">
            6. Complainant / Informant Particulars (குற்றமுறையீட்டாளர் விவரங்கள்)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              6(a) Name (பெயர்) *
            </label>
            <input
              type="text"
              value={data.complainant?.name}
              onChange={e => updateNested('complainant', 'name', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              6(b) Father's / Husband's Name
            </label>
            <input
              type="text"
              value={data.complainant?.fatherOrHusbandName}
              onChange={e => updateNested('complainant', 'fatherOrHusbandName', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              6(c) Date/Year of Birth & Nationality
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="DOB / Year"
                value={data.complainant?.dob}
                onChange={e => updateNested('complainant', 'dob', e.target.value)}
                className="w-1/2 px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
              />
              <input
                type="text"
                value={data.complainant?.nationality}
                onChange={e => updateNested('complainant', 'nationality', e.target.value)}
                className="w-1/2 px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              6(g) Address (முகவரி)
            </label>
            <input
              type="text"
              value={data.complainant?.address}
              onChange={e => updateNested('complainant', 'address', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Accused & FIR Contents (Page 2) */}
      <div className="bg-white dark:bg-[#101823] p-5 rounded-xl border border-[#E5E0D8] dark:border-[#1D2633] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-2">
          <FileText className="w-4 h-4 text-[#B8955A]" />
          <h3 className="font-semibold text-sm text-[#171717] dark:text-white">
            7 & 12. Accused Details & FIR Contents (குற்ற விவரங்கள்)
          </h3>
        </div>

        <div>
          <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
            7. Accused Details (சாட்டப்பட்டவரின் முழுமையான விவரங்கள்)
          </label>
          <input
            type="text"
            value={data.accusedDetails?.[0] || ''}
            onChange={e => updateField('accusedDetails', [e.target.value])}
            placeholder="e.g. Two unknown persons, approximately 25-30 years"
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
            12. FIR Contents / Verbatim Statement (மு.த.அ. உள்ளடக்கம்) *
          </label>
          <textarea
            rows={5}
            value={data.firContents}
            onChange={e => updateField('firContents', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white leading-relaxed font-serif"
          />
        </div>
      </div>

      {/* Action Taken & Court Dispatch (Page 3) */}
      <div className="bg-white dark:bg-[#101823] p-5 rounded-xl border border-[#E5E0D8] dark:border-[#1D2633] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D8] dark:border-[#1D2633] pb-2">
          <Shield className="w-4 h-4 text-[#B8955A]" />
          <h3 className="font-semibold text-sm text-[#171717] dark:text-white">
            13 & 14. Action Taken & Designated Investigating Officer
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Investigating Officer (I.O.)
            </label>
            <input
              type="text"
              value={data.actionTaken?.investigatingOfficer}
              onChange={e => updateNested('actionTaken', 'investigatingOfficer', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Officer Rank
            </label>
            <input
              type="text"
              value={data.actionTaken?.officerRank}
              onChange={e => updateNested('actionTaken', 'officerRank', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#595959] dark:text-[#8E98A5] mb-1 font-medium">
              Badge / Officer Number
            </label>
            <input
              type="text"
              value={data.actionTaken?.officerNumber}
              onChange={e => updateNested('actionTaken', 'officerNumber', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#1D2633] bg-[#F7F6F2] dark:bg-[#151F2D] text-[#171717] dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Area: Save Draft & Generate FIR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#E5E0D8] dark:border-[#1D2633] bg-[#FAF9F5] dark:bg-[#101823] p-4 rounded-xl">
        <div>
          <div className="text-xs font-semibold text-[#171717] dark:text-white">
            Official FIR Statutory Endorsement
          </div>
          <div className="text-[11px] text-[#595959] dark:text-[#8E98A5] mt-0.5">
            {isValid
              ? 'All required statutory fields validated. Ready to compile official 3-page FIR PDF.'
              : `Missing required fields: ${validation.missingFields.join(', ')}`}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSavingDraft}
              className="px-4 py-2.5 text-xs font-semibold text-[#171717] dark:text-white bg-white dark:bg-[#151F2D] hover:bg-[#F2EFE9] dark:hover:bg-[#1D2633] border border-[#DDD8CE] dark:border-[#1D2633] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-[#B8955A]" />
              <span>{isSavingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGeneratePreview}
            disabled={!isValid || isGenerating}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg cursor-pointer shadow-md transition-all ${
              !isValid
                ? 'bg-[#E5E0D8] dark:bg-[#1A2634] text-[#8E98A5] cursor-not-allowed border border-[#DDD8CE] dark:border-[#223042]'
                : isGenerating
                ? 'bg-[#B8955A]/80 text-black cursor-wait'
                : 'btn-legal-gold'
            }`}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : isValid ? (
              <Sparkles className="w-4 h-4 text-black" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#8E98A5]" />
            )}
            <span>{getGenerateButtonText()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

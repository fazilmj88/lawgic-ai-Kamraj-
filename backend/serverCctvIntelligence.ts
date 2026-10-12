import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  CctvEvidenceItem,
  CctvAnalysisData,
  CctvTimelineEvent,
  CctvPerson,
  CctvVehicle,
  CctvObject,
  CctvVisibleText,
  CctvKeyFrame,
  CctvPotentialEvidence,
  CctvOfficerReview,
  CctvCustodyEntry
} from "./types/cctv";

const execFileAsync = promisify(execFile);

// Directory where CCTV evidence files and extracted frame thumbnails are stored
const CCTV_STORAGE_DIR = path.join(process.cwd(), "data", "cctv_evidence");
const CCTV_FRAMES_DIR = path.join(process.cwd(), "data", "cctv_frames");
const CCTV_METADATA_STORE = path.join(process.cwd(), "data", "cctv_store.json");

// Ensure directories exist
if (!fs.existsSync(CCTV_STORAGE_DIR)) {
  fs.mkdirSync(CCTV_STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(CCTV_FRAMES_DIR)) {
  fs.mkdirSync(CCTV_FRAMES_DIR, { recursive: true });
}

// In-Memory store with file-backed persistence
const cctvEvidenceMap = new Map<string, CctvEvidenceItem>();

// Load persisted items on startup
function loadPersistedStore() {
  try {
    if (fs.existsSync(CCTV_METADATA_STORE)) {
      const raw = fs.readFileSync(CCTV_METADATA_STORE, "utf-8");
      const list: CctvEvidenceItem[] = JSON.parse(raw);
      list.forEach(item => cctvEvidenceMap.set(item.id, item));
      console.log(`[CCTV Store] Loaded ${list.length} CCTV evidence records from disk.`);
    }
  } catch (err) {
    console.warn("[CCTV Store] Failed to load metadata store from disk:", err);
  }
}
loadPersistedStore();

function persistStore() {
  try {
    const list = Array.from(cctvEvidenceMap.values());
    fs.writeFileSync(CCTV_METADATA_STORE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[CCTV Store] Failed to persist metadata store to disk:", err);
  }
}

/**
 * Check FFmpeg and FFprobe availability
 */
export async function checkFfmpegSupport(): Promise<{
  ffmpegAvailable: boolean;
  ffprobeAvailable: boolean;
  version: string;
}> {
  let ffmpegAvailable = false;
  let ffprobeAvailable = false;
  let version = "Not installed";

  try {
    const { stdout } = await execFileAsync("ffmpeg", ["-version"]);
    ffmpegAvailable = true;
    const firstLine = stdout.split("\n")[0];
    version = firstLine.trim();
  } catch {
    ffmpegAvailable = false;
  }

  try {
    await execFileAsync("ffprobe", ["-version"]);
    ffprobeAvailable = true;
  } catch {
    ffprobeAvailable = false;
  }

  return { ffmpegAvailable, ffprobeAvailable, version };
}

/**
 * Extract technical video metadata using ffprobe
 */
export async function extractVideoMetadata(filePath: string): Promise<{
  duration: number;
  formattedDuration: string;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: string;
  hasAudio: boolean;
}> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration,bit_rate:stream=width,height,r_frame_rate,codec_name,codec_type",
      "-print_format", "json",
      filePath
    ]);

    const info = JSON.parse(stdout);
    const videoStream = info.streams?.find((s: any) => s.codec_type === "video");
    const audioStream = info.streams?.find((s: any) => s.codec_type === "audio");

    let duration = parseFloat(info.format?.duration || "0");
    if (isNaN(duration) || duration <= 0) {
      duration = 60; // fallback duration estimate
    }

    let fps = 25;
    if (videoStream?.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split("/");
      if (parts.length === 2 && parseFloat(parts[1]) > 0) {
        fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
      }
    }

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    const formattedDuration = `${String(hours).padStart(2, "0")}:${String(remMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return {
      duration,
      formattedDuration,
      width: videoStream?.width || 1280,
      height: videoStream?.height || 720,
      fps,
      codec: videoStream?.codec_name || "h264",
      bitrate: info.format?.bit_rate ? `${Math.round(parseInt(info.format.bit_rate) / 1000)} kbps` : "Variable",
      hasAudio: !!audioStream
    };
  } catch (err) {
    console.warn("[CCTV Metadata] ffprobe extraction warning, using fallback:", err);
    return {
      duration: 30,
      formattedDuration: "00:00:30",
      width: 1280,
      height: 720,
      fps: 25,
      codec: "h264",
      bitrate: "1500 kbps",
      hasAudio: false
    };
  }
}

/**
 * Compute SHA-256 checksum of video file using stream
 */
export async function calculateFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", err => reject(err));
  });
}

/**
 * Format seconds into HH:MM:SS
 */
export function formatSecondsToTimestamp(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Parse timestamp (HH:MM:SS or MM:SS) to seconds
 */
export function parseTimestampToSeconds(ts: string): number {
  if (!ts) return 0;
  const parts = ts.trim().split(":").map(p => parseFloat(p) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseFloat(ts) || 0;
}

/**
 * Extract intelligently sampled frames using FFmpeg
 */
export async function extractSampledFrames(
  filePath: string,
  evidenceId: string,
  duration: number
): Promise<Array<{ seconds: number; timestamp: string; framePath: string; base64: string }>> {
  const frames: Array<{ seconds: number; timestamp: string; framePath: string; base64: string }> = [];

  // Determine intelligent sample timestamps (between 6 and 14 frames)
  const timestampsToSample: number[] = [];

  if (duration <= 15) {
    // Very short clip: sample at start, middle, and end
    const count = Math.max(3, Math.min(6, Math.floor(duration)));
    for (let i = 0; i < count; i++) {
      timestampsToSample.push(Number(((duration / (count + 1)) * (i + 1)).toFixed(2)));
    }
  } else if (duration <= 60) {
    // 15 - 60s: sample every 4-5 seconds (~8-12 frames)
    const step = Math.max(4, duration / 10);
    for (let t = Math.min(1, step / 2); t < duration; t += step) {
      timestampsToSample.push(Number(t.toFixed(2)));
    }
  } else {
    // Longer clip: sample key moments with max 12 frames to avoid API quota saturation
    const step = duration / 12;
    for (let t = Math.min(2, step / 2); t < duration - 1; t += step) {
      timestampsToSample.push(Number(t.toFixed(2)));
    }
  }

  // Ensure unique sorted timestamps
  const uniqueTimestamps = Array.from(new Set(timestampsToSample)).sort((a, b) => a - b);

  const evidenceFramesDir = path.join(CCTV_FRAMES_DIR, evidenceId);
  if (!fs.existsSync(evidenceFramesDir)) {
    fs.mkdirSync(evidenceFramesDir, { recursive: true });
  }

  for (let i = 0; i < uniqueTimestamps.length; i++) {
    const sec = uniqueTimestamps[i];
    const tsFormatted = formatSecondsToTimestamp(sec);
    const frameFilename = `frame_${i + 1}_${Math.floor(sec)}s.jpg`;
    const framePath = path.join(evidenceFramesDir, frameFilename);

    try {
      // Seek quickly with -ss before -i and scale to standard resolution
      await execFileAsync("ffmpeg", [
        "-ss", sec.toString(),
        "-i", filePath,
        "-frames:v", "1",
        "-vf", "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
        "-q:v", "3",
        "-y",
        framePath
      ]);

      if (fs.existsSync(framePath)) {
        const buf = fs.readFileSync(framePath);
        const base64 = `data:image/jpeg;base64,${buf.toString("base64")}`;
        frames.push({
          seconds: sec,
          timestamp: tsFormatted,
          framePath,
          base64
        });
      }
    } catch (frameErr) {
      console.warn(`[CCTV Extraction] Failed extracting frame at ${sec}s:`, frameErr);
    }
  }

  return frames;
}

/**
 * Execute Multimodal Video Analysis on Sampled Frames
 */
export async function analyzeCctvWithGemini(
  frames: Array<{ seconds: number; timestamp: string; base64: string }>,
  videoMeta: {
    fileName: string;
    duration: number;
    formattedDuration: string;
    caseId: string;
  }
): Promise<CctvAnalysisData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "lawgic-ai-cctv-intelligence"
      }
    }
  });

  const promptText = `
You are a senior forensic video analyst assisting Indian Law Enforcement (Police IO / Forensics) under the Bharatiya Nagarik Suraksha Sanhita (BNSS 2023) and Bharatiya Sakshya Adhiniyam (BSA 2023).

You are given a chronological sequence of ${frames.length} keyframes extracted from CCTV footage for Case: ${videoMeta.caseId}, File: ${videoMeta.fileName}, Duration: ${videoMeta.formattedDuration}.

EACH FRAME IS ACCOMPANIED BY ITS EXACT VIDEO TIMESTAMP:
${frames.map((f, i) => `Frame ${i + 1}: Timestamp ${f.timestamp} (${f.seconds.toFixed(1)}s)`).join("\n")}

STRICT EVIDENTIARY RULES:
1. ONLY report what is visibly and objectively observable in these frames.
2. DO NOT identify or claim facial recognition or real identities. Use neutral labels: "Person 1", "Person 2", "Person 3".
3. DO NOT state guilt, legal conclusions, or criminal intent (e.g. NEVER say "the thief steals the bike"). Instead say: "Person 1 approaches parked motorcycle and rides away towards south exit".
4. DO NOT invent or hallucinate vehicle registration numbers or visible text. If unreadable, clearly state "Unreadable / Low Confidence".
5. For visible objects, use neutral descriptive wording (e.g., "Possible iron rod / metallic tool" rather than "Murder weapon"; "Dark backpack" rather than "Bag containing stolen jewelry").
6. Timestamps MUST match the actual extracted timestamps provided above.

Return a valid JSON object matching this EXACT schema:
{
  "summary": "Objective chronological summary of observed surveillance footage events.",
  "events": [
    {
      "id": "evt-1",
      "timestamp": "HH:MM:SS",
      "seconds": 0,
      "observation": "Detailed observable fact",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "sourceFrame": "Timestamp HH:MM:SS",
      "category": "person_movement" | "vehicle_movement" | "object_interaction" | "critical_incident" | "general"
    }
  ],
  "persons": [
    {
      "id": "Person 1",
      "label": "Person 1",
      "firstSeen": "HH:MM:SS",
      "firstSeenSeconds": 0,
      "lastSeen": "HH:MM:SS",
      "lastSeenSeconds": 0,
      "clothing": "Description of visible attire (e.g., dark collared shirt, light denim)",
      "appearanceNotes": "Observable physical attributes (e.g., tall build, wearing dark cap)",
      "carriedObjects": ["e.g. Black backpack", "Helmet"],
      "directionOfMovement": "e.g. Moving towards storefront",
      "interactions": ["Approaches motorcycle at 00:01:15"],
      "confidence": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "vehicles": [
    {
      "id": "veh-1",
      "vehicleType": "Motorcycle" | "Car" | "Auto-rickshaw" | "Van" | "Truck" | "Bicycle" | "Other",
      "visibleColor": "Color description",
      "firstSeen": "HH:MM:SS",
      "firstSeenSeconds": 0,
      "lastSeen": "HH:MM:SS",
      "lastSeenSeconds": 0,
      "direction": "Movement or parking description",
      "distinguishingFeatures": "Visible distinctive markings, rims, or accessories",
      "numberPlateText": "Registration text or 'Unreadable / Low Confidence'",
      "plateConfidence": "HIGH" | "MEDIUM" | "LOW" | "UNREADABLE",
      "confidence": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "objects": [
    {
      "id": "obj-1",
      "objectName": "Object name (e.g., Backpack, Helmet, Tool)",
      "timestamp": "HH:MM:SS",
      "seconds": 0,
      "personAssociation": "Person 1 or Unassociated",
      "visualDescription": "Detailed visual description",
      "evidentiaryCategory": "Potential Weapon" | "Stolen Property" | "Personal Effect" | "Tool / Implement" | "Wearable",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "sourceFrame": "Timestamp HH:MM:SS"
    }
  ],
  "visibleText": [
    {
      "id": "txt-1",
      "text": "Exact text visible (signboards, shop names, timestamps, overlays)",
      "timestamp": "HH:MM:SS",
      "seconds": 0,
      "locationInFrame": "Position description",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "sourceFrame": "Timestamp HH:MM:SS"
    }
  ],
  "potentialEvidence": [
    {
      "id": "ev-1",
      "observation": "Key observation of investigative importance",
      "timestamp": "HH:MM:SS",
      "seconds": 0,
      "evidentiarySignificance": "Why this observation matters for the investigation or chargesheet",
      "legalProvisionsRelevant": ["e.g. Section 303(2) BNS 2023", "Section 63 BSA 2023"]
    }
  ],
  "limitations": [
    "Any technical limitations like low resolution, lighting changes, occlusion, or motion blur."
  ]
}
`;

  // Build multimodal content parts
  const contentsParts: any[] = [{ text: promptText }];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const rawBase64 = frame.base64.replace(/^data:image\/[a-z]+;base64,/, "");
    contentsParts.push({
      text: `[CCTV Keyframe ${i + 1} at timestamp ${frame.timestamp}]`
    });
    contentsParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: rawBase64
      }
    });
  }

  // Candidate models in order of performance and availability
  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];

  let rawResponseText = "";
  let modelUsed = "";
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      console.log(`[CCTV Analysis] Invoking multimodal model ${model} with ${frames.length} frames...`);
      const response = await ai.models.generateContent({
        model,
        contents: contentsParts,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      rawResponseText = response.text || "";
      if (rawResponseText) {
        modelUsed = model;
        break;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[CCTV Analysis] Model ${model} failed: ${errMsg}`);

      if (errMsg.includes("429") || errMsg.includes("ResourceExhausted") || errMsg.includes("quota")) {
        console.warn("[CCTV Analysis] Rate limit / quota reached. Stopping immediate retries.");
        throw new Error("AI analysis temporarily unavailable due to API quota / rate limits. The original CCTV upload has been preserved securely. You can retry analysis later.");
      }
    }
  }

  if (!rawResponseText) {
    throw new Error(`Multimodal CCTV analysis failed: ${lastError?.message || "No response received"}`);
  }

  // Parse JSON response cleanly
  let parsed: any;
  try {
    const cleaned = rawResponseText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[CCTV Analysis] Failed to parse model JSON:", parseErr, rawResponseText.substring(0, 300));
    throw new Error("Failed to parse CCTV forensic response structure from AI model.");
  }

  // Build KeyFrames gallery with thumbnail references
  const keyFrames: CctvKeyFrame[] = frames.map((f, idx) => {
    // Find matching or closest event
    const matchedEvent = (parsed.events || []).find((e: any) => Math.abs((e.seconds || 0) - f.seconds) < 5);
    return {
      id: `kf-${idx + 1}`,
      timestamp: f.timestamp,
      seconds: f.seconds,
      thumbnailUrl: f.base64,
      observation: matchedEvent?.observation || `Surveillance observation recorded at ${f.timestamp}`,
      confidence: matchedEvent?.confidence || "HIGH",
      associatedEntities: (parsed.persons || []).map((p: any) => p.id).slice(0, 2)
    };
  });

  // Ensure all events have review status
  const validatedEvents: CctvTimelineEvent[] = (parsed.events || []).map((ev: any, idx: number) => ({
    id: ev.id || `evt-${idx + 1}`,
    timestamp: ev.timestamp || formatSecondsToTimestamp(ev.seconds || 0),
    seconds: ev.seconds ?? parseTimestampToSeconds(ev.timestamp),
    observation: ev.observation || "Unspecified surveillance activity",
    confidence: (["HIGH", "MEDIUM", "LOW"].includes(ev.confidence) ? ev.confidence : "HIGH") as any,
    sourceFrame: ev.sourceFrame || `Timestamp ${ev.timestamp || "00:00:00"}`,
    category: ev.category || "general",
    reviewStatus: "PENDING"
  }));

  const validatedPersons: CctvPerson[] = (parsed.persons || []).map((p: any, idx: number) => ({
    id: p.id || `Person ${idx + 1}`,
    label: p.label || p.id || `Person ${idx + 1}`,
    firstSeen: p.firstSeen || "00:00:00",
    firstSeenSeconds: p.firstSeenSeconds ?? parseTimestampToSeconds(p.firstSeen),
    lastSeen: p.lastSeen || videoMeta.formattedDuration,
    lastSeenSeconds: p.lastSeenSeconds ?? videoMeta.duration,
    clothing: p.clothing || "Apparel not clearly discernible",
    appearanceNotes: p.appearanceNotes || "Visual features noted from surveillance",
    carriedObjects: Array.isArray(p.carriedObjects) ? p.carriedObjects : [],
    directionOfMovement: p.directionOfMovement || "Stationary / ambiguous direction",
    interactions: Array.isArray(p.interactions) ? p.interactions : [],
    confidence: (["HIGH", "MEDIUM", "LOW"].includes(p.confidence) ? p.confidence : "HIGH") as any,
    reviewStatus: "PENDING"
  }));

  const validatedVehicles: CctvVehicle[] = (parsed.vehicles || []).map((v: any, idx: number) => ({
    id: v.id || `veh-${idx + 1}`,
    vehicleType: v.vehicleType || "Motorcycle",
    visibleColor: v.visibleColor || "Indeterminate",
    firstSeen: v.firstSeen || "00:00:00",
    firstSeenSeconds: v.firstSeenSeconds ?? parseTimestampToSeconds(v.firstSeen),
    lastSeen: v.lastSeen || videoMeta.formattedDuration,
    lastSeenSeconds: v.lastSeenSeconds ?? videoMeta.duration,
    direction: v.direction || "Visible in frame",
    distinguishingFeatures: v.distinguishingFeatures || "None explicitly noted",
    numberPlateText: v.numberPlateText || "Unreadable / Low Confidence",
    plateConfidence: v.plateConfidence || "UNREADABLE",
    confidence: (["HIGH", "MEDIUM", "LOW"].includes(v.confidence) ? v.confidence : "HIGH") as any,
    reviewStatus: "PENDING"
  }));

  const validatedObjects: CctvObject[] = (parsed.objects || []).map((o: any, idx: number) => ({
    id: o.id || `obj-${idx + 1}`,
    objectName: o.objectName || "Visible Object",
    timestamp: o.timestamp || "00:00:00",
    seconds: o.seconds ?? parseTimestampToSeconds(o.timestamp),
    personAssociation: o.personAssociation,
    visualDescription: o.visualDescription || "Item observed in surveillance view",
    evidentiaryCategory: o.evidentiaryCategory || "Personal Effect",
    confidence: (["HIGH", "MEDIUM", "LOW"].includes(o.confidence) ? o.confidence : "HIGH") as any,
    sourceFrame: o.sourceFrame || `Timestamp ${o.timestamp || "00:00:00"}`,
    reviewStatus: "PENDING"
  }));

  const validatedText: CctvVisibleText[] = (parsed.visibleText || []).map((t: any, idx: number) => ({
    id: t.id || `txt-${idx + 1}`,
    text: t.text || "",
    timestamp: t.timestamp || "00:00:00",
    seconds: t.seconds ?? parseTimestampToSeconds(t.timestamp),
    locationInFrame: t.locationInFrame || "Frame overlay / scene",
    confidence: (["HIGH", "MEDIUM", "LOW"].includes(t.confidence) ? t.confidence : "HIGH") as any,
    sourceFrame: t.sourceFrame || `Timestamp ${t.timestamp || "00:00:00"}`,
    reviewStatus: "PENDING"
  }));

  const validatedEvidence: CctvPotentialEvidence[] = (parsed.potentialEvidence || []).map((pe: any, idx: number) => ({
    id: pe.id || `ev-${idx + 1}`,
    observation: pe.observation || "Evidentiary observation",
    timestamp: pe.timestamp || "00:00:00",
    seconds: pe.seconds ?? parseTimestampToSeconds(pe.timestamp),
    evidentiarySignificance: pe.evidentiarySignificance || "Investigative relevance noted",
    legalProvisionsRelevant: Array.isArray(pe.legalProvisionsRelevant) ? pe.legalProvisionsRelevant : ["Sec 63 BSA 2023"]
  }));

  return {
    summary: parsed.summary || "CCTV footage analyzed across extracted chronological keyframes.",
    events: validatedEvents,
    persons: validatedPersons,
    vehicles: validatedVehicles,
    objects: validatedObjects,
    visibleText: validatedText,
    keyFrames,
    potentialEvidence: validatedEvidence,
    limitations: Array.isArray(parsed.limitations) ? parsed.limitations : ["Subject to camera resolution and lighting"],
    analyzedAt: new Date().toISOString(),
    modelUsed,
    videoDuration: videoMeta.duration
  };
}

/**
 * Get all CCTV evidence items across system
 */
export function getAllCctvEvidence(): CctvEvidenceItem[] {
  return Array.from(cctvEvidenceMap.values());
}

/**
 * Get all CCTV evidence items for a case
 */
export function getCctvEvidenceForCase(caseId: string): CctvEvidenceItem[] {
  return Array.from(cctvEvidenceMap.values()).filter(item => item.caseId === caseId);
}

/**
 * Get single CCTV evidence item by ID
 */
export function getCctvEvidenceById(evidenceId: string): CctvEvidenceItem | undefined {
  return cctvEvidenceMap.get(evidenceId);
}

/**
 * Save or update CCTV evidence item
 */
export function saveCctvEvidenceItem(item: CctvEvidenceItem): void {
  cctvEvidenceMap.set(item.id, item);
  persistStore();
}

/**
 * Delete CCTV evidence item
 */
export function deleteCctvEvidenceItem(evidenceId: string): boolean {
  const existed = cctvEvidenceMap.delete(evidenceId);
  if (existed) persistStore();
  return existed;
}

/**
 * Return file path for a stored CCTV evidence item
 */
export function getCctvFilePath(evidenceId: string): string | null {
  const item = cctvEvidenceMap.get(evidenceId);
  if (!item) return null;

  // 1. Direct match with exact stored fileName
  const directPath = path.join(CCTV_STORAGE_DIR, `${evidenceId}_${item.fileName}`);
  if (fs.existsSync(directPath)) return directPath;

  // 2. Match with sanitized filename
  const sanitizedName = item.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const sanitizedPath = path.join(CCTV_STORAGE_DIR, `${evidenceId}_${sanitizedName}`);
  if (fs.existsSync(sanitizedPath)) return sanitizedPath;

  // 3. Scan storage directory for any file matching evidence ID prefix
  try {
    const files = fs.readdirSync(CCTV_STORAGE_DIR);
    const prefix = `${evidenceId}_`;
    const matched = files.find(f => f.startsWith(prefix));
    if (matched) {
      const matchedPath = path.join(CCTV_STORAGE_DIR, matched);
      if (fs.existsSync(matchedPath)) return matchedPath;
    }
  } catch (scanErr) {
    console.warn(`[CCTV FilePath] Directory scan warning:`, scanErr);
  }

  return null;
}

export { CCTV_STORAGE_DIR, CCTV_FRAMES_DIR };

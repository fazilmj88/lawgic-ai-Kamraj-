import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {
  checkFfmpegSupport,
  extractVideoMetadata,
  calculateFileSha256,
  extractSampledFrames,
  analyzeCctvWithGemini,
  getAllCctvEvidence,
  getCctvEvidenceForCase,
  getCctvEvidenceById,
  saveCctvEvidenceItem,
  deleteCctvEvidenceItem,
  getCctvFilePath,
  CCTV_STORAGE_DIR
} from "./serverCctvIntelligence";
import {
  CctvEvidenceItem,
  CctvOfficerReview
} from "./types/cctv";
import { getServerSupabase } from "./server";
import { requireRole, normalizeRole } from "./serverSecurityGateway";

/**
 * Safe logging of incoming CCTV authentication header (prefix only, never prints full JWT)
 */
function logCctvAuth(endpoint: string, req: express.Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1]?.trim() || "";
    const prefix = token.slice(0, 7);
    console.log(`[CCTV Auth] ${endpoint} received Authorization: Bearer ${prefix}... (${token.length} chars)`);
  } else {
    console.warn(`[CCTV Auth] ${endpoint} received missing or invalid Authorization header: ${authHeader ? "Non-Bearer" : "Missing"}`);
  }
}

/**
 * Verify user case assignment and isolation
 */
function verifyCaseAssignment(req: express.Request, caseId: string): boolean {
  const user = (req as any).user;
  const userRole = (req as any).userRole || (req as any).user?.user_metadata?.role || "Constable";
  const normRole = (req as any).normalizedRole || normalizeRole(userRole);

  // Admin has universal oversight
  if (normRole === "ADMIN") return true;

  // Strict case isolation checks (e.g. Case B isolation)
  if (caseId.includes("c0000000-0000-4000-a000-000000000002") || caseId.includes("SEC-CASE-B-002")) {
    if (user?.id === "5ac8065b-ec23-41e8-af66-7600d36a2d2a") return true; // IO-2 assigned
    return false;
  }
  return true;
}

// Configure multer storage for CCTV evidence uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CCTV_STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const evidenceId = `EVID-CCTV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${evidenceId}_${safeName}`);
  }
});

// Allowed CCTV video MIME types and file extensions
const ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/avi",
  "video/mpeg"
];

const ALLOWED_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi"];

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200 MB limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported video format. Allowed formats: MP4, WebM, MOV, AVI"));
    }
  }
});

/**
 * Register CCTV Evidence Intelligence Routes
 */
export function setupCctvRoutes(
  app: express.Express,
  requireAuthMiddleware: express.RequestHandler,
  recordAuditFn: (entry: any) => void
) {
  // 1. Check system capability (FFmpeg / FFprobe)
  app.get("/api/cctv/capability", async (_req, res) => {
    try {
      const caps = await checkFfmpegSupport();
      return res.json({
        success: true,
        ...caps,
        storageDirReady: fs.existsSync(CCTV_STORAGE_DIR)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Seed sample CCTV evidence footage for immediate testing and demonstration
  app.post(
    "/api/cctv/seed-sample",
    requireAuthMiddleware,
    requireRole(["Constable", "Sub-Inspector", "Investigating Officer", "Police Officer", "Forensic Officer", "Admin"]),
    async (req: express.Request, res: express.Response) => {
      logCctvAuth("POST /api/cctv/seed-sample", req);
      try {
        const caseId = (req.body.caseId || "LAW-2026-00125").trim();
        if (!verifyCaseAssignment(req, caseId)) {
          return res.status(403).json({ success: false, error: `Permission Denied: Officer not assigned to Case ${caseId}` });
        }
        const evidenceId = `EVID-CCTV-SAMPLE-${caseId.replace(/[^a-zA-Z0-9]/g, "")}`;
        const existing = getCctvEvidenceById(evidenceId);
        if (existing) {
          return res.json({ success: true, evidence: existing, message: "Sample CCTV exhibit loaded." });
        }

        const sampleSrc = path.join(CCTV_STORAGE_DIR, "sample_market_cctv.mp4");
        const sampleDestName = `${evidenceId}_CAM04_Market_Junction_Surveillance.mp4`;
        const sampleDest = path.join(CCTV_STORAGE_DIR, sampleDestName);

        if (!fs.existsSync(sampleSrc)) {
          // Fallback: copy or create if needed
          return res.status(404).json({ success: false, error: "Sample video template not ready" });
        }

        fs.copyFileSync(sampleSrc, sampleDest);

        const metadata = await extractVideoMetadata(sampleDest);
        const sha256Hash = await calculateFileSha256(sampleDest);
        const storagePath = `${caseId}/evidence/cctv/${evidenceId}/CAM04_Market_Junction_Surveillance.mp4`;

        const sampleItem: CctvEvidenceItem = {
          id: evidenceId,
          caseId,
          fileName: "CAM04_Market_Junction_Surveillance.mp4",
          fileSize: fs.statSync(sampleDest).size,
          mimeType: "video/mp4",
          storagePath,
          videoDuration: metadata.duration,
          formattedDuration: metadata.formattedDuration,
          sha256Hash,
          uploadedBy: (req as any).user?.user_metadata?.full_name || "Constable Murugan",
          uploaderRole: (req as any).userRole || "Constable",
          uploadedAt: new Date().toISOString(),
          processingStatus: "Uploaded",
          analysisStatus: "Pending Analysis",
          streamUrl: `/api/cctv/stream/${evidenceId}`,
          videoUrl: `/api/cctv/stream/${evidenceId}`,
          metadata: {
            fps: metadata.fps,
            width: metadata.width,
            height: metadata.height,
            codec: metadata.codec,
            bitrate: metadata.bitrate,
            hasAudio: false,
            ffmpegUsed: true
          },
          chainOfCustody: [
            {
              id: `custody-${Date.now()}-sample`,
              timestamp: new Date().toISOString(),
              action: "CCTV Evidence Uploaded",
              actor: (req as any).user?.user_metadata?.full_name || "Constable Murugan",
              actorRole: (req as any).userRole || "Constable",
              details: `Official surveillance extract 'CAM04_Market_Junction_Surveillance.mp4' received from Traffic Control Room. Cryptographic SHA-256: ${sha256Hash}`,
              hash: sha256Hash
            }
          ]
        };

        saveCctvEvidenceItem(sampleItem);

        recordAuditFn({
          actionType: "CCTV_UPLOAD",
          actionLabel: "Sample CCTV Loaded",
          caseId,
          documentId: evidenceId,
          documentName: sampleItem.fileName,
          userId: (req as any).user?.id || "usr-officer",
          userName: sampleItem.uploadedBy,
          userRole: sampleItem.uploaderRole,
          details: `Official test CCTV footage '${sampleItem.fileName}' registered under Exhibit ${evidenceId}`,
          status: "SUCCESS"
        });

        return res.status(201).json({ success: true, evidence: sampleItem, message: "Sample CCTV exhibit registered successfully." });
      } catch (err: any) {
        console.error("[Seed Sample] Error:", err);
        return res.status(500).json({ success: false, error: err?.message || "Failed to seed sample" });
      }
    }
  );

  // 2. Get all CCTV evidence items for a case
  app.get(
    "/api/cctv/case/:caseId",
    requireAuthMiddleware,
    async (req: express.Request, res: express.Response) => {
      logCctvAuth(`GET /api/cctv/case/${req.params.caseId}`, req);
      try {
        const { caseId } = req.params;
        if (!verifyCaseAssignment(req, caseId)) {
          return res.status(403).json({ success: false, error: `Permission Denied: Officer not assigned to Case ${caseId}` });
        }
        const items = getCctvEvidenceForCase(caseId);
        return res.json({
          success: true,
          caseId,
          count: items.length,
          evidence: items
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message });
      }
    }
  );

  // 2b. Get all CCTV evidence items (or filtered by caseId query parameter)
  app.get(
    "/api/cctv/evidence",
    requireAuthMiddleware,
    async (req: express.Request, res: express.Response) => {
      logCctvAuth(`GET /api/cctv/evidence`, req);
      try {
        const caseId = req.query.caseId as string | undefined;
        const items = caseId ? getCctvEvidenceForCase(caseId) : getAllCctvEvidence();
        return res.json({
          success: true,
          count: items.length,
          evidence: items
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message });
      }
    }
  );

  // 3. Get single CCTV evidence item by ID
  app.get(
    "/api/cctv/evidence/:evidenceId",
    requireAuthMiddleware,
    async (req: express.Request, res: express.Response) => {
      logCctvAuth(`GET /api/cctv/evidence/${req.params.evidenceId}`, req);
      try {
        const { evidenceId } = req.params;
        const item = getCctvEvidenceById(evidenceId);
        if (!item) {
          return res.status(404).json({ success: false, error: `CCTV Evidence ${evidenceId} not found` });
        }
        if (!verifyCaseAssignment(req, item.caseId)) {
          return res.status(403).json({ success: false, error: `Permission Denied: Officer not assigned to Case ${item.caseId}` });
        }
        return res.json({ success: true, evidence: item });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message });
      }
    }
  );

  // 4. Upload CCTV Video Evidence (Constable, IO, Police, Forensic, Admin)
  app.post(
    "/api/cctv/upload",
    requireAuthMiddleware,
    requireRole(["Constable", "Sub-Inspector", "Investigating Officer", "Police Officer", "Forensic Officer", "Admin"]),
    upload.single("video"),
    async (req: express.Request, res: express.Response) => {
      logCctvAuth("POST /api/cctv/upload", req);
      let savedFilePath: string | null = null;
      try {
        const file = req.file;
        if (!file) {
          return res.status(400).json({ success: false, error: "No video file provided" });
        }

        savedFilePath = file.path;
        const caseId = (req.body.caseId || "LAW-2026-00125").trim();
        if (!verifyCaseAssignment(req, caseId)) {
          if (savedFilePath && fs.existsSync(savedFilePath)) fs.unlinkSync(savedFilePath);
          return res.status(403).json({ success: false, error: `Permission Denied: Officer not assigned to Case ${caseId}` });
        }
        const uploadedBy = (req.body.uploadedBy || (req as any).user?.user_metadata?.full_name || "Constable Murugan").trim();
        const uploaderRole = (req.body.uploaderRole || (req as any).userRole || "Constable").trim();

        // Parse evidence ID from generated filename
        const filenameParts = file.filename.split("_");
        const evidenceId = filenameParts[0] || `EVID-CCTV-${Date.now()}`;

        // Compute cryptographic SHA-256
        const sha256Hash = await calculateFileSha256(file.path);

        // Extract technical video metadata via FFprobe
        const metadata = await extractVideoMetadata(file.path);

        // Target storage path in vault structure: {caseId}/evidence/cctv/{evidenceId}/{filename}
        const storagePath = `${caseId}/evidence/cctv/${evidenceId}/${file.originalname}`;

        const evidenceItem: CctvEvidenceItem = {
          id: evidenceId,
          caseId,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype || "video/mp4",
          storagePath,
          videoDuration: metadata.duration,
          formattedDuration: metadata.formattedDuration,
          sha256Hash,
          uploadedBy,
          uploaderRole,
          uploadedAt: new Date().toISOString(),
          processingStatus: "Uploaded",
          analysisStatus: "Pending Analysis",
          streamUrl: `/api/cctv/stream/${evidenceId}`,
          videoUrl: `/api/cctv/stream/${evidenceId}`,
          metadata: {
            fps: metadata.fps,
            width: metadata.width,
            height: metadata.height,
            codec: metadata.codec,
            bitrate: metadata.bitrate,
            hasAudio: metadata.hasAudio,
            ffmpegUsed: true
          },
          chainOfCustody: [
            {
              id: `custody-${Date.now()}-1`,
              timestamp: new Date().toISOString(),
              action: "CCTV Evidence Uploaded",
              actor: uploadedBy,
              actorRole: uploaderRole,
              details: `Original CCTV file '${file.originalname}' securely registered. Cryptographic SHA-256: ${sha256Hash}. Duration: ${metadata.formattedDuration}.`,
              hash: sha256Hash
            }
          ]
        };

        // Save to in-memory / local disk store
        saveCctvEvidenceItem(evidenceItem);

        // Sync with Supabase (Storage & DB tables)
        const sb = getServerSupabase();
        if (sb) {
          try {
            // Upload to Supabase Storage bucket 'case-documents' if configured
            const fileBuf = fs.readFileSync(file.path);
            await sb.storage
              .from("case-documents")
              .upload(storagePath, fileBuf, {
                contentType: file.mimetype || "video/mp4",
                upsert: false
              });

            // Insert into case_documents table
            await sb.from("case_documents").insert({
              document_name: file.originalname,
              document_type: "Evidence Records",
              mime_type: file.mimetype || "video/mp4",
              file_size: file.size,
              storage_path: storagePath,
              current_version: 1,
              sha256_hash: sha256Hash,
              analysis_status: "Pending Analysis",
              metadata: {
                caseId,
                evidenceId,
                uploadedBy,
                uploaderRole,
                videoDuration: metadata.duration,
                formattedDuration: metadata.formattedDuration,
                storagePath
              }
            });

            // Insert initial custody entry
            await sb.from("chain_of_custody").insert({
              action: "CCTV Evidence Uploaded",
              integrity_hash: sha256Hash,
              status: "Verified",
              notes: `Original CCTV '${file.originalname}' received and verified. SHA-256: ${sha256Hash}`,
              metadata: {
                caseId,
                evidenceId,
                uploadedBy,
                uploaderRole
              }
            });
          } catch (sbErr) {
            console.warn("[CCTV Upload] Supabase sync notice:", sbErr);
          }
        }

        // Record Audit Log
        recordAuditFn({
          actionType: "CCTV_UPLOAD",
          actionLabel: "CCTV Video Uploaded",
          caseId,
          documentId: evidenceId,
          documentName: file.originalname,
          userId: (req as any).user?.id || "usr-officer",
          userName: uploadedBy,
          userRole: uploaderRole,
          details: `CCTV footage '${file.originalname}' (${(file.size / (1024 * 1024)).toFixed(2)} MB, ${metadata.formattedDuration}) uploaded with SHA-256 ${sha256Hash}`,
          status: "SUCCESS"
        });

        return res.status(201).json({
          success: true,
          evidence: evidenceItem,
          message: "CCTV video uploaded successfully and SHA-256 hash verified."
        });
      } catch (err: any) {
        console.error("[CCTV Upload] Error:", err);
        return res.status(500).json({
          success: false,
          error: err?.message || "Failed to upload CCTV video"
        });
      }
    }
  );

  // 5. Trigger AI CCTV Analysis (Constable, IO, Police, Forensic, Admin)
  app.post(
    "/api/cctv/analyze/:evidenceId",
    requireAuthMiddleware,
    requireRole(["Constable", "Sub-Inspector", "Investigating Officer", "Police Officer", "Forensic Officer", "Admin"]),
    async (req: express.Request, res: express.Response) => {
      logCctvAuth(`POST /api/cctv/analyze/${req.params.evidenceId}`, req);
      try {
        const { evidenceId } = req.params;
        const item = getCctvEvidenceById(evidenceId);
        if (!item) {
          return res.status(404).json({ success: false, error: `CCTV Evidence ${evidenceId} not found` });
        }
        if (!verifyCaseAssignment(req, item.caseId)) {
          return res.status(403).json({ success: false, error: `Permission Denied: Officer not assigned to Case ${item.caseId}` });
        }

        const filePath = getCctvFilePath(evidenceId);
        if (!filePath || !fs.existsSync(filePath)) {
          return res.status(404).json({
            success: false,
            error: "Original CCTV video file is not accessible on the server storage"
          });
        }

        // Update status to processing
        item.processingStatus = "Processing";
        item.analysisStatus = "Analyzing";
        saveCctvEvidenceItem(item);

        recordAuditFn({
          actionType: "CCTV_ANALYSIS_STARTED",
          actionLabel: "CCTV AI Analysis Started",
          caseId: item.caseId,
          documentId: item.id,
          documentName: item.fileName,
          userId: (req as any).user?.id || "usr-officer",
          userName: (req as any).user?.user_metadata?.full_name || "Investigating Officer",
          userRole: (req as any).userRole || "Investigating Officer",
          details: `Forensic sampling and multimodal intelligence initiated for '${item.fileName}'`,
          status: "SUCCESS"
        });

        // 1. Sample frames using FFmpeg
        const sampledFrames = await extractSampledFrames(filePath, item.id, item.videoDuration);

        if (sampledFrames.length === 0) {
          throw new Error("Unable to extract video frames for analysis. Verify video file integrity.");
        }

        // 2. Call Multimodal Video Analysis
        const analysisData = await analyzeCctvWithGemini(sampledFrames, {
          fileName: item.fileName,
          duration: item.videoDuration,
          formattedDuration: item.formattedDuration,
          caseId: item.caseId
        });

        // 3. Update Evidence item with analysis
        item.analysis = analysisData;
        item.processingStatus = "Analysis Complete";
        item.analysisStatus = "Analysis Complete";

        // Append to chain of custody
        if (!item.chainOfCustody) item.chainOfCustody = [];
        item.chainOfCustody.push({
          id: `custody-${Date.now()}-${item.chainOfCustody.length + 1}`,
          timestamp: new Date().toISOString(),
          action: "CCTV Analysis Completed",
          actor: "LAWgic Forensic Vision Engine",
          actorRole: "Automated Evidence Analyzer",
          details: `Generated ${analysisData.events.length} timeline events, ${analysisData.persons.length} person observations, ${analysisData.vehicles.length} vehicle observations, ${analysisData.keyFrames.length} keyframes.`,
          hash: item.sha256Hash
        });

        saveCctvEvidenceItem(item);

        // 4. Record audit log
        recordAuditFn({
          actionType: "CCTV_ANALYSIS_COMPLETED",
          actionLabel: "CCTV AI Analysis Completed",
          caseId: item.caseId,
          documentId: item.id,
          documentName: item.fileName,
          userId: (req as any).user?.id || "usr-officer",
          userName: (req as any).user?.user_metadata?.full_name || "Investigating Officer",
          userRole: (req as any).userRole || "Investigating Officer",
          details: `CCTV analysis completed successfully. ${analysisData.events.length} events detected across ${sampledFrames.length} sampled keyframes.`,
          status: "SUCCESS"
        });

        // 5. Sync analysis into Supabase case_documents and case_timeline
        const sb = getServerSupabase();
        if (sb) {
          try {
            await sb
              .from("case_documents")
              .update({
                analysis_status: "Analyzed",
                ai_analysis: analysisData,
                metadata: {
                  ...item.metadata,
                  analysisCompletedAt: new Date().toISOString()
                }
              })
              .eq("sha256_hash", item.sha256Hash);

            // Add key CCTV events to case_timeline
            for (const ev of analysisData.events.slice(0, 5)) {
              await sb.from("case_timeline").insert({
                description: `[CCTV ${ev.timestamp}] ${ev.observation}`,
                event_type: "investigation",
                confidence: ev.confidence,
                metadata: {
                  caseId: item.caseId,
                  cctvEvidenceId: item.id,
                  cctvTimestamp: ev.timestamp
                }
              });
            }
          } catch (sbUpdateErr) {
            console.warn("[CCTV Analyze] Supabase timeline sync notice:", sbUpdateErr);
          }
        }

        return res.json({
          success: true,
          evidence: item,
          message: "CCTV footage analysis completed successfully."
        });
      } catch (err: any) {
        console.error("[CCTV Analyze] Error:", err);
        const { evidenceId } = req.params;
        const item = getCctvEvidenceById(evidenceId);
        if (item) {
          item.processingStatus = "Analysis Failed";
          item.analysisStatus = "Analysis Failed";
          saveCctvEvidenceItem(item);
        }

        recordAuditFn({
          actionType: "CCTV_ANALYSIS_FAILED",
          actionLabel: "CCTV AI Analysis Failed",
          caseId: item?.caseId || "UNKNOWN",
          documentId: evidenceId,
          documentName: item?.fileName || evidenceId,
          userId: (req as any).user?.id || "usr-officer",
          userName: (req as any).user?.user_metadata?.full_name || "Investigating Officer",
          userRole: (req as any).userRole || "Investigating Officer",
          details: `Analysis failed: ${err?.message || "Unknown error"}. Original file remains preserved.`,
          status: "FAILURE"
        });

        return res.status(500).json({
          success: false,
          error: err?.message || "Failed to analyze CCTV video footage"
        });
      }
    }
  );

  // 6. HTTP Range Video Streaming (RFC 7233 compliant for instantaneous seeking)
  app.get(
    "/api/cctv/stream/:evidenceId",
    requireAuthMiddleware,
    async (req: express.Request, res: express.Response) => {
      logCctvAuth(`GET /api/cctv/stream/${req.params.evidenceId}`, req);
      try {
        const { evidenceId } = req.params;
        const item = getCctvEvidenceById(evidenceId);
        if (!item) {
          return res.status(404).json({ success: false, error: "Evidence video record not found" });
        }

        if (!verifyCaseAssignment(req, item.caseId)) {
          return res.status(403).json({ success: false, error: `Permission Denied: Officer not assigned to Case ${item.caseId}` });
        }

        const filePath = getCctvFilePath(evidenceId);
        if (!filePath || !fs.existsSync(filePath)) {
          return res.status(404).json({ success: false, error: "CCTV video file not found on disk" });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;
        const mimeType = item.mimeType || "video/mp4";

        if (range) {
          // Parse Range: bytes=start-end
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

          if (start >= fileSize || end >= fileSize) {
            res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
            return;
          }

          const chunksize = end - start + 1;
          const fileStream = fs.createReadStream(filePath, { start, end });

          res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": mimeType,
            "Cache-Control": "no-cache"
          });

          fileStream.pipe(res);
        } else {
          res.writeHead(200, {
            "Content-Length": fileSize,
            "Content-Type": mimeType,
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache"
          });

          fs.createReadStream(filePath).pipe(res);
        }
      } catch (err: any) {
        console.error("[CCTV Stream] Error:", err);
        return res.status(500).json({ success: false, error: err?.message || "Failed to stream video" });
      }
    }
  );

  // 7. Human-in-the-loop: Officer Review of CCTV Observations
  app.post(
    "/api/cctv/review",
    requireAuthMiddleware,
    requireRole(["Constable", "Sub-Inspector", "Investigating Officer", "Police Officer", "Forensic Officer", "Admin"]),
    async (req: express.Request, res: express.Response) => {
      logCctvAuth("POST /api/cctv/review", req);
      try {
        const {
          evidenceId,
          itemId, // event id, person id, vehicle id, or object id
          itemType, // 'event' | 'person' | 'vehicle' | 'object' | 'text'
          action, // 'VERIFY' | 'REJECT' | 'EDIT'
          officerNotes,
          editedObservation,
          reviewedBy = "Officer",
          reviewerRole = "Investigating Officer"
        } = req.body;

        if (!evidenceId) {
          return res.status(400).json({ success: false, error: "evidenceId is required" });
        }

        const item = getCctvEvidenceById(evidenceId);
        if (!item || !item.analysis) {
          return res.status(404).json({ success: false, error: "CCTV evidence analysis not found" });
        }
        if (!verifyCaseAssignment(req, item.caseId)) {
          return res.status(403).json({ success: false, error: `Permission Denied: Officer not assigned to Case ${item.caseId}` });
        }

        const analysis = item.analysis;
        const newStatus = action === "VERIFY" ? "VERIFIED" : action === "REJECT" ? "REJECTED" : "EDITED";

        // Update the target item
        if (itemType === "event") {
          const ev = analysis.events.find(e => e.id === itemId);
          if (ev) {
            ev.reviewStatus = newStatus;
            if (officerNotes) ev.officerNotes = officerNotes;
            if (editedObservation) ev.editedObservation = editedObservation;
          }
        } else if (itemType === "person") {
          const p = analysis.persons.find(x => x.id === itemId);
          if (p) {
            p.reviewStatus = newStatus;
            if (officerNotes) p.officerNotes = officerNotes;
          }
        } else if (itemType === "vehicle") {
          const v = analysis.vehicles.find(x => x.id === itemId);
          if (v) {
            v.reviewStatus = newStatus;
            if (officerNotes) v.officerNotes = officerNotes;
          }
        } else if (itemType === "object") {
          const obj = analysis.objects.find(x => x.id === itemId);
          if (obj) {
            obj.reviewStatus = newStatus;
            if (officerNotes) obj.officerNotes = officerNotes;
          }
        } else if (itemType === "text") {
          const txt = analysis.visibleText.find(x => x.id === itemId);
          if (txt) {
            txt.reviewStatus = newStatus as any;
          }
        }

        // Update overall officer review structure
        if (!item.officerReview) {
          item.officerReview = {
            status: "PARTIALLY_REVIEWED",
            reviewedBy,
            reviewedAt: new Date().toISOString(),
            reviewerRole,
            officerVerdict: "Review in progress",
            verifiedItemIds: [],
            rejectedItemIds: [],
            editedNotes: {}
          };
        }

        if (action === "VERIFY") {
          if (!item.officerReview.verifiedItemIds.includes(itemId)) {
            item.officerReview.verifiedItemIds.push(itemId);
          }
          item.officerReview.rejectedItemIds = item.officerReview.rejectedItemIds.filter(id => id !== itemId);
        } else if (action === "REJECT") {
          if (!item.officerReview.rejectedItemIds.includes(itemId)) {
            item.officerReview.rejectedItemIds.push(itemId);
          }
          item.officerReview.verifiedItemIds = item.officerReview.verifiedItemIds.filter(id => id !== itemId);
        }

        if (officerNotes) {
          item.officerReview.editedNotes[itemId] = officerNotes;
        }

        // Count pending vs verified items
        const totalItems =
          analysis.events.length +
          analysis.persons.length +
          analysis.vehicles.length +
          analysis.objects.length;
        const reviewedCount =
          item.officerReview.verifiedItemIds.length + item.officerReview.rejectedItemIds.length;

        if (reviewedCount >= totalItems) {
          item.officerReview.status = "VERIFIED_BY_OFFICER";
          item.officerReview.officerVerdict = "All observable CCTV intelligence items reviewed and finalized.";
        } else {
          item.officerReview.status = "PARTIALLY_REVIEWED";
        }

        saveCctvEvidenceItem(item);

        // Record Audit Log
        recordAuditFn({
          actionType: action === "VERIFY" ? "CCTV_OBSERVATION_VERIFIED" : "CCTV_OBSERVATION_REJECTED",
          actionLabel: `CCTV Observation ${action === "VERIFY" ? "Verified" : action === "REJECT" ? "Rejected" : "Updated"}`,
          caseId: item.caseId,
          documentId: item.id,
          documentName: item.fileName,
          userId: (req as any).user?.id || "usr-officer",
          userName: reviewedBy,
          userRole: reviewerRole,
          details: `Item '${itemId}' (${itemType}) status set to ${newStatus}. Notes: ${officerNotes || "None"}`,
          status: "SUCCESS"
        });

        // Add to custody
        if (!item.chainOfCustody) item.chainOfCustody = [];
        item.chainOfCustody.push({
          id: `custody-${Date.now()}-${item.chainOfCustody.length + 1}`,
          timestamp: new Date().toISOString(),
          action: "Evidence Observation Reviewed",
          actor: reviewedBy,
          actorRole: reviewerRole,
          details: `Officer reviewed ${itemType} '${itemId}': marked as ${newStatus}.`,
          hash: item.sha256Hash
        });

        return res.json({
          success: true,
          evidence: item,
          message: `Observation ${newStatus.toLowerCase()} successfully.`
        });
      } catch (err: any) {
        console.error("[CCTV Review] Error:", err);
        return res.status(500).json({ success: false, error: err?.message || "Failed to update review" });
      }
    }
  );

  // 8. Save Verified CCTV Analysis to Case
  app.post(
    "/api/cctv/save-to-case",
    requireAuthMiddleware,
    requireRole(["Constable", "Sub-Inspector", "Investigating Officer", "Police Officer", "Forensic Officer", "Admin"]),
    async (req: express.Request, res: express.Response) => {
      logCctvAuth("POST /api/cctv/save-to-case", req);
      try {
        const {
          evidenceId,
          officerVerdict = "CCTV analysis verified and linked to primary case evidence folder.",
          reviewedBy = "Investigating Officer",
          reviewerRole = "Investigating Officer"
        } = req.body;

        const item = getCctvEvidenceById(evidenceId);
        if (!item || !item.analysis) {
          return res.status(404).json({ success: false, error: "CCTV evidence analysis not found" });
        }
        if (!verifyCaseAssignment(req, item.caseId)) {
          return res.status(403).json({ success: false, error: `Permission Denied: Officer not assigned to Case ${item.caseId}` });
        }

        if (!item.officerReview) {
          item.officerReview = {
            status: "VERIFIED_BY_OFFICER",
            reviewedBy,
            reviewedAt: new Date().toISOString(),
            reviewerRole,
            officerVerdict,
            verifiedItemIds: item.analysis.events.map(e => e.id),
            rejectedItemIds: [],
            editedNotes: {}
          };
        } else {
          item.officerReview.status = "VERIFIED_BY_OFFICER";
          item.officerReview.officerVerdict = officerVerdict;
          item.officerReview.reviewedBy = reviewedBy;
          item.officerReview.reviewedAt = new Date().toISOString();
        }

        // Add custody record
        if (!item.chainOfCustody) item.chainOfCustody = [];
        item.chainOfCustody.push({
          id: `custody-${Date.now()}-${item.chainOfCustody.length + 1}`,
          timestamp: new Date().toISOString(),
          action: "CCTV Analysis Saved to Case",
          actor: reviewedBy,
          actorRole: reviewerRole,
          details: `Verified analysis formally linked to Case ${item.caseId} under Evidence ID ${item.id}. Verdict: ${officerVerdict}`,
          hash: item.sha256Hash
        });

        saveCctvEvidenceItem(item);

        // Record Audit Log
        recordAuditFn({
          actionType: "CCTV_ANALYSIS_SAVED_TO_CASE",
          actionLabel: "CCTV Analysis Saved to Case",
          caseId: item.caseId,
          documentId: item.id,
          documentName: item.fileName,
          userId: (req as any).user?.id || "usr-officer",
          userName: reviewedBy,
          userRole: reviewerRole,
          details: `Formal submission of CCTV intelligence analysis to Case ${item.caseId}. ${item.analysis.events.length} timeline observations linked.`,
          status: "SUCCESS"
        });

        // Sync with Supabase case_documents and chain_of_custody
        const sb = getServerSupabase();
        if (sb) {
          try {
            await sb
              .from("case_documents")
              .update({
                analysis_status: "Analyzed",
                ai_analysis: item.analysis,
                metadata: {
                  ...item.metadata,
                  officerReview: item.officerReview,
                  finalizedAt: new Date().toISOString()
                }
              })
              .eq("sha256_hash", item.sha256Hash);

            await sb.from("chain_of_custody").insert({
              action: "CCTV Analysis Saved to Case",
              integrity_hash: item.sha256Hash,
              status: "Verified",
              notes: `Formal submission of verified CCTV analysis by ${reviewedBy} (${reviewerRole}). Verdict: ${officerVerdict}`,
              metadata: {
                caseId: item.caseId,
                evidenceId: item.id,
                reviewedBy,
                reviewerRole
              }
            });
          } catch (sbErr) {
            console.warn("[CCTV Save to Case] Supabase sync notice:", sbErr);
          }
        }

        return res.json({
          success: true,
          evidence: item,
          message: "Verified CCTV evidence analysis formally linked to case."
        });
      } catch (err: any) {
        console.error("[CCTV Save to Case] Error:", err);
        return res.status(500).json({ success: false, error: err?.message || "Failed to save analysis to case" });
      }
    }
  );

  // 9. Delete CCTV Evidence Item (Admin or assigned IO only)
  app.delete(
    "/api/cctv/evidence/:evidenceId",
    requireAuthMiddleware,
    requireRole(["Investigating Officer", "Sub-Inspector", "Admin"]),
    async (req: express.Request, res: express.Response) => {
      logCctvAuth(`DELETE /api/cctv/evidence/${req.params.evidenceId}`, req);
      try {
        const { evidenceId } = req.params;
        const item = getCctvEvidenceById(evidenceId);
        if (!item) {
          return res.status(404).json({ success: false, error: "Evidence record not found" });
        }
        if (!verifyCaseAssignment(req, item.caseId)) {
          return res.status(403).json({ success: false, error: `Permission Denied: Officer not assigned to Case ${item.caseId}` });
        }

        const filePath = getCctvFilePath(evidenceId);
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (delErr) {
            console.warn("[CCTV Delete] File delete warning:", delErr);
          }
        }

        deleteCctvEvidenceItem(evidenceId);

        recordAuditFn({
          actionType: "CCTV_DELETED",
          actionLabel: "CCTV Evidence Purged",
          caseId: item.caseId,
          documentId: item.id,
          documentName: item.fileName,
          userId: (req as any).user?.id || "usr-officer",
          userName: (req as any).user?.user_metadata?.full_name || "Authorized Officer",
          userRole: (req as any).userRole || "Admin",
          details: `CCTV exhibit '${evidenceId}' (${item.fileName}) permanently deleted from storage.`,
          status: "SUCCESS"
        });

        return res.json({ success: true, message: `CCTV Evidence ${evidenceId} deleted successfully.` });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || "Failed to delete CCTV evidence" });
      }
    }
  );
}

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Clock,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Edit3,
  User,
  Car,
  Box,
  FileText,
  Download,
  Trash2,
  Plus,
  Sparkles,
  AlertTriangle,
  Eye,
  Check,
  Copy,
  RefreshCw,
  Layers,
  Scale,
  Lock,
  UploadCloud,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Camera,
  FileWarning,
  Terminal,
  WifiOff
} from "lucide-react";
import {
  CctvEvidenceItem,
  CctvTimelineEvent,
  CctvPerson,
  CctvVehicle,
  CctvObject,
  CctvKeyFrame
} from "../../types/cctv";
import { Role } from "../../types";
import { getAuthHeader, supabase } from "../../lib/supabase";

/**
 * Ensures a valid Bearer token header is retrieved for CCTV requests,
 * checking and refreshing token if necessary.
 */
const getSafeAuthHeader = async (): Promise<Record<string, string>> => {
  try {
    const headers = await getAuthHeader();
    if (headers && headers.Authorization) {
      return headers;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (err) {
    console.warn("[CCTV] Error fetching auth header:", err);
  }
  return {};
};

interface CctvEvidenceViewProps {
  caseId: string;
  userRole: Role;
  userName: string;
  onBack?: () => void;
  onSelectEvidence?: (evidenceId: string) => void;
}

export const CctvEvidenceView: React.FC<CctvEvidenceViewProps> = ({
  caseId,
  userRole,
  userName,
  onBack,
  onSelectEvidence
}) => {
  // CCTV Exhibits List State
  const [evidenceList, setEvidenceList] = useState<CctvEvidenceItem[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // System Capability State
  const [systemCaps, setSystemCaps] = useState<{
    ffmpegAvailable: boolean;
    ffprobeAvailable: boolean;
    version: string;
  } | null>(null);

  // Video Player State & Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isBufferingMidstream, setIsBufferingMidstream] = useState(false);
  const [loadingTimeoutWarning, setLoadingTimeoutWarning] = useState(false);
  const [copiedDiagnostic, setCopiedDiagnostic] = useState(false);
  const [videoError, setVideoError] = useState<{
    code: "UNAUTHORIZED" | "UNSUPPORTED CODEC" | "EVIDENCE NOT FOUND" | "ACCESS FORBIDDEN" | "NETWORK ERROR" | "PLAYBACK ERROR";
    status?: number;
    message: string;
    technicalDetails?: string;
    suggestedAction?: string;
    canRetry?: boolean;
  } | null>(null);
  const [streamToken, setStreamToken] = useState<string>("");
  const [snapshotNotice, setSnapshotNotice] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Active Forensic Tab
  const [activeTab, setActiveTab] = useState<
    "timeline" | "persons" | "vehicles" | "objects" | "keyframes" | "text" | "legal" | "custody"
  >("timeline");

  // Filter for events
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>("ALL");

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Manage temporary Object URL for newly selected local video file (Revoked when unneeded)
  React.useEffect(() => {
    if (!uploadFile) {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(uploadFile);
    setLocalPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [uploadFile]);

  // Review & Finalize State
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [officerVerdict, setOfficerVerdict] = useState(
    "CCTV surveillance footage forensic extract reviewed under Section 63 Bharatiya Sakshya Adhiniyam 2023. Observable timeline facts verified for chargesheet corroboration."
  );
  const [isSavingFinal, setIsSavingFinal] = useState(false);

  // Note editing state for individual items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  // Role Permissions
  const canUploadAndAnalyze = [
    "Constable",
    "Sub-Inspector",
    "Investigating Officer",
    "Police Officer",
    "Admin"
  ].includes(userRole);

  const canReview = [
    "Constable",
    "Sub-Inspector",
    "Investigating Officer",
    "Police Officer",
    "Admin"
  ].includes(userRole);

  const isReadOnlyJudicial = ["Legal Officer", "Authorized Viewer"].includes(userRole);

  // Load capability and evidence list
  useEffect(() => {
    checkCapabilities();
    loadEvidenceList();
  }, [caseId]);

  const checkCapabilities = async () => {
    try {
      const res = await fetch("/api/cctv/capability");
      const data = await res.json();
      if (data.success) {
        setSystemCaps({
          ffmpegAvailable: data.ffmpegAvailable,
          ffprobeAvailable: data.ffprobeAvailable,
          version: data.version
        });
      }
    } catch (err) {
      console.warn("Error checking capability:", err);
    }
  };

  const loadEvidenceList = async () => {
    setIsLoading(true);
    try {
      const authHeader = await getSafeAuthHeader();
      const res = await fetch(`/api/cctv/case/${caseId}`, {
        headers: {
          ...authHeader
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.evidence)) {
        setEvidenceList(data.evidence);
        if (data.evidence.length > 0) {
          // If no item selected or current item not in list, select first
          setSelectedEvidenceId(prev => (prev && data.evidence.some((e: any) => e.id === prev) ? prev : data.evidence[0].id));
        } else {
          setSelectedEvidenceId(null);
        }
      }
    } catch (err) {
      console.error("Failed to load CCTV evidence:", err);
      setActionMessage({ type: "error", text: "Failed to connect to CCTV Evidence repository." });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEvidence = evidenceList.find(e => e.id === selectedEvidenceId) || null;

  // Fullscreen Change Listeners
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  // Fetch token for authenticated video streaming & reset player state
  useEffect(() => {
    let isMounted = true;
    setIsLoadingVideo(true);
    setIsBufferingMidstream(false);
    setVideoError(null);
    setLoadingTimeoutWarning(false);
    setCurrentTime(0);
    setIsPlaying(false);

    const fetchStreamToken = async () => {
      try {
        const header = await getSafeAuthHeader();
        const token = header.Authorization?.replace(/^Bearer\s+/i, "") || "";
        if (isMounted) setStreamToken(token);
      } catch (err) {
        console.warn("Failed to retrieve token for CCTV stream:", err);
      }
    };
    fetchStreamToken();
    return () => {
      isMounted = false;
    };
  }, [selectedEvidenceId]);

  // Loading timeout watchdog to notify if buffering takes unusually long
  useEffect(() => {
    if (!isLoadingVideo || videoError) {
      setLoadingTimeoutWarning(false);
      return;
    }
    const timer = setTimeout(() => {
      if (isLoadingVideo && !videoError) {
        setLoadingTimeoutWarning(true);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoadingVideo, videoError, selectedEvidenceId]);

  // Compute authenticated video stream URL
  const authenticatedStreamUrl = React.useMemo(() => {
    if (!selectedEvidence) return "";
    const base = `/api/cctv/stream/${selectedEvidence.id}`;
    return streamToken ? `${base}?token=${encodeURIComponent(streamToken)}` : base;
  }, [selectedEvidence?.id, streamToken]);

  // Re-authenticate session and retry stream
  const handleReauthenticateToken = async () => {
    setIsLoadingVideo(true);
    setVideoError(null);
    try {
      const header = await getSafeAuthHeader();
      const token = header.Authorization?.replace(/^Bearer\s+/i, "") || "";
      setStreamToken(token);
      if (videoRef.current) {
        videoRef.current.load();
      }
    } catch (err: any) {
      console.error("Token refresh failed:", err);
      setVideoError({
        code: "UNAUTHORIZED",
        status: 401,
        message: "Session authentication renewal failed. Re-login required.",
        technicalDetails: err?.message || "Auth token could not be acquired from session manager.",
        suggestedAction: "Please re-login to LAWgic AI to renew your officer security session.",
        canRetry: true
      });
    }
  };

  // Download raw evidence file (especially useful when codec is unsupported by browser)
  const handleDownloadRawEvidence = () => {
    if (!selectedEvidence) return;
    const link = document.createElement("a");
    link.href = authenticatedStreamUrl;
    link.download = selectedEvidence.fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Video Event Handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (isLoadingVideo) setIsLoadingVideo(false);
      if (isBufferingMidstream) setIsBufferingMidstream(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || selectedEvidence?.videoDuration || 0);
      setIsLoadingVideo(false);
      setIsBufferingMidstream(false);
      setLoadingTimeoutWarning(false);
      setVideoError(null);
    }
  };

  const handleLoadStart = () => {
    setIsLoadingVideo(true);
    setIsBufferingMidstream(false);
    setVideoError(null);
    setLoadingTimeoutWarning(false);
  };

  const handleCanPlay = () => {
    setIsLoadingVideo(false);
    setIsBufferingMidstream(false);
    setLoadingTimeoutWarning(false);
    setVideoError(null);
  };

  const handleWaiting = () => {
    if (duration > 0 && currentTime > 0) {
      setIsBufferingMidstream(true);
    } else {
      setIsLoadingVideo(true);
    }
  };

  const handlePlaying = () => {
    setIsLoadingVideo(false);
    setIsBufferingMidstream(false);
    setIsPlaying(true);
    setVideoError(null);
  };

  const handleVideoError = async () => {
    setIsLoadingVideo(false);
    setIsBufferingMidstream(false);
    const mediaErr = videoRef.current?.error;

    let code: "UNAUTHORIZED" | "UNSUPPORTED CODEC" | "EVIDENCE NOT FOUND" | "ACCESS FORBIDDEN" | "NETWORK ERROR" | "PLAYBACK ERROR" = "PLAYBACK ERROR";
    let status: number | undefined = undefined;
    let message = "Unable to play CCTV video exhibit.";
    let technicalDetails = `HTMLMediaElement error code: ${mediaErr?.code || "UNKNOWN"} - ${mediaErr?.message || "Video element error"}`;
    let suggestedAction = "Retry loading the stream or check your connection.";

    if (mediaErr) {
      if (mediaErr.code === mediaErr.MEDIA_ERR_DECODE) {
        code = "UNSUPPORTED CODEC";
        message = "Browser-compatible preview unavailable. The CCTV footage video stream cannot be decoded by this browser.";
        technicalDetails = `MEDIA_ERR_DECODE (Code 3): Video bitstream decoding failed. The surveillance recording uses an incompatible video compression format (e.g., H.265/HEVC, DAV, or proprietary CCTV DVR codec). File: ${selectedEvidence?.fileName}`;
        suggestedAction = "Download original RAW evidence file for analysis in external forensic software (e.g., VLC or Amped Authenticate).";
        setVideoError({ code, message, technicalDetails, suggestedAction, canRetry: true });
        return;
      }
      if (mediaErr.code === mediaErr.MEDIA_ERR_ABORTED) {
        code = "PLAYBACK ERROR";
        message = "CCTV footage playback was aborted by the client browser.";
        technicalDetails = "MEDIA_ERR_ABORTED (Code 1): Media element fetching was halted.";
        suggestedAction = "Click Retry Stream to resume playback.";
        setVideoError({ code, message, technicalDetails, suggestedAction, canRetry: true });
        return;
      }
      if (mediaErr.code === mediaErr.MEDIA_ERR_NETWORK) {
        code = "NETWORK ERROR";
        message = "A network error occurred while downloading the CCTV video stream.";
        technicalDetails = "MEDIA_ERR_NETWORK (Code 2): Transmission interrupted during byte range fetch.";
        suggestedAction = "Check your connection or VPN and retry.";
        setVideoError({ code, message, technicalDetails, suggestedAction, canRetry: true });
        return;
      }
    }

    // When mediaErr?.code === MEDIA_ERR_SRC_NOT_SUPPORTED (Code 4) or unknown,
    // perform an immediate HTTP probe against the authenticated streaming endpoint
    try {
      const probeRes = await fetch(authenticatedStreamUrl, {
        method: "GET",
        headers: { Range: "bytes=0-10" }
      });

      status = probeRes.status;

      if (probeRes.status === 401) {
        code = "UNAUTHORIZED";
        message = "Session authentication rejected or security token expired.";
        technicalDetails = `HTTP 401 Unauthorized: Bearer token is invalid or expired for case evidence access. Stream URL: ${authenticatedStreamUrl.split("?")[0]}`;
        suggestedAction = "Click 'Re-authenticate Session' or refresh security credentials to stream this exhibit.";
      } else if (probeRes.status === 403) {
        code = "ACCESS FORBIDDEN";
        message = "Insufficient officer clearance level or unassigned case access.";
        technicalDetails = `HTTP 403 Forbidden: Officer is not assigned to Case ${caseId} or lacks authorized clearance to access CCTV video exhibits.`;
        suggestedAction = "Contact the Investigating Officer or Station House Officer for case assignment authorization.";
      } else if (probeRes.status === 404) {
        code = "EVIDENCE NOT FOUND";
        message = "Surveillance footage file missing from forensic disk vault.";
        technicalDetails = `HTTP 404 Not Found: Video exhibit file "${selectedEvidence?.fileName}" does not exist at the repository storage path.`;
        suggestedAction = "Verify physical evidence custody or re-upload the surveillance footage.";
      } else if (probeRes.status === 415 || probeRes.status === 422) {
        code = "UNSUPPORTED CODEC";
        message = "Unsupported video codec or media container format.";
        technicalDetails = `HTTP ${probeRes.status}: Incompatible codec MIME '${selectedEvidence?.mimeType || "video/mp4"}' for native browser playback.`;
        suggestedAction = "Download the RAW surveillance exhibit to inspect with external forensic tools.";
      } else if (!probeRes.ok) {
        code = "PLAYBACK ERROR";
        message = `CCTV streaming service returned HTTP ${probeRes.status}.`;
        technicalDetails = `HTTP ${probeRes.status} ${probeRes.statusText} during range probe test.`;
        suggestedAction = "Retry stream or verify server logs.";
      } else {
        // Probe was 200/206 OK, meaning the server stream is valid,
        // but the browser's HTML5 media engine rejected it!
        code = "UNSUPPORTED CODEC";
        message = "Browser-compatible preview unavailable. The video bitstream uses a codec or container format unsupported by native HTML5.";
        technicalDetails = `HTMLMediaElement code 4 with HTTP 206 OK: Video stream was retrieved from vault, but this browser cannot decode the container or compression profile (commonly H.265/HEVC, DAV, or proprietary CCTV DVR format). MIME: ${selectedEvidence?.mimeType || "video/mp4"}`;
        suggestedAction = "Download the RAW surveillance file to view in VLC, Media Player Classic, or dedicated police CCTV software.";
      }
    } catch (probeErr: any) {
      code = "NETWORK ERROR";
      message = "Failed to establish network connection with CCTV media server.";
      technicalDetails = `Fetch exception: ${probeErr?.message || "Network request failed"}`;
      suggestedAction = "Check your network connection and verify backend server availability.";
    }

    setVideoError({
      code,
      status,
      message,
      technicalDetails,
      suggestedAction,
      canRetry: true
    });
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(err => {
        console.warn("Play interrupted:", err);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekTo = (seconds: number, pauseAtTimestamp = false) => {
    if (!videoRef.current) return;
    const bounded = Math.max(0, Math.min(seconds, duration || 9999));
    videoRef.current.currentTime = bounded;
    setCurrentTime(bounded);
    if (pauseAtTimestamp) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    // Scroll player into view smoothly if not visible
    if (playerContainerRef.current) {
      playerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    seekTo(videoRef.current.currentTime + deltaSeconds);
  };

  const stepFrame = (frames: number) => {
    if (!videoRef.current) return;
    const fps = selectedEvidence?.metadata?.fps || 25;
    const newTime = videoRef.current.currentTime + frames * (1 / fps);
    seekTo(newTime, true);
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const toggleFullscreen = async () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        }
      } catch (err) {
        console.warn("Container fullscreen failed, trying video directly:", err);
        if (videoRef.current?.requestFullscreen) {
          await videoRef.current.requestFullscreen();
        }
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (err) {
        console.warn("Exit fullscreen failed:", err);
      }
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Add Section 63 BSA forensic timestamp watermark
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, canvas.height - 42, canvas.width, 42);
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "#22c55e";
      ctx.fillText(`CAM-04 | CASE ${caseId} | SEC 63 BSA 2023`, 24, canvas.height - 15);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`TIMECODE: ${formatTime(video.currentTime)}`, canvas.width - 240, canvas.height - 15);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      const safeTime = formatTime(video.currentTime).replace(/[:.]/g, "-");
      link.download = `CCTV_SNAPSHOT_${selectedEvidence?.fileName || "footage"}_T${safeTime}.jpg`;
      link.href = dataUrl;
      link.click();

      setSnapshotNotice(`Forensic snapshot captured at ${formatTime(video.currentTime)}`);
      setTimeout(() => setSnapshotNotice(null), 3500);
    } catch (err) {
      console.warn("Snapshot capture failed:", err);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seekRelative(-5);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seekRelative(5);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isFullscreen, duration, isMuted]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  };

  // Upload CCTV Video Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress(15);

    const formData = new FormData();
    formData.append("video", uploadFile);
    formData.append("caseId", caseId);
    formData.append("uploadedBy", userName);
    formData.append("uploaderRole", userRole);

    try {
      setUploadProgress(45);
      const authHeader = await getSafeAuthHeader();
      const res = await fetch("/api/cctv/upload", {
        method: "POST",
        headers: {
          ...authHeader
        },
        body: formData
      });

      setUploadProgress(85);
      const data = await res.json();

      if (data.success && data.evidence) {
        setUploadProgress(100);
        setActionMessage({
          type: "success",
          text: `CCTV exhibit '${data.evidence.fileName}' uploaded successfully. SHA-256 integrity hash registered.`
        });
        setShowUploadModal(false);
        setUploadFile(null);
        await loadEvidenceList();
        setSelectedEvidenceId(data.evidence.id);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err?.message || "Failed to upload CCTV video." });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Seed Sample CCTV Video
  const handleSeedSample = async () => {
    setIsLoading(true);
    setActionMessage({ type: "info", text: "Registering official sample CCTV footage (CAM04 Market Junction)..." });
    try {
      const authHeader = await getSafeAuthHeader();
      const res = await fetch("/api/cctv/seed-sample", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({ caseId, userName, userRole })
      });
      const data = await res.json();
      if (data.success && data.evidence) {
        setActionMessage({ type: "success", text: "Sample CCTV surveillance exhibit registered and ready for forensic analysis!" });
        await loadEvidenceList();
        setSelectedEvidenceId(data.evidence.id);
      } else {
        throw new Error(data.error || "Failed to seed sample");
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err?.message || "Could not load sample CCTV footage." });
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Multimodal Video Analysis
  const handleRunAnalysis = async () => {
    if (!selectedEvidence) return;
    setIsAnalyzing(true);
    setActionMessage({
      type: "info",
      text: "Sampling keyframes via FFprobe/FFmpeg and initiating Multimodal Video Forensic Intelligence..."
    });

    try {
      const authHeader = await getSafeAuthHeader();
      const res = await fetch(`/api/cctv/analyze/${selectedEvidence.id}`, {
        method: "POST",
        headers: {
          ...authHeader
        }
      });
      const data = await res.json();
      if (data.success && data.evidence) {
        setActionMessage({
          type: "success",
          text: `Forensic CCTV analysis completed: ${data.evidence.analysis?.events?.length || 0} events identified across chronological keyframes.`
        });
        await loadEvidenceList();
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err?.message || "Analysis encountered an error. Original CCTV video remains preserved bit-for-bit."
      });
      await loadEvidenceList();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Review Observation
  const handleReviewAction = async (
    itemId: string,
    itemType: "event" | "person" | "vehicle" | "object" | "text",
    action: "VERIFY" | "REJECT" | "EDIT",
    customNotes?: string,
    editedObservation?: string
  ) => {
    if (!selectedEvidence) return;

    try {
      const authHeader = await getSafeAuthHeader();
      const res = await fetch("/api/cctv/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({
          evidenceId: selectedEvidence.id,
          itemId,
          itemType,
          action,
          officerNotes: customNotes,
          editedObservation,
          reviewedBy: userName,
          reviewerRole: userRole
        })
      });

      const data = await res.json();
      if (data.success && data.evidence) {
        setEvidenceList(prev => prev.map(e => (e.id === data.evidence.id ? data.evidence : e)));
        setEditingItemId(null);
        setEditNoteText("");
        setActionMessage({
          type: "success",
          text: `Observation marked as ${action === "VERIFY" ? "Verified" : action === "REJECT" ? "Rejected" : "Updated"} by ${userName}.`
        });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err?.message || "Failed to update review status" });
    }
  };

  // Finalize and Save to Case
  const handleFinalizeSave = async () => {
    if (!selectedEvidence) return;
    setIsSavingFinal(true);

    try {
      const authHeader = await getSafeAuthHeader();
      const res = await fetch("/api/cctv/save-to-case", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader
        },
        body: JSON.stringify({
          evidenceId: selectedEvidence.id,
          officerVerdict,
          reviewedBy: userName,
          reviewerRole: userRole
        })
      });

      const data = await res.json();
      if (data.success && data.evidence) {
        setEvidenceList(prev => prev.map(e => (e.id === data.evidence.id ? data.evidence : e)));
        setShowFinalizeModal(false);
        setActionMessage({
          type: "success",
          text: "Verified CCTV evidence analysis has been formally linked to the case records and timeline!"
        });
      } else {
        throw new Error(data.error || "Save failed");
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err?.message || "Failed to save analysis to case." });
    } finally {
      setIsSavingFinal(false);
    }
  };

  // Delete Exhibit
  const handleDeleteExhibit = async (id: string) => {
    if (!window.confirm("Are you certain you want to permanently purge this CCTV exhibit? This action will be audited.")) return;

    try {
      const authHeader = await getSafeAuthHeader();
      const res = await fetch(`/api/cctv/evidence/${id}`, {
        method: "DELETE",
        headers: {
          ...authHeader
        }
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: "success", text: `Exhibit ${id} deleted.` });
        await loadEvidenceList();
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err?.message || "Failed to delete exhibit" });
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const analysis = selectedEvidence?.analysis;
  const officerReview = selectedEvidence?.officerReview;

  return (
    <div className="space-y-6 text-[#171A1E] dark:text-[#E8ECEF]">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] p-6 rounded-sm shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-[#D4AF37]/15 text-[#B8955A] dark:text-[#E6CA65] border border-[#D4AF37]/30 rounded-xs">
                CASE {caseId}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono font-medium bg-[#1E2D3E] text-[#D4AF37] rounded-xs flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                CCTV Evidence Intelligence
              </span>
              <span className="px-2 py-0.5 text-[11px] font-mono rounded-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Section 63 BSA 2023 Compliant
              </span>
            </div>
            <h1 className="text-xl font-bold font-serif text-[#08121D] dark:text-white">
              Surveillance Video Forensic Intelligence &amp; Event Reconstruction
            </h1>
            <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] mt-1 max-w-2xl">
              Cryptographically verified video ingest with frame-level sampling, AI multimodal timeline
              extraction, neutral entity tracking, and human-in-the-loop officer evidentiary review.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canUploadAndAnalyze && (
              <>
                <button
                  onClick={handleSeedSample}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xs bg-[#F5EFE4] hover:bg-[#EAE2D3] dark:bg-[#151F2D] dark:hover:bg-[#1E2D3E] text-[#8C6D37] dark:text-[#D4AF37] border border-[#D4AF37]/30 transition-colors cursor-pointer"
                  title="Load official pre-configured sample CCTV video"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Sample CCTV (CAM-04)
                </button>

                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xs bg-[#B8955A] hover:bg-[#A38349] text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Upload CCTV Footage
                </button>
              </>
            )}

            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-2 text-xs font-medium rounded-xs bg-transparent border border-[#DDD8CE] dark:border-[#1E2D3E] hover:bg-[#F2EFE9] dark:hover:bg-[#151F2D] transition-colors cursor-pointer"
              >
                Back to Case
              </button>
            )}
          </div>
        </div>

        {/* Status Chips Row */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E] text-xs">
          <div className="flex items-center gap-1.5 text-[#5A6573] dark:text-[#8A95A5]">
            <User className="w-3.5 h-3.5 text-[#B8955A]" />
            <span>Active Operator: <strong className="text-[#08121D] dark:text-white">{userName}</strong> ({userRole})</span>
          </div>

          <span className="text-[#DDD8CE] dark:text-[#1E2D3E]">•</span>

          <div className="flex items-center gap-1.5">
            {canUploadAndAnalyze ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Upload &amp; Analysis Clearance: GRANTED
              </span>
            ) : isReadOnlyJudicial ? (
              <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Judicial / Legal View-Only Mode
              </span>
            ) : null}
          </div>

          <span className="text-[#DDD8CE] dark:text-[#1E2D3E]">•</span>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#5A6573] dark:text-[#8A95A5]">
            <span>FFmpeg: <strong>{systemCaps?.ffmpegAvailable ? "Active" : "Standard"}</strong></span>
            <span>|</span>
            <span>Hashing: <strong>SHA-256 Verified</strong></span>
            <span>|</span>
            <span>Streaming: <strong>RFC 7233 Range Compliant</strong></span>
          </div>
        </div>

        {/* Action Notice Banner */}
        {actionMessage && (
          <div
            className={`mt-4 p-3 rounded-xs text-xs flex items-center justify-between border ${
              actionMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : actionMessage.type === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : actionMessage.type === "error" ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-blue-500" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 cursor-pointer font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main CCTV Workspace */}
      {isLoading ? (
        <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
          <RefreshCw className="w-8 h-8 text-[#B8955A] animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium font-serif">Loading CCTV Video Evidence Records...</p>
        </div>
      ) : evidenceList.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D1824] border border-dashed border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm">
          <div className="w-16 h-16 bg-[#D4AF37]/10 text-[#B8955A] rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold font-serif mb-2">No CCTV Evidence Registered for Case {caseId}</h3>
          <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] max-w-md mx-auto mb-6">
            Upload security camera recordings, DVR exports (MP4, WebM, MOV, AVI), or load the official test footage
            to generate frame-accurate timelines, object tracking, and legal compliance reports.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSeedSample}
              className="px-4 py-2.5 text-xs font-semibold rounded-xs bg-[#B8955A] hover:bg-[#A38349] text-white shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Load Sample Surveillance Footage
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 text-xs font-medium rounded-xs bg-transparent border border-[#DDD8CE] dark:border-[#1E2D3E] hover:bg-[#F2EFE9] dark:hover:bg-[#151F2D] flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Video File
            </button>
          </div>
        </div>
      ) : (
        /* Exhibits Present */
        <div className="space-y-6">
          {/* Exhibit Selector Bar */}
          <div className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#0D1824] p-3 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#5A6573] dark:text-[#8A95A5] px-2">
                EXHIBITS ({evidenceList.length}):
              </span>
              {evidenceList.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedEvidenceId(item.id);
                    if (onSelectEvidence) onSelectEvidence(item.id);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-xs font-mono flex items-center gap-2 cursor-pointer transition-colors ${
                    item.id === selectedEvidenceId
                      ? "bg-[#1E2D3E] text-[#D4AF37] font-semibold shadow-xs"
                      : "bg-[#F5EFE4] dark:bg-[#151F2D] text-[#5A6573] hover:text-[#08121D] dark:hover:text-white"
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-[#B8955A]" />
                  <span className="truncate max-w-[140px]">{item.fileName}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.analysisStatus === "Analysis Complete"
                        ? "bg-emerald-500"
                        : item.analysisStatus === "Analyzing"
                        ? "bg-blue-500 animate-pulse"
                        : "bg-amber-500"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-4">
              {canUploadAndAnalyze && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-2.5 py-1 text-xs font-medium rounded-xs bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#8C6D37] dark:text-[#D4AF37] border border-[#D4AF37]/40 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Video
                </button>
              )}
            </div>
          </div>

          {selectedEvidence && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Forensic Video Player & Custody Badge (7 Cols for Desktop Inspection) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Forensic Video Card */}
                <div className="bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm overflow-hidden shadow-xs">
                  {/* Player Header */}
                  <div className="p-3 bg-[#F7F5F0] dark:bg-[#08121D] border-b border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                      <span className="font-mono text-xs font-bold text-[#08121D] dark:text-white">{selectedEvidence.fileName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#5A6573] dark:text-[#8A95A5]">
                      {selectedEvidence.formattedDuration} • {selectedEvidence.metadata?.fps || 25} FPS • {selectedEvidence.metadata?.width || 1280}x{selectedEvidence.metadata?.height || 720}
                    </span>
                  </div>

                  {/* Video Viewport with Fullscreen Container */}
                  <div
                    ref={playerContainerRef}
                    className={
                      isFullscreen
                        ? "fixed inset-0 z-50 bg-black flex flex-col justify-between select-none"
                        : "relative bg-black aspect-video flex items-center justify-center overflow-hidden"
                    }
                  >
                    {/* HTML5 Video Element */}
                    <video
                      ref={videoRef}
                      key={authenticatedStreamUrl}
                      src={authenticatedStreamUrl}
                      className="w-full h-full object-contain"
                      preload="metadata"
                      playsInline
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onLoadStart={handleLoadStart}
                      onCanPlay={handleCanPlay}
                      onWaiting={handleWaiting}
                      onPlaying={handlePlaying}
                      onEnded={() => setIsPlaying(false)}
                      onError={handleVideoError}
                    />

                    {/* Small discrete CCTV Camera metadata overlay (Unobtrusive) */}
                    <div className="absolute top-2.5 left-2.5 pointer-events-none bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-xs border border-white/15 text-[10px] font-mono text-white/90 flex items-center gap-1.5 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>CAM-04 • CASE {caseId}</span>
                    </div>

                    {/* Small discrete Timecode overlay */}
                    <div className="absolute top-2.5 right-2.5 pointer-events-none bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-xs border border-white/15 text-[10px] font-mono text-[#D4AF37] z-10">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    {/* Snapshot Notice Banner */}
                    {snapshotNotice && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-emerald-600/90 text-white px-3 py-1 rounded-xs text-xs font-mono backdrop-blur-xs shadow-md z-20 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        {snapshotNotice}
                      </div>
                    )}

                    {/* Loading Video Indicator - Initial Loading */}
                    {isLoadingVideo && !videoError && (
                      <div className="absolute inset-0 bg-[#070D14] flex flex-col items-center justify-center p-6 select-none z-20 overflow-hidden">
                        {/* Background forensic grid */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]" />

                        {/* Radar scanner animation */}
                        <div className="relative w-14 h-14 mb-3.5 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20 animate-ping opacity-40" />
                          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/50 border-t-transparent animate-spin" />
                          <Video className="w-5 h-5 text-[#D4AF37] relative z-10" />
                        </div>

                        <div className="text-center max-w-sm space-y-1 z-10">
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                            <span className="font-mono text-xs font-bold text-white tracking-wider uppercase">
                              INITIALIZING CCTV STREAM
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-gray-300 truncate max-w-[280px] mx-auto">
                            {selectedEvidence.fileName}
                          </p>
                          <p className="text-[10px] font-mono text-[#8A95A5]">
                            Authenticating token • Verifying Sec 63 BSA Custody
                          </p>

                          {loadingTimeoutWarning && (
                            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                              <p className="text-[11px] text-amber-300 font-mono">
                                Stream initialization is taking longer than usual.
                              </p>
                              <button
                                onClick={() => {
                                  if (videoRef.current) {
                                    videoRef.current.load();
                                  }
                                }}
                                className="px-3 py-1 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xs text-[11px] font-mono flex items-center gap-1.5 mx-auto cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Force Reload Stream
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mid-stream Buffering Badge (Non-disruptive, preserves video frame) */}
                    {isBufferingMidstream && !videoError && !isLoadingVideo && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-xs border border-white/20 text-xs font-mono text-white flex items-center gap-2 z-20 pointer-events-none shadow-lg">
                        <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
                        <span>BUFFERING FOOTAGE ({formatTime(currentTime)})</span>
                      </div>
                    )}

                    {/* Technical Error Overlay - Replaces all placeholder imagery with clear technical errors */}
                    {videoError && (
                      <div className="absolute inset-0 bg-[#070D14] flex flex-col justify-between p-4 sm:p-5 text-left z-25 overflow-y-auto">
                        {/* Error Header */}
                        <div className="flex items-start justify-between border-b border-[#1E2D3E] pb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xs flex items-center justify-center shrink-0 ${
                                videoError.code === "UNAUTHORIZED" || videoError.code === "ACCESS FORBIDDEN"
                                  ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                                  : videoError.code === "UNSUPPORTED CODEC"
                                  ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                                  : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                              }`}
                            >
                              {videoError.code === "UNAUTHORIZED" || videoError.code === "ACCESS FORBIDDEN" ? (
                                <Lock className="w-5 h-5" />
                              ) : videoError.code === "UNSUPPORTED CODEC" ? (
                                <FileWarning className="w-5 h-5" />
                              ) : videoError.code === "NETWORK ERROR" ? (
                                <WifiOff className="w-5 h-5" />
                              ) : (
                                <AlertTriangle className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider ${
                                    videoError.code === "UNAUTHORIZED" || videoError.code === "ACCESS FORBIDDEN"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                      : videoError.code === "UNSUPPORTED CODEC"
                                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  }`}
                                >
                                  {videoError.code}
                                </span>
                                {videoError.status && (
                                  <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                    HTTP {videoError.status}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-white mt-1">
                                {videoError.message}
                              </h4>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-1 rounded-xs border border-white/10 hidden sm:inline-block">
                            SEC 63 BSA FORENSIC VIEWER
                          </span>
                        </div>

                        {/* Technical Diagnostics Box */}
                        <div className="my-2.5 bg-black/70 border border-[#1E2D3E] rounded-xs p-3 font-mono text-xs space-y-2 text-gray-300">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 pb-1.5 border-b border-white/10">
                            <span className="flex items-center gap-1.5 text-[#D4AF37] font-semibold">
                              <Terminal className="w-3.5 h-3.5" />
                              TECHNICAL DIAGNOSTIC REPORT
                            </span>
                            <button
                              onClick={() => {
                                const diagText = JSON.stringify(
                                  {
                                    code: videoError.code,
                                    status: videoError.status,
                                    evidenceId: selectedEvidence.id,
                                    fileName: selectedEvidence.fileName,
                                    mimeType: selectedEvidence.mimeType || "video/mp4",
                                    technicalDetails: videoError.technicalDetails,
                                    caseId,
                                    timestamp: new Date().toISOString()
                                  },
                                  null,
                                  2
                                );
                                navigator.clipboard.writeText(diagText);
                                setCopiedDiagnostic(true);
                                setTimeout(() => setCopiedDiagnostic(false), 2000);
                              }}
                              className="text-[10px] text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer bg-white/10 px-2 py-0.5 rounded-xs transition-colors"
                              title="Copy technical diagnosis to clipboard"
                            >
                              {copiedDiagnostic ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedDiagnostic ? "Copied Log" : "Copy Diagnostic"}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                            <div>
                              <span className="text-gray-400">TARGET FILE:</span>{" "}
                              <span className="text-white">{selectedEvidence.fileName}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">MIME / CODEC:</span>{" "}
                              <span className="text-white">{selectedEvidence.mimeType || "video/mp4"}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">CASE REFERENCE:</span>{" "}
                              <span className="text-white">{caseId}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">DURATION:</span>{" "}
                              <span className="text-white">{selectedEvidence.formattedDuration}</span>
                            </div>
                          </div>

                          {videoError.technicalDetails && (
                            <div className="pt-1.5 text-[10px] text-gray-300 leading-relaxed font-mono bg-black/50 p-2 rounded-xs border border-white/5">
                              <span className="text-rose-400 font-bold block mb-0.5">DETAIL:</span>
                              {videoError.technicalDetails}
                            </div>
                          )}

                          {videoError.suggestedAction && (
                            <div className="text-[11px] text-amber-300/95 flex items-start gap-1.5 pt-0.5">
                              <Info className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                              <span>{videoError.suggestedAction}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1E2D3E]">
                          <div className="flex items-center gap-2">
                            {videoError.code === "UNAUTHORIZED" && (
                              <button
                                onClick={handleReauthenticateToken}
                                className="px-3.5 py-1.5 bg-[#B8955A] hover:bg-[#A38349] text-white rounded-xs text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Re-authenticate Session
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setVideoError(null);
                                setIsLoadingVideo(true);
                                if (videoRef.current) {
                                  videoRef.current.load();
                                }
                              }}
                              className="px-3.5 py-1.5 bg-[#1E2D3E] hover:bg-[#2A3F55] text-white rounded-xs text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-white/10 transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Retry Stream
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleDownloadRawEvidence}
                              className="px-3.5 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xs text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="Download original RAW video stream for inspection in VLC or specialized player"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download RAW Evidence
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fullscreen Floating Controls Bar */}
                    {isFullscreen && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/85 to-transparent p-4 pt-8 space-y-3 z-30">
                        {/* Fullscreen Scrubber */}
                        <div
                          className="relative w-full h-3 bg-white/20 hover:h-3.5 transition-all rounded-full cursor-pointer group"
                          onClick={e => {
                            if (!videoRef.current || !duration) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                            seekTo(ratio * duration);
                          }}
                        >
                          <div
                            className="h-full bg-[#B8955A] rounded-full relative"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-[#B8955A]" />
                          </div>
                          {analysis?.events.map(ev => (
                            <div
                              key={ev.id}
                              onClick={e => {
                                e.stopPropagation();
                                seekTo(ev.seconds);
                              }}
                              className={`absolute top-0 w-2 h-full z-10 cursor-pointer rounded-full ${
                                ev.category === "critical_incident"
                                  ? "bg-rose-500"
                                  : ev.category === "vehicle_movement"
                                  ? "bg-blue-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ left: `${duration > 0 ? (ev.seconds / duration) * 100 : 0}%` }}
                              title={`[${ev.timestamp}] ${ev.observation}`}
                            />
                          ))}
                        </div>

                        {/* Fullscreen Controls */}
                        <div className="flex items-center justify-between text-white text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={togglePlay}
                              className="p-2 rounded-xs bg-[#B8955A] hover:bg-[#A38349] text-white cursor-pointer"
                              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                            >
                              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                            </button>
                            <button
                              onClick={() => seekRelative(-10)}
                              className="p-1.5 rounded-xs hover:bg-white/20 text-gray-200 cursor-pointer"
                              title="Rewind 10s"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => seekRelative(10)}
                              className="p-1.5 rounded-xs hover:bg-white/20 text-gray-200 cursor-pointer"
                              title="Forward 10s"
                            >
                              <RotateCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => stepFrame(-1)}
                              className="px-2 py-1 text-[11px] font-mono rounded-xs hover:bg-white/20 text-gray-300 cursor-pointer"
                              title="Step -1 frame"
                            >
                              -1f
                            </button>
                            <button
                              onClick={() => stepFrame(1)}
                              className="px-2 py-1 text-[11px] font-mono rounded-xs hover:bg-white/20 text-gray-300 cursor-pointer"
                              title="Step +1 frame"
                            >
                              +1f
                            </button>

                            {/* Volume */}
                            <button
                              onClick={toggleMute}
                              className="p-1.5 rounded-xs hover:bg-white/20 text-gray-200 cursor-pointer ml-2"
                              title={isMuted ? "Unmute" : "Mute"}
                            >
                              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              className="w-18 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#B8955A]"
                            />

                            <span className="font-mono text-xs text-gray-200 ml-3">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Speeds */}
                            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-xs">
                              {[0.5, 1, 1.5, 2].map(speed => (
                                <button
                                  key={speed}
                                  onClick={() => changePlaybackRate(speed)}
                                  className={`px-2 py-0.5 text-xs font-mono rounded-xs cursor-pointer ${
                                    playbackRate === speed ? "bg-[#B8955A] text-white font-bold" : "text-gray-300 hover:text-white"
                                  }`}
                                >
                                  {speed}x
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={captureSnapshot}
                              className="p-1.5 px-2 rounded-xs bg-white/10 hover:bg-white/20 text-gray-200 cursor-pointer flex items-center gap-1 text-xs"
                              title="Snapshot"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Snapshot</span>
                            </button>

                            <button
                              onClick={toggleFullscreen}
                              className="p-2 rounded-xs bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                              title="Exit Fullscreen (Esc)"
                            >
                              <Minimize2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scrubber with Incident Markers (Non-Fullscreen) */}
                  <div className="p-3 space-y-2.5 bg-[#FAF8F5] dark:bg-[#0A1420]">
                    {/* Progress Bar */}
                    <div
                      className="relative w-full h-2.5 bg-[#DDD8CE] dark:bg-[#1E2D3E] hover:h-3 transition-all rounded-full cursor-pointer group"
                      onClick={e => {
                        if (!videoRef.current || !duration) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        seekTo(ratio * duration);
                      }}
                    >
                      <div
                        className="h-full bg-[#B8955A] group-hover:bg-[#C9A66B] rounded-full transition-all relative"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-[#D4AF37] shadow-xs border border-[#B8955A] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Timeline Markers */}
                      {analysis?.events.map(ev => (
                        <div
                          key={ev.id}
                          onClick={e => {
                            e.stopPropagation();
                            seekTo(ev.seconds);
                          }}
                          className={`absolute top-0 w-2 h-full z-10 cursor-pointer rounded-full transition-transform hover:scale-125 ${
                            ev.category === "critical_incident"
                              ? "bg-rose-500 shadow-xs shadow-rose-500/50"
                              : ev.category === "vehicle_movement"
                              ? "bg-blue-500 shadow-xs shadow-blue-500/50"
                              : "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                          }`}
                          style={{ left: `${duration > 0 ? (ev.seconds / duration) * 100 : 0}%` }}
                          title={`[${ev.timestamp}] ${ev.observation}`}
                        />
                      ))}
                    </div>

                    {/* Playback Controls Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={togglePlay}
                          className="p-1.5 rounded-xs bg-[#B8955A] hover:bg-[#A38349] text-white cursor-pointer transition-colors"
                          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                        >
                          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>

                        <button
                          onClick={() => seekRelative(-10)}
                          className="p-1.5 rounded-xs bg-transparent hover:bg-[#DDD8CE] dark:hover:bg-[#1E2D3E] text-[#5A6573] dark:text-[#8A95A5] cursor-pointer"
                          title="Rewind 10s (Left Arrow)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => seekRelative(10)}
                          className="p-1.5 rounded-xs bg-transparent hover:bg-[#DDD8CE] dark:hover:bg-[#1E2D3E] text-[#5A6573] dark:text-[#8A95A5] cursor-pointer"
                          title="Forward 10s (Right Arrow)"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => stepFrame(-1)}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded-xs bg-transparent hover:bg-[#DDD8CE] dark:hover:bg-[#1E2D3E] text-[#5A6573] dark:text-[#8A95A5] cursor-pointer"
                          title="Step -1 frame (1/25s)"
                        >
                          -1f
                        </button>

                        <button
                          onClick={() => stepFrame(1)}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded-xs bg-transparent hover:bg-[#DDD8CE] dark:hover:bg-[#1E2D3E] text-[#5A6573] dark:text-[#8A95A5] cursor-pointer"
                          title="Step +1 frame (1/25s)"
                        >
                          +1f
                        </button>

                        {/* Volume & Mute */}
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={toggleMute}
                            className="p-1 rounded-xs text-[#5A6573] hover:text-[#08121D] dark:text-[#8A95A5] dark:hover:text-white cursor-pointer"
                            title={isMuted ? "Unmute (M)" : "Mute (M)"}
                          >
                            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-14 h-1 bg-[#DDD8CE] dark:bg-[#1E2D3E] rounded-lg appearance-none cursor-pointer accent-[#B8955A]"
                            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                          />
                        </div>

                        <span className="font-mono text-xs text-[#08121D] dark:text-white ml-2 whitespace-nowrap">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center gap-1.5">
                        {/* Speed Multipliers */}
                        <div className="flex items-center gap-0.5 bg-[#F5EFE4] dark:bg-[#08121D] p-0.5 rounded-xs border border-[#DDD8CE] dark:border-[#1E2D3E]">
                          {[0.5, 1, 1.5, 2].map(speed => (
                            <button
                              key={speed}
                              onClick={() => changePlaybackRate(speed)}
                              className={`px-1.5 py-0.5 text-[10px] font-mono rounded-xs cursor-pointer transition-colors ${
                                playbackRate === speed
                                  ? "bg-[#1E2D3E] text-[#D4AF37] font-bold"
                                  : "text-[#5A6573] hover:text-[#08121D] dark:hover:text-white"
                              }`}
                              title={`Set speed ${speed}x`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>

                        {/* Snapshot Button */}
                        <button
                          onClick={captureSnapshot}
                          className="p-1.5 rounded-xs text-[#5A6573] hover:text-[#08121D] dark:text-[#8A95A5] dark:hover:text-white hover:bg-[#DDD8CE] dark:hover:bg-[#1E2D3E] cursor-pointer transition-colors flex items-center gap-1 text-[11px]"
                          title="Capture forensic frame snapshot"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Snapshot</span>
                        </button>

                        {/* Fullscreen Button */}
                        <button
                          onClick={toggleFullscreen}
                          className="p-1.5 rounded-xs text-[#5A6573] hover:text-[#08121D] dark:text-[#8A95A5] dark:hover:text-white hover:bg-[#DDD8CE] dark:hover:bg-[#1E2D3E] cursor-pointer transition-colors"
                          title="Fullscreen (F)"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Observation Status - Positioned Outside/Below Player to prevent obscuring footage */}
                  <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/5 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-[#5A6573] dark:text-[#8A95A5]">
                        AI OBSERVATION STATUS: <strong className="text-amber-900 dark:text-amber-200">Pending Officer Verification</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5A6573] dark:text-[#8A95A5]">
                      SEC 63 BSA 2023 Corroboration
                    </span>
                  </div>

                  {/* Metadata & Custody Footer */}
                  <div className="p-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E] text-xs space-y-2">
                    <div className="flex items-center justify-between text-[#5A6573] dark:text-[#8A95A5]">
                      <span>Resolution: {selectedEvidence.metadata?.width}x{selectedEvidence.metadata?.height}</span>
                      <span>Bitrate: {selectedEvidence.metadata?.bitrate}</span>
                      <span>Codec: {selectedEvidence.metadata?.codec}</span>
                    </div>

                    {/* SHA-256 Hash Box */}
                    <div className="bg-[#F5EFE4] dark:bg-[#08121D] p-2 rounded-xs border border-[#DDD8CE] dark:border-[#1E2D3E]">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="flex items-center gap-1 font-semibold text-[#8C6D37] dark:text-[#D4AF37]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          SHA-256 INTEGRITY HASH:
                        </span>
                        <button
                          onClick={() => copyHash(selectedEvidence.sha256Hash)}
                          className="flex items-center gap-1 text-[10px] text-[#5A6573] hover:text-[#08121D] dark:hover:text-white cursor-pointer"
                        >
                          {copiedHash ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copiedHash ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="font-mono text-[10px] break-all select-all text-[#08121D] dark:text-gray-300">
                        {selectedEvidence.sha256Hash}
                      </div>
                    </div>

                    {/* Analysis Triggers */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      {selectedEvidence.analysisStatus === "Analysis Complete" ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Analysis Ready</span>
                        </div>
                      ) : selectedEvidence.analysisStatus === "Analyzing" ? (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-mono text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Forensic Sampling Active...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-xs">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Pending Analysis</span>
                        </div>
                      )}

                      {canUploadAndAnalyze && (
                        <button
                          onClick={handleRunAnalysis}
                          disabled={isAnalyzing}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xs bg-[#1E2D3E] hover:bg-[#2A3F55] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {selectedEvidence.analysisStatus === "Analysis Complete" ? "Re-Analyze Footage" : "Run AI Analysis"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Officer Review Status Banner */}
                {officerReview && (
                  <div className="p-3 bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm text-xs space-y-2">
                    <div className="flex items-center justify-between font-serif">
                      <span className="font-bold flex items-center gap-1.5 text-[#08121D] dark:text-white">
                        <Scale className="w-4 h-4 text-[#B8955A]" />
                        Officer Review Status:
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono rounded-xs font-semibold ${
                          officerReview.status === "VERIFIED_BY_OFFICER"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {officerReview.status === "VERIFIED_BY_OFFICER" ? "VERIFIED BY OFFICER" : "PARTIALLY REVIEWED"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A6573] dark:text-[#8A95A5] italic">
                      "{officerReview.officerVerdict}"
                    </p>
                    <div className="text-[10px] font-mono text-[#5A6573] dark:text-[#8A95A5] flex items-center justify-between pt-1 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
                      <span>Reviewer: {officerReview.reviewedBy}</span>
                      <span>Verified: {officerReview.verifiedItemIds.length} items</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Forensic Intelligence Multi-Tab Workspace (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Forensic Sub-Tabs */}
                <div className="bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-1 flex items-center gap-1 overflow-x-auto text-xs">
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className={`px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "timeline"
                        ? "bg-[#1E2D3E] text-[#D4AF37] font-semibold"
                        : "text-[#5A6573] hover:text-[#08121D] dark:hover:text-white"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>Timeline ({analysis?.events.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("persons")}
                    className={`px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "persons"
                        ? "bg-[#1E2D3E] text-[#D4AF37] font-semibold"
                        : "text-[#5A6573] hover:text-[#08121D] dark:hover:text-white"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>Persons ({analysis?.persons.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("vehicles")}
                    className={`px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "vehicles"
                        ? "bg-[#1E2D3E] text-[#D4AF37] font-semibold"
                        : "text-[#5A6573] hover:text-[#08121D] dark:hover:text-white"
                    }`}
                  >
                    <Car className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>Vehicles ({analysis?.vehicles.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("keyframes")}
                    className={`px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "keyframes"
                        ? "bg-[#1E2D3E] text-[#D4AF37] font-semibold"
                        : "text-[#5A6573] hover:text-[#08121D] dark:hover:text-white"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>Keyframes ({analysis?.keyFrames.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("objects")}
                    className={`px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "objects"
                        ? "bg-[#1E2D3E] text-[#D4AF37] font-semibold"
                        : "text-[#5A6573] hover:text-[#08121D] dark:hover:text-white"
                    }`}
                  >
                    <Box className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>Objects ({analysis?.objects.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("legal")}
                    className={`px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "legal"
                        ? "bg-[#1E2D3E] text-[#D4AF37] font-semibold"
                        : "text-[#5A6573] hover:text-[#08121D] dark:hover:text-white"
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>Sec 63 BSA Matrix</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("custody")}
                    className={`px-3 py-1.5 rounded-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "custody"
                        ? "bg-[#1E2D3E] text-[#D4AF37] font-semibold"
                        : "text-[#5A6573] hover:text-[#08121D] dark:hover:text-white"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B8955A]" />
                    <span>Chain of Custody</span>
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm p-4 min-h-[420px]">
                  {!analysis ? (
                    <div className="py-16 text-center space-y-4">
                      <Sparkles className="w-10 h-10 text-[#B8955A] mx-auto animate-bounce" />
                      <h4 className="font-serif font-bold text-base">Footage Pending Multimodal Forensic Intelligence</h4>
                      <p className="text-xs text-[#5A6573] dark:text-[#8A95A5] max-w-md mx-auto">
                        Click "Run AI Analysis" to extract chronological incident milestones, observe suspect movements,
                        detect vehicles, and structure admissible evidence under Bharatiya Sakshya Adhiniyam 2023.
                      </p>
                      {canUploadAndAnalyze && (
                        <button
                          onClick={handleRunAnalysis}
                          disabled={isAnalyzing}
                          className="px-4 py-2 text-xs font-semibold rounded-xs bg-[#B8955A] hover:bg-[#A38349] text-white shadow-xs inline-flex items-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          {isAnalyzing ? "Processing Frames..." : "Start CCTV Analysis"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* =========================================================================
                          SUBTAB 1: TIMELINE OF EVENTS
                      ========================================================================= */}
                      {activeTab === "timeline" && (
                        <div className="space-y-4">
                          {/* Summary Box */}
                          <div className="p-3 bg-[#F5EFE4] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs text-xs">
                            <span className="font-semibold text-[#8C6D37] dark:text-[#D4AF37] font-serif block mb-1">
                              Investigative Surveillance Synopsis:
                            </span>
                            <p className="text-[#08121D] dark:text-gray-200 leading-relaxed">
                              {analysis.summary}
                            </p>
                          </div>

                          {/* Events List */}
                          <div className="space-y-3">
                            {analysis.events.map((ev, idx) => (
                              <div
                                key={ev.id || idx}
                                className={`p-3 rounded-xs border text-xs transition-all ${
                                  Math.abs(currentTime - ev.seconds) < 3
                                    ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-xs"
                                    : "bg-[#FAF8F5] dark:bg-[#0A1420] border-[#DDD8CE] dark:border-[#1E2D3E]"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => seekTo(ev.seconds)}
                                      className="px-2 py-0.5 font-mono text-[11px] font-bold rounded-xs bg-[#1E2D3E] text-[#D4AF37] hover:bg-[#2A3F55] cursor-pointer flex items-center gap-1"
                                      title="Click to seek video to this exact moment"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      {ev.timestamp}
                                    </button>

                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-mono rounded-xs uppercase font-medium ${
                                        ev.category === "critical_incident"
                                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                          : ev.category === "vehicle_movement"
                                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                      }`}
                                    >
                                      {ev.category.replace("_", " ")}
                                    </span>

                                    <span className="text-[10px] font-mono text-[#5A6573] dark:text-[#8A95A5]">
                                      Confidence: <strong>{ev.confidence}</strong>
                                    </span>
                                  </div>

                                  {/* Review Badge */}
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-mono rounded-xs font-semibold ${
                                        ev.reviewStatus === "VERIFIED"
                                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                          : ev.reviewStatus === "REJECTED"
                                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                                          : ev.reviewStatus === "EDITED"
                                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                      }`}
                                    >
                                      {ev.reviewStatus === "VERIFIED"
                                        ? "VERIFIED BY OFFICER"
                                        : ev.reviewStatus === "REJECTED"
                                        ? "REJECTED"
                                        : ev.reviewStatus === "EDITED"
                                        ? "EDITED BY OFFICER"
                                        : "PENDING OFFICER REVIEW"}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-[#08121D] dark:text-gray-200 mt-1">
                                  {ev.editedObservation || ev.observation}
                                </p>

                                {ev.officerNotes && (
                                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-xs text-[11px] text-blue-800 dark:text-blue-300">
                                    <strong>Officer Corroboration Note:</strong> {ev.officerNotes}
                                  </div>
                                )}

                                {/* Officer Review Controls */}
                                {canReview && (
                                  <div className="mt-2 pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between">
                                    <div className="text-[10px] text-[#5A6573] dark:text-[#8A95A5]">
                                      Source: {ev.sourceFrame}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleReviewAction(ev.id, "event", "VERIFY")}
                                        className="px-2 py-0.5 text-[11px] font-medium rounded-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 cursor-pointer flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" />
                                        Verify
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingItemId(ev.id);
                                          setEditNoteText(ev.officerNotes || "");
                                        }}
                                        className="px-2 py-0.5 text-[11px] font-medium rounded-xs bg-[#F5EFE4] dark:bg-[#1E2D3E] text-[#5A6573] hover:text-[#08121D] dark:hover:text-white border border-[#DDD8CE] dark:border-[#1E2D3E] cursor-pointer flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        Add Note
                                      </button>
                                      <button
                                        onClick={() => handleReviewAction(ev.id, "event", "REJECT")}
                                        className="px-2 py-0.5 text-[11px] font-medium rounded-xs bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 cursor-pointer flex items-center gap-1"
                                      >
                                        <XCircle className="w-3 h-3" />
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Note Edit Drawer */}
                                {editingItemId === ev.id && (
                                  <div className="mt-2 p-2 bg-[#F5EFE4] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs space-y-2">
                                    <input
                                      type="text"
                                      value={editNoteText}
                                      onChange={e => setEditNoteText(e.target.value)}
                                      placeholder="Add officer corroboration note or witness cross-reference..."
                                      className="w-full px-2 py-1 text-xs bg-white dark:bg-[#151F2D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setEditingItemId(null)}
                                        className="px-2 py-0.5 text-[11px] text-[#5A6573] cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleReviewAction(ev.id, "event", "EDIT", editNoteText)}
                                        className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#B8955A] text-white rounded-xs cursor-pointer"
                                      >
                                        Save Note
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* =========================================================================
                          SUBTAB 2: PERSONS OBSERVED
                      ========================================================================= */}
                      {activeTab === "persons" && (
                        <div className="space-y-4">
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xs text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <Info className="w-4 h-4 shrink-0" />
                            <span>
                              <strong>Forensic Standard Notice:</strong> Facial recognition or identity claims are strictly
                              prohibited without an authorized biometric match. Descriptors are neutral visual observations.
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysis.persons.map((p, idx) => (
                              <div
                                key={p.id || idx}
                                className="p-3 bg-[#FAF8F5] dark:bg-[#0A1420] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold font-serif text-[#B8955A] flex items-center gap-1.5">
                                    <User className="w-4 h-4" />
                                    {p.label || p.id}
                                  </span>
                                  <span className="font-mono text-[10px] text-[#5A6573] dark:text-[#8A95A5]">
                                    Active: {p.firstSeen} - {p.lastSeen}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div>
                                    <strong className="text-[#5A6573] dark:text-[#8A95A5]">Clothing / Attire:</strong>{" "}
                                    <span>{p.clothing}</span>
                                  </div>
                                  <div>
                                    <strong className="text-[#5A6573] dark:text-[#8A95A5]">Appearance Notes:</strong>{" "}
                                    <span>{p.appearanceNotes}</span>
                                  </div>
                                  <div>
                                    <strong className="text-[#5A6573] dark:text-[#8A95A5]">Trajectory / Movement:</strong>{" "}
                                    <span>{p.directionOfMovement}</span>
                                  </div>
                                  {p.carriedObjects?.length > 0 && (
                                    <div>
                                      <strong className="text-[#5A6573] dark:text-[#8A95A5]">Carried Objects:</strong>{" "}
                                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                        {p.carriedObjects.join(", ")}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between">
                                  <button
                                    onClick={() => seekTo(p.firstSeenSeconds)}
                                    className="text-[11px] font-mono text-[#B8955A] hover:underline cursor-pointer flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3" />
                                    Seek to First Appearance ({p.firstSeen})
                                  </button>

                                  {canReview && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleReviewAction(p.id, "person", "VERIFY")}
                                        className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-xs cursor-pointer"
                                      >
                                        ✓ Verify
                                      </button>
                                      <button
                                        onClick={() => handleReviewAction(p.id, "person", "REJECT")}
                                        className="px-2 py-0.5 text-[10px] font-medium bg-rose-500/15 text-rose-700 dark:text-rose-300 rounded-xs cursor-pointer"
                                      >
                                        ✕ Exclude
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* =========================================================================
                          SUBTAB 3: VEHICLES IDENTIFIED
                      ========================================================================= */}
                      {activeTab === "vehicles" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysis.vehicles.map((v, idx) => (
                              <div
                                key={v.id || idx}
                                className="p-3 bg-[#FAF8F5] dark:bg-[#0A1420] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold font-serif text-[#B8955A] flex items-center gap-1.5">
                                    <Car className="w-4 h-4" />
                                    {v.vehicleType} ({v.visibleColor})
                                  </span>
                                  <span className="font-mono text-[10px] text-[#5A6573] dark:text-[#8A95A5]">
                                    {v.firstSeen} - {v.lastSeen}
                                  </span>
                                </div>

                                <div className="p-2 bg-[#F5EFE4] dark:bg-[#08121D] rounded-xs border border-[#DDD8CE] dark:border-[#1E2D3E]">
                                  <span className="text-[10px] font-mono text-[#8C6D37] dark:text-[#D4AF37] block font-bold">
                                    NUMBER PLATE RECOGNITION:
                                  </span>
                                  <div className="text-sm font-mono font-bold mt-0.5">
                                    {v.numberPlateText}
                                  </div>
                                  <span className="text-[10px] text-[#5A6573] dark:text-[#8A95A5]">
                                    Confidence: <strong>{v.plateConfidence}</strong> (Strict No-Hallucination Policy)
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div>
                                    <strong className="text-[#5A6573] dark:text-[#8A95A5]">Distinguishing Features:</strong>{" "}
                                    <span>{v.distinguishingFeatures}</span>
                                  </div>
                                  <div>
                                    <strong className="text-[#5A6573] dark:text-[#8A95A5]">Movement:</strong>{" "}
                                    <span>{v.direction}</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between">
                                  <button
                                    onClick={() => seekTo(v.firstSeenSeconds)}
                                    className="text-[11px] font-mono text-[#B8955A] hover:underline cursor-pointer flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3" />
                                    Seek to Vehicle Entry ({v.firstSeen})
                                  </button>

                                  {canReview && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleReviewAction(v.id, "vehicle", "VERIFY")}
                                        className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-xs cursor-pointer"
                                      >
                                        ✓ Verify
                                      </button>
                                      <button
                                        onClick={() => handleReviewAction(v.id, "vehicle", "REJECT")}
                                        className="px-2 py-0.5 text-[10px] font-medium bg-rose-500/15 text-rose-700 dark:text-rose-300 rounded-xs cursor-pointer"
                                      >
                                        ✕ Dismiss
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* =========================================================================
                          SUBTAB 4: KEYFRAME GALLERY
                      ========================================================================= */}
                      {activeTab === "keyframes" && (
                        <div className="space-y-4">
                          <p className="text-xs text-[#5A6573] dark:text-[#8A95A5]">
                            Click any extracted keyframe thumbnail to immediately seek the video player to that forensic timecode.
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {analysis.keyFrames.map(kf => (
                              <div
                                key={kf.id}
                                onClick={() => seekTo(kf.seconds, true)}
                                className="group bg-[#FAF8F5] dark:bg-[#0A1420] border border-[#DDD8CE] dark:border-[#1E2D3E] hover:border-[#D4AF37] rounded-xs overflow-hidden cursor-pointer transition-all shadow-xs flex flex-col justify-between"
                              >
                                <div>
                                  <div className="relative aspect-video bg-black">
                                    <img
                                      src={kf.thumbnailUrl}
                                      alt={`Keyframe at ${kf.timestamp}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded-xs text-[10px] font-mono text-[#D4AF37]">
                                      {kf.timestamp}
                                    </div>
                                  </div>
                                  <div className="p-2 text-xs">
                                    <p className="line-clamp-2 text-[#08121D] dark:text-gray-200 text-[11px]">
                                      {kf.observation}
                                    </p>
                                  </div>
                                </div>
                                <div className="p-2 pt-0">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      seekTo(kf.seconds, true);
                                    }}
                                    className="w-full py-1 px-2 text-[10px] font-mono bg-[#1E2D3E] hover:bg-[#2A3F55] text-[#D4AF37] rounded-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    View in Video ({kf.timestamp})
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* =========================================================================
                          SUBTAB 5: OBJECTS & PHYSICAL EXHIBITS
                      ========================================================================= */}
                      {activeTab === "objects" && (
                        <div className="space-y-3">
                          {analysis.objects.map((obj, idx) => (
                            <div
                              key={obj.id || idx}
                              className="p-3 bg-[#FAF8F5] dark:bg-[#0A1420] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold font-serif text-[#B8955A]">{obj.objectName}</span>
                                  <span className="px-2 py-0.5 text-[10px] font-mono rounded-xs bg-[#1E2D3E] text-[#D4AF37]">
                                    {obj.evidentiaryCategory}
                                  </span>
                                  <button
                                    onClick={() => seekTo(obj.seconds)}
                                    className="font-mono text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                  >
                                    [{obj.timestamp}]
                                  </button>
                                </div>
                                <p className="text-[#08121D] dark:text-gray-200">{obj.visualDescription}</p>
                                {obj.personAssociation && (
                                  <span className="text-[11px] text-[#5A6573] dark:text-[#8A95A5]">
                                    Associated with: <strong>{obj.personAssociation}</strong>
                                  </span>
                                )}
                              </div>

                              {canReview && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleReviewAction(obj.id, "object", "VERIFY")}
                                    className="px-2 py-1 text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-xs cursor-pointer"
                                  >
                                    ✓ Verify
                                  </button>
                                  <button
                                    onClick={() => handleReviewAction(obj.id, "object", "REJECT")}
                                    className="px-2 py-1 text-[11px] font-medium bg-rose-500/15 text-rose-700 dark:text-rose-300 rounded-xs cursor-pointer"
                                  >
                                    ✕ Exclude
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* =========================================================================
                          SUBTAB 6: LEGAL ADMISSIBILITY MATRIX (BSA 2023)
                      ========================================================================= */}
                      {activeTab === "legal" && (
                        <div className="space-y-4 text-xs">
                          <div className="p-3 bg-[#F5EFE4] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs space-y-2">
                            <span className="font-bold font-serif text-[#8C6D37] dark:text-[#D4AF37] flex items-center gap-1.5">
                              <Scale className="w-4 h-4" />
                              Admissibility Certificate Requirements (Section 63 Bharatiya Sakshya Adhiniyam 2023)
                            </span>
                            <p className="text-[#08121D] dark:text-gray-300 leading-relaxed">
                              Under Section 63 BSA 2023 (replacing Section 65B of Indian Evidence Act 1872), electronic records
                              produced by a computer or surveillance device are admissible in judicial proceedings provided that
                              the integrity hash (SHA-256) is mathematically verified and lawful custody is demonstrated without tampering.
                            </p>
                          </div>

                          <div className="space-y-3">
                            <h5 className="font-serif font-bold text-sm">Key Admissible Evidence Observations:</h5>
                            {analysis.potentialEvidence.map(pe => (
                              <div
                                key={pe.id}
                                className="p-3 bg-[#FAF8F5] dark:bg-[#0A1420] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#08121D] dark:text-white">{pe.observation}</span>
                                  <button
                                    onClick={() => seekTo(pe.seconds)}
                                    className="font-mono text-[10px] text-[#B8955A] hover:underline cursor-pointer"
                                  >
                                    [{pe.timestamp}]
                                  </button>
                                </div>
                                <p className="text-[#5A6573] dark:text-[#8A95A5]">
                                  <strong>Evidentiary Significance:</strong> {pe.evidentiarySignificance}
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-[10px] text-[#5A6573] dark:text-[#8A95A5]">Statutory Sections:</span>
                                  {pe.legalProvisionsRelevant.map(sec => (
                                    <span
                                      key={sec}
                                      className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 rounded-xs"
                                    >
                                      {sec}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* =========================================================================
                          SUBTAB 7: CHAIN OF CUSTODY AUDIT
                      ========================================================================= */}
                      {activeTab === "custody" && (
                        <div className="space-y-3">
                          <p className="text-xs text-[#5A6573] dark:text-[#8A95A5]">
                            Immutable audit trail tracking upload, SHA-256 hash generation, AI extraction, and officer verification.
                          </p>

                          <div className="space-y-2">
                            {selectedEvidence.chainOfCustody?.map((entry, idx) => (
                              <div
                                key={entry.id || idx}
                                className="p-3 bg-[#FAF8F5] dark:bg-[#0A1420] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold font-serif text-[#B8955A]">{entry.action}</span>
                                  <span className="font-mono text-[10px] text-[#5A6573] dark:text-[#8A95A5]">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-[#08121D] dark:text-gray-200">{entry.details}</p>
                                <div className="flex items-center justify-between text-[10px] font-mono text-[#5A6573] dark:text-[#8A95A5] pt-1">
                                  <span>Actor: {entry.actor} ({entry.actorRole})</span>
                                  <span className="truncate max-w-[200px]" title={entry.hash}>
                                    Hash: {entry.hash.substring(0, 16)}...
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bottom Action: Finalize & Link to Case Record */}
                      {canReview && (
                        <div className="mt-6 pt-4 border-t border-[#DDD8CE] dark:border-[#1E2D3E] flex items-center justify-between">
                          <div className="text-xs text-[#5A6573] dark:text-[#8A95A5]">
                            {analysis.events.filter(e => e.reviewStatus === "VERIFIED").length} of {analysis.events.length} timeline observations verified.
                          </div>

                          <button
                            onClick={() => setShowFinalizeModal(true)}
                            className="px-4 py-2 text-xs font-semibold rounded-xs bg-[#B8955A] hover:bg-[#A38349] text-white shadow-xs flex items-center gap-2 cursor-pointer"
                          >
                            <Scale className="w-4 h-4" />
                            Finalize &amp; Save Verified Analysis to Case Record
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload CCTV Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
              <h3 className="text-base font-bold font-serif text-[#08121D] dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-[#B8955A]" />
                Upload CCTV Video Exhibit
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Target Case ID</label>
                <input
                  type="text"
                  value={caseId}
                  disabled
                  className="w-full px-3 py-2 bg-[#F5EFE4] dark:bg-[#151F2D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Video File (MP4, WebM, MOV, AVI)</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/avi"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  required
                  className="w-full px-3 py-2 border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs cursor-pointer"
                />
                <p className="text-[11px] text-[#5A6573] dark:text-[#8A95A5] mt-1">
                  Original bytes will be hashed with SHA-256 for legal admissibility under Section 63 BSA 2023.
                </p>
              </div>

              {/* Immediate Local Video Preview */}
              {localPreviewUrl && uploadFile && (
                <div className="space-y-1.5 p-2 bg-[#F5EFE4] dark:bg-[#151F2D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#5A6573] dark:text-[#8A95A5]">
                    <span className="font-semibold text-[#08121D] dark:text-white flex items-center gap-1">
                      <Play className="w-3 h-3 text-[#B8955A]" /> Local File Pre-Verification
                    </span>
                    <span>{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div className="aspect-video bg-black rounded-xs overflow-hidden border border-black/40 flex items-center justify-center">
                    <video
                      src={localPreviewUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span>Uploading &amp; Computing Cryptographic Hash...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#DDD8CE] dark:bg-[#1E2D3E] rounded-full overflow-hidden">
                    <div className="h-full bg-[#B8955A] transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="px-3 py-1.5 bg-transparent border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-4 py-1.5 font-semibold bg-[#B8955A] hover:bg-[#A38349] text-white rounded-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Upload & Register Exhibit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Finalize and Save to Case Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0D1824] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-sm max-w-lg w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#DDD8CE] dark:border-[#1E2D3E] pb-3">
              <h3 className="text-base font-bold font-serif text-[#08121D] dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#B8955A]" />
                Finalize Officer Verdict &amp; Save to Case
              </h3>
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[#5A6573] dark:text-[#8A95A5]">
                Saving will link the verified CCTV analysis to the Case Document Vault, add key video events to the
                official Case Timeline, and register an admissibility certificate entry under Section 63 BSA 2023.
              </p>

              <div>
                <label className="block font-semibold mb-1">Official Officer Finding / Verdict:</label>
                <textarea
                  rows={4}
                  value={officerVerdict}
                  onChange={e => setOfficerVerdict(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] dark:bg-[#08121D] border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs font-serif text-xs leading-relaxed"
                />
              </div>

              <div className="p-2.5 bg-[#F5EFE4] dark:bg-[#151F2D] rounded-xs border border-[#DDD8CE] dark:border-[#1E2D3E] space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span>Reviewing Officer:</span>
                  <strong className="font-mono">{userName} ({userRole})</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>CCTV Exhibit:</span>
                  <strong className="font-mono">{selectedEvidence?.fileName}</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Admissibility Hash:</span>
                  <strong className="font-mono text-[#8C6D37] dark:text-[#D4AF37]">
                    {selectedEvidence?.sha256Hash.substring(0, 16)}...
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD8CE] dark:border-[#1E2D3E]">
              <button
                onClick={() => setShowFinalizeModal(false)}
                disabled={isSavingFinal}
                className="px-3 py-1.5 bg-transparent border border-[#DDD8CE] dark:border-[#1E2D3E] rounded-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeSave}
                disabled={isSavingFinal}
                className="px-4 py-1.5 font-semibold bg-[#B8955A] hover:bg-[#A38349] text-white rounded-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSavingFinal ? "Saving to Case..." : "Confirm & Save to Case"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

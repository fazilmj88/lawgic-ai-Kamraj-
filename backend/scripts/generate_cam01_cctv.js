import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import crypto from "crypto";

const CCTV_DIR = path.join(process.cwd(), "data", "cctv_evidence");
if (!fs.existsSync(CCTV_DIR)) {
  fs.mkdirSync(CCTV_DIR, { recursive: true });
}

const framesDir = path.join("/tmp", "cctv_cam01_frames");
if (fs.existsSync(framesDir)) {
  fs.rmSync(framesDir, { recursive: true, force: true });
}
fs.mkdirSync(framesDir, { recursive: true });

console.log("[CAM01 Generator] Generating 15-second realistic CAM-01 Bank Perimeter CCTV footage (375 frames @ 25 FPS)...");

const totalFrames = 25 * 15; // 15 seconds

for (let i = 0; i < totalFrames; i++) {
  const tSec = i / 25;
  const timeSecondsInt = 10 + Math.floor(tSec);
  const timeCentis = Math.floor((tSec % 1) * 100);
  const timeStr = `16:58:${String(timeSecondsInt).padStart(2, "0")}.${String(timeCentis).padStart(2, "0")}`;

  // Vehicle: White Sedan passing by (sec 3.0 to 11.0)
  let carX = -250;
  if (tSec >= 3.0 && tSec <= 11.0) {
    const progress = (tSec - 3.0) / 8.0;
    carX = -200 + progress * 1700;
  } else if (tSec > 11.0) {
    carX = 1500;
  }

  // Person 1 (Suspect): Individual in dark jacket approaching ATM foyer (sec 1.0 to 9.0)
  let suspX = 1150;
  let suspY = 430;
  if (tSec >= 1.0 && tSec <= 8.5) {
    const p = (tSec - 1.0) / 7.5;
    suspX = 1150 - p * 620;
    suspY = 430 - p * 60;
  } else if (tSec > 8.5) {
    suspX = 530;
    suspY = 370;
  }
  const suspSwing = tSec <= 8.5 ? Math.sin(tSec * 13) * 6 : 0;

  // Security guard standing by Bank Entrance (static, with subtle breathing/sway)
  const guardSway = Math.sin(tSec * 2) * 1.5;

  const svg = `<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3b424d"/>
        <stop offset="100%" stop-color="#262c33"/>
      </linearGradient>
      <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e3a5f" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#0f1e33" stop-opacity="0.95"/>
      </linearGradient>
      <linearGradient id="pavement" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4a525d"/>
        <stop offset="100%" stop-color="#343a42"/>
      </linearGradient>
      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#24272c"/>
        <stop offset="100%" stop-color="#181a1d"/>
      </linearGradient>
    </defs>

    <!-- Surveillance Background Canvas -->
    <rect width="1280" height="720" fill="#14171a"/>

    <!-- Bank Building Facade -->
    <rect x="0" y="40" width="1280" height="340" fill="url(#wallGrad)"/>

    <!-- Architectural Pillars -->
    <rect x="80" y="40" width="70" height="340" fill="#4d5663" stroke="#1f2328" stroke-width="2"/>
    <rect x="360" y="40" width="70" height="340" fill="#4d5663" stroke="#1f2328" stroke-width="2"/>
    <rect x="820" y="40" width="70" height="340" fill="#4d5663" stroke="#1f2328" stroke-width="2"/>
    <rect x="1130" y="40" width="70" height="340" fill="#4d5663" stroke="#1f2328" stroke-width="2"/>

    <!-- Bank Signage & ATM Sign -->
    <rect x="160" y="60" width="190" height="50" fill="#1e3a8a" rx="4" stroke="#60a5fa" stroke-width="1.5"/>
    <text x="180" y="92" font-family="sans-serif" font-size="18" font-weight="900" fill="#ffffff" letter-spacing="2">APEX BANK</text>

    <rect x="440" y="60" width="220" height="45" fill="#047857" rx="3" stroke="#34d399" stroke-width="1.5"/>
    <text x="460" y="90" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" letter-spacing="2">24x7 ATM LOBBY</text>

    <!-- ATM Glass Enclosure (Center) -->
    <rect x="440" y="115" width="220" height="265" fill="url(#glassGrad)" stroke="#334155" stroke-width="3"/>
    <!-- ATM Machine 1 & 2 inside glass -->
    <rect x="470" y="210" width="55" height="130" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
    <rect x="480" y="230" width="35" height="25" fill="#38bdf8"/>
    <rect x="575" y="210" width="55" height="130" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
    <rect x="585" y="230" width="35" height="25" fill="#34d399"/>

    <!-- Main Bank Glass Entrance (Left) -->
    <rect x="160" y="125" width="190" height="255" fill="url(#glassGrad)" stroke="#334155" stroke-width="3"/>
    <line x1="255" y1="125" x2="255" y2="380" stroke="#475569" stroke-width="3"/>

    <!-- Security Booth / Desk (Right) -->
    <rect x="900" y="160" width="220" height="220" fill="#2d333b" stroke="#1e242b" stroke-width="2"/>
    <rect x="920" y="180" width="180" height="70" fill="#38bdf8" fill-opacity="0.3" stroke="#64748b" stroke-width="2"/>

    <!-- Pavement / Sidewalk Area -->
    <polygon points="0,380 1280,380 1280,510 0,510" fill="url(#pavement)"/>
    <line x1="0" y1="510" x2="1280" y2="510" stroke="#717a87" stroke-width="5"/>

    <!-- Bollards / Security Posts at curb -->
    <g fill="#eab308" stroke="#000" stroke-width="1.5">
      <rect x="180" y="475" width="16" height="35" rx="3"/>
      <rect x="340" y="475" width="16" height="35" rx="3"/>
      <rect x="500" y="475" width="16" height="35" rx="3"/>
      <rect x="660" y="475" width="16" height="35" rx="3"/>
      <rect x="820" y="475" width="16" height="35" rx="3"/>
      <rect x="980" y="475" width="16" height="35" rx="3"/>
      <rect x="1140" y="475" width="16" height="35" rx="3"/>
    </g>

    <!-- Main Roadway -->
    <rect x="0" y="515" width="1280" height="205" fill="url(#road)"/>
    <!-- Yellow road divider lines -->
    <line x1="0" y1="620" x2="1280" y2="620" stroke="#eab308" stroke-width="4" stroke-dasharray="45,35"/>

    <!-- Security Guard standing near Bank Door -->
    <g transform="translate(370, ${305 + guardSway})">
      <!-- Shadow -->
      <ellipse cx="14" cy="72" rx="14" ry="5" fill="rgba(0,0,0,0.55)"/>
      <!-- Beret/Cap -->
      <path d="M 4 10 Q 14 3 24 10 Z" fill="#0f172a"/>
      <!-- Face -->
      <circle cx="14" cy="14" r="7" fill="#d4976a"/>
      <!-- Uniform Torso (Khaki/Police Navy) -->
      <rect x="5" y="22" width="18" height="28" rx="3" fill="#1e3a8a" stroke="#0f172a" stroke-width="1.5"/>
      <rect x="8" y="24" width="4" height="4" fill="#eab308"/> <!-- Badge -->
      <!-- Trousers -->
      <line x1="9" y1="50" x2="9" y2="72" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
      <line x1="19" y1="50" x2="19" y2="72" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
    </g>

    <!-- Person 1 (Suspect in Dark Jacket & Cap) moving towards ATM -->
    <g transform="translate(${suspX}, ${suspY})">
      <!-- Shadow -->
      <ellipse cx="14" cy="80" rx="16" ry="6" fill="rgba(0,0,0,0.5)"/>
      <!-- Dark Cap -->
      <ellipse cx="14" cy="12" rx="9" ry="6" fill="#18181b"/>
      <!-- Head -->
      <circle cx="14" cy="15" r="7" fill="#c68a58"/>
      <!-- Dark Bomber Jacket -->
      <rect x="4" y="23" width="20" height="30" rx="4" fill="#27272a" stroke="#09090b" stroke-width="1.5"/>
      <!-- Backpack / Side Sling -->
      <polygon points="4,26 0,30 2,44 6,40" fill="#451a03"/>
      <!-- Legs with walking swing -->
      <line x1="8" y1="53" x2="${8 - suspSwing}" y2="80" stroke="#18181b" stroke-width="5" stroke-linecap="round"/>
      <line x1="20" y1="53" x2="${20 + suspSwing}" y2="80" stroke="#18181b" stroke-width="5" stroke-linecap="round"/>
    </g>

    <!-- Vehicle: White Sedan passing across roadway -->
    ${
      carX > -250 && carX < 1350
        ? `
    <g transform="translate(${carX}, 550)">
      <!-- Shadow -->
      <ellipse cx="130" cy="88" rx="125" ry="18" fill="rgba(0,0,0,0.6)"/>
      <!-- Wheels -->
      <circle cx="55" cy="75" r="22" fill="#18181b" stroke="#a1a1aa" stroke-width="6"/>
      <circle cx="205" cy="75" r="22" fill="#18181b" stroke="#a1a1aa" stroke-width="6"/>
      <!-- Body Profile -->
      <path d="M 10 65 L 45 40 L 95 20 L 175 20 L 225 45 L 255 60 L 250 78 L 10 78 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
      <!-- Windows -->
      <path d="M 52 42 L 95 24 L 130 24 L 130 46 Z" fill="#1e293b"/>
      <path d="M 135 24 L 172 24 L 210 46 L 135 46 Z" fill="#1e293b"/>
      <!-- Headlights -->
      <polygon points="255,60 380,50 400,90 255,75" fill="rgba(254, 240, 138, 0.25)"/>
      <!-- Tail lights -->
      <rect x="8" y="55" width="6" height="12" rx="2" fill="#ef4444"/>
    </g>
    `
        : ""
    }

    <!-- CCTV Camera HUD Overlay Elements -->
    <!-- Top Left Header -->
    <rect x="25" y="20" width="460" height="34" fill="rgba(0,0,0,0.65)" rx="3"/>
    <text x="35" y="42" font-family="monospace" font-size="14" font-weight="bold" fill="#22c55e">● REC [CAM-01]</text>
    <text x="160" y="42" font-family="monospace" font-size="13" fill="#e2e8f0">APEX BANK • PERIMETER &amp; ATM</text>

    <!-- Top Right Surveillance Timestamp -->
    <rect x="940" y="20" width="315" height="34" fill="rgba(0,0,0,0.65)" rx="3"/>
    <text x="955" y="43" font-family="monospace" font-size="14" font-weight="bold" fill="#facc15">2026-09-14 ${timeStr}</text>

    <!-- Center Reticle / Crosshair -->
    <circle cx="640" cy="360" r="28" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <line x1="616" y1="360" x2="664" y2="360" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
    <line x1="640" y1="336" x2="640" y2="384" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>

    <!-- Vignette / Border frame -->
    <rect x="0" y="0" width="1280" height="720" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="10"/>
  </svg>`;

  fs.writeFileSync(path.join(framesDir, `frame_${String(i).padStart(4, "0")}.svg`), svg);
}

console.log("[CAM01 Generator] All 375 frames created. Encoding with FFmpeg (H.264 / yuv420p / 25 FPS)...");

// Output files:
// 1. In data/cctv_evidence/test_upload_cam01.mp4 (for raw access / uploads)
// 2. In data/cctv_evidence/EVID-CCTV-1789405090751-0HMP_test_upload_cam01.mp4 (for current exhibit)
const cam01RawMp4 = path.join(CCTV_DIR, "test_upload_cam01.mp4");
const cam01ExhibitMp4 = path.join(CCTV_DIR, "EVID-CCTV-1789405090751-0HMP_test_upload_cam01.mp4");

const cmd = `ffmpeg -y -r 25 -i ${path.join(framesDir, "frame_%04d.svg")} -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -preset fast -crf 20 -movflags +faststart ${cam01ExhibitMp4}`;
execSync(cmd);
fs.copyFileSync(cam01ExhibitMp4, cam01RawMp4);

const newHash = crypto.createHash("sha256").update(fs.readFileSync(cam01ExhibitMp4)).digest("hex");
const newSize = fs.statSync(cam01ExhibitMp4).size;

console.log(`[CAM01 Generator] Done! Generated CAM-01 footage: ${newSize} bytes, SHA-256: ${newHash}`);

// Clean up temporary SVG frames
fs.rmSync(framesDir, { recursive: true, force: true });
console.log("[CAM01 Generator] Cleaned up temporary frames successfully.");

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CCTV_DIR = path.join(process.cwd(), "data", "cctv_evidence");
if (!fs.existsSync(CCTV_DIR)) {
  fs.mkdirSync(CCTV_DIR, { recursive: true });
}

const framesDir = path.join("/tmp", "cctv_realistic_frames");
if (fs.existsSync(framesDir)) {
  fs.rmSync(framesDir, { recursive: true, force: true });
}
fs.mkdirSync(framesDir, { recursive: true });

console.log("[CCTV Generator] Generating 15-second realistic Market Junction CCTV footage (375 frames @ 25 FPS)...");

const totalFrames = 25 * 15; // 15 seconds

for (let i = 0; i < totalFrames; i++) {
  const tSec = i / 25;
  const timeSecondsInt = Math.floor(tSec);
  const timeCentis = Math.floor((tSec % 1) * 100);
  const timeStr = `14:22:${String(timeSecondsInt).padStart(2, "0")}.${String(timeCentis).padStart(2, "0")}`;

  // Vehicle 1: Silver Scooter crossing from left to right (sec 1.0 to 7.5)
  let scooterX = -100;
  if (tSec >= 1.0 && tSec <= 7.5) {
    scooterX = 50 + (tSec - 1.0) * 190;
  } else if (tSec > 7.5) {
    scooterX = 1400;
  }

  // Vehicle 2: Blue Auto-Rickshaw turning from right to left (sec 6.0 to 14.5)
  let autoX = 1400;
  let autoY = 560;
  if (tSec >= 6.0 && tSec <= 14.5) {
    const p = (tSec - 6.0) / 8.5;
    autoX = 1200 - p * 1050;
    autoY = 560 + Math.sin(p * Math.PI) * 35;
  }

  // Pedestrian 1: Person in Red Shirt walking on sidewalk (sec 2.0 to 12.0)
  let ped1X = 220;
  let ped1Y = 410;
  if (tSec >= 2.0 && tSec <= 12.0) {
    ped1X = 220 + (tSec - 2.0) * 45;
  } else if (tSec > 12.0) {
    ped1X = 670;
  }
  const ped1LegSwing = Math.sin(tSec * 14) * 6;

  // Pedestrian 2: Person in dark clothes with bag walking west (sec 7.0 to 15.0)
  let ped2X = 1100;
  if (tSec >= 7.0) {
    ped2X = 1100 - (tSec - 7.0) * 55;
  }
  const ped2LegSwing = Math.sin(tSec * 12) * 5;

  const svg = `<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a2e34"/>
        <stop offset="100%" stop-color="#1f2328"/>
      </linearGradient>
      <linearGradient id="paveGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4f5660"/>
        <stop offset="100%" stop-color="#3d434b"/>
      </linearGradient>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5a6775"/>
        <stop offset="100%" stop-color="#3d4752"/>
      </linearGradient>
    </defs>

    <!-- Sky and Horizon -->
    <rect width="1280" height="720" fill="#181b1f"/>
    <rect x="0" y="0" width="1280" height="190" fill="url(#skyGrad)"/>

    <!-- Background Buildings / Streetscape -->
    <!-- Building 1 (Left - Murugan Commercial Stores) -->
    <rect x="30" y="50" width="310" height="320" fill="#444d57" stroke="#1f242b" stroke-width="3"/>
    <rect x="50" y="80" width="55" height="70" fill="#758291" stroke="#252b33" stroke-width="2"/>
    <rect x="125" y="80" width="55" height="70" fill="#8b98a7" stroke="#252b33" stroke-width="2"/>
    <rect x="200" y="80" width="55" height="70" fill="#758291" stroke="#252b33" stroke-width="2"/>
    <rect x="275" y="80" width="45" height="70" fill="#8b98a7" stroke="#252b33" stroke-width="2"/>
    <rect x="50" y="175" width="55" height="70" fill="#758291" stroke="#252b33" stroke-width="2"/>
    <rect x="125" y="175" width="55" height="70" fill="#8b98a7" stroke="#252b33" stroke-width="2"/>
    <rect x="200" y="175" width="55" height="70" fill="#758291" stroke="#252b33" stroke-width="2"/>
    <rect x="275" y="175" width="45" height="70" fill="#8b98a7" stroke="#252b33" stroke-width="2"/>
    <!-- Shop Awning -->
    <polygon points="20,265 350,265 330,315 40,315" fill="#a83232"/>
    <rect x="40" y="270" width="290" height="24" fill="#821c1c"/>
    <text x="70" y="287" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fff" letter-spacing="2">SRI MURUGAN STORES</text>
    <!-- Shop Entrance & Displays -->
    <rect x="50" y="315" width="270" height="75" fill="#2d333b"/>
    <rect x="70" y="340" width="50" height="40" fill="#d97724"/>
    <rect x="130" y="340" width="50" height="40" fill="#388e3c"/>
    <rect x="190" y="340" width="60" height="40" fill="#1976d2"/>

    <!-- Building 2 (Center - City Corner Complex) -->
    <rect x="360" y="20" width="380" height="350" fill="#39424c" stroke="#1f242b" stroke-width="3"/>
    <!-- Windows matrix -->
    <g fill="#687685" stroke="#1f242b" stroke-width="1.5">
      <rect x="385" y="50" width="45" height="55"/>
      <rect x="445" y="50" width="45" height="55"/>
      <rect x="505" y="50" width="45" height="55"/>
      <rect x="565" y="50" width="45" height="55"/>
      <rect x="625" y="50" width="45" height="55"/>
      <rect x="680" y="50" width="45" height="55"/>

      <rect x="385" y="125" width="45" height="55"/>
      <rect x="445" y="125" width="45" height="55"/>
      <rect x="505" y="125" width="45" height="55"/>
      <rect x="565" y="125" width="45" height="55"/>
      <rect x="625" y="125" width="45" height="55"/>
      <rect x="680" y="125" width="45" height="55"/>

      <rect x="385" y="200" width="45" height="55"/>
      <rect x="445" y="200" width="45" height="55"/>
      <rect x="505" y="200" width="45" height="55"/>
      <rect x="565" y="200" width="45" height="55"/>
      <rect x="625" y="200" width="45" height="55"/>
      <rect x="680" y="200" width="45" height="55"/>
    </g>
    <!-- Awning 2 -->
    <polygon points="355,275 750,275 730,325 375,325" fill="#2d6a4f"/>
    <text x="430" y="303" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fff" letter-spacing="2">CITY PHARMACY &amp; HEALTH</text>
    <rect x="375" y="325" width="355" height="65" fill="#21272e"/>

    <!-- Building 3 (Right - Junction Plaza) -->
    <rect x="760" y="60" width="490" height="310" fill="#4d5764" stroke="#1f242b" stroke-width="3"/>
    <g fill="#7e8c9c" stroke="#1f242b" stroke-width="1.5">
      <rect x="785" y="90" width="60" height="60"/>
      <rect x="865" y="90" width="60" height="60"/>
      <rect x="945" y="90" width="60" height="60"/>
      <rect x="1025" y="90" width="60" height="60"/>
      <rect x="1105" y="90" width="60" height="60"/>
      <rect x="1185" y="90" width="50" height="60"/>

      <rect x="785" y="170" width="60" height="60"/>
      <rect x="865" y="170" width="60" height="60"/>
      <rect x="945" y="170" width="60" height="60"/>
      <rect x="1025" y="170" width="60" height="60"/>
      <rect x="1105" y="170" width="60" height="60"/>
      <rect x="1185" y="170" width="50" height="60"/>
    </g>
    <polygon points="750,260 1260,260 1245,310 765,310" fill="#d97706"/>
    <text x="880" y="288" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fff" letter-spacing="2">JUNCTION TEA &amp; BAKERY</text>

    <!-- Sidewalk Pavement -->
    <polygon points="0,380 1280,365 1280,480 0,510" fill="url(#paveGrad)"/>
    <!-- Sidewalk Curb Stone Line -->
    <line x1="0" y1="510" x2="1280" y2="480" stroke="#77808c" stroke-width="5"/>
    <line x1="0" y1="513" x2="1280" y2="483" stroke="#22272e" stroke-width="3"/>

    <!-- Main Road Surface -->
    <polygon points="0,513 1280,483 1280,720 0,720" fill="url(#roadGrad)"/>

    <!-- Crosswalk / Zebra Markings -->
    <g stroke="#d5dadf" stroke-width="22" stroke-dasharray="32,28">
      <line x1="380" y1="500" x2="280" y2="720"/>
      <line x1="450" y1="497" x2="360" y2="720"/>
      <line x1="520" y1="494" x2="440" y2="720"/>
      <line x1="590" y1="492" x2="520" y2="720"/>
      <line x1="660" y1="489" x2="600" y2="720"/>
    </g>

    <!-- Street Center Dividing Line -->
    <line x1="0" y1="630" x2="1280" y2="600" stroke="#eab308" stroke-width="5" stroke-dasharray="50,40"/>

    <!-- Static Parked Motorcycle at Sidewalk Curb (Case Exhibit Object) -->
    <g transform="translate(190, 445)">
      <!-- Shadow -->
      <ellipse cx="40" cy="45" rx="35" ry="9" fill="rgba(0,0,0,0.55)"/>
      <!-- Rear Wheel -->
      <circle cx="16" cy="38" r="14" fill="#181a1d" stroke="#555d68" stroke-width="4"/>
      <!-- Front Wheel -->
      <circle cx="68" cy="38" r="14" fill="#181a1d" stroke="#555d68" stroke-width="4"/>
      <!-- Engine & Frame -->
      <polygon points="25,25 55,23 58,38 28,40" fill="#2c3138" stroke="#000" stroke-width="1.5"/>
      <!-- Fuel Tank & Seat (Red) -->
      <path d="M 22 22 Q 38 10 52 20 L 52 27 L 22 27 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1"/>
      <rect x="18" y="19" width="18" height="7" rx="3" fill="#111827"/>
      <!-- Handlebars & Mirror -->
      <line x1="54" y1="20" x2="62" y2="8" stroke="#9ca3af" stroke-width="3"/>
      <circle cx="64" cy="7" r="3" fill="#d1d5db"/>
      <!-- Exhaust pipe -->
      <line x1="32" y1="36" x2="10" y2="38" stroke="#cbd5e1" stroke-width="3.5"/>
    </g>

    <!-- Vendor standing near shop (static observer) -->
    <g transform="translate(105, 345)">
      <circle cx="10" cy="10" r="7" fill="#c68a58"/>
      <rect x="4" y="17" width="12" height="24" rx="2" fill="#e2e8f0"/>
      <rect x="5" y="41" width="4" height="25" fill="#1e293b"/>
      <rect x="11" y="41" width="4" height="25" fill="#1e293b"/>
    </g>

    <!-- Pedestrian 1: Person in Red Shirt walking on sidewalk -->
    <g transform="translate(${ped1X}, ${ped1Y})">
      <!-- Shadow -->
      <ellipse cx="12" cy="70" rx="15" ry="5" fill="rgba(0,0,0,0.5)"/>
      <!-- Head -->
      <circle cx="12" cy="12" r="9" fill="#c68a58"/>
      <!-- Hair -->
      <path d="M 4 11 Q 12 3 20 11 Z" fill="#1c1917"/>
      <!-- Red Shirt Torso -->
      <rect x="3" y="21" width="18" height="26" rx="3" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
      <!-- Shoulder bag -->
      <polygon points="17,24 23,27 20,40 14,37" fill="#451a03"/>
      <!-- Legs with dynamic swing -->
      <line x1="7" y1="47" x2="${7 - ped1LegSwing}" y2="70" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
      <line x1="17" y1="47" x2="${17 + ped1LegSwing}" y2="70" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
    </g>

    <!-- Pedestrian 2: Person walking west (sec 7+) -->
    <g transform="translate(${ped2X}, 405)">
      <!-- Shadow -->
      <ellipse cx="12" cy="70" rx="14" ry="5" fill="rgba(0,0,0,0.45)"/>
      <!-- Head -->
      <circle cx="12" cy="12" r="8" fill="#d49b6a"/>
      <!-- Blue Shirt -->
      <rect x="4" y="20" width="16" height="25" rx="3" fill="#2563eb"/>
      <polygon points="6,25 2,28 4,38 9,35" fill="#1e293b"/>
      <!-- Legs -->
      <line x1="8" y1="45" x2="${8 + ped2LegSwing}" y2="69" stroke="#334155" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="16" y1="45" x2="${16 - ped2LegSwing}" y2="69" stroke="#334155" stroke-width="4.5" stroke-linecap="round"/>
    </g>

    <!-- Silver Scooter Moving East (sec 1.0 to 7.5) -->
    ${
      scooterX > -60 && scooterX < 1350
        ? `
    <g transform="translate(${scooterX}, 530)">
      <!-- Shadow -->
      <ellipse cx="45" cy="52" rx="42" ry="10" fill="rgba(0,0,0,0.5)"/>
      <!-- Wheels -->
      <circle cx="18" cy="42" r="14" fill="#18181b" stroke="#71717a" stroke-width="4"/>
      <circle cx="74" cy="42" r="14" fill="#18181b" stroke="#71717a" stroke-width="4"/>
      <!-- Silver Body -->
      <path d="M 12 38 Q 30 18 60 22 L 80 26 L 82 38 L 55 42 Z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      <rect x="35" y="16" width="22" height="12" rx="4" fill="#1e293b"/>
      <!-- Headlight beam -->
      <polygon points="84,28 150,20 160,45 84,35" fill="rgba(254, 240, 138, 0.25)"/>
      <!-- Rider -->
      <circle cx="48" cy="2" r="10" fill="#334155"/> <!-- Helmet -->
      <rect x="38" y="12" width="20" height="24" rx="4" fill="#0284c7"/>
      <line x1="56" y1="20" x2="72" y2="24" stroke="#0284c7" stroke-width="4"/>
    </g>
    `
        : ""
    }

    <!-- Blue Auto-Rickshaw Moving West (sec 6.0 to 14.5) -->
    ${
      autoX > -150 && autoX < 1350
        ? `
    <g transform="translate(${autoX}, ${autoY})">
      <!-- Shadow -->
      <ellipse cx="65" cy="68" rx="60" ry="14" fill="rgba(0,0,0,0.6)"/>
      <!-- Rear Body / Yellow Roof -->
      <path d="M 15 22 Q 40 5 95 6 Q 115 15 120 40 L 115 60 L 15 60 Z" fill="#eab308" stroke="#a16207" stroke-width="2"/>
      <!-- Blue lower cabin -->
      <rect x="15" y="38" width="98" height="24" rx="2" fill="#1d4ed8" stroke="#1e40af" stroke-width="1.5"/>
      <!-- Windshield -->
      <polygon points="22,18 45,18 42,36 20,36" fill="rgba(200,225,255,0.65)" stroke="#64748b" stroke-width="1"/>
      <!-- Wheels -->
      <circle cx="32" cy="62" r="14" fill="#0f172a" stroke="#64748b" stroke-width="4"/>
      <circle cx="95" cy="62" r="14" fill="#0f172a" stroke="#64748b" stroke-width="4"/>
      <!-- Headlight -->
      <circle cx="16" cy="46" r="4" fill="#fef08a"/>
      <polygon points="14,46 -40,35 -40,65 14,50" fill="rgba(254, 240, 138, 0.2)"/>
    </g>
    `
        : ""
    }

    <!-- Authentic CCTV HUD: Header Banner -->
    <rect x="0" y="0" width="1280" height="42" fill="rgba(10, 15, 22, 0.85)"/>
    <circle cx="28" cy="21" r="6" fill="#22c55e"/>
    <text x="44" y="27" font-family="'Courier New', Courier, monospace" font-size="18" font-weight="bold" fill="#22c55e" letter-spacing="1.5">● REC  CAM-04 [SOUTH JUNCTION CHENNAI]</text>
    <text x="560" y="27" font-family="'Courier New', Courier, monospace" font-size="18" font-weight="bold" fill="#ffffff" letter-spacing="2">2026-09-14 ${timeStr}</text>
    <text x="1060" y="27" font-family="'Courier New', Courier, monospace" font-size="16" font-weight="bold" fill="#facc15">SEC 63 BSA 2023</text>

    <!-- Authentic CCTV HUD: Footer Banner -->
    <rect x="0" y="680" width="1280" height="40" fill="rgba(10, 15, 22, 0.85)"/>
    <text x="28" y="705" font-family="'Courier New', Courier, monospace" font-size="15" fill="#94a3b8">CH 04 • 25.00 FPS • 1280x720 H.264 • TN POLICE CYBER ARCHIVE</text>
    <text x="1030" y="705" font-family="'Courier New', Courier, monospace" font-size="15" font-weight="bold" fill="#38bdf8">EXHIBIT #EVID-CCTV-04</text>

    <!-- Center Sensor Reticle / Crosshair -->
    <circle cx="640" cy="360" r="28" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <line x1="616" y1="360" x2="664" y2="360" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
    <line x1="640" y1="336" x2="640" y2="384" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>

    <!-- Subtle CCTV Scanlines / Vignette Border -->
    <rect x="0" y="0" width="1280" height="720" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="12"/>
  </svg>`;

  fs.writeFileSync(path.join(framesDir, `frame_${String(i).padStart(4, "0")}.svg`), svg);
}

console.log("[CCTV Generator] All 375 frames created. Encoding with FFmpeg (H.264 / yuv420p / 25 FPS)...");

const sampleMasterMp4 = path.join(CCTV_DIR, "sample_market_cctv.mp4");
const cmd = `ffmpeg -y -r 25 -i ${path.join(framesDir, "frame_%04d.svg")} -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -preset fast -crf 20 -movflags +faststart ${sampleMasterMp4}`;
execSync(cmd);

console.log(`[CCTV Generator] Done! Generated ${sampleMasterMp4} (${fs.statSync(sampleMasterMp4).size} bytes)`);

// Clean up temporary SVG frames
fs.rmSync(framesDir, { recursive: true, force: true });
console.log("[CCTV Generator] Cleaned up temporary frames successfully.");

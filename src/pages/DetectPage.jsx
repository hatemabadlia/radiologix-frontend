// src/pages/DetectPage.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Radiologix — Bone Fracture Detection
// Model: YOLOv8m  |  1 class: Fracture (class_id = 0)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn, ZoomOut, RotateCcw, SunMoon, Layers, Download,
  CheckCircle2, AlertTriangle, Scan, Camera, Upload, X,
  Activity, Shield, FileText, Crosshair, Eye, EyeOff,
  User, Calendar, Bone, Stethoscope, Brain, BarChart3,
  Info, Wifi, WifiOff, Settings, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  collection, addDoc, doc, updateDoc, increment, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error("Server error");
  return res.json();
}

async function callDetectAPI(imageFile, conf = 0.25, iou = 0.45) {
  const form = new FormData();
  form.append("file", imageFile);
  const res = await fetch(`${API_BASE}/predict?conf=${conf}&iou=${iou}`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error ${res.status}`);
  }
  return res.json();
  // Returns: { detections: [{classId, label, confidence, x, y, w, h}], inferenceMs }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// YOUR MODEL HAS 1 CLASS: "Fracture" (class_id = 0)
// ─────────────────────────────────────────────────────────────
// FRACTURE_CLASS is a single object describing the only class.
// No mapping needed — every detection from your model is a fracture.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FRACTURE_CLASS = {
  id:     0,
  label:  "Fracture",
  color:  "#f43f5e",        // red — matches medical urgency
  icon:   "🦴",
  aoCode: "See radiologist", // your model detects fracture presence, not AO type
};

// Severity based on confidence band
function getSeverity(confidence) {
  if (confidence >= 0.80) return { label: "High Confidence",   color: "#f43f5e", bg: "rgba(244,63,94,0.10)",   border: "rgba(244,63,94,0.28)"   };
  if (confidence >= 0.55) return { label: "Moderate Confidence", color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.28)"  };
  return                          { label: "Low Confidence",    color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.28)"  };
}

const ANATOMICAL_REGIONS = [
  "Hand / Wrist","Forearm","Elbow","Humerus","Shoulder / Clavicle",
  "Pelvis / Hip","Femur","Knee","Tibia / Fibula","Ankle / Foot",
  "Spine","Rib / Sternum","Skull",
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #070c14;
    --surf:    #0d1320;
    --surf2:   #111827;
    --brd:     #1a2540;
    --brd2:    #243050;
    --text:    #e8f0ff;
    --mid:     #6b7fa3;
    --dim:     #2e3d5a;
    --blue:    #3b82f6;
    --blue-hi: #60a5fa;
    --green:   #06d6a0;
    --red:     #f43f5e;
    --mono:    'DM Mono', monospace;
    --disp:    'Syne', sans-serif;
    --body:    'DM Sans', sans-serif;
    --r:       14px;
  }

  @keyframes spin  { to{transform:rotate(360deg)} }
  @keyframes scanY { 0%{top:-4px;opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{top:calc(100% + 4px);opacity:0} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.92)} }
  @keyframes dotB  { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-7px)} }

  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:var(--surf)}
  ::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:2px}

  .rx-input {
    width:100%; padding:9px 12px;
    background:var(--surf2); border:1px solid var(--brd);
    border-radius:10px; color:var(--text);
    font-family:var(--body); font-size:13px; outline:none;
    transition:border-color .2s, box-shadow .2s;
  }
  .rx-input::placeholder { color:var(--dim) }
  .rx-input:focus { border-color:rgba(59,130,246,.5); box-shadow:0 0 0 3px rgba(59,130,246,.08) }

  .rx-select {
    width:100%; padding:9px 36px 9px 12px;
    background:var(--surf2); border:1px solid var(--brd);
    border-radius:10px; color:var(--text);
    font-family:var(--body); font-size:13px;
    outline:none; cursor:pointer; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7fa3' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 12px center;
    transition:border-color .2s;
  }
  .rx-select option { background:#0d1320 }

  .rx-btn {
    display:inline-flex; align-items:center; justify-content:center; gap:7px;
    border:none; border-radius:10px; cursor:pointer;
    font-family:var(--body); font-weight:600; font-size:13px;
    transition:all .18s ease; white-space:nowrap;
  }
  .rx-btn:hover:not(:disabled) { filter:brightness(1.12); transform:translateY(-1px) }
  .rx-btn:active:not(:disabled) { transform:translateY(0) scale(.97) }
  .rx-btn:disabled { opacity:.4; cursor:not-allowed }

  .rx-card { background:var(--surf); border:1px solid var(--brd); border-radius:var(--r) }

  .rx-drop {
    border:2px dashed var(--brd2); border-radius:var(--r);
    background:var(--surf); cursor:pointer; text-align:center;
    transition:all .22s ease;
  }
  .rx-drop:hover { border-color:rgba(59,130,246,.4); background:rgba(59,130,246,.03) }
  .rx-drop.drag-over { border-color:var(--blue); background:rgba(59,130,246,.06); transform:scale(1.01) }

  .tb-btn {
    width:32px; height:32px; border-radius:8px;
    border:1px solid var(--brd); background:var(--surf2);
    cursor:pointer; color:var(--mid);
    display:flex; align-items:center; justify-content:center;
    transition:all .18s; flex-shrink:0;
  }
  .tb-btn:hover { border-color:rgba(59,130,246,.4); color:var(--blue); background:rgba(59,130,246,.06) }
  .tb-btn.on    { border-color:var(--blue); color:var(--blue); background:rgba(59,130,246,.1) }
  .tb-btn:disabled { opacity:.25; cursor:not-allowed }

  .rx-label {
    font-family:var(--mono); font-size:10px; font-weight:500;
    color:var(--mid); letter-spacing:.1em; text-transform:uppercase;
    display:flex; align-items:center; gap:5px;
  }
  .rx-tag {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 9px; border-radius:6px;
    font-family:var(--mono); font-size:10px; font-weight:500; letter-spacing:.06em;
  }

  .server-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:4px 12px; border-radius:99px;
    font-family:var(--mono); font-size:10px; border:1px solid; transition:all .3s;
  }
  .rx-slider {
    -webkit-appearance:none; width:100%; height:4px; border-radius:2px;
    background:var(--brd2); outline:none; cursor:pointer;
  }
  .rx-slider::-webkit-slider-thumb {
    -webkit-appearance:none; width:14px; height:14px; border-radius:50%;
    background:var(--blue); cursor:pointer; box-shadow:0 0 0 3px rgba(59,130,246,.2);
  }

  @media(max-width:900px) {
    .det-layout { grid-template-columns:1fr !important }
    .det-sidebar { display:none !important }
  }
  @media(max-width:580px) {
    .det-root { padding:80px 14px 40px !important }
    .act-row  { flex-wrap:wrap }
  }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CIRCULAR CONFIDENCE METER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CircularProgress({ value, color, size = 96, stroke = 7 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (value / 100) * circ;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(.22,.68,0,1.2)",
                   filter:`drop-shadow(0 0 6px ${color}88)` }}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={1} opacity={0.13} strokeDasharray={circ}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex",
        flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:"var(--disp)", fontSize:20, fontWeight:800,
          color, lineHeight:1 }}>
          {Math.round(value)}<span style={{ fontSize:11, fontWeight:600 }}>%</span>
        </span>
        <span style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--mid)",
          letterSpacing:".06em", marginTop:2 }}>CERTAINTY</span>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PDF REPORT GENERATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generatePDF({ patient, studyDate, region, detections }) {
  const now = new Date().toLocaleString("en-GB");
  const id  = "RLX-" + Date.now().toString(36).toUpperCase();
  const topConf = detections[0]?.confidence || 0;
  const sev = getSeverity(topConf);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Radiologix Fracture Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:#f7f9fc;color:#1a2040}
  .page{max-width:794px;margin:0 auto;background:#fff;min-height:1100px;padding:48px 56px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e5eaf5;padding-bottom:24px;margin-bottom:28px}
  .logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#1e3a8a}
  .logo span{color:#3b82f6}
  .stitle{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.12em;color:#8a9bc0;text-transform:uppercase;margin:0 0 10px;display:flex;align-items:center;gap:6px}
  .stitle::after{content:'';flex:1;height:1px;background:#e5eaf5;margin-left:8px}
  .igrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px}
  .ibox{background:#f7f9fc;border:1px solid #e5eaf5;border-radius:8px;padding:12px}
  .ilabel{font-family:'DM Mono',monospace;font-size:9px;color:#8a9bc0;letter-spacing:.08em;margin-bottom:4px}
  .ivalue{font-weight:600;font-size:13px}
  .pcard{background:${sev.bg};border:1.5px solid ${sev.border};border-radius:12px;padding:24px;margin-bottom:20px}
  .prow{display:flex;align-items:center;gap:20px}
  .ring{width:88px;height:88px;position:relative;flex-shrink:0}
  .ring svg{transform:rotate(-90deg)}
  .rcenter{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .fname{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin-bottom:6px;color:#1a2040}
  .sevbadge{display:inline-block;padding:4px 12px;border-radius:99px;font-family:'DM Mono',monospace;font-size:10px;font-weight:700;background:${sev.bg};color:${sev.color};border:1px solid ${sev.border};margin-bottom:8px}
  .dtable{width:100%;border-collapse:collapse;margin-bottom:22px}
  .dtable th{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.08em;color:#8a9bc0;text-align:left;border-bottom:1px solid #e5eaf5;padding-bottom:7px;font-weight:500}
  .dtable td{padding:9px 0;border-bottom:1px solid #f0f3fa;font-size:13px;vertical-align:middle}
  .barw{height:5px;background:#e5eaf5;border-radius:3px;width:100px;display:inline-block}
  .barf{height:100%;border-radius:3px;background:${FRACTURE_CLASS.color}}
  .vbox{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-top:18px;display:flex;align-items:flex-start;gap:10px}
  .foot{margin-top:40px;padding-top:14px;border-top:1px solid #e5eaf5;display:flex;justify-content:space-between;align-items:center}
  .disc{font-size:9px;color:#b0bcd8;max-width:380px;line-height:1.5}
  .wm{font-family:'DM Mono',monospace;font-size:9px;color:#c5cce0}
</style></head><body><div class="page">

  <div class="hdr">
    <div>
      <div class="logo">Radio<span>logix</span></div>
      <div style="font-size:11px;color:#8a9bc0;margin-top:4px">AI Bone Fracture Detection · YOLOv8m</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:14px;font-weight:700;color:#1a2040;margin-bottom:4px">DIAGNOSTIC REPORT</div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:#8a9bc0">${id}</div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:#8a9bc0">${now}</div>
    </div>
  </div>

  <div class="stitle">Patient Information</div>
  <div class="igrid">
    <div class="ibox"><div class="ilabel">Patient ID</div><div class="ivalue">${patient || "—"}</div></div>
    <div class="ibox"><div class="ilabel">Study Date</div><div class="ivalue">${studyDate || now.split(",")[0]}</div></div>
    <div class="ibox"><div class="ilabel">Anatomical Region</div><div class="ivalue">${region || "—"}</div></div>
  </div>

  <div class="stitle">Primary Finding</div>
  <div class="pcard">
    <div class="prow">
      <div class="ring">
        <svg width="88" height="88">
          <circle cx="44" cy="44" r="37" fill="none" stroke="#e5eaf5" stroke-width="7"/>
          <circle cx="44" cy="44" r="37" fill="none" stroke="${FRACTURE_CLASS.color}" stroke-width="7"
            stroke-linecap="round"
            stroke-dasharray="${2 * Math.PI * 37}"
            stroke-dashoffset="${2 * Math.PI * 37 * (1 - topConf)}"/>
        </svg>
        <div class="rcenter">
          <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:${FRACTURE_CLASS.color}">${Math.round(topConf * 100)}%</div>
          <div style="font-family:'DM Mono',monospace;font-size:7px;color:#8a9bc0">CERTAINTY</div>
        </div>
      </div>
      <div style="flex:1">
        <div class="fname">🦴 Fracture Detected</div>
        <div class="sevbadge">${sev.label}</div>
        <div style="font-size:12px;color:#5a6888;line-height:1.65;margin-top:6px">
          The AI model detected ${detections.length} fracture region${detections.length > 1 ? "s" : ""} in this X-ray.
          Confidence scores range from ${Math.round(Math.min(...detections.map(d => d.confidence)) * 100)}%
          to ${Math.round(Math.max(...detections.map(d => d.confidence)) * 100)}%.
          This finding requires radiologist review for definitive diagnosis and AO/OTA classification.
        </div>
      </div>
    </div>
  </div>

  <div class="stitle">All Detected Regions (${detections.length})</div>
  <table class="dtable">
    <thead><tr>
      <th>#</th><th>CLASS</th><th>CONFIDENCE</th><th>LOCATION (normalised)</th>
    </tr></thead>
    <tbody>
      ${detections.map((d, i) => `<tr>
        <td style="color:#8a9bc0;font-family:'DM Mono',monospace;font-size:11px">${i + 1}</td>
        <td><strong>${d.label || "Fracture"}</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="barw"><div class="barf" style="width:${d.confidence * 100}%"></div></div>
            <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:${FRACTURE_CLASS.color}">${Math.round(d.confidence * 100)}%</span>
          </div>
        </td>
        <td style="font-family:'DM Mono',monospace;font-size:10px;color:#8a9bc0">
          x=${d.x.toFixed(2)} y=${d.y.toFixed(2)} w=${d.w.toFixed(2)} h=${d.h.toFixed(2)}
        </td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="vbox">
    <span style="font-size:18px">⚕️</span>
    <div>
      <div style="font-weight:700;font-size:13px;color:#92400e;margin-bottom:4px">Physician Review Required</div>
      <div style="font-size:12px;color:#78350f;line-height:1.6">
        This report is generated by an AI model (YOLOv8m) trained to detect the <em>presence</em> of bone fractures.
        It does not provide AO/OTA fracture classification or treatment recommendations.
        A licensed radiologist or orthopedic specialist must review this finding before any clinical decision is made.
      </div>
    </div>
  </div>

  <div class="foot">
    <div class="disc">⚠ For clinical reference only. AI detection — not a substitute for professional medical diagnosis.</div>
    <div class="wm">RADIOLOGIX v1.0 · YOLOv8m · 1-CLASS MODEL</div>
  </div>
</div></body></html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 900);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function DetectPage() {
  const { user } = useAuth();

  const [image,        setImage]        = useState(null);
  const [imageFile,    setImageFile]    = useState(null);
  const [detections,   setDetections]   = useState(null);  // array of detections or []
  const [status,       setStatus]       = useState("idle");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [saved,        setSaved]        = useState(false);
  const [validated,    setValidated]    = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const [cameraOn,     setCameraOn]     = useState(false);
  const [animKey,      setAnimKey]      = useState(0);
  const [patientId,    setPatientId]    = useState("");
  const [studyDate,    setStudyDate]    = useState("");
  const [region,       setRegion]       = useState("");
  const [zoom,         setZoom]         = useState(1);
  const [inverted,     setInverted]     = useState(false);
  const [showBoxes,    setShowBoxes]    = useState(true);
  const [hovDet,       setHovDet]       = useState(null);
  const [serverStatus, setServerStatus] = useState("unknown");
  const [inferenceMs,  setInferenceMs]  = useState(null);
  const [confThresh,   setConfThresh]   = useState(0.25);
  const [iouThresh,    setIouThresh]    = useState(0.45);
  const [showSettings, setShowSettings] = useState(false);

  const fileRef   = useRef();
  const videoRef  = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();

  // ── Health check every 30s ────────────────────────────────────
  useEffect(() => {
    const ping = async () => {
      setServerStatus("checking");
      try { await checkHealth(); setServerStatus("online"); }
      catch  { setServerStatus("offline"); }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => clearInterval(id);
  }, []);

  // ── Load image ────────────────────────────────────────────────
  const loadImage = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      setImage(e.target.result); setImageFile(file);
      setDetections(null); setSaved(false); setValidated(false);
      setStatus("idle"); setErrorMsg(""); setZoom(1);
      setInverted(false); setShowBoxes(true); setInferenceMs(null);
      setAnimKey(k => k + 1);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Camera ────────────────────────────────────────────────────
  const openCamera = async () => {
    setCameraOn(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:"environment" } });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
  };
  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob(blob => loadImage(new File([blob], `cap_${Date.now()}.jpg`, { type:"image/jpeg" })), "image/jpeg");
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOn(false);
  };
  const closeCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setCameraOn(false); };

  // ── ANALYZE — calls real FastAPI ──────────────────────────────
  const analyze = async () => {
    if (!imageFile) return;
    setStatus("analyzing"); setDetections(null);
    setSaved(false); setValidated(false); setErrorMsg("");

    try {
      const data = await callDetectAPI(imageFile, confThresh, iouThresh);
      setInferenceMs(data.inferenceMs ?? null);
      setDetections(data.detections || []);   // [] = no fracture found
      setStatus("done");
      setAnimKey(k => k + 1);
      setServerStatus("online");
    } catch (err) {
      setErrorMsg(err.message || "Unknown error");
      setStatus("error");
      if (/fetch|network|timeout/i.test(err.message)) setServerStatus("offline");
    }
  };

  // ── Save to Firestore ─────────────────────────────────────────
  const saveToFirestore = async () => {
    if (!detections || !imageFile || !user) return;
    try {
      const sRef = ref(storage, `scans/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(sRef, imageFile);
      const imageUrl = await getDownloadURL(sRef);
      await addDoc(collection(db, "scans"), {
        uid: user.uid, email: user.email, imageUrl,
        detections, patientId, studyDate, region,
        hasFracture: detections.length > 0,
        numFractures: detections.length,
        topConfidence: detections[0]?.confidence ?? null,
        inferenceMs, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid), { scanCount: increment(1) });
      setSaved(true);
    } catch (err) { console.error("Firestore save:", err); }
  };

  const reset = () => {
    setImage(null); setImageFile(null); setDetections(null);
    setStatus("idle"); setSaved(false); setValidated(false);
    setZoom(1); setInverted(false); setErrorMsg(""); setInferenceMs(null);
  };

  // ── Derived ───────────────────────────────────────────────────
  const hasFracture  = detections && detections.length > 0;
  const topDet       = detections?.[0];
  const topSev       = topDet ? getSeverity(topDet.confidence) : null;

  const serverCfg = {
    online:   { color:"#34d399", bg:"rgba(52,211,153,.1)",  border:"rgba(52,211,153,.3)",  label:"Backend Online" },
    offline:  { color:"#f43f5e", bg:"rgba(244,63,94,.1)",   border:"rgba(244,63,94,.3)",   label:"Backend Offline" },
    checking: { color:"#fbbf24", bg:"rgba(251,191,36,.1)",  border:"rgba(251,191,36,.3)",  label:"Checking…" },
    unknown:  { color:"#6b7fa3", bg:"rgba(107,127,163,.1)", border:"rgba(107,127,163,.3)", label:"Server Status" },
  }[serverStatus] || {};

  const pv = {
    hidden:  { opacity:0, y:14 },
    visible: { opacity:1, y:0, transition:{ duration:.38, ease:[.22,.68,0,1.2] } },
    exit:    { opacity:0, y:-8, transition:{ duration:.2 } },
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <>
      <style>{CSS}</style>

      {/* BG */}
      <div style={{ position:"fixed", inset:0, zIndex:-2,
        background:"radial-gradient(ellipse 90% 70% at 15% 5%,#0c1829 0%,#070c14 55%)" }}/>
      <div style={{ position:"fixed", inset:0, zIndex:-1, opacity:.28,
        backgroundImage:"linear-gradient(#1a2540 1px,transparent 1px),linear-gradient(90deg,#1a2540 1px,transparent 1px)",
        backgroundSize:"44px 44px" }}/>

      <div className="det-root" style={{ maxWidth:1220, margin:"0 auto",
        padding:"88px 28px 60px", fontFamily:"var(--body)" }}>

        {/* ══ HEADER ══ */}
        <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}}
          transition={{duration:.4,ease:[.22,.68,0,1.2]}}
          style={{ display:"flex", alignItems:"flex-start",
            justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:28 }}
        >
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
              {/* AI badge */}
              <div style={{
                display:"inline-flex", alignItems:"center", gap:6,
                background:"rgba(59,130,246,.12)", border:"1px solid rgba(59,130,246,.25)",
                borderRadius:99, padding:"4px 12px",
              }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#06d6a0",
                  display:"inline-block", animation:"pulse 2s ease infinite" }}/>
                <span style={{ color:"var(--blue-hi)", fontSize:10,
                  fontFamily:"var(--mono)", letterSpacing:".1em" }}>
                  RADIOLOGIX · AI ONLINE
                </span>
              </div>
              {/* Server status */}
              <div className="server-pill" style={{
                background: serverCfg.bg, borderColor: serverCfg.border, color: serverCfg.color,
              }}>
                {serverStatus === "online"  && <Wifi size={10}/>}
                {serverStatus === "offline" && <WifiOff size={10}/>}
                {serverCfg.label}
              </div>
              {/* Inference time badge */}
              {inferenceMs && (
                <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--mid)",
                  padding:"4px 10px", border:"1px solid var(--brd)", borderRadius:99 }}>
                  ⚡ {inferenceMs}ms
                </div>
              )}
            </div>
            <h1 style={{ fontFamily:"var(--disp)", fontSize:"clamp(20px,3.5vw,30px)",
              fontWeight:800, color:"var(--text)", lineHeight:1.1 }}>
              Bone Fracture Detection
            </h1>
            <p style={{ color:"var(--mid)", marginTop:7, fontSize:13.5 }}>
              Upload an X-ray · YOLOv8m detects fracture presence &amp; confidence score.
            </p>
          </div>

          <button onClick={() => setShowSettings(s => !s)} style={{
            display:"flex", alignItems:"center", gap:8,
            background:"var(--surf)", border:"1px solid var(--brd)",
            borderRadius:11, padding:"9px 15px", color:"var(--mid)",
            fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"var(--body)", flexShrink:0,
          }}>
            <Settings size={14}/> API Settings
            {showSettings ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
        </motion.div>

        {/* ══ SETTINGS PANEL ══ */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
              exit={{opacity:0,height:0}} transition={{duration:.28}}
              style={{ overflow:"hidden", marginBottom:16 }}>
              <div className="rx-card" style={{ padding:16 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>
                  <div>
                    <div className="rx-label" style={{ marginBottom:8 }}>Confidence Threshold</div>
                    <input type="range" className="rx-slider" min={0.05} max={0.90} step={0.05}
                      value={confThresh} onChange={e => setConfThresh(parseFloat(e.target.value))}/>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:5,
                      fontSize:11, color:"var(--mid)", fontFamily:"var(--mono)" }}>
                      <span>0.05</span>
                      <span style={{ color:"var(--blue-hi)", fontWeight:700 }}>{confThresh.toFixed(2)}</span>
                      <span>0.90</span>
                    </div>
                    <div style={{ fontSize:11, color:"var(--dim)", marginTop:4 }}>
                      Optimal from your sweep: 0.25
                    </div>
                  </div>
                  <div>
                    <div className="rx-label" style={{ marginBottom:8 }}>IoU Threshold (NMS)</div>
                    <input type="range" className="rx-slider" min={0.30} max={0.80} step={0.05}
                      value={iouThresh} onChange={e => setIouThresh(parseFloat(e.target.value))}/>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:5,
                      fontSize:11, color:"var(--mid)", fontFamily:"var(--mono)" }}>
                      <span>0.30</span>
                      <span style={{ color:"var(--blue-hi)", fontWeight:700 }}>{iouThresh.toFixed(2)}</span>
                      <span>0.80</span>
                    </div>
                    <div style={{ fontSize:11, color:"var(--dim)", marginTop:4 }}>
                      Optimal from your sweep: 0.60
                    </div>
                  </div>
                  <div>
                    <div className="rx-label" style={{ marginBottom:8 }}>Backend</div>
                    {[
                      ["Endpoint", API_BASE],
                      ["Model",    "YOLOv8m · best.pt"],
                      ["Classes",  "1 class: Fracture"],
                      ["Status",   serverStatus.toUpperCase()],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between",
                        fontSize:11, marginBottom:6 }}>
                        <span style={{ color:"var(--mid)" }}>{k}</span>
                        <span style={{ color:"var(--text)", fontFamily:"var(--mono)", fontSize:10 }}>{v}</span>
                      </div>
                    ))}
                    <button className="rx-btn"
                      onClick={async () => {
                        setServerStatus("checking");
                        try { await checkHealth(); setServerStatus("online"); }
                        catch { setServerStatus("offline"); }
                      }}
                      style={{ marginTop:6, padding:"7px 12px", width:"100%",
                        background:"rgba(59,130,246,.1)", border:"1px solid rgba(59,130,246,.25)",
                        color:"var(--blue-hi)", fontSize:11 }}>
                      <Wifi size={11}/> Re-check
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ 3-COLUMN LAYOUT ══ */}
        <div className="det-layout" style={{ display:"grid",
          gridTemplateColumns:"210px 1fr 348px", gap:18, alignItems:"start" }}>

          {/* ── LEFT SIDEBAR ── */}
          <motion.div className="det-sidebar"
            initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}}
            transition={{duration:.38,delay:.1}}
            style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Patient */}
            <div className="rx-card" style={{ padding:16 }}>
              <div className="rx-label" style={{ marginBottom:12 }}>
                <User size={11}/> Patient Context
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div>
                  <div style={{ fontSize:11, color:"var(--mid)", marginBottom:5,
                    display:"flex", alignItems:"center", gap:4 }}>
                    <User size={10}/> Patient ID
                  </div>
                  <input className="rx-input" placeholder="PT-00482"
                    value={patientId} onChange={e => setPatientId(e.target.value)}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"var(--mid)", marginBottom:5,
                    display:"flex", alignItems:"center", gap:4 }}>
                    <Calendar size={10}/> Study Date
                  </div>
                  <input className="rx-input" type="date"
                    value={studyDate} onChange={e => setStudyDate(e.target.value)}
                    style={{ colorScheme:"dark" }}/>
                </div>
              </div>
            </div>

            {/* Region */}
            <div className="rx-card" style={{ padding:16 }}>
              <div className="rx-label" style={{ marginBottom:12 }}>
                <Bone size={11}/> Anatomical Region
              </div>
              <select className="rx-select" value={region}
                onChange={e => setRegion(e.target.value)}>
                <option value="">Select region…</option>
                {ANATOMICAL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {region && (
                <div style={{ marginTop:10, padding:"7px 10px",
                  background:"rgba(59,130,246,.07)", border:"1px solid rgba(59,130,246,.15)",
                  borderRadius:8, fontSize:11, color:"var(--blue-hi)", fontFamily:"var(--mono)" }}>
                  Region: {region}
                </div>
              )}
            </div>

            {/* Model info — accurate for your real model */}
            <div className="rx-card" style={{ padding:16 }}>
              <div className="rx-label" style={{ marginBottom:12 }}>
                <Brain size={11}/> Model Info
              </div>
              {[
                ["Model",    "YOLOv8m"],
                ["Dataset",  "781 train"],
                ["Classes",  "1 (Fracture)"],
                ["Conf",     confThresh.toFixed(2)],
                ["IoU",      iouThresh.toFixed(2)],
              ].map(([k, v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:7, fontSize:12 }}>
                  <span style={{ color:"var(--mid)" }}>{k}</span>
                  <span style={{ color:"var(--text)", fontFamily:"var(--mono)",
                    fontSize:11, fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── CENTER (image viewer) ── */}
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
            transition={{duration:.38,delay:.15}}
            style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Toolbar */}
            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap",
              padding:"8px 12px",
              background:"var(--surf)", border:"1px solid var(--brd)", borderRadius:11 }}>
              <span style={{ fontSize:10, color:"var(--mid)",
                fontFamily:"var(--mono)", marginRight:2 }}>TOOLS</span>
              <button className="tb-btn" disabled={!image} title="Zoom In"
                onClick={() => setZoom(z => Math.min(z+.25,3))}><ZoomIn size={13}/></button>
              <button className="tb-btn" disabled={!image||zoom<=.5} title="Zoom Out"
                onClick={() => setZoom(z => Math.max(z-.25,.5))}><ZoomOut size={13}/></button>
              <button className="tb-btn" disabled={!image} title="Reset View"
                onClick={() => setZoom(1)}><RotateCcw size={13}/></button>
              <div style={{ width:1, height:20, background:"var(--brd)", margin:"0 2px" }}/>
              <button className={`tb-btn${inverted?" on":""}`} disabled={!image}
                title="Invert Colors" onClick={() => setInverted(v=>!v)}>
                <SunMoon size={13}/>
              </button>
              <button className={`tb-btn${showBoxes?" on":""}`}
                disabled={!hasFracture} title="Toggle Boxes"
                onClick={() => setShowBoxes(v=>!v)}>
                {showBoxes ? <Eye size={13}/> : <EyeOff size={13}/>}
              </button>
              {hasFracture && (
                <div className="rx-tag" style={{
                  background: showBoxes?"rgba(59,130,246,.1)":"transparent",
                  border:`1px solid ${showBoxes?"rgba(59,130,246,.3)":"var(--brd)"}`,
                  color: showBoxes?"var(--blue-hi)":"var(--mid)", transition:"all .2s",
                }}>
                  <Layers size={9}/> {showBoxes?"Overlay ON":"Overlay OFF"}
                </div>
              )}
              <span style={{ marginLeft:"auto", fontFamily:"var(--mono)",
                fontSize:11, color:"var(--mid)" }}>{Math.round(zoom*100)}%</span>
            </div>

            {/* Drop zone */}
            {!image && !cameraOn && (
              <div className={`rx-drop${dragOver?" drag-over":""}`}
                style={{ padding:"52px 28px" }}
                onDrop={e => { e.preventDefault(); setDragOver(false); loadImage(e.dataTransfer.files[0]); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current.click()}
              >
                <div style={{ fontSize:42, marginBottom:14, animation:"pulse 3s ease infinite" }}>🩻</div>
                <p style={{ color:"var(--text)", fontWeight:600, fontSize:14, marginBottom:6 }}>
                  Drop X-ray image here
                </p>
                <p style={{ color:"var(--mid)", fontSize:12.5 }}>
                  JPG · PNG · WebP · DICOM-exported
                </p>
                {serverStatus === "offline" && (
                  <div style={{ marginTop:14, padding:"8px 14px",
                    background:"rgba(244,63,94,.08)", border:"1px solid rgba(244,63,94,.2)",
                    borderRadius:8, fontSize:11, color:"var(--red)" }}>
                    ⚠ Backend offline — start uvicorn first
                  </div>
                )}
                <div style={{ marginTop:18, display:"inline-flex", alignItems:"center", gap:6,
                  padding:"7px 16px", background:"rgba(59,130,246,.08)",
                  border:"1px solid rgba(59,130,246,.2)", borderRadius:8,
                  color:"var(--blue-hi)", fontSize:12 }}>
                  <Upload size={12}/> Browse files
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden
              onChange={e => loadImage(e.target.files[0])}/>

            {/* Camera */}
            {cameraOn && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}
                style={{ position:"relative", borderRadius:14, overflow:"hidden", background:"#000" }}>
                <video ref={videoRef} autoPlay playsInline
                  style={{ width:"100%", display:"block", maxHeight:420, objectFit:"contain" }}/>
                <canvas ref={canvasRef} hidden/>
                <div style={{ position:"absolute", left:0, right:0, height:3, top:0,
                  background:"linear-gradient(90deg,transparent,var(--blue),transparent)",
                  animation:"scanY 1.8s linear infinite" }}/>
                <div style={{ position:"absolute", bottom:14, left:"50%",
                  transform:"translateX(-50%)", display:"flex", gap:10 }}>
                  <button className="rx-btn" onClick={capture}
                    style={{ padding:"10px 22px", background:"var(--green)", color:"#000" }}>
                    <Camera size={13}/> Capture
                  </button>
                  <button className="rx-btn" onClick={closeCamera}
                    style={{ padding:"10px 14px", background:"rgba(244,63,94,.15)",
                      border:"1px solid rgba(244,63,94,.3)", color:"var(--red)" }}>
                    <X size={13}/>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Image preview */}
            {image && (
              <motion.div key={animKey}
                initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}}
                transition={{duration:.33,ease:[.22,.68,0,1.2]}}
                style={{ position:"relative", borderRadius:14, overflow:"hidden",
                  border:"1px solid var(--brd)", background:"#000",
                  boxShadow:"0 8px 40px rgba(0,0,0,.55)" }}>
                <div style={{ overflow:"hidden", lineHeight:0 }}>
                  <img src={image} alt="X-ray"
                    style={{ width:"100%", display:"block", maxHeight:480, objectFit:"contain",
                      transform:`scale(${zoom})`, transformOrigin:"center",
                      transition:"transform .3s ease",
                      filter:inverted?"invert(1)":"none" }}/>
                </div>

                {/* Scan overlay */}
                {status==="analyzing" && (
                  <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
                    <div style={{ position:"absolute", left:0, right:0, height:4, top:0,
                      background:"linear-gradient(90deg,transparent,rgba(59,130,246,.9),transparent)",
                      animation:"scanY 1.1s linear infinite" }}/>
                    <div style={{ position:"absolute", inset:0,
                      background:"repeating-linear-gradient(0deg,rgba(59,130,246,.04) 0,rgba(59,130,246,.04) 1px,transparent 1px,transparent 4px)" }}/>
                    <div style={{ position:"absolute", inset:0, display:"flex",
                      alignItems:"center", justifyContent:"center" }}>
                      <div style={{ background:"rgba(7,12,20,.88)", border:"1px solid var(--brd2)",
                        borderRadius:12, padding:"13px 22px",
                        display:"flex", alignItems:"center", gap:10, backdropFilter:"blur(8px)" }}>
                        <div style={{ width:16, height:16, borderRadius:"50%",
                          border:"2px solid rgba(255,255,255,.2)", borderTopColor:"var(--blue)",
                          animation:"spin .7s linear infinite" }}/>
                        <span style={{ color:"var(--text)", fontFamily:"var(--mono)", fontSize:12 }}>
                          YOLOv8m · Detecting…
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detection boxes — all are "Fracture" class */}
                {status==="done" && hasFracture && showBoxes && (
                  <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
                    {detections.map((d, i) => {
                      const hov = hovDet===i;
                      const boxColor = FRACTURE_CLASS.color;
                      return (
                        <motion.div key={i}
                          initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}}
                          transition={{delay:i*.1}}
                          style={{
                            position:"absolute",
                            left:`${d.x*100}%`, top:`${d.y*100}%`,
                            width:`${d.w*100}%`, height:`${d.h*100}%`,
                            border:`${hov?2.5:1.5}px solid ${boxColor}`,
                            borderRadius:5,
                            boxShadow:`0 0 ${hov?22:10}px ${boxColor}${hov?"99":"55"}, inset 0 0 10px ${boxColor}12`,
                            pointerEvents:"auto", cursor:"pointer",
                            transition:"box-shadow .2s",
                          }}
                          onMouseEnter={() => setHovDet(i)}
                          onMouseLeave={() => setHovDet(null)}
                        >
                          <div style={{ position:"absolute", top:-24, left:0,
                            background:boxColor, color:"#fff",
                            fontSize:10, fontWeight:800, padding:"3px 8px",
                            borderRadius:"5px 5px 0 0", whiteSpace:"nowrap",
                            fontFamily:"var(--mono)",
                            display:"flex", alignItems:"center", gap:4 }}>
                            <Crosshair size={8} strokeWidth={3}/>
                            Fracture · {Math.round(d.confidence*100)}%
                          </div>
                          {[[0,0],[100,0],[0,100],[100,100]].map(([px,py],pi) => (
                            <div key={pi} style={{
                              position:"absolute",
                              left:px===0?-2:"calc(100% - 2px)",
                              top:py===0?-2:"calc(100% - 2px)",
                              width:5, height:5, background:boxColor, borderRadius:1 }}/>
                          ))}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* HUD */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"7px 13px",
                  background:"linear-gradient(transparent,rgba(7,12,20,.8))",
                  display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"rgba(255,255,255,.35)", fontFamily:"var(--mono)", fontSize:9 }}>
                    {imageFile?.name||"scan.jpg"}
                  </span>
                  <span style={{ color:"rgba(255,255,255,.28)", fontFamily:"var(--mono)", fontSize:9 }}>
                    {Math.round(zoom*100)}% · {inverted?"INV":"NORM"}
                    {inferenceMs ? ` · ${inferenceMs}ms` : ""}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Action row */}
            <div className="act-row" style={{ display:"flex", gap:8 }}>
              {!cameraOn && (
                <button className="rx-btn" onClick={openCamera} style={{
                  padding:"11px 14px", background:"var(--surf)",
                  border:"1px solid var(--brd)", color:"var(--mid)" }}>
                  <Camera size={13}/> Camera
                </button>
              )}
              <button className="rx-btn" onClick={() => fileRef.current.click()} style={{
                padding:"11px 14px", background:"var(--surf)",
                border:"1px solid var(--brd)", color:"var(--mid)" }}>
                <Upload size={13}/> Upload
              </button>
              {image && (
                <button className="rx-btn" onClick={analyze}
                  disabled={status==="analyzing" || serverStatus==="offline"}
                  title={serverStatus==="offline"?"Backend offline":"Analyze X-ray"}
                  style={{
                    flex:1, padding:"11px",
                    background: serverStatus==="offline"
                      ? "rgba(244,63,94,.15)"
                      : "linear-gradient(135deg,var(--blue),var(--blue-hi))",
                    border: serverStatus==="offline" ? "1px solid rgba(244,63,94,.3)" : "none",
                    color: serverStatus==="offline" ? "var(--red)" : "#fff",
                    boxShadow: status!=="analyzing" && serverStatus!=="offline"
                      ? "0 4px 20px rgba(59,130,246,.35)" : "none",
                    opacity: status==="analyzing" ? .55 : 1,
                  }}>
                  {status==="analyzing"
                    ? <><div style={{ width:13,height:13,borderRadius:"50%",
                        border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",
                        animation:"spin .7s linear infinite" }}/> Analyzing…</>
                    : serverStatus==="offline"
                    ? <><WifiOff size={13}/> Backend Offline</>
                    : <><Scan size={13}/> Analyze</>}
                </button>
              )}
              {image && (
                <button className="rx-btn" onClick={reset} style={{
                  padding:"11px 13px", background:"transparent",
                  border:"1px solid var(--brd)", color:"var(--mid)" }}>
                  <RotateCcw size={13}/>
                </button>
              )}
            </div>
          </motion.div>

          {/* ── RIGHT PANEL (results) ── */}
          <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}}
            transition={{duration:.38,delay:.2}}
            style={{ display:"flex", flexDirection:"column", gap:13 }}>
            <AnimatePresence mode="wait">

              {/* IDLE */}
              {status==="idle" && !detections && (
                <motion.div key="idle" variants={pv} initial="hidden" animate="visible" exit="exit">
                  <div className="rx-card" style={{ padding:"48px 22px", textAlign:"center",
                    minHeight:300, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center", gap:12 }}>
                    <div style={{ fontSize:38, animation:"pulse 3s ease infinite" }}>📋</div>
                    <p style={{ color:"var(--text)", fontWeight:600, fontSize:14 }}>Diagnostic Card</p>
                    <p style={{ color:"var(--mid)", fontSize:12, lineHeight:1.65 }}>
                      Upload an X-ray and click Analyze.<br/>
                      The model will detect fracture presence.
                    </p>
                    <div style={{ fontFamily:"var(--mono)", fontSize:10,
                      color:"var(--dim)", letterSpacing:".1em" }}>AWAITING SCAN INPUT</div>
                  </div>
                </motion.div>
              )}

              {/* ANALYZING */}
              {status==="analyzing" && (
                <motion.div key="analyzing" variants={pv} initial="hidden" animate="visible" exit="exit">
                  <div className="rx-card" style={{ padding:"40px 22px", textAlign:"center" }}>
                    <div style={{ position:"relative", width:70, height:70, margin:"0 auto 20px" }}>
                      <div style={{ position:"absolute", inset:0, borderRadius:"50%",
                        border:"2px solid var(--brd2)", borderTop:"2px solid var(--blue)",
                        animation:"spin .85s linear infinite" }}/>
                      <div style={{ position:"absolute", inset:8, borderRadius:"50%",
                        border:"2px solid var(--brd)", borderBottom:"2px solid var(--green)",
                        animation:"spin 1.3s linear infinite reverse" }}/>
                      <div style={{ position:"absolute", inset:0, display:"flex",
                        alignItems:"center", justifyContent:"center", fontSize:20 }}>🔬</div>
                    </div>
                    <p style={{ color:"var(--text)", fontFamily:"var(--disp)",
                      fontWeight:700, fontSize:15, marginBottom:6 }}>YOLOv8m Inference</p>
                    <p style={{ color:"var(--mid)", fontSize:12, marginBottom:18 }}>
                      Sending to FastAPI · analyzing bone structure…
                    </p>
                    <div style={{ display:"flex", justifyContent:"center", gap:5 }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width:7, height:7, borderRadius:"50%",
                          background:"var(--blue)",
                          animation:`dotB 1.2s ease ${i*.18}s infinite` }}/>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DONE — NO FRACTURE */}
              {status==="done" && detections && !hasFracture && (
                <motion.div key="no-frac" variants={pv} initial="hidden" animate="visible" exit="exit">
                  <div className="rx-card" style={{ padding:"40px 22px", textAlign:"center" }}>
                    <div style={{ fontSize:40, marginBottom:14 }}>✅</div>
                    <p style={{ color:"var(--green)", fontFamily:"var(--disp)",
                      fontWeight:700, fontSize:16, marginBottom:8 }}>
                      No Fracture Detected
                    </p>
                    <p style={{ color:"var(--mid)", fontSize:12, lineHeight:1.65, marginBottom:14 }}>
                      The model found no fractures above the confidence threshold ({confThresh.toFixed(2)}).
                    </p>
                    <div style={{ padding:"9px 12px",
                      background:"rgba(6,214,160,.06)", border:"1px solid rgba(6,214,160,.18)",
                      borderRadius:9, fontSize:11, color:"rgba(6,214,160,.8)", lineHeight:1.55,
                      display:"flex", gap:7, alignItems:"flex-start", textAlign:"left" }}>
                      <Info size={11} style={{ flexShrink:0, marginTop:1 }}/>
                      If you expect a fracture, try lowering the confidence threshold in API Settings.
                    </div>
                    {inferenceMs && (
                      <div style={{ marginTop:12, fontFamily:"var(--mono)",
                        fontSize:10, color:"var(--dim)" }}>⚡ {inferenceMs}ms</div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* DONE — FRACTURE FOUND */}
              {status==="done" && hasFracture && topDet && (
                <motion.div key="done" variants={pv} initial="hidden" animate="visible" exit="exit"
                  style={{ display:"flex", flexDirection:"column", gap:12 }}>

                  {/* PRIMARY CARD */}
                  <div style={{
                    background:`linear-gradient(145deg,${topSev.bg},rgba(13,19,32,.92))`,
                    border:`1px solid ${topSev.border}`,
                    borderRadius:16, padding:20,
                    boxShadow:`0 8px 40px ${FRACTURE_CLASS.color}18`,
                  }}>
                    <div style={{ display:"flex", alignItems:"center",
                      justifyContent:"space-between", marginBottom:16 }}>
                      <div>
                        <div className="rx-label" style={{ marginBottom:4 }}>
                          <Stethoscope size={10}/> Primary Finding
                        </div>
                        <div style={{ fontFamily:"var(--disp)", fontWeight:800,
                          fontSize:"clamp(17px,2.3vw,21px)", color:"var(--text)", lineHeight:1.1 }}>
                          Fracture Detected
                        </div>
                      </div>
                      <div style={{ fontSize:28,
                        filter:`drop-shadow(0 0 8px ${FRACTURE_CLASS.color}88)` }}>
                        🦴
                      </div>
                    </div>

                    {/* Confidence ring */}
                    <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                      <CircularProgress value={topDet.confidence*100}
                        color={FRACTURE_CLASS.color} size={90} stroke={7}/>
                      <div style={{ flex:1 }}>
                        {/* Severity badge */}
                        <div style={{ marginBottom:8 }}>
                          <div className="rx-tag" style={{
                            background: topSev.bg, border:`1px solid ${topSev.border}`,
                            color: topSev.color }}>
                            <AlertTriangle size={8}/> {topSev.label}
                          </div>
                        </div>
                        {/* Region info */}
                        {region && (
                          <div style={{ marginBottom:6, fontSize:11, color:"var(--mid)",
                            fontFamily:"var(--mono)", display:"flex", alignItems:"center", gap:4 }}>
                            <Bone size={9}/> {region}
                          </div>
                        )}
                        {patientId && (
                          <div style={{ fontSize:11, color:"var(--mid)", fontFamily:"var(--mono)",
                            display:"flex", alignItems:"center", gap:4 }}>
                            <User size={9}/> {patientId}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5,
                        fontSize:10, color:"var(--mid)", fontFamily:"var(--mono)" }}>
                        <span>CONFIDENCE</span>
                        <span style={{ color:FRACTURE_CLASS.color }}>
                          {Math.round(topDet.confidence*100)}%
                        </span>
                      </div>
                      <div style={{ height:5, background:"rgba(255,255,255,.07)",
                        borderRadius:3, overflow:"hidden" }}>
                        <motion.div
                          initial={{width:0}}
                          animate={{width:`${topDet.confidence*100}%`}}
                          transition={{duration:1.1,ease:[.22,.68,0,1.2]}}
                          style={{ height:"100%", borderRadius:3,
                            background:`linear-gradient(90deg,${FRACTURE_CLASS.color},${FRACTURE_CLASS.color}bb)`,
                            boxShadow:`0 0 8px ${FRACTURE_CLASS.color}66` }}/>
                      </div>
                    </div>

                    {/* Note */}
                    <div style={{ marginTop:12, padding:"9px 11px",
                      background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.05)",
                      borderRadius:9, fontSize:12, color:"var(--mid)", lineHeight:1.65,
                      display:"flex", gap:7 }}>
                      <Info size={12} style={{ flexShrink:0, marginTop:2,
                        color:"var(--blue-hi)", opacity:.7 }}/>
                      Your model detects fracture <em>presence</em>. AO/OTA classification and
                      fracture type require radiologist review.
                    </div>

                    {inferenceMs && (
                      <div style={{ marginTop:8, fontFamily:"var(--mono)", fontSize:10,
                        color:"var(--dim)", display:"flex", alignItems:"center", gap:4 }}>
                        ⚡ Model inference: {inferenceMs}ms
                      </div>
                    )}
                  </div>

                  {/* ALL DETECTIONS */}
                  <div className="rx-card" style={{ padding:16 }}>
                    <div className="rx-label" style={{ marginBottom:12 }}>
                      <BarChart3 size={11}/> Detected Regions ({detections.length})
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                      {detections.map((d, i) => {
                        const hov = hovDet===i;
                        return (
                          <motion.div key={i}
                            initial={{opacity:0,x:10}} animate={{opacity:1,x:0}}
                            transition={{delay:i*.07}}
                            onMouseEnter={() => setHovDet(i)}
                            onMouseLeave={() => setHovDet(null)}
                            style={{ display:"flex", alignItems:"center", gap:10,
                              padding:"7px 10px", borderRadius:9,
                              background:hov?`${FRACTURE_CLASS.color}0a`:"transparent",
                              border:`1px solid ${hov?FRACTURE_CLASS.color+"30":"transparent"}`,
                              transition:"all .18s", cursor:"pointer" }}>
                            <span style={{ fontSize:15, flexShrink:0 }}>🦴</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12.5, fontWeight:600, color:"var(--text)" }}>
                                Fracture #{i+1}
                              </div>
                              <div style={{ fontFamily:"var(--mono)", fontSize:9,
                                color:"var(--mid)", marginTop:1 }}>
                                {d.label || "Fracture"} · conf {Math.round(d.confidence*100)}%
                              </div>
                            </div>
                            <div style={{ width:68, height:3, background:"var(--brd)",
                              borderRadius:2, overflow:"hidden", flexShrink:0 }}>
                              <motion.div
                                initial={{width:0}}
                                animate={{width:`${d.confidence*100}%`}}
                                transition={{delay:.1+i*.06,duration:.6,ease:[.22,.68,0,1.2]}}
                                style={{ height:"100%",
                                  background:FRACTURE_CLASS.color, borderRadius:2 }}/>
                            </div>
                            <span style={{ color:FRACTURE_CLASS.color, fontFamily:"var(--mono)",
                              fontSize:11, fontWeight:700, width:32, textAlign:"right" }}>
                              {Math.round(d.confidence*100)}%
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CLINICAL ACTIONS */}
                  <div className="rx-card" style={{ padding:16 }}>
                    <div className="rx-label" style={{ marginBottom:12 }}>
                      <Activity size={11}/> Clinical Actions
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <button className="rx-btn"
                        onClick={() => generatePDF({ patient:patientId, studyDate, region, detections })}
                        style={{ width:"100%", padding:"11px",
                          background:"linear-gradient(135deg,rgba(59,130,246,.14),rgba(96,165,250,.07))",
                          border:"1px solid rgba(59,130,246,.28)", color:"var(--blue-hi)" }}>
                        <FileText size={13}/> Generate PDF Report
                      </button>

                      <button className="rx-btn" onClick={() => setValidated(v=>!v)}
                        style={{ width:"100%", padding:"11px",
                          background:validated
                            ? "linear-gradient(135deg,rgba(6,214,160,.14),rgba(6,214,160,.07))"
                            : "var(--surf2)",
                          border:`1px solid ${validated?"rgba(6,214,160,.35)":"var(--brd)"}`,
                          color:validated?"var(--green)":"var(--mid)" }}>
                        <CheckCircle2 size={13}/>
                        {validated?"✓ Validated by Physician":"Validate Result"}
                      </button>

                      {validated && (
                        <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}
                          style={{ padding:"9px 12px",
                            background:"rgba(6,214,160,.06)", border:"1px solid rgba(6,214,160,.18)",
                            borderRadius:9, fontSize:11, color:"rgba(6,214,160,.8)", lineHeight:1.55,
                            display:"flex", gap:7, alignItems:"flex-start" }}>
                          <Shield size={11} style={{ flexShrink:0, marginTop:1 }}/>
                          Validation recorded. Helps improve model retraining data.
                        </motion.div>
                      )}

                      <button className="rx-btn" onClick={saveToFirestore} disabled={saved}
                        style={{ width:"100%", padding:"11px",
                          background:saved
                            ? "rgba(6,214,160,.08)"
                            : "linear-gradient(135deg,var(--green),#00b894)",
                          border:saved?"1px solid rgba(6,214,160,.22)":"none",
                          color:saved?"var(--green)":"#000", fontWeight:700,
                          boxShadow:saved?"none":"0 4px 20px rgba(6,214,160,.28)" }}>
                        {saved
                          ? <><CheckCircle2 size={13}/> Saved to History</>
                          : <><Download size={13}/> Save to My Scans</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ERROR */}
              {status==="error" && (
                <motion.div key="error" variants={pv} initial="hidden" animate="visible" exit="exit">
                  <div className="rx-card" style={{ padding:"32px 22px", textAlign:"center",
                    background:"rgba(244,63,94,.05)", borderColor:"rgba(244,63,94,.2)" }}>
                    <div style={{ fontSize:34, marginBottom:12 }}>⚠️</div>
                    <p style={{ color:"var(--red)", fontFamily:"var(--disp)",
                      fontWeight:700, fontSize:15, marginBottom:8 }}>Detection Failed</p>
                    <div style={{ padding:"10px 14px", marginBottom:14,
                      background:"rgba(244,63,94,.08)", border:"1px solid rgba(244,63,94,.2)",
                      borderRadius:9, fontSize:12, color:"rgba(244,63,94,.8)",
                      fontFamily:"var(--mono)", textAlign:"left", lineHeight:1.6 }}>
                      {errorMsg || "Unknown error"}
                    </div>
                    <div style={{ fontSize:12, color:"var(--mid)", marginBottom:18,
                      lineHeight:1.65, textAlign:"left" }}>
                      Check:
                      <ul style={{ marginTop:6, paddingLeft:18 }}>
                        <li>uvicorn is running on port 8000</li>
                        <li>best.pt is in the backend folder</li>
                        <li>.env has VITE_API_URL=http://localhost:8000</li>
                      </ul>
                    </div>
                    <button className="rx-btn" onClick={reset}
                      style={{ padding:"9px 22px", background:"var(--surf2)",
                        border:"1px solid var(--brd)", color:"var(--mid)" }}>
                      <RotateCcw size={12}/> Try Again
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer */}
        <div style={{ marginTop:44, textAlign:"center" }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:10,
            color:"var(--dim)", letterSpacing:".08em" }}>
            RADIOLOGIX · YOLOV8m · 1-CLASS FRACTURE DETECTION ·
            FOR CLINICAL REFERENCE ONLY
          </span>
        </div>
      </div>
    </>
  );
}
// src/pages/AuthPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Cylinder, Torus } from "@react-three/drei";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   FONTS & TOKENS
───────────────────────────────────────────────────────────────── */
const FONT_DISPLAY = "'Clash Display', 'Syne', sans-serif";
const FONT_BODY    = "'Satoshi', 'DM Sans', sans-serif";
const FONT_MONO    = "'JetBrains Mono', monospace";

/* ─────────────────────────────────────────────────────────────────
   GLOBAL CSS  (dark + light mode, full responsive)
───────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── CSS Variables: Dark ── */
  :root {
    --bg:           #04080f;
    --bg-panel:     rgba(255,255,255,0.018);
    --bg-input:     rgba(255,255,255,0.04);
    --bg-input-hov: rgba(255,255,255,0.07);
    --bg-tab-act:   linear-gradient(135deg,#112240,#1e4d8c);
    --bg-btn:       linear-gradient(135deg,#1e4d8c,#3b82c4);
    --bg-google:    rgba(255,255,255,0.04);
    --bg-google-hov:rgba(255,255,255,0.08);
    --border:       rgba(255,255,255,0.07);
    --border-focus: rgba(99,179,237,.55);
    --border-tab:   rgba(99,179,237,0.22);
    --border-logo:  rgba(99,179,237,0.3);
    --text-primary: #f0f4f8;
    --text-secondary:#4b5563;
    --text-muted:   #2d3748;
    --text-tab-off: #4b5563;
    --text-mono:    #374151;
    --accent:       #63b3ed;
    --accent-warm:  #fbbf24;
    --accent-teal:  #4fd1c5;
    --glow-blue:    rgba(30,77,140,0.22);
    --glow-teal:    rgba(79,209,197,0.10);
    --glow-mid:     rgba(99,179,237,0.07);
    --shadow-btn:   rgba(59,130,196,.35);
    --shadow-logo:  rgba(99,179,237,0.18);
    --err-bg:       rgba(252,129,129,0.07);
    --err-border:   rgba(252,129,129,0.22);
    --err-text:     #fc8181;
    --divider:      rgba(255,255,255,0.06);
    --tag-bg:       rgba(99,179,237,0.07);
    --tag-border:   rgba(99,179,237,0.14);
    --scan-color:   rgba(99,179,237,0.7);
    --bone-stroke:  rgba(99,179,237,0.3);
    --bone-fill:    rgba(99,179,237,0.07);
    --logo-bg:      linear-gradient(135deg,#0f2744,#1e4d8c);
    --hud-text:     rgba(99,179,237,0.45);
    --hud-sub:      rgba(99,179,237,0.3);
    --placeholder:  #374151;
    --grid-line:    rgba(99,179,237,0.028);
    --toggle-bg:    rgba(255,255,255,0.06);
    --toggle-thumb: rgba(255,255,255,0.15);
    --toggle-label: #4b5563;
  }

  /* ── CSS Variables: Light ── */
  .light {
    --bg:           #f0f4fa;
    --bg-panel:     rgba(255,255,255,0.75);
    --bg-input:     rgba(255,255,255,0.85);
    --bg-input-hov: rgba(255,255,255,1);
    --bg-tab-act:   linear-gradient(135deg,#dbeafe,#bfdbfe);
    --bg-btn:       linear-gradient(135deg,#1e4d8c,#3b82c4);
    --bg-google:    rgba(255,255,255,0.9);
    --bg-google-hov:rgba(255,255,255,1);
    --border:       rgba(0,0,0,0.09);
    --border-focus: rgba(59,130,246,.55);
    --border-tab:   rgba(59,130,246,0.4);
    --border-logo:  rgba(59,130,246,0.3);
    --text-primary: #0f172a;
    --text-secondary:#475569;
    --text-muted:   #94a3b8;
    --text-tab-off: #64748b;
    --text-mono:    #64748b;
    --accent:       #2563eb;
    --accent-warm:  #d97706;
    --accent-teal:  #0d9488;
    --glow-blue:    rgba(59,130,246,0.12);
    --glow-teal:    rgba(13,148,136,0.08);
    --glow-mid:     rgba(59,130,246,0.05);
    --shadow-btn:   rgba(37,99,235,.25);
    --shadow-logo:  rgba(59,130,246,0.18);
    --err-bg:       rgba(239,68,68,0.06);
    --err-border:   rgba(239,68,68,0.3);
    --err-text:     #dc2626;
    --divider:      rgba(0,0,0,0.08);
    --tag-bg:       rgba(37,99,235,0.07);
    --tag-border:   rgba(37,99,235,0.2);
    --scan-color:   rgba(59,130,246,0.8);
    --bone-stroke:  rgba(59,130,246,0.35);
    --bone-fill:    rgba(59,130,246,0.06);
    --logo-bg:      linear-gradient(135deg,#dbeafe,#bfdbfe);
    --hud-text:     rgba(37,99,235,0.5);
    --hud-sub:      rgba(37,99,235,0.35);
    --placeholder:  #94a3b8;
    --grid-line:    rgba(59,130,246,0.04);
    --toggle-bg:    rgba(0,0,0,0.06);
    --toggle-thumb: rgba(0,0,0,0.12);
    --toggle-label: #64748b;
  }

  /* ── Keyframes ── */
  @keyframes fadeUp    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes slideIn   { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
  @keyframes float     { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.02)} }
  @keyframes floatB    { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(1deg)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes scanMove  { 0%{top:-2px;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
  @keyframes pulse     { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
  @keyframes orb1      { 0%,100%{transform:translate(0,0)} 33%{transform:translate(40px,-30px)} 66%{transform:translate(-20px,20px)} }
  @keyframes orb2      { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,25px)} }
  @keyframes orb3      { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
  @keyframes gridDrift { from{background-position:0 0} to{background-position:0 40px} }
  @keyframes logoIn    { 0%{opacity:0;transform:scale(.5) rotate(-15deg)} 70%{transform:scale(1.1) rotate(4deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes pulseRing { 0%{transform:scale(.85);opacity:.7} 100%{transform:scale(1.45);opacity:0} }
  @keyframes badgeIn   { from{opacity:0;transform:scale(.8) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes bboxBlink { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes particleRise { 0%{transform:translateY(0) scale(1);opacity:0.7} 100%{transform:translateY(-80px) scale(0);opacity:0} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes breathe   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
  @keyframes typewriter{ from{width:0} to{width:100%} }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes drawLine  { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
  @keyframes rotateRing{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes counterRotate { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes signalPulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,179,237,0.4)} 50%{box-shadow:0 0 0 8px rgba(99,179,237,0)} }

  /* ── Layout ── */
  .auth-page {
    min-height: 100vh;
    display: flex;
    background: var(--bg);
    overflow: hidden;
    font-family: ${FONT_BODY};
    transition: background 0.4s ease;
    position: relative;
  }

  /* ── Left panel ── */
  .left-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 48px;
    position: relative;
    z-index: 1;
    min-width: 0;
  }

  /* ── Right panel ── */
  .right-panel {
    width: 480px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 36px;
    background: var(--bg-panel);
    border-left: 1px solid var(--border);
    position: relative;
    z-index: 1;
    transition: background 0.4s ease, border-color 0.4s ease;
    backdrop-filter: blur(20px);
  }

  /* ── Form elements ── */
  .auth-input {
    width: 100%;
    padding: 13px 16px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text-primary);
    font-family: ${FONT_BODY};
    font-size: 15px;
    font-weight: 300;
    outline: none;
    transition: border-color .25s, background .25s, box-shadow .25s;
  }
  .auth-input::placeholder { color: var(--placeholder); }
  .auth-input:hover:not(:focus) {
    border-color: rgba(99,179,237,0.25);
    background: var(--bg-input-hov);
  }
  .auth-input:focus {
    border-color: var(--border-focus);
    background: var(--bg-input-hov);
    box-shadow: 0 0 0 3px rgba(99,179,237,0.1);
  }

  .btn-primary {
    width: 100%; padding: 14px; border: none; border-radius: 12px;
    background: var(--bg-btn);
    color: #fff; font-family: ${FONT_BODY}; font-size: 15px; font-weight: 500;
    cursor: pointer; position: relative; overflow: hidden; letter-spacing: .02em;
    transition: opacity .2s, transform .15s, box-shadow .2s;
  }
  .btn-primary::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
    background-size: 200% 100%;
    opacity: 0;
    transition: opacity .3s;
  }
  .btn-primary:hover:not(:disabled)::before { opacity: 1; animation: shimmer 1.2s ease; }
  .btn-primary::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg,rgba(255,255,255,.06),transparent);
    pointer-events: none;
  }
  .btn-primary:hover:not(:disabled) {
    opacity: .92; transform: translateY(-1px);
    box-shadow: 0 8px 28px var(--shadow-btn);
  }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled { opacity: .5; cursor: not-allowed; }

  .btn-google {
    width: 100%; padding: 13px; border-radius: 12px;
    background: var(--bg-google);
    border: 1px solid var(--border);
    color: var(--text-primary); font-family: ${FONT_BODY}; font-size: 14px; font-weight: 400;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: background .2s, border-color .2s, transform .15s, box-shadow .2s;
  }
  .btn-google:hover:not(:disabled) {
    background: var(--bg-google-hov);
    border-color: rgba(99,179,237,0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  }
  .btn-google:active:not(:disabled) { transform: translateY(0); }
  .btn-google:disabled { opacity: .5; cursor: not-allowed; }

  .tab-btn {
    flex: 1; padding: 9px; border: none; border-radius: 9px;
    font-family: ${FONT_BODY}; font-size: 14px; font-weight: 500; cursor: pointer;
    transition: all .25s;
  }

  .field-wrap { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    font-size: 11px; font-weight: 500; color: var(--text-secondary);
    letter-spacing: .08em; text-transform: uppercase;
    transition: color 0.3s;
  }

  /* ── Theme toggle ── */
  .theme-toggle {
    position: fixed;
    top: 20px; right: 20px;
    z-index: 100;
    display: flex; align-items: center; gap: 8px;
    background: var(--toggle-bg);
    border: 1px solid var(--border);
    border-radius: 30px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all .3s;
    backdrop-filter: blur(10px);
  }
  .theme-toggle:hover { border-color: rgba(99,179,237,0.3); }
  .theme-toggle-track {
    width: 36px; height: 20px;
    background: rgba(99,179,237,0.2);
    border-radius: 10px;
    position: relative;
    transition: background .3s;
  }
  .theme-toggle-track.on { background: rgba(99,179,237,0.5); }
  .theme-toggle-thumb {
    position: absolute; top: 3px; left: 3px;
    width: 14px; height: 14px;
    background: var(--accent);
    border-radius: 50%;
    transition: transform .3s cubic-bezier(.34,1.56,.64,1), background .3s;
  }
  .theme-toggle-thumb.on { transform: translateX(16px); }

  /* ── Particle ── */
  .particle {
    position: absolute;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--accent);
    pointer-events: none;
    animation: particleRise 2s ease-out forwards;
  }

  /* ── Stat chips ── */
  .stat-chip {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    backdrop-filter: blur(12px);
    transition: all .3s;
  }
  .stat-chip:hover { border-color: rgba(99,179,237,0.3); transform: translateY(-2px); }

  /* ── Rotating ring ── */
  .ring-outer { animation: rotateRing 12s linear infinite; }
  .ring-inner { animation: counterRotate 8s linear infinite; }

  /* ── Scanning badge ── */
  .scanning-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #22c55e;
    animation: signalPulse 2s ease infinite;
  }

  /* ────────────────────────────────────────────────────────────
     RESPONSIVE
  ──────────────────────────────────────────────────────────── */

  /* Tablet: hide left panel decorative elements, keep 3D */
  @media (max-width: 1024px) {
    .left-panel { padding: 40px 24px; }
    .right-panel { width: 420px; padding: 32px 28px; }
    .floating-badge-right { right: -10px !important; }
    .floating-badge-left  { left:  -10px !important; }
  }

  /* Mobile: stack vertically */
  @media (max-width: 768px) {
    .auth-page { flex-direction: column; }

    .left-panel {
      padding: 32px 24px 20px;
      flex: none;
    }

    .right-panel {
      width: 100%;
      border-left: none;
      border-top: 1px solid var(--border);
      padding: 28px 20px 40px;
      align-items: flex-start;
    }

    .canvas-wrap { width: 220px !important; height: 220px !important; }

    .stats-row { flex-wrap: wrap; gap: 8px !important; }
    .stat-chip  { flex: 1; min-width: 100px; }

    .floating-badge-right,
    .floating-badge-left,
    .floating-badge-bottom { display: none !important; }

    .caption-text { display: none; }
  }

  @media (max-width: 480px) {
    .right-panel { padding: 24px 16px 36px; }
    .left-panel  { padding: 24px 16px 16px; }
    .theme-toggle { top: 12px; right: 12px; }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   3D BONE SCENE  — complete femur + fracture + glow
───────────────────────────────────────────────────────────────── */
function FractureIndicator({ position }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 3) * 0.3;
    }
  });
  return (
    <Torus ref={ref} args={[0.08, 0.025, 8, 20]} position={position}
      rotation={[Math.PI / 2, 0, Math.PI / 4]}>
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
    </Torus>
  );
}

function Bone3D({ isLight }) {
  const groupRef   = useRef();
  const glowRef    = useRef();
  const crackRef   = useRef();

  const boneColor   = isLight ? "#93c5fd" : "#bfdbfe";
  const emissive    = isLight ? "#1d4ed8" : "#1e4d8c";
  const jointColor  = isLight ? "#dbeafe" : "#e0f2fe";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.5;
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.18;
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.05;
    }
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = 0.08 + Math.sin(t * 1.5) * 0.04;
    }
    if (crackRef.current) {
      crackRef.current.material.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Femoral head (ball) ── */}
      <Sphere args={[0.32, 48, 48]} position={[0, 1.7, 0]}>
        <meshStandardMaterial
          color={jointColor} emissive={emissive} emissiveIntensity={0.12}
          roughness={0.25} metalness={0.15}
        />
      </Sphere>

      {/* ── Femoral neck ── */}
      <Cylinder args={[0.14, 0.18, 0.5, 32]} position={[-0.12, 1.35, 0]}
        rotation={[0, 0, -Math.PI / 6]}>
        <meshStandardMaterial color={boneColor} emissive={emissive}
          emissiveIntensity={0.08} roughness={0.3} metalness={0.1} />
      </Cylinder>

      {/* ── Greater trochanter ── */}
      <Sphere args={[0.2, 32, 32]} position={[-0.32, 1.15, 0]}>
        <meshStandardMaterial color={boneColor} emissive={emissive}
          emissiveIntensity={0.06} roughness={0.35} />
      </Sphere>

      {/* ── Shaft — upper half ── */}
      <Cylinder args={[0.155, 0.165, 1.3, 32]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color={boneColor} emissive={emissive}
          emissiveIntensity={0.07} roughness={0.3} metalness={0.12} />
      </Cylinder>

      {/* ── FRACTURE LINE (yellow crack cylinder) ── */}
      <Cylinder
        ref={crackRef}
        args={[0.17, 0.17, 0.025, 32]}
        position={[0, 0.05, 0]}
        rotation={[0, 0, Math.PI * 0.08]}
      >
        <meshStandardMaterial
          color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6}
          roughness={0.1} transparent opacity={0.9}
        />
      </Cylinder>

      {/* ── Fracture torus indicators ── */}
      <FractureIndicator position={[0.16, 0.05, 0]} />
      <FractureIndicator position={[-0.14, 0.07, 0.1]} />

      {/* ── Shaft — lower half ── */}
      <Cylinder args={[0.16, 0.2, 1.3, 32]} position={[0, -0.62, 0]}>
        <meshStandardMaterial color={boneColor} emissive={emissive}
          emissiveIntensity={0.07} roughness={0.3} metalness={0.12} />
      </Cylinder>

      {/* ── Medial condyle ── */}
      <Sphere args={[0.26, 32, 32]} position={[-0.15, -1.38, 0]}>
        <meshStandardMaterial color={jointColor} emissive={emissive}
          emissiveIntensity={0.1} roughness={0.25} metalness={0.15} />
      </Sphere>

      {/* ── Lateral condyle ── */}
      <Sphere args={[0.24, 32, 32]} position={[0.15, -1.38, 0]}>
        <meshStandardMaterial color={jointColor} emissive={emissive}
          emissiveIntensity={0.1} roughness={0.25} metalness={0.15} />
      </Sphere>

      {/* ── Inter-condylar notch ── */}
      <Cylinder args={[0.08, 0.08, 0.28, 16]} position={[0, -1.38, 0]}
        rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color={boneColor} emissive={emissive}
          emissiveIntensity={0.05} roughness={0.4} />
      </Cylinder>

      {/* ── Glow sphere at fracture site ── */}
      <Sphere ref={glowRef} args={[0.22, 16, 16]} position={[0, 0.05, 0]}>
        <meshStandardMaterial
          color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.08}
          transparent opacity={0.12} roughness={1}
        />
      </Sphere>
    </group>
  );
}

function BoneScene({ isLight }) {
  return (
    <Canvas
      camera={{ position: [3.5, 1.5, 3.5], fov: 45 }}
      style={{ height: "100%", width: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={isLight ? 1.2 : 0.5} />
      <directionalLight position={[8, 10, 6]} intensity={isLight ? 1.4 : 1.0} castShadow />
      <directionalLight position={[-6, -5, -4]} intensity={isLight ? 0.5 : 0.3} color={isLight ? "#dbeafe" : "#1e4d8c"} />
      <pointLight position={[0, 0, 4]} intensity={isLight ? 0.6 : 0.4} color={isLight ? "#bfdbfe" : "#63b3ed"} />
      <pointLight position={[0, 0.05, 0]} intensity={isLight ? 0.8 : 0.5} color="#fbbf24" distance={2} />
      <Bone3D isLight={isLight} />
      <OrbitControls
        enableZoom={false} enablePan={false}
        autoRotate={false}
        minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI * 0.75}
      />
    </Canvas>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ANIMATED X-RAY CARD  (2D SVG illustration)
───────────────────────────────────────────────────────────────── */
function XrayCard({ isLight }) {
  const bg     = isLight ? "rgba(241,245,249,0.95)" : "rgba(8,14,26,0.92)";
  const border = isLight ? "rgba(59,130,246,0.2)"   : "rgba(99,179,237,0.2)";
  const shadow = isLight
    ? "0 24px 60px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)"
    : "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(99,179,237,0.1)";
  const scan   = isLight ? "rgba(59,130,246,0.7)"  : "rgba(99,179,237,0.7)";
  const bStroke= isLight ? "rgba(59,130,246,0.3)"  : "rgba(99,179,237,0.3)";
  const bFill  = isLight ? "rgba(59,130,246,0.06)" : "rgba(99,179,237,0.07)";
  const hudT   = isLight ? "rgba(37,99,235,0.5)"   : "rgba(99,179,237,0.45)";
  const hudS   = isLight ? "rgba(37,99,235,0.35)"  : "rgba(99,179,237,0.3)";
  const gridL  = isLight ? "rgba(59,130,246,0.05)" : "rgba(99,179,237,0.04)";
  const botBg  = isLight ? "rgba(59,130,246,0.04)" : "rgba(99,179,237,0.04)";
  const corners= isLight ? "#2563eb" : "#63b3ed";

  return (
    <div style={{
      position: "relative", width: 260, height: 360,
      animation: "float 7s ease-in-out infinite",
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute", inset: -30,
        background: isLight
          ? "radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)"
          : "radial-gradient(ellipse, rgba(59,130,196,0.18) 0%, transparent 70%)",
        borderRadius: "50%", animation: "pulse 4s ease-in-out infinite",
      }} />

      {/* Film card */}
      <div style={{
        position: "relative", width: "100%", height: "100%",
        background: bg, border: `1px solid ${border}`, borderRadius: 16,
        overflow: "hidden", boxShadow: shadow,
      }}>
        {/* Scan line */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${scan} 50%, transparent)`,
          animation: "scanMove 3.5s ease-in-out infinite", zIndex: 10,
        }} />

        {/* Corners */}
        {[{top:10,left:10,d:"M0 8 L0 0 L8 0"},{top:10,right:10,d:"M0 0 L8 0 L8 8"},
          {bottom:10,left:10,d:"M0 0 L0 8 L8 8"},{bottom:10,right:10,d:"M8 0 L8 8 L0 8"}
        ].map((c, i) => (
          <svg key={i} width="12" height="12" viewBox="0 0 8 8"
            style={{ position:"absolute", ...Object.fromEntries(Object.entries(c).filter(([k])=>k!=='d')), opacity:0.6 }}>
            <path d={c.d} fill="none" stroke={corners} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray:20, strokeDashoffset:20, animation:"drawLine 1s ease .5s forwards" }} />
          </svg>
        ))}

        {/* SVG illustration */}
        <svg viewBox="0 0 260 360" style={{ width:"100%", height:"100%" }}>
          {/* Grid */}
          {Array.from({length:8},(_,i)=>(
            <line key={`h${i}`} x1="0" y1={45*i} x2="260" y2={45*i} stroke={gridL} strokeWidth="1"/>
          ))}
          {Array.from({length:6},(_,i)=>(
            <line key={`v${i}`} x1={52*i} y1="0" x2={52*i} y2="360" stroke={gridL} strokeWidth="1"/>
          ))}

          {/* Bone structure */}
          <ellipse cx="130" cy="62" rx="34" ry="28" fill={bFill} stroke={bStroke} strokeWidth="1"/>
          <rect x="110" y="72" width="40" height="200" rx="9" fill={bFill} stroke={bStroke} strokeWidth="1"/>
          <ellipse cx="98" cy="90" rx="18" ry="14" fill={bFill} stroke={bStroke} strokeWidth="0.8"/>
          <path d="M112 80 Q100 90 98 100" fill="none" stroke={bStroke} strokeWidth="1"/>
          <ellipse cx="118" cy="286" rx="20" ry="16" fill={bFill} stroke={bStroke} strokeWidth="1"/>
          <ellipse cx="142" cy="286" rx="20" ry="16" fill={bFill} stroke={bStroke} strokeWidth="1"/>

          {/* Internal bone texture */}
          <ellipse cx="130" cy="170" rx="12" ry="60" fill="none" stroke={bStroke} strokeWidth="0.5" strokeDasharray="3 5" opacity="0.5"/>

          {/* Fracture crack */}
          <path d="M110 165 L122 172 L115 178 L128 184 L152 177"
            fill="none" stroke="rgba(251,191,36,0.85)" strokeWidth="1.8"
            strokeDasharray="3 1.5"
            style={{ strokeDasharray:100, strokeDashoffset:100, animation:"drawLine 1.5s ease 1s forwards" }}/>

          {/* Detection bounding box */}
          <rect x="100" y="158" width="68" height="34" rx="4"
            fill="rgba(251,191,36,0.05)"
            stroke="rgba(251,191,36,0.65)" strokeWidth="1.2"
            style={{ animation:"bboxBlink 2s ease-in-out infinite" }}/>
          {/* Corner pips on bbox */}
          {[[100,158],[168,158],[100,192],[168,192]].map(([x,y],i)=>(
            <rect key={i} x={x-2} y={y-2} width="4" height="4" fill="rgba(251,191,36,0.9)"/>
          ))}

          {/* BBox label */}
          <rect x="100" y="144" width="68" height="16" rx="3" fill="rgba(251,191,36,0.85)"/>
          <text x="134" y="155" textAnchor="middle"
            fill="#1a1200" fontSize="7.5" fontFamily="monospace" fontWeight="700">
            Hairline · 91.2%
          </text>

          {/* HUD */}
          <text x="12" y="22" fill={hudT} fontSize="7.5" fontFamily="monospace">YOLOv8m</text>
          <text x="12" y="32" fill={hudS} fontSize="6.5" fontFamily="monospace">640×640 · FP16</text>
          <text x="248" y="22" fill={hudT} fontSize="7.5" fontFamily="monospace" textAnchor="end">12.4ms</text>
          <text x="248" y="32" fill={hudS} fontSize="6.5" fontFamily="monospace" textAnchor="end">conf≥0.50</text>

          {/* Measurement lines */}
          <line x1="90" y1="158" x2="90" y2="192" stroke="rgba(251,191,36,0.4)" strokeWidth="0.8"/>
          <line x1="86" y1="158" x2="94" y2="158" stroke="rgba(251,191,36,0.4)" strokeWidth="0.8"/>
          <line x1="86" y1="192" x2="94" y2="192" stroke="rgba(251,191,36,0.4)" strokeWidth="0.8"/>
          <text x="83" y="178" fill="rgba(251,191,36,0.5)" fontSize="6" fontFamily="monospace"
            textAnchor="end">34px</text>

          {/* Bottom bar */}
          <rect x="0" y="340" width="260" height="20" fill={botBg}/>
          <text x="12" y="353" fill={hudS} fontSize="6.5" fontFamily="monospace">XRAY_0042.dcm</text>
          <text x="248" y="353" fill={hudS} fontSize="6.5" fontFamily="monospace" textAnchor="end">1 DET</text>
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ROTATING RING DECORATION
───────────────────────────────────────────────────────────────── */
function RotatingRings({ isLight }) {
  const c = isLight ? "rgba(37,99,235," : "rgba(99,179,237,";
  return (
    <div style={{ position:"absolute", top:"50%", left:"50%",
      transform:"translate(-50%,-50%)", pointerEvents:"none" }}>
      {/* Outer ring */}
      <div className="ring-outer" style={{
        width:380, height:380, marginLeft:-190, marginTop:-190,
        border:`1px solid ${c}0.08)`, borderRadius:"50%",
        borderTopColor:`${c}0.2)`, borderRightColor:`${c}0.12)`,
      }}/>
      {/* Middle ring */}
      <div className="ring-inner" style={{
        position:"absolute", top:"12%", left:"12%",
        width:304, height:304,
        border:`1px solid ${c}0.06)`, borderRadius:"50%",
        borderBottomColor:`${c}0.15)`,
      }}/>
      {/* Inner dots ring */}
      <div className="ring-outer" style={{
        position:"absolute", top:"24%", left:"24%",
        width:228, height:228,
        border:`1px dashed ${c}0.08)`, borderRadius:"50%",
      }}/>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PARTICLES
───────────────────────────────────────────────────────────────── */
function useParticles() {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      const x  = 20 + Math.random() * 60;
      setParticles(p => [...p.slice(-8), { id, x }]);
    }, 1800);
    return () => clearInterval(interval);
  }, []);
  return particles;
}

/* ─────────────────────────────────────────────────────────────────
   TYPEWRITER HOOK
───────────────────────────────────────────────────────────────── */
function useTypewriter(words, delay = 2800) {
  const [idx, setIdx]   = useState(0);
  const [text, setText] = useState("");
  const [del,  setDel]  = useState(false);

  useEffect(() => {
    const word = words[idx];
    const timer = setTimeout(() => {
      if (!del) {
        setText(word.slice(0, text.length + 1));
        if (text.length + 1 === word.length) setTimeout(() => setDel(true), delay);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length - 1 === 0) { setDel(false); setIdx((idx + 1) % words.length); }
      }
    }, del ? 50 : 80);
    return () => clearTimeout(timer);
  }, [text, del, idx, words, delay]);

  return text;
}

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */
export default function AuthPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [mode,    setMode]    = useState("login");
  const [form,    setForm]    = useState({ name:"", email:"", password:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [view3d,  setView3d]  = useState(true);   // toggle 3D vs X-ray card

  const particles = useParticles();
  const typeText  = useTypewriter(
    ["Hairline Fracture", "Comminuted", "Oblique Fracture", "Transverse", "Spiral Fracture"],
    2400
  );

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handle    = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const switchMode= m => { setMode(m); setError(""); setForm({ name:"", email:"", password:"" }); };

  const submit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else                  await register(form.email, form.password, form.name);
      navigate("/detect");
    } catch (err) {
      setError(err.message.replace("Firebase: ","").replace(/\(auth\/[^)]+\)/,"").trim());
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/detect");
    } catch (err) {
      if (err && !err.message?.includes("redirect"))
        setError(err.message.replace("Firebase: ","").trim());
    } finally { setLoading(false); }
  };

  const delay = n => ({ animationDelay:`${0.4 + n * 0.07}s`, animationFillMode:"both" });

  /* Stats for the left panel */
  const stats = [
    { label:"mAP@50", value:"87%",   color:"#3fb950", icon:"🎯" },
    { label:"Speed",  value:"12ms",  color:"#63b3ed", icon:"⚡" },
    { label:"Classes",value:"7",     color:"#bc8cff", icon:"🦴" },
    { label:"AUC",    value:"0.91",  color:"#f78166", icon:"📈" },
  ];

  return (
    <>
      <style>{CSS}</style>

      <div className={`auth-page${isLight ? " light" : ""}`}>

        {/* ── Theme toggle ── */}
        <button
          className="theme-toggle"
          onClick={() => setIsLight(l => !l)}
          aria-label="Toggle theme"
        >
          <span style={{ fontSize:13 }}>{isLight ? "☀️" : "🌙"}</span>
          <div className={`theme-toggle-track${isLight ? " on" : ""}`}>
            <div className={`theme-toggle-thumb${isLight ? " on" : ""}`}/>
          </div>
          <span style={{ fontSize:11, color:"var(--toggle-label)", fontFamily:FONT_MONO, whiteSpace:"nowrap" }}>
            {isLight ? "Light" : "Dark"}
          </span>
        </button>

        {/* ── Animated background ── */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div style={{
            position:"absolute", top:"5%", left:"8%", width:560, height:560,
            background:`radial-gradient(circle, ${isLight ? "rgba(59,130,246,0.12)" : "rgba(30,77,140,0.22)"} 0%, transparent 65%)`,
            borderRadius:"50%", animation:"orb1 20s ease-in-out infinite",
          }}/>
          <div style={{
            position:"absolute", bottom:"8%", right:"15%", width:440, height:440,
            background:`radial-gradient(circle, ${isLight ? "rgba(13,148,136,0.08)" : "rgba(79,209,197,0.1)"} 0%, transparent 65%)`,
            borderRadius:"50%", animation:"orb2 26s ease-in-out infinite",
          }}/>
          <div style={{
            position:"absolute", top:"40%", right:"40%", width:300, height:300,
            background:`radial-gradient(circle, ${isLight ? "rgba(59,130,246,0.05)" : "rgba(99,179,237,0.07)"} 0%, transparent 65%)`,
            borderRadius:"50%", animation:"orb3 16s ease-in-out infinite",
          }}/>
          <div style={{
            position:"absolute", inset:0,
            backgroundImage:`linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)`,
            backgroundSize:"40px 40px",
            animation:"gridDrift 25s linear infinite",
          }}/>
        </div>

        {/* ══════════════════════════════════════════
            LEFT PANEL
        ══════════════════════════════════════════ */}
        <div className="left-panel">
          <div style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity .9s ease .1s",
            display:"flex", flexDirection:"column", alignItems:"center", gap:24,
            width:"100%", maxWidth:480, position:"relative",
          }}>

            {/* ── View toggle: 3D / X-ray ── */}
            <div style={{
              display:"flex", gap:6,
              background:"var(--toggle-bg)", borderRadius:12, padding:4,
              border:"1px solid var(--border)",
            }}>
              {[{k:true, label:"3D Bone"}, {k:false, label:"X-ray View"}].map(({k, label}) => (
                <button key={label} onClick={() => setView3d(k)} style={{
                  padding:"6px 14px", borderRadius:9, border:"none",
                  background: view3d === k ? "var(--bg-btn)" : "transparent",
                  color: view3d === k ? "#fff" : "var(--text-secondary)",
                  fontSize:12, fontFamily:FONT_BODY, cursor:"pointer",
                  transition:"all .25s",
                }}>{label}</button>
              ))}
            </div>

            {/* ── Central visual ── */}
            <div style={{ position:"relative", width:"100%", display:"flex", justifyContent:"center" }}>
              <RotatingRings isLight={isLight} />

              {/* Particles */}
              {particles.map(p => (
                <div key={p.id} className="particle" style={{
                  left:`${p.x}%`, bottom:0,
                  background: isLight ? "rgba(37,99,235,0.6)" : "rgba(99,179,237,0.6)",
                }}/>
              ))}

              {/* Main visual */}
              <div style={{
                position:"relative", zIndex:2,
                transition:"opacity .5s",
              }}>
                {view3d ? (
                  <div className="canvas-wrap" style={{ width:300, height:300 }}>
                    <BoneScene isLight={isLight} />
                  </div>
                ) : (
                  <XrayCard isLight={isLight} />
                )}
              </div>

              {/* ── Floating badges ── */}
              {/* Fracture type badge */}
              <div className="floating-badge-right" style={{
                position:"absolute", right:-10, top:"10%",
                background: isLight ? "rgba(217,119,6,0.08)" : "rgba(251,191,36,0.08)",
                border:`1px solid ${isLight ? "rgba(217,119,6,0.3)" : "rgba(251,191,36,0.28)"}`,
                borderRadius:12, padding:"10px 14px",
                animation:"floatB 5.5s ease-in-out infinite, badgeIn .6s ease .9s both",
                backdropFilter:"blur(12px)", minWidth:118, zIndex:3,
              }}>
                <div style={{ fontSize:9, color: isLight ? "rgba(217,119,6,0.6)" : "rgba(251,191,36,0.55)",
                  fontFamily:FONT_MONO, marginBottom:3, letterSpacing:"0.1em" }}>FRACTURE TYPE</div>
                <div style={{ fontSize:13, color: isLight ? "#92400e" : "rgba(251,220,80,0.95)",
                  fontFamily:FONT_DISPLAY, fontWeight:700 }}>
                  {typeText}
                  <span style={{ animation:"blink 1s step-end infinite", marginLeft:1 }}>|</span>
                </div>
                <div style={{ fontSize:10, color: isLight ? "rgba(217,119,6,0.5)" : "rgba(251,191,36,0.5)",
                  fontFamily:FONT_MONO, marginTop:3 }}>91.2% confidence</div>
              </div>

              {/* Latency badge */}
              <div className="floating-badge-left" style={{
                position:"absolute", left:-10, bottom:"18%",
                background:"var(--tag-bg)",
                border:"1px solid var(--tag-border)",
                borderRadius:12, padding:"10px 14px",
                animation:"float 6.5s ease-in-out infinite 1.5s, badgeIn .6s ease 1.1s both",
                backdropFilter:"blur(12px)", zIndex:3,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <div className="scanning-dot"/>
                  <span style={{ fontSize:9, color:"var(--accent)", fontFamily:FONT_MONO,
                    letterSpacing:"0.1em" }}>LIVE INFERENCE</span>
                </div>
                <div style={{ fontSize:18, color:"var(--accent)", fontFamily:FONT_MONO, fontWeight:500 }}>
                  12.4<span style={{ fontSize:10, opacity:0.6 }}>ms</span>
                </div>
              </div>

              {/* Classes strip */}
              <div className="floating-badge-bottom" style={{
                position:"absolute", bottom: view3d ? -16 : -18,
                left:"50%", transform:"translateX(-50%)",
                background:"var(--bg-panel)",
                border:"1px solid var(--border)",
                borderRadius:12, padding:"6px 14px",
                animation:"floatB 8s ease-in-out infinite 2s, badgeIn .6s ease 1.3s both",
                backdropFilter:"blur(12px)",
                display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap", zIndex:3,
              }}>
                {["Hairline","Comminuted","Oblique","Transverse","Spiral","Stress","Greenstick"].map((label, i) => (
                  <span key={label} style={{
                    fontSize:9, fontFamily:FONT_MONO,
                    color: i === 0
                      ? isLight ? "rgba(217,119,6,0.9)" : "rgba(251,191,36,0.9)"
                      : "var(--text-secondary)",
                    fontWeight: i === 0 ? 700 : 400,
                  }}>{label}</span>
                ))}
              </div>
            </div>

            {/* ── Stats row ── */}
            <div className="stats-row" style={{ display:"flex", gap:10, width:"100%", marginTop:20 }}>
              {stats.map(s => (
                <div key={s.label} className="stat-chip">
                  <span style={{ fontSize:14 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:s.color, fontFamily:FONT_MONO }}>{s.value}</div>
                    <div style={{ fontSize:9, color:"var(--text-secondary)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Caption ── */}
            <div className="caption-text" style={{ textAlign:"center" }}>
              <h2 style={{
                fontFamily:FONT_DISPLAY, fontSize:19, fontWeight:700,
                color:"var(--text-primary)", marginBottom:6, letterSpacing:"-0.02em",
              }}>
                AI-Powered Fracture Analysis
              </h2>
              <p style={{ color:"var(--text-secondary)", fontSize:13, lineHeight:1.7, fontWeight:300 }}>
                YOLOv8 detection · 7 fracture classes<br/>
                Real-time · HIPAA-compliant · Grad-CAM
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center", marginTop:12 }}>
                {["YOLOv8m","mAP 87%","12ms","Grad-CAM","7 Classes"].map(tag => (
                  <span key={tag} style={{
                    padding:"3px 10px", borderRadius:20, fontSize:10,
                    background:"var(--tag-bg)", border:"1px solid var(--tag-border)",
                    color:"var(--accent)", letterSpacing:"0.03em",
                  }}>{tag}</span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — AUTH FORM
        ══════════════════════════════════════════ */}
        <div className="right-panel">
          <div style={{
            width:"100%", maxWidth:388,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(28px)",
            transition: "opacity .7s ease .2s, transform .7s ease .2s",
          }}>

            {/* ── Logo ── */}
            <div style={{ marginBottom:32 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                <div style={{
                  width:46, height:46, borderRadius:13,
                  background:"var(--logo-bg)",
                  border:"1px solid var(--border-logo)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:22, position:"relative",
                  boxShadow:`0 0 24px var(--shadow-logo)`,
                  animation: mounted ? "logoIn .65s cubic-bezier(.34,1.56,.64,1) .05s both" : "none",
                }}>
                  🦴
                  <div style={{
                    position:"absolute", inset:-6,
                    border:"1px solid var(--border-logo)",
                    borderRadius:19,
                    animation:"pulseRing 3s ease-out infinite",
                  }}/>
                </div>
                <div style={{ animation: mounted ? "fadeUp .5s ease .2s both" : "none" }}>
                  <div style={{
                    fontFamily:FONT_DISPLAY, fontSize:22, fontWeight:800,
                    letterSpacing:"-0.03em", lineHeight:1.1,
                    background: isLight
                      ? "linear-gradient(90deg,#0f172a 40%,#2563eb)"
                      : "linear-gradient(90deg,#f0f4f8 40%,#63b3ed)",
                    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  }}>FractureAI</div>
                  <div style={{ fontSize:10, color:"var(--text-secondary)",
                    letterSpacing:"0.1em", fontFamily:FONT_MONO }}>BONE DETECTION SYSTEM</div>
                </div>
              </div>
              <p style={{
                color:"var(--text-secondary)", fontSize:14, fontWeight:300, lineHeight:1.6,
                animation: mounted ? "fadeUp .5s ease .3s both" : "none",
              }}>
                {mode === "login"
                  ? "Sign in to access your imaging dashboard."
                  : "Create an account to start detecting fractures."}
              </p>
            </div>

            {/* ── Tabs ── */}
            <div style={{
              display:"flex",
              background:"var(--toggle-bg)",
              border:"1px solid var(--border)",
              borderRadius:12, padding:4, marginBottom:24,
              animation: mounted ? "fadeUp .5s ease .35s both" : "none",
            }}>
              {["login","register"].map(m => (
                <button key={m} className="tab-btn" onClick={() => switchMode(m)} style={{
                  background: mode === m ? "var(--bg-tab-act)" : "transparent",
                  color: mode === m ? isLight ? "#1e3a8a" : "#e2e8f0" : "var(--text-tab-off)",
                  border: mode === m ? "1px solid var(--border-tab)" : "1px solid transparent",
                  boxShadow: mode === m ? "0 2px 14px rgba(30,77,140,0.25)" : "none",
                }}>
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* ── Form ── */}
            <form key={mode} onSubmit={submit}
              style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {mode === "register" && (
                <div className="field-wrap"
                  style={{ animation:"fadeUp .35s ease both", ...delay(0) }}>
                  <label className="field-label">Full Name</label>
                  <input className="auth-input" name="name" type="text"
                    placeholder="Dr. Ahmed Benali" value={form.name}
                    onChange={handle} required autoComplete="name" />
                </div>
              )}

              <div className="field-wrap"
                style={{ animation:"fadeUp .35s ease both", ...delay(mode==="register"?1:0) }}>
                <label className="field-label">Email</label>
                <input className="auth-input" name="email" type="email"
                  placeholder="you@clinic.com" value={form.email}
                  onChange={handle} required autoComplete="email"/>
              </div>

              <div className="field-wrap"
                style={{ animation:"fadeUp .35s ease both", ...delay(mode==="register"?2:1) }}>
                <label className="field-label">Password</label>
                <div style={{ position:"relative" }}>
                  <input className="auth-input" name="password" type="password"
                    placeholder="••••••••" value={form.password}
                    onChange={handle} required
                    autoComplete={mode==="login"?"current-password":"new-password"}
                    style={{ paddingRight:44 }}/>
                  {/* Strength indicator dots */}
                  {form.password.length > 0 && (
                    <div style={{
                      position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                      display:"flex", gap:3,
                    }}>
                      {[1,2,3].map(i => (
                        <div key={i} style={{
                          width:5, height:5, borderRadius:"50%",
                          background: form.password.length >= i*3
                            ? i===1?"#ef4444":i===2?"#f59e0b":"#22c55e"
                            : "var(--border)",
                          transition:"background .3s",
                        }}/>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Forgot password link */}
              {mode === "login" && (
                <div style={{ textAlign:"right", marginTop:-6 }}>
                  <button type="button" style={{
                    background:"none", border:"none",
                    color:"var(--accent)", fontSize:12, cursor:"pointer",
                    fontFamily:FONT_BODY, opacity:0.8,
                  }}>Forgot password?</button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  background:"var(--err-bg)", border:"1px solid var(--err-border)",
                  borderRadius:10, padding:"10px 14px",
                  color:"var(--err-text)", fontSize:13,
                  display:"flex", gap:8, alignItems:"flex-start",
                  animation:"fadeIn .25s ease",
                }}>
                  <span style={{ flexShrink:0, marginTop:1 }}>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <div style={{ animation:"fadeUp .35s ease both", ...delay(mode==="register"?3:2) }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <span style={{
                        width:14, height:14,
                        border:"2px solid rgba(255,255,255,.25)",
                        borderTopColor:"#fff", borderRadius:"50%",
                        animation:"spin .7s linear infinite", display:"inline-block",
                      }}/>
                      {mode==="login" ? "Signing in…" : "Creating account…"}
                    </span>
                  ) : (
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      {mode==="login" ? "Sign In" : "Create Account"}
                      <span style={{ fontSize:16, animation:"bounce 1.5s ease infinite" }}>→</span>
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* ── Divider ── */}
            <div style={{
              display:"flex", alignItems:"center", gap:12, margin:"20px 0",
              animation: mounted ? "fadeUp .5s ease .6s both" : "none",
            }}>
              <div style={{ flex:1, height:1, background:"var(--divider)" }}/>
              <span style={{ color:"var(--text-muted)", fontSize:12, fontFamily:FONT_MONO }}>or</span>
              <div style={{ flex:1, height:1, background:"var(--divider)" }}/>
            </div>

            {/* ── Google ── */}
            <div style={{ animation: mounted ? "fadeUp .5s ease .65s both" : "none" }}>
              <button className="btn-google" onClick={handleGoogle} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            {/* ── Footer ── */}
            <p style={{
              textAlign:"center", marginTop:24,
              fontSize:11, color:"var(--text-muted)", lineHeight:1.7,
              fontFamily:FONT_MONO,
              animation: mounted ? "fadeUp .5s ease .7s both" : "none",
            }}>
              Encrypted · HIPAA-compliant · Research use
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
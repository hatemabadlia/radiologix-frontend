// src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { path: "/detect",   label: "Detect",     icon: "🔍" },
  { path: "/scans",    label: "My Scans",   icon: "📋" },
  { path: "/stats",    label: "Statistics", icon: "📊" },
  { path: "/database", label: "Database",   icon: "🗄️" },
];

// ─── Shared theme tokens (keep in sync with DetectPage) ───────
const themes = {
  dark: {
    bg:         "rgba(8, 11, 20, 0.88)",
    border:     "#1f2535",
    text:       "#eaf0ff",
    textMid:    "#7b8aab",
    textDim:    "#3d4a65",
    primary:    "#4f8ef7",
    primaryHi:  "#7bb3ff",
    accent:     "#00e5b0",
    danger:     "#ff5577",
    surface:    "#12161e",
    surfaceHi:  "#181d28",
    glow:       "rgba(79,142,247,0.20)",
    activeText: "#eaf0ff",
  },
  light: {
    bg:         "rgba(240, 244, 255, 0.92)",
    border:     "#dde3f0",
    text:       "#1a2040",
    textMid:    "#5a6888",
    textDim:    "#b0bcd8",
    primary:    "#2563eb",
    primaryHi:  "#4f8ef7",
    accent:     "#00b894",
    danger:     "#e53e5a",
    surface:    "#ffffff",
    surfaceHi:  "#f0f4ff",
    glow:       "rgba(37,99,235,0.14)",
    activeText: "#1a2040",
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=Nunito:wght@400;600;700&display=swap');

  @keyframes navSlideDown { from { opacity:0; transform:translateY(-100%) } to { opacity:1; transform:translateY(0) } }
  @keyframes indicatorIn  { from { width:0; opacity:0 } to { opacity:1 } }
  @keyframes menuOpen     { from { opacity:0; transform:translateY(-8px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
  @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes spin         { to { transform:rotate(360deg) } }

  .nav-root { animation: navSlideDown 0.45s cubic-bezier(.22,.68,0,1.2) both; }

  .nav-link {
    position: relative;
    transition: color 0.18s, background 0.18s, border-color 0.18s, transform 0.18s;
  }
  .nav-link:hover:not(.active) {
    transform: translateY(-1px);
  }
  .nav-link.active::after {
    content:'';
    position:absolute;
    bottom:-1px; left:50%; transform:translateX(-50%);
    width:28px; height:2px;
    background: var(--primary);
    border-radius:2px;
    animation: indicatorIn 0.3s ease both;
  }

  .nav-btn {
    transition: all 0.18s ease;
  }
  .nav-btn:hover { transform: translateY(-1px); filter:brightness(1.1); }
  .nav-btn:active { transform: translateY(0) scale(0.96); }

  .avatar-btn { transition: all 0.2s ease; }
  .avatar-btn:hover { transform: scale(1.05); }

  .mobile-menu { animation: menuOpen 0.22s cubic-bezier(.22,.68,0,1.2) both; }

  .hamburger-line {
    display:block; width:22px; height:2px; border-radius:2px;
    transition: all 0.25s cubic-bezier(.22,.68,0,1.2);
  }

  @media (max-width: 768px) {
    .nav-links-desktop { display: none !important; }
    .hamburger-btn     { display: flex !important; }
    .user-email        { display: none !important; }
  }
  @media (min-width: 769px) {
    .hamburger-btn  { display: none !important; }
    .mobile-overlay { display: none !important; }
  }
`;

// ─── Props: isDark, setIsDark (passed down from App) ──────────
export default function Navbar({ isDark = true, setIsDark }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef();

  const c = isDark ? themes.dark : themes.light;

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate("/auth"); };

  const userInitial = (user?.displayName || user?.email || "?")[0].toUpperCase();

  return (
    <>
      <style>{CSS}</style>
      <style>{`:root { --primary: ${c.primary}; }`}</style>

      {/* ── Navbar ── */}
      <nav
        className="nav-root"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: c.bg,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: `1px solid ${c.border}`,
          boxShadow: scrolled
            ? isDark ? `0 4px 32px rgba(0,0,0,0.45)` : `0 4px 24px rgba(37,99,235,0.08)`
            : "none",
          display: "flex", alignItems: "center",
          padding: "0 24px", height: 64,
          gap: 8,
          transition: "background 0.4s, border-color 0.4s, box-shadow 0.3s",
          fontFamily: "'Nunito', sans-serif",
        }}
        ref={menuRef}
      >
        {/* ── Logo ── */}
        <div
          onClick={() => navigate("/detect")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginRight: 24, flexShrink: 0 }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: `0 2px 16px ${c.glow}`,
            flexShrink: 0,
          }}>🦴</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: c.text, whiteSpace: "nowrap", transition: "color 0.3s" }}>
            Fracture<span style={{ color: c.accent }}>AI</span>
          </span>
          {/* Live indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: `${c.accent}18`, border: `1px solid ${c.accent}33`,
            borderRadius: 99, padding: "2px 8px", marginLeft: 2,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.accent, display: "inline-block", animation: "pulse 1.8s ease infinite" }} />
            <span style={{ fontSize: 9, color: c.accent, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>LIVE</span>
          </div>
        </div>

        {/* ── Desktop nav links ── */}
        <div className="nav-links-desktop" style={{ display: "flex", gap: 2, flex: 1, alignItems: "center" }}>
          {NAV.map(({ path, label, icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`nav-link nav-btn${active ? " active" : ""}`}
                style={{
                  background: active ? `${c.primary}1a` : "transparent",
                  color: active ? c.primaryHi : c.textMid,
                  border: active ? `1px solid ${c.primary}33` : "1px solid transparent",
                  borderRadius: 9,
                  padding: "7px 15px",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Right side ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0 }}>

          {/* Theme toggle */}
          {setIsDark && (
            <button
              className="nav-btn"
              onClick={() => setIsDark(!isDark)}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                background: c.surface, border: `1px solid ${c.border}`,
                borderRadius: 9, padding: "7px 12px",
                display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer", color: c.textMid, fontSize: 13,
                fontFamily: "'Nunito', sans-serif", fontWeight: 600,
                transition: "all 0.3s",
              }}
            >
              <span style={{ fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</span>
              <span className="user-email" style={{ fontSize: 12 }}>{isDark ? "Light" : "Dark"}</span>
            </button>
          )}

          {/* User info — desktop */}
          {user && (
            <div className="user-email" style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: c.text, fontWeight: 600, transition: "color 0.3s" }}>
                {user.displayName || user.email?.split("@")[0]}
              </div>
              <div style={{ fontSize: 10, color: c.textMid, fontFamily: "'DM Mono', monospace" }}>
                {user.email}
              </div>
            </div>
          )}

          {/* Avatar */}
          {user && (
            <div
              className="avatar-btn"
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 14, cursor: "default", flexShrink: 0,
                boxShadow: `0 2px 10px ${c.glow}`,
              }}
            >
              {userInitial}
            </div>
          )}

          {/* Logout — desktop */}
          {user && (
            <button
              className="nav-btn user-email"
              onClick={handleLogout}
              style={{
                background: "transparent",
                color: c.textMid,
                border: `1px solid ${c.border}`,
                borderRadius: 9, padding: "7px 14px",
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12, cursor: "pointer", fontWeight: 600,
                "--hover-color": c.danger,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = c.danger;
                e.currentTarget.style.borderColor = `${c.danger}55`;
                e.currentTarget.style.background = `${c.danger}12`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = c.textMid;
                e.currentTarget.style.borderColor = c.border;
                e.currentTarget.style.background = "transparent";
              }}
            >
              Sign out
            </button>
          )}

          {/* ── Hamburger (mobile) ── */}
          <button
            className="hamburger-btn nav-btn"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: menuOpen ? `${c.primary}18` : "transparent",
              border: `1px solid ${menuOpen ? c.primary + "44" : c.border}`,
              borderRadius: 9, padding: "8px 10px",
              cursor: "pointer", display: "none",
              flexDirection: "column", gap: 5,
              alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            <span className="hamburger-line" style={{
              background: c.text,
              transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none",
            }} />
            <span className="hamburger-line" style={{
              background: c.text,
              opacity: menuOpen ? 0 : 1,
              width: menuOpen ? 0 : 22,
            }} />
            <span className="hamburger-line" style={{
              background: c.text,
              transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none",
            }} />
          </button>
        </div>
      </nav>

      {/* ── Mobile dropdown menu ── */}
      {menuOpen && (
        <div
          className="mobile-menu mobile-overlay"
          style={{
            position: "fixed", top: 64, left: 0, right: 0, zIndex: 199,
            background: isDark
              ? "rgba(10,12,20,0.97)"
              : "rgba(240,244,255,0.97)",
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${c.border}`,
            padding: "16px 20px 20px",
            display: "flex", flexDirection: "column", gap: 6,
          }}
        >
          {NAV.map(({ path, label, icon }, i) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="nav-btn"
                style={{
                  background: active ? `${c.primary}18` : c.surfaceHi,
                  color: active ? c.primaryHi : c.text,
                  border: `1px solid ${active ? c.primary + "33" : c.border}`,
                  borderRadius: 10, padding: "12px 16px",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: active ? 700 : 500, fontSize: 14,
                  cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10,
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <span style={{ fontSize: 17 }}>{icon}</span>
                {label}
                {active && (
                  <span style={{
                    marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                    background: c.primary,
                  }} />
                )}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ height: 1, background: c.border, margin: "8px 0" }} />

          {/* Mobile user row */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px" }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 15, flexShrink: 0,
              }}>
                {userInitial}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, color: c.text, fontWeight: 600 }}>
                  {user.displayName || user.email?.split("@")[0]}
                </div>
                <div style={{ fontSize: 11, color: c.textMid, fontFamily: "'DM Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* Mobile theme + logout */}
          <div style={{ display: "flex", gap: 8 }}>
            {setIsDark && (
              <button
                className="nav-btn"
                onClick={() => setIsDark(!isDark)}
                style={{
                  flex: 1, padding: "11px",
                  background: c.surfaceHi, border: `1px solid ${c.border}`,
                  borderRadius: 10, color: c.textMid,
                  fontFamily: "'Nunito', sans-serif", fontWeight: 600,
                  fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</span>
                {isDark ? "Light Mode" : "Dark Mode"}
              </button>
            )}
            {user && (
              <button
                className="nav-btn"
                onClick={handleLogout}
                style={{
                  flex: 1, padding: "11px",
                  background: `${c.danger}12`, border: `1px solid ${c.danger}33`,
                  borderRadius: 10, color: c.danger,
                  fontFamily: "'Nunito', sans-serif", fontWeight: 700,
                  fontSize: 13, cursor: "pointer",
                }}
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
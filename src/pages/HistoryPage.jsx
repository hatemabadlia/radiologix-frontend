// src/pages/HistoryPage.jsx
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { colors, fonts, FRACTURE_CLASSES } from "../utils/theme";

export default function HistoryPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "scans"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setScans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const deleteScan = async (id) => {
    await deleteDoc(doc(db, "scans", id));
    if (selected?.id === id) setSelected(null);
  };

  const fmt = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ padding: "88px 32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: "32px", fontWeight: 800, color: colors.text }}>
          📋 My Scans
        </h1>
        <p style={{ color: colors.textMid, marginTop: 6 }}>
          {scans.length} scan{scans.length !== 1 ? "s" : ""} saved to your account
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "80px", color: colors.textMid }}>
          Loading scans...
        </div>
      )}

      {!loading && scans.length === 0 && (
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: "16px", padding: "60px", textAlign: "center",
        }}>
          <div style={{ fontSize: "48px", marginBottom: 16 }}>🩻</div>
          <p style={{ color: colors.text, fontWeight: 600, marginBottom: 6 }}>No scans yet</p>
          <p style={{ color: colors.textMid, fontSize: "14px" }}>Run a detection and save results to see them here.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20 }}>
        {/* Scan list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {scans.map((scan) => {
            const cls = FRACTURE_CLASSES[scan.topClass];
            const active = selected?.id === scan.id;
            return (
              <div
                key={scan.id}
                onClick={() => setSelected(active ? null : scan)}
                style={{
                  background: active ? `${colors.primary}15` : colors.surface,
                  border: `1px solid ${active ? colors.primary + "44" : colors.border}`,
                  borderRadius: "14px", padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 16,
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {/* Thumbnail */}
                <img
                  src={scan.imageUrl}
                  alt=""
                  style={{ width: 56, height: 56, borderRadius: "10px", objectFit: "cover", background: "#000" }}
                />

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: "14px" }}>{cls?.icon}</span>
                    <span style={{ color: colors.text, fontWeight: 600, fontSize: "14px" }}>{scan.topLabel}</span>
                    <span style={{
                      background: `${cls?.color}22`, color: cls?.color,
                      border: `1px solid ${cls?.color}44`,
                      borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 700,
                    }}>
                      {Math.round((scan.topConfidence || 0) * 100)}%
                    </span>
                  </div>
                  <div style={{ color: colors.textMid, fontSize: "12px" }}>
                    {fmt(scan.createdAt)} · {scan.detections?.length || 0} detection{scan.detections?.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteScan(scan.id); }}
                  style={{
                    background: "transparent", border: "none",
                    color: colors.textLo, fontSize: "16px", cursor: "pointer", padding: "4px 8px",
                    borderRadius: "6px", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = colors.danger; e.currentTarget.style.background = "#ff475718"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = colors.textLo; e.currentTarget.style.background = "transparent"; }}
                >✕</button>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: "16px", padding: "24px", alignSelf: "start",
            position: "sticky", top: 80,
          }}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: colors.textMid, fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em" }}>SCAN DETAIL</span>
              <button onClick={() => setSelected(null)} style={{
                background: "transparent", border: "none", color: colors.textMid,
                cursor: "pointer", fontSize: "16px",
              }}>✕</button>
            </div>
            <img src={selected.imageUrl} alt="" style={{ width: "100%", borderRadius: "10px", marginBottom: 16, objectFit: "contain", background: "#000", maxHeight: 200 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(selected.detections || []).map((d, i) => {
                const cls = FRACTURE_CLASSES[d.classId];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>{cls?.icon}</span>
                    <span style={{ flex: 1, color: colors.text, fontSize: "13px" }}>{cls?.label}</span>
                    <div style={{ width: 80, height: 4, background: colors.border, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${d.confidence * 100}%`, background: cls?.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ color: cls?.color, fontSize: "12px", fontWeight: 700 }}>
                      {Math.round(d.confidence * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}`, color: colors.textMid, fontSize: "12px" }}>
              Scanned on {fmt(selected.createdAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

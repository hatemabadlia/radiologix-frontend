// src/pages/StatsPage.jsx
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { colors, fonts, FRACTURE_CLASSES } from "../utils/theme";

function BarChart({ data, maxVal, color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%",
            height: `${maxVal > 0 ? (d.count / maxVal) * 72 : 0}px`,
            background: color,
            borderRadius: "4px 4px 0 0",
            minHeight: d.count > 0 ? 4 : 0,
            transition: "height 0.5s ease",
          }} />
          <span style={{ color: colors.textMid, fontSize: "9px" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Compute stats
  const total = scans.length;
  const avgConf = total > 0
    ? Math.round((scans.reduce((s, sc) => s + (sc.topConfidence || 0), 0) / total) * 100)
    : 0;

  // Class breakdown
  const classCounts = {};
  scans.forEach((sc) => {
    const k = sc.topClass ?? -1;
    classCounts[k] = (classCounts[k] || 0) + 1;
  });

  // Daily activity (last 14 days)
  const dailyMap = {};
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMap[key] = 0;
  }
  scans.forEach((sc) => {
    if (!sc.createdAt) return;
    const d = sc.createdAt.toDate ? sc.createdAt.toDate() : new Date(sc.createdAt);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (key in dailyMap) dailyMap[key]++;
  });
  const dailyData = Object.entries(dailyMap).map(([label, count]) => ({ label, count }));
  const maxDaily = Math.max(1, ...dailyData.map((d) => d.count));

  // No fracture rate
  const noFractureCount = classCounts[6] || 0;
  const fractureCount = total - noFractureCount;
  const fractureRate = total > 0 ? Math.round((fractureCount / total) * 100) : 0;

  const statCards = [
    { label: "Total Scans", value: total, icon: "🩻", color: colors.primary },
    { label: "Avg Confidence", value: `${avgConf}%`, icon: "🎯", color: colors.accent },
    { label: "Fractures Found", value: fractureCount, icon: "🦴", color: colors.danger },
    { label: "Detection Rate", value: `${fractureRate}%`, icon: "📈", color: colors.warn },
  ];

  if (loading) return (
    <div style={{ padding: "88px 32px", textAlign: "center", color: colors.textMid }}>
      Loading statistics...
    </div>
  );

  return (
    <div style={{ padding: "88px 32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: "32px", fontWeight: 800, color: colors.text }}>
          📊 Statistics
        </h1>
        <p style={{ color: colors.textMid, marginTop: 6 }}>Analytics for your detection activity</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: "14px", padding: "20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: colors.textMid, fontSize: "12px", marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: fonts.display, fontSize: "28px", fontWeight: 800, color }}>{value}</div>
              </div>
              <span style={{ fontSize: "24px" }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Daily activity */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: "14px", padding: "24px",
        }}>
          <div style={{ color: colors.textMid, fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 20 }}>
            DAILY ACTIVITY — LAST 14 DAYS
          </div>
          {total === 0 ? (
            <div style={{ textAlign: "center", color: colors.textMid, padding: "40px 0" }}>No data yet</div>
          ) : (
            <BarChart data={dailyData} maxVal={maxDaily} color={colors.primary} />
          )}
        </div>

        {/* Class breakdown */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: "14px", padding: "24px",
        }}>
          <div style={{ color: colors.textMid, fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 20 }}>
            FRACTURE TYPE BREAKDOWN
          </div>
          {total === 0 ? (
            <div style={{ textAlign: "center", color: colors.textMid, padding: "40px 0" }}>No data yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(FRACTURE_CLASSES).map(([id, cls]) => {
                const count = classCounts[parseInt(id)] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "14px", width: 20 }}>{cls.icon}</span>
                    <span style={{ flex: 1, color: colors.text, fontSize: "13px" }}>{cls.label}</span>
                    <div style={{ width: 120, height: 5, background: colors.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: cls.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ color: cls.color, fontSize: "12px", fontWeight: 700, width: 32, textAlign: "right" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

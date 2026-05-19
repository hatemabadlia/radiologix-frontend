// src/pages/DatabasePage.jsx
import { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { colors, fonts, FRACTURE_CLASSES } from "../utils/theme";

const PAGE_SIZE = 15;

export default function DatabasePage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "scans"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setScans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    let s = scans;
    if (search) {
      const q = search.toLowerCase();
      s = s.filter((sc) =>
        sc.email?.toLowerCase().includes(q) ||
        sc.topLabel?.toLowerCase().includes(q) ||
        sc.id.includes(q)
      );
    }
    if (filterClass !== "all") {
      s = s.filter((sc) => String(sc.topClass) === filterClass);
    }
    return s;
  }, [scans, search, filterClass]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id) => {
    setDeleting(id);
    await deleteDoc(doc(db, "scans", id));
    setDeleting(null);
  };

  const fmt = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ padding: "88px 32px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: "32px", fontWeight: 800, color: colors.text }}>
          🗄️ Database
        </h1>
        <p style={{ color: colors.textMid, marginTop: 6 }}>
          All scans · {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          placeholder="Search by email, label, ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            flex: 1, padding: "10px 16px",
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: "10px", color: colors.text,
            fontFamily: fonts.body, fontSize: "14px", outline: "none",
          }}
          onFocus={(e) => e.target.style.borderColor = colors.primary}
          onBlur={(e) => e.target.style.borderColor = colors.border}
        />
        <select
          value={filterClass}
          onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
          style={{
            padding: "10px 16px",
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: "10px", color: colors.text,
            fontFamily: fonts.body, fontSize: "14px", cursor: "pointer",
          }}
        >
          <option value="all">All classes</option>
          {Object.entries(FRACTURE_CLASSES).map(([id, cls]) => (
            <option key={id} value={id}>{cls.icon} {cls.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: "16px", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "56px 1fr 200px 160px 100px 100px 60px",
          padding: "12px 20px",
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surfaceHi,
        }}>
          {["", "User", "Finding", "Date", "Conf.", "Det.", ""].map((h, i) => (
            <span key={i} style={{ color: colors.textMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em" }}>{h}</span>
          ))}
        </div>

        {loading && (
          <div style={{ padding: "40px", textAlign: "center", color: colors.textMid }}>Loading...</div>
        )}

        {!loading && paged.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: colors.textMid }}>No records found</div>
        )}

        {paged.map((scan, idx) => {
          const cls = FRACTURE_CLASSES[scan.topClass];
          return (
            <div
              key={scan.id}
              style={{
                display: "grid", gridTemplateColumns: "56px 1fr 200px 160px 100px 100px 60px",
                padding: "14px 20px", alignItems: "center",
                borderBottom: idx < paged.length - 1 ? `1px solid ${colors.border}` : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHi}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {/* Thumbnail */}
              <img
                src={scan.imageUrl}
                alt=""
                style={{ width: 40, height: 40, borderRadius: "8px", objectFit: "cover", background: "#000" }}
              />

              {/* User */}
              <div>
                <div style={{ color: colors.text, fontSize: "13px", fontWeight: 500 }}>{scan.email}</div>
                <div style={{ color: colors.textLo, fontSize: "11px", fontFamily: "monospace" }}>{scan.id.slice(0, 12)}…</div>
              </div>

              {/* Finding */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "14px" }}>{cls?.icon}</span>
                <span style={{
                  background: `${cls?.color}20`, color: cls?.color,
                  border: `1px solid ${cls?.color}44`,
                  borderRadius: "6px", padding: "3px 8px", fontSize: "11px", fontWeight: 600,
                }}>
                  {scan.topLabel}
                </span>
              </div>

              {/* Date */}
              <span style={{ color: colors.textMid, fontSize: "13px" }}>{fmt(scan.createdAt)}</span>

              {/* Confidence */}
              <span style={{ color: cls?.color, fontWeight: 700, fontSize: "13px" }}>
                {Math.round((scan.topConfidence || 0) * 100)}%
              </span>

              {/* Detections count */}
              <span style={{ color: colors.textMid, fontSize: "13px" }}>
                {scan.detections?.length || 0} det.
              </span>

              {/* Delete */}
              <button
                onClick={() => handleDelete(scan.id)}
                disabled={deleting === scan.id}
                style={{
                  background: "transparent", border: "none",
                  color: colors.textLo, fontSize: "14px", cursor: "pointer",
                  padding: "4px 8px", borderRadius: "6px", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = colors.danger; e.currentTarget.style.background = "#ff475718"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.textLo; e.currentTarget.style.background = "transparent"; }}
              >
                {deleting === scan.id ? "…" : "✕"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: "8px 16px", background: colors.surface,
              border: `1px solid ${colors.border}`, borderRadius: "8px",
              color: page === 1 ? colors.textLo : colors.text,
              fontFamily: fonts.body, cursor: page === 1 ? "default" : "pointer",
            }}>← Prev</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <button key={p} onClick={() => setPage(p)} style={{
                padding: "8px 14px",
                background: p === page ? colors.primary : colors.surface,
                border: `1px solid ${p === page ? colors.primary : colors.border}`,
                borderRadius: "8px", color: p === page ? "#fff" : colors.text,
                fontFamily: fonts.body, cursor: "pointer", fontWeight: p === page ? 700 : 400,
              }}>{p}</button>
            ))}

          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{
              padding: "8px 16px", background: colors.surface,
              border: `1px solid ${colors.border}`, borderRadius: "8px",
              color: page === totalPages ? colors.textLo : colors.text,
              fontFamily: fonts.body, cursor: page === totalPages ? "default" : "pointer",
            }}>Next →</button>
        </div>
      )}
    </div>
  );
}

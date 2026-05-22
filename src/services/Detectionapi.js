// src/services/detectionApi.js
// ═══════════════════════════════════════════════════════════════
// Radiologix — API client for FastAPI inference server
// ═══════════════════════════════════════════════════════════════

// ── Base URL ─────────────────────────────────────────────────────
// In production, point this to your deployed backend:
// const API_BASE = "https://api.radiologix.app";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Timeout (ms) ─────────────────────────────────────────────────
const TIMEOUT_MS = 18000;   // 18s — large X-ray images can take time

/**
 * Check if the backend is alive.
 * Returns { status, model, classes } or throws.
 */
export async function healthCheck() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError")
      throw new Error("Backend not responding (timeout)");
    throw err;
  }
}

/**
 * Run fracture detection on an image file.
 *
 * @param {File}   imageFile  - the X-ray image file
 * @param {Object} options
 * @param {number} options.conf - confidence threshold (default 0.25)
 * @param {number} options.iou  - IoU threshold (default 0.45)
 * @param {Function} options.onProgress - optional progress callback
 *
 * @returns {Promise<{detections, inferenceMs, imageSize}>}
 *
 * Each detection:
 * {
 *   classId:    number,   // 0 = Fracture (single-class model)
 *   label:      string,   // "Fracture"
 *   confidence: number,   // 0–1
 *   x:          number,   // top-left x (normalised 0–1)
 *   y:          number,   // top-left y (normalised 0–1)
 *   w:          number,   // width  (normalised 0–1)
 *   h:          number,   // height (normalised 0–1)
 * }
 */
export async function detectFractures(imageFile, options = {}) {
  const {
    conf = 0.25,
    iou  = 0.45,
    onProgress = null,
  } = options;

  const formData = new FormData();
  formData.append("file", imageFile);

  const url = `${API_BASE}/predict?conf=${conf}&iou=${iou}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    onProgress?.("uploading");

    const res = await fetch(url, {
      method: "POST",
      body:   formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    // Parse error body even on HTTP errors
    if (!res.ok) {
      let detail = `Server error ${res.status}`;
      try {
        const err = await res.json();
        detail = err.detail || detail;
      } catch (_) { /* ignore */ }
      throw new Error(detail);
    }

    onProgress?.("done");
    const data = await res.json();

    // Validate shape
    if (!Array.isArray(data.detections)) {
      throw new Error("Unexpected server response format");
    }

    return data;  // { detections, inferenceMs, imageSize, modelConf, modelIou }

  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError")
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s`);
    throw err;
  }
}


// ── Single-class model: your best.pt detects 1 class (Fracture)
// ── The frontend has its own FRACTURE_CLASSES array with 7 types.
// ── To map a real detection to one of the 7 UI types, we use
//    confidence bands as a visual demo mapping.
// ── Once you train a 7-class model, remove this and use classId directly.

/**
 * Map a single-class detection to one of the 7 UI fracture types.
 * This is a DEMO heuristic — replace with real multi-class classId
 * once you train a 7-class model.
 *
 * Confidence bands (illustrative):
 *   ≥ 0.90 → Comminuted (critical, high conf)
 *   ≥ 0.78 → Transverse
 *   ≥ 0.65 → Oblique
 *   ≥ 0.52 → Spiral
 *   ≥ 0.40 → Hairline
 *   ≥ 0.28 → Stress
 *   <  0.28 → Greenstick
 */
export function mapToUIClass(detection) {
  const { confidence, classId } = detection;

  // If you already have a multi-class model (classId 0-6), use it directly:
  if (classId > 0) return classId;

  // Single-class model heuristic:
  if (confidence >= 0.90) return 1;  // Comminuted
  if (confidence >= 0.78) return 3;  // Transverse
  if (confidence >= 0.65) return 2;  // Oblique
  if (confidence >= 0.52) return 4;  // Spiral
  if (confidence >= 0.40) return 0;  // Hairline
  if (confidence >= 0.28) return 5;  // Stress
  return 6;                          // Greenstick
}
// AM Motors PDI Yard: Cloudflare Pages advanced-mode worker.
// Serves the dashboard and reads the PDI reports from Google Drive on the server,
// so the page loads them automatically.
//
// Two ways to reach Drive:
//  A) PUBLIC LINKS (default, no setup): each report is shared "Anyone with the link" and listed below.
//     Change a file by setting STOCK_FILE / IBND_FILE / PLAN_FILE / JOBCARD_FILE / DELIVERY_SHEET
//     (a Drive link or just the file ID) in Cloudflare Pages → Settings → Variables and Secrets.
//     Keep the same link when the daily file is replaced: in Drive use "Manage versions → Upload new version".
//  B) SERVICE ACCOUNT (optional, keeps files private and finds the newest file in the folder):
// Settings (Cloudflare Pages project → Settings → Variables and Secrets):
//   GOOGLE_SERVICE_ACCOUNT  (Secret)  the whole JSON key file of a Google service account.
//                                     Share the Drive folder (and the delivery Google Sheet) with its email as Viewer.
//   DRIVE_FOLDER_ID         (optional) folder holding the Excel reports. Default below.
//   EXTRA_FILE_IDS          (optional) comma-separated extra files allowed, e.g. the delivery Google Sheet.
//
// Routes:
//   GET /api/drive?list=1   → newest files in the folder (+ extra files), as JSON
//   GET /api/drive?id=FILE  → the file's bytes (Google Sheets are exported as CSV)

const DEFAULT_FOLDER = "1IYtAvPPFMB3crzHoo-wJclC7IuZaeb0q";
const DEFAULT_EXTRA = "1Kpi75PeN2jeh_8PzsgmlPcyrf85v7s7VV3Q4HrnMwZU";
const SHEET_MIME = "application/vnd.google-apps.spreadsheet";
let tokenCache = { token: "", exp: 0 };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/drive") {
      try { return await drive(url, env, ctx); }
      catch (e) { return json({ error: String(e && e.message || e) }, 502); }
    }
    return env.ASSETS.fetch(request);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

const PUBLIC_DEFAULTS = {
  stock:    ["STOCK_FILE",     "1zNqp-9UlA2THEuOGXVtfTFnlPSdvmXQ9",  "stock_report.xlsx"],
  ibnd:     ["IBND_FILE",      "1WAC-ubcYUNUkj4SiJiWShcmizdUCBU89",  "ibnd_report.xlsx"],
  pdi:      ["PLAN_FILE",      "13OviUV91xngJ4uYl9mc4uHVn_gULyLvr",  "Final_Plan_Report.xlsx"],
  jobs:     ["JOBCARD_FILE",   "1HRbZT0NEnRYzKG4AC-P7MaO80cpnTjMh",  "jobcard_work_report.xlsx"],
  delivery: ["DELIVERY_SHEET", "1Kpi75PeN2jeh_8PzsgmlPcyrf85v7s7VV3Q4HrnMwZU", "delivery Report", "sheet"]
};
const idFrom = (v) => { const m = String(v || "").match(/\/d\/([A-Za-z0-9_-]{20,})|[?&]id=([A-Za-z0-9_-]{20,})|^([A-Za-z0-9_-]{20,})$/); return m ? (m[1] || m[2] || m[3]) : ""; };
function publicFiles(env) {
  return Object.entries(PUBLIC_DEFAULTS).map(([kind, [key, id, name, type]]) => ({ kind, id: idFrom(env[key]) || id, name, sheet: type === "sheet" }));
}
async function publicDrive(url, env, ctx) {
  const files = publicFiles(env);
  if (url.searchParams.get("list")) return json({ mode: "public", files: files.map(f => ({ id: f.id, name: f.name, mimeType: f.sheet ? SHEET_MIME : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", modifiedTime: "" })) });
  const id = url.searchParams.get("id") || "";
  const f = files.find(x => x.id === id);
  if (!f) return json({ error: "not_allowed" }, 403);
  // short server cache so several people opening the site at once don't each pull the big files from Drive
  const cache = caches.default, key = new Request("https://pdi-cache.local/" + id);
  if (!url.searchParams.get("fresh")) { const hit = await cache.match(key); if (hit) return hit; }
  const src = f.sheet
    ? `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`
    : `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
  const r = await fetch(src, { redirect: "follow" });
  const ct = r.headers.get("content-type") || "";
  if (!r.ok || /text\/html/.test(ct)) return json({ error: "not_public", message: `${f.name} could not be downloaded. In Drive set its sharing to "Anyone with the link".` }, 502);
  const res = new Response(r.body, { headers: {
    "content-type": f.sheet ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "cache-control": "public, max-age=120",
    "x-file-name": encodeURIComponent(f.name),
    "x-file-modified": r.headers.get("last-modified") || ""
  } });
  ctx && ctx.waitUntil && ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

async function drive(url, env, ctx) {
  if (!env.GOOGLE_SERVICE_ACCOUNT) return publicDrive(url, env, ctx);
  const folder = env.DRIVE_FOLDER_ID || DEFAULT_FOLDER;
  const extra = String(env.EXTRA_FILE_IDS || DEFAULT_EXTRA).split(",").map(s => s.trim()).filter(Boolean);
  const token = await accessToken(env);
  const api = (path) => fetch("https://www.googleapis.com/drive/v3/" + path, { headers: { Authorization: "Bearer " + token } });

  if (url.searchParams.get("list")) {
    const q = encodeURIComponent(`'${folder}' in parents and trashed = false`);
    const r = await api(`files?q=${q}&orderBy=modifiedTime desc&pageSize=100&fields=files(id,name,mimeType,modifiedTime,size)&supportsAllDrives=true&includeItemsFromAllDrives=true`);
    if (!r.ok) return json({ error: "list_failed", message: await r.text() }, r.status);
    const files = (await r.json()).files || [];
    for (const id of extra) {
      const m = await api(`files/${id}?fields=id,name,mimeType,modifiedTime,size&supportsAllDrives=true`);
      if (m.ok) files.push(await m.json());
    }
    return json({ files, folder });
  }

  const id = url.searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) return json({ error: "bad_id" }, 400);
  const meta = await api(`files/${id}?fields=id,name,mimeType,modifiedTime,parents&supportsAllDrives=true`);
  if (!meta.ok) return json({ error: "not_found", message: await meta.text() }, meta.status);
  const m = await meta.json();
  // only files in the PDI folder, or the listed extra files, can be read
  if (!(m.parents || []).includes(folder) && !extra.includes(id)) return json({ error: "not_allowed" }, 403);
  const r = m.mimeType === SHEET_MIME
    ? await api(`files/${id}/export?mimeType=text/csv`)
    : await api(`files/${id}?alt=media&supportsAllDrives=true`);
  if (!r.ok) return json({ error: "download_failed", message: await r.text() }, r.status);
  return new Response(r.body, {
    headers: {
      "content-type": m.mimeType === SHEET_MIME ? "text/csv; charset=utf-8" : (r.headers.get("content-type") || "application/octet-stream"),
      "cache-control": "private, max-age=60",
      "x-file-name": encodeURIComponent(m.name || ""),
      "x-file-modified": m.modifiedTime || ""
    }
  });
}

// Service-account sign-in: a signed JWT exchanged for a Drive read-only token (cached ~55 min).
async function accessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.token && tokenCache.exp - 60 > now) return tokenCache.token;
  let sa;
  try { sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT); } catch (e) { throw new Error("GOOGLE_SERVICE_ACCOUNT is not valid JSON. Paste the whole key file."); }
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const head = enc({ alg: "RS256", typ: "JWT" });
  const claim = enc({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/drive.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const pem = String(sa.private_key || "").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head + "." + claim)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + head + "." + claim + "." + b64url(sig)
  });
  const t = await r.json();
  if (!r.ok || !t.access_token) throw new Error("Google sign-in failed: " + (t.error_description || t.error || r.status));
  tokenCache = { token: t.access_token, exp: now + (t.expires_in || 3600) };
  return t.access_token;
}
function b64url(bytes) {
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

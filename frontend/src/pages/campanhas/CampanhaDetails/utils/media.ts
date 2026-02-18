// /var/www/frontend/src/pages/campanhas/CampanhaDetails/utils/media.ts

export function extractTempPathFromPublicUrl(url: string): string | null {
  try {
    const u = new URL(url);

    // Ex:
    // /storage/v1/object/public/<bucket>/temp/arquivo.png
    const marker = "/object/public/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;

    const after = u.pathname.substring(idx + marker.length); // bucket/path
    const parts = after.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    // remove bucket
    const rest = parts.slice(1).join("/"); // path inside bucket

    // se houver "temp/" em qualquer posição, extrai a partir dele
    const tempIdx = rest.indexOf("temp/");
    if (tempIdx === -1) return null;

    const tempPath = rest.substring(tempIdx);
    return tempPath.startsWith("temp/") ? tempPath : null;
  } catch {
    return null;
  }
}

export function normalizeTempPath(p: any): string | null {
  if (typeof p !== "string") return null;

  const v = p.trim().replace(/^\/+/, "");
  if (!v) return null;

  // ✅ se já começa com temp/, ok
  if (v.startsWith("temp/")) return v;

  // ✅ se contém temp/ em qualquer lugar, extrai a partir dele
  const idx = v.indexOf("temp/");
  if (idx !== -1) {
    const cut = v.substring(idx);
    return cut.startsWith("temp/") ? cut : null;
  }

  // ⚠️ fallback: mantém compatível com seu comportamento atual
  // (se vier só "abc.png", vira "temp/abc.png")
  return `temp/${v}`;
}

// Reusable helpers (CSV, DOM, Cloudinary uploads)
import { UPLOAD_URL, PRODUCT_PRESET, RECEIPT_PRESET } from "./firebase.js";

/* CSV */
export function downloadCSV(filename, rows){
  if (!rows?.length) return alert("Nothing to export.");
  const escape = (v)=> `"${String(v ?? "").replace(/"/g,'""')}"`;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(escape).join(","),
    ...rows.map(r=> headers.map(h=>escape(r[h])).join(","))
  ].join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* tiny DOM helper */
export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

/* Cloudinary unsigned upload */
export async function uploadImages(files, kind="product"){
  const preset = kind==="receipt" ? RECEIPT_PRESET : PRODUCT_PRESET;
  const urls = [];
  for (const file of files){
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    const res = await fetch(UPLOAD_URL, { method:"POST", body: fd });
    const data = await res.json();
    if (data.secure_url) urls.push(data.secure_url);
    else console.error("Cloudinary error", data);
  }
  return urls;
}

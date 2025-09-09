// --- Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD2-n2E63mxeYwQBfyIDd-OmRMQzu3z9xw",
  authDomain: "all-hall-shop.firebaseapp.com",
  databaseURL: "https://all-hall-shop-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "all-hall-shop",
  storageBucket: "all-hall-shop.appspot.com",
  messagingSenderId: "741136437274",
  appId: "1:741136437274:web:86931f347cd0127faf81a3",
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// --- Cloudinary (Unsigned) ---
const cloudName     = "dzgsde4su";            // change if needed
const productPreset = "allhall_product";      // uploads to folder: product/
const uploadUrl     = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

// --- Sidebar SPA switching ---
const links = document.querySelectorAll(".admin-sidebar a[data-section]");
const sections = document.querySelectorAll(".admin-section");
links.forEach(a => a.addEventListener("click", (e) => {
  e.preventDefault();
  const id = a.dataset.section;
  sections.forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  links.forEach(x => x.classList.remove("active"));
  a.classList.add("active");
}));

// ---------- DASHBOARD ----------
const stats = document.getElementById("stats");
const todayOrders = document.getElementById("todayOrders");
const exportOrdersCSV = document.getElementById("exportOrdersCSV");

let ordersCacheFlat = []; // used for CSV, dashboard, orders page

onValue(ref(db, "orders"), (snap) => {
  const all = snap.val() || {};
  const flat = [];
  let today=0, pending=0, cancelled=0, delivered=0;

  const todayStr = new Date().toDateString();
  const todayList = [];

  Object.entries(all).forEach(([uid, orders]) => {
    Object.entries(orders).forEach(([oid, o]) => {
      const row = { ...o, _uid: uid, _oid: oid };
      flat.push(row);

      const d = new Date(o.createdAt || 0);
      if (d.toDateString() === todayStr) { today++; todayList.push(row); }
      if (o.status === "pending")   pending++;
      if (o.status === "cancelled") cancelled++;
      if (o.status === "delivered") delivered++;
    });
  });
  ordersCacheFlat = flat.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));

  stats.innerHTML = `
    <div class="glass stat"><i class="fa-solid fa-calendar-day"></i> Today: <b>${today}</b></div>
    <div class="glass stat"><i class="fa-solid fa-clock"></i> Pending: <b>${pending}</b></div>
    <div class="glass stat"><i class="fa-solid fa-ban"></i> Cancelled: <b>${cancelled}</b></div>
    <div class="glass stat"><i class="fa-solid fa-circle-check"></i> Delivered: <b>${delivered}</b></div>
  `;

  todayOrders.innerHTML = todayList
    .sort((a,b)=> (b.createdAt||0)-(a.createdAt||0))
    .slice(0,8)
    .map(o => `
      <div class="glass item">
        <div style="display:flex; justify-content:space-between;">
          <div><strong>#${o._oid}</strong> — ${o.payment || "—"}</div>
          <span class="pill">${o.status}</span>
        </div>
        <div style="opacity:.8; font-size:.95rem; margin-top:6px;">
          ${o.items?.map(i=>`${i.name} x${i.qty}`).join(", ")}
        </div>
      </div>
    `).join("");
});

// CSV helper
function downloadCSV(filename, rows){
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
exportOrdersCSV.onclick = ()=> {
  const rows = ordersCacheFlat.map(o=>({
    order_id: o._oid,
    user_id: o._uid,
    status: o.status,
    payment: o.payment,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt||"",
    items: (o.items||[]).map(i=>`${i.name} x${i.qty}`).join("; ")
  }));
  downloadCSV("orders.csv", rows);
};

// ---------- PRODUCTS (search + category chips/dropdown + export) ----------
const productList     = document.getElementById("productList");
const prodCount       = document.getElementById("prodCount");
const prodSearch      = document.getElementById("prodSearch");
const prodCategorySel = document.getElementById("prodCategoryFilter");
const categoryChips   = document.getElementById("categoryChips");
const exportProductsCSV = document.getElementById("exportProductsCSV");

const form            = document.getElementById("productForm");
const resetFormBtn    = document.getElementById("resetForm");
const deleteCurrent   = document.getElementById("deleteCurrent");
const thumbs          = document.getElementById("imageThumbs");
const el = id => document.getElementById(id);

let currentImages = []; // secure_url list
let productsCache = {}; // for search/filter

onValue(ref(db, "products"), (snap) => {
  productsCache = snap.val() || {};
  renderCategoryControls();
  renderProductList();
});

function renderCategoryControls(){
  const cats = [...new Set(Object.values(productsCache).map(p => (p.category||"").trim()).filter(Boolean))].sort();
  // dropdown
  prodCategorySel.innerHTML = `<option value="">All categories</option>${cats.map(c=>`<option value="${c}">${c}</option>`).join("")}`;
  // chips
  categoryChips.innerHTML = `<div class="chip active" data-cat="">All</div>` + cats.map(c=>`<div class="chip" data-cat="${c}">${c}</div>`).join("");
  categoryChips.querySelectorAll(".chip").forEach(chip=>{
    chip.onclick = () => {
      categoryChips.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
      chip.classList.add("active");
      prodCategorySel.value = chip.dataset.cat;
      renderProductList(prodSearch.value);
    };
  });
  prodCategorySel.onchange = () => {
    // sync chip active
    categoryChips.querySelectorAll(".chip").forEach(x=> x.classList.toggle("active", x.dataset.cat === prodCategorySel.value));
    renderProductList(prodSearch.value);
  };
}

function renderProductList(filter=""){
  const entries = Object.entries(productsCache);
  const q = filter.trim().toLowerCase();
  const cat = (prodCategorySel.value||"").toLowerCase();

  const filtered = entries.filter(([id,p]) => {
    // category filter
    if (cat && (String(p.category||"").toLowerCase() !== cat)) return false;
    // text search
    if (!q) return true;
    const hay = `${p.name||""} ${p.category||""}`.toLowerCase();
    return hay.includes(q);
  });

  prodCount.textContent = filtered.length;

  productList.innerHTML = filtered.map(([id,p]) => `
    <div class="glass item">
      <div style="display:flex; align-items:center; gap:12px;">
        ${p.images?.[0] ? `<img src="${p.images[0]}" style="height:48px;width:48px;object-fit:cover;border-radius:10px;border:1px solid rgba(255,255,255,.15)">` : ""}
        <div style="flex:1">
          <div><strong>${p.name}</strong></div>
          <div style="opacity:.75; font-size:.9rem">${p.category || "—"} · Rs.${p.price} ${p.discount?`(−${p.discount}%)`:""}</div>
        </div>
        <button class="btn btn-outline" data-edit="${id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
        <button class="btn btn-rose" data-del="${id}"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    </div>
  `).join("");

  // bind edit
  document.querySelectorAll("[data-edit]").forEach(b=>{
    b.onclick = () => {
      const id = b.dataset.edit;
      const p = productsCache[id];
      el("editId").value = id;
      el("pName").value = p.name||"";
      el("pCategory").value = p.category||"";
      el("pPrice").value = p.price||0;
      el("pDiscount").value = p.discount||0;
      el("pColors").value = p.colors||"";
      el("pDesc").value = p.description||"";
      currentImages = Array.isArray(p.images) ? p.images.slice() : [];
      renderThumbs();
      window.scrollTo({top:0, behavior:"smooth"});
    };
  });

  // bind delete
  document.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick = async () => {
      if (!confirm("Delete this product?")) return;
      await remove(ref(db, "products/"+b.dataset.del));
    };
  });
}

prodSearch.addEventListener("input", (e)=> renderProductList(e.target.value));

// thumbnails
function renderThumbs(){
  thumbs.innerHTML = currentImages.map((u,i)=>`
    <div style="position:relative">
      <img src="${u}">
      <button type="button" data-remove="${i}" class="btn btn-outline" style="position:absolute;top:-6px;right:-6px;padding:4px 6px;border-radius:10px;">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join("");
  document.querySelectorAll("[data-remove]").forEach(btn=>{
    btn.onclick = ()=>{ currentImages.splice(+btn.dataset.remove,1); renderThumbs(); };
  });
}

// upload multiple to Cloudinary
el("pImages").addEventListener("change", async (e)=>{
  const files = [...e.target.files];
  if (!files.length) return;
  for (const file of files){
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", productPreset); // preset enforces folder product/
    const res = await fetch(uploadUrl, { method:"POST", body: fd });
    const data = await res.json();
    if (data.secure_url) {
      currentImages.push(data.secure_url);
      renderThumbs();
    } else {
      alert("Upload failed");
      console.error(data);
    }
  }
  e.target.value = "";
});

// save / update product
document.getElementById("productForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const payload = {
    name: el("pName").value.trim(),
    category: el("pCategory").value.trim(),
    price: Number(el("pPrice").value || 0),
    discount: Number(el("pDiscount").value || 0),
    colors: el("pColors").value.trim(),
    description: el("pDesc").value.trim(),
    images: currentImages,
    updatedAt: Date.now(),
  };
  const id = el("editId").value;

  if (!payload.name || !payload.price) {
    alert("Name and Price are required.");
    return;
  }

  if (id) {
    await update(ref(db, "products/"+id), payload);
    alert("Product updated");
  } else {
    const node = push(ref(db, "products"));
    await set(node, { ...payload, createdAt: Date.now() });
    alert("Product created");
  }
  resetForm();
});

function resetForm(){
  ["editId","pName","pCategory","pPrice","pDiscount","pColors","pDesc"].forEach(id => {
    const node = el(id);
    node.value = (id==="pDiscount") ? 0 : "";
  });
  currentImages = [];
  renderThumbs();
}
document.getElementById("resetForm").onclick = resetForm;
document.getElementById("deleteCurrent").onclick = async () => {
  const id = el("editId").value;
  if (!id) { alert("Nothing to delete."); return; }
  if (!confirm("Delete this product?")) return;
  await remove(ref(db, "products/"+id));
  resetForm();
};

// export products CSV
exportProductsCSV.onclick = ()=>{
  const rows = Object.entries(productsCache).map(([id,p])=>({
    product_id: id,
    name: p.name,
    category: p.category||"",
    price: p.price,
    discount: p.discount||0,
    colors: p.colors||"",
    createdAt: p.createdAt||"",
    updatedAt: p.updatedAt||"",
    images: (p.images||[]).join(" | ")
  }));
  downloadCSV("products.csv", rows);
};

// ---------- ORDERS (Tabbed + payment filter + ID search + export) ----------
const orderList = document.getElementById("orderList");
const tabs = document.querySelectorAll(".tab");
const paymentFilter = document.getElementById("paymentFilter");
const orderIdSearch = document.getElementById("orderIdSearch");
const exportOrdersCSV2 = document.getElementById("exportOrdersCSV2");

tabs.forEach(t => t.addEventListener("click", () => {
  tabs.forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  renderOrders();
}));
paymentFilter.onchange = renderOrders;
orderIdSearch.oninput = renderOrders;
exportOrdersCSV2.onclick = ()=>exportOrdersCSV.click(); // reuse same export

function renderOrders(){
  const status = document.querySelector(".tab.active")?.dataset.status || "pending";
  const pay = paymentFilter.value;
  const qid = orderIdSearch.value.trim().toLowerCase();
  const now = Date.now();
  const sevenDays = 7*24*60*60*1000;

  const filtered = ordersCacheFlat.filter(o => {
    // status logic
    if (status !== "cancelled") {
      if (o.status !== status) return false;
    } else {
      if (o.status !== "cancelled") return false;
      const when = o.updatedAt || o.cancelledAt || o.createdAt || 0;
      if ((now - when) > sevenDays) return false;
    }
    // payment filter
    if (pay && (String(o.payment||"").toUpperCase() !== pay)) return false;
    // order ID search
    if (qid && !String(o._oid).toLowerCase().includes(qid)) return false;
    return true;
  });

  orderList.innerHTML = filtered.map(o => `
    <div class="glass item">
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
        <div><strong>#${o._oid}</strong> · ${new Date(o.createdAt||0).toLocaleString()}</div>
        <span class="pill">${o.status}</span>
      </div>
      <div style="opacity:.85;margin:6px 0;">${o.items?.map(i=>`${i.name} x${i.qty}`).join(", ")}</div>
      <div style="opacity:.75;font-size:.95rem;">Payment: ${o.payment||"-"}</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
        ${o.status==="pending" ? `
          <button class="btn btn-outline act" data-user="${o._uid}" data-id="${o._oid}" data-status="accepted"><i class="fa-solid fa-check"></i> Accept</button>
          <button class="btn btn-rose act" data-user="${o._uid}" data-id="${o._oid}" data-status="cancelled"><i class="fa-solid fa-ban"></i> Cancel</button>
        ` : ""}
        ${o.status==="accepted" ? `
          <button class="btn btn-gold act" data-user="${o._uid}" data-id="${o._oid}" data-status="delivered"><i class="fa-solid fa-box"></i> Mark Delivered</button>
          <button class="btn btn-rose act" data-user="${o._uid}" data-id="${o._oid}" data-status="cancelled"><i class="fa-solid fa-ban"></i> Cancel</button>
        ` : ""}
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".act").forEach(b=>{
    b.onclick = async ()=>{
      const { user, id, status } = b.dataset;
      const payload = { status, updatedAt: Date.now() };
      if (status === "cancelled") payload.cancelledAt = Date.now();
      await update(ref(db, `orders/${user}/${id}`), payload);
    };
  });
}

// initial render for orders when section opened
// (when switching tabs/filters it re-renders)

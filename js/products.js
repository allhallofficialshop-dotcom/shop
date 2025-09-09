import { db } from "./firebase.js";
import { ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { $, $$, uploadImages, downloadCSV } from "./utils.js";

const productList     = $("#productList");
const prodCount       = $("#prodCount");
const prodSearch      = $("#prodSearch");
const prodCategorySel = $("#prodCategoryFilter");
const categoryChips   = $("#categoryChips");

const form            = $("#productForm");
const resetFormBtn    = $("#resetForm");
const deleteCurrent   = $("#deleteCurrent");
const thumbs          = $("#imageThumbs");
const exportProductsCSV = $("#exportProductsCSV");

const el = id => document.getElementById(id);

let currentImages = [];
let productsCache = {};

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
  $$(".chip", categoryChips).forEach(chip=>{
    chip.onclick = () => {
      $$(".chip", categoryChips).forEach(x=>x.classList.remove("active"));
      chip.classList.add("active");
      prodCategorySel.value = chip.dataset.cat;
      renderProductList(prodSearch.value);
    };
  });
  prodCategorySel.onchange = () => {
    $$(".chip", categoryChips).forEach(x=> x.classList.toggle("active", x.dataset.cat === prodCategorySel.value));
    renderProductList(prodSearch.value);
  };
}

function renderProductList(filter=""){
  const entries = Object.entries(productsCache);
  const q = filter.trim().toLowerCase();
  const cat = (prodCategorySel.value||"").toLowerCase();

  const filtered = entries.filter(([id,p]) => {
    if (cat && (String(p.category||"").toLowerCase() !== cat)) return false;
    if (!q) return true;
    const hay = `${p.name||""} ${p.category||""}`.toLowerCase();
    return hay.includes(q);
  });

  prodCount.textContent = filtered.length;

  productList.innerHTML = filtered.map(([id,p]) => `
    <div class="glass item">
      <div style="display:flex; align-items:center; gap:12px;">
        ${p.images?.[0] ? `<img src="${p.images[0]}" class="img48">` : ""}
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
  $$("[data-edit]").forEach(b=>{
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
  $$("[data-del]").forEach(b=>{
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
      <img src="${u}" class="img48">
      <button type="button" data-remove="${i}" class="btn btn-outline" style="position:absolute;top:-6px;right:-6px;padding:4px 6px;border-radius:10px;">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join("");
  $$("[data-remove]").forEach(btn=>{
    btn.onclick = ()=>{ currentImages.splice(+btn.dataset.remove,1); renderThumbs(); };
  });
}

// upload multiple to Cloudinary
document.getElementById("pImages").addEventListener("change", async (e)=>{
  const files = [...e.target.files];
  if (!files.length) return;
  const urls = await uploadImages(files, "product");
  currentImages.push(...urls);
  renderThumbs();
  e.target.value = "";
});

// save / update product
form.addEventListener("submit", async (e)=>{
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
resetFormBtn.onclick = resetForm;
deleteCurrent.onclick = async () => {
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

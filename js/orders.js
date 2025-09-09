import { db } from "./firebase.js";
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { $, $$, downloadCSV } from "./utils.js";
import { getOrdersCache } from "./dashboard.js";

const orderList = $("#orderList");
const tabs = $$(".tab");
const paymentFilter = $("#paymentFilter");
const orderIdSearch = $("#orderIdSearch");
const exportOrdersCSV2 = $("#exportOrdersCSV2");

let ordersCache = [];

onValue(ref(db, "orders"), (snap)=>{
  // dashboard.js already flattens, but keep local copy too
  const all = snap.val() || {};
  const arr = [];
  Object.entries(all).forEach(([uid, orders])=>{
    Object.entries(orders).forEach(([oid, o])=>{
      arr.push({ ...o, _uid: uid, _oid: oid });
    });
  });
  ordersCache = arr.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));
  renderOrders();
});

tabs.forEach(t => t.addEventListener("click", () => {
  tabs.forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  renderOrders();
}));
paymentFilter.onchange = renderOrders;
orderIdSearch.oninput = renderOrders;
exportOrdersCSV2.onclick = ()=> {
  const flat = getOrdersCache();
  const rows = flat.map(o=>({
    order_id: o._oid,
    user_id: o._uid,
    status: o.status,
    payment: o.payment,
    tracking: o.tracking||"",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt||"",
    items: (o.items||[]).map(i=>`${i.name} x${i.qty}`).join("; ")
  }));
  downloadCSV("orders.csv", rows);
};

function renderOrders(){
  const status = document.querySelector(".tab.active")?.dataset.status || "pending";
  const pay = paymentFilter.value;
  const qid = orderIdSearch.value.trim().toLowerCase();
  const now = Date.now();
  const sevenDays = 7*24*60*60*1000;

  const filtered = ordersCache.filter(o => {
    // status
    if (status !== "cancelled") {
      if (o.status !== status) return false;
    } else {
      if (o.status !== "cancelled") return false;
      const when = o.updatedAt || o.cancelledAt || o.createdAt || 0;
      if ((now - when) > sevenDays) return false;
    }
    // payment
    if (pay && (String(o.payment||"").toUpperCase() !== pay)) return false;
    // order id search
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
      ${o.payment==="BANK" && o.receiptUrl ? `<div style="margin-top:6px;"><a href="${o.receiptUrl}" target="_blank" class="btn btn-outline">View receipt</a></div>`:""}
      ${o.status==="accepted" ? `
        <div class="row" style="margin-top:8px;">
          <input data-track="${o._uid}|${o._oid}" placeholder="Tracking number…" value="${o.tracking||""}" />
          <button class="btn btn-gold saveTrack" data-user="${o._uid}" data-id="${o._oid}">
            <i class="fa-solid fa-save"></i> Save Tracking
          </button>
        </div>
      `:""}
      <div class="row" style="margin-top:8px;">
        ${o.status==="pending" ? `
          <button class="btn btn-outline act" data-user="${o._uid}" data-id="${o._oid}" data-status="accepted">
            <i class="fa-solid fa-check"></i> Accept
          </button>
          <button class="btn btn-rose act" data-user="${o._uid}" data-id="${o._oid}" data-status="cancelled">
            <i class="fa-solid fa-ban"></i> Cancel
          </button>
        ` : ""}
        ${o.status==="accepted" ? `
          <button class="btn btn-gold act" data-user="${o._uid}" data-id="${o._oid}" data-status="delivered">
            <i class="fa-solid fa-box"></i> Mark Delivered
          </button>
          <button class="btn btn-rose act" data-user="${o._uid}" data-id="${o._oid}" data-status="cancelled">
            <i class="fa-solid fa-ban"></i> Cancel
          </button>
        ` : ""}
      </div>
    </div>
  `).join("");

  // actions
  $$(".act").forEach(b=>{
    b.onclick = async ()=>{
      const { user, id, status } = b.dataset;
      const payload = { status, updatedAt: Date.now() };
      if (status === "cancelled") payload.cancelledAt = Date.now();
      await update(ref(db, `orders/${user}/${id}`), payload);
    };
  });

  // tracking save
  $$(".saveTrack").forEach(btn=>{
    btn.onclick = async ()=>{
      const { user, id } = btn.dataset;
      const input = document.querySelector(`input[data-track="${user}|${id}"]`);
      await update(ref(db, `orders/${user}/${id}`), { tracking: input.value.trim(), updatedAt: Date.now() });
      alert("Tracking saved");
    };
  });
}

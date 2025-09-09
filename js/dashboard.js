import { db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { downloadCSV, $ } from "./utils.js";

const stats = $("#stats");
const todayOrders = $("#todayOrders");
const exportOrdersCSV = $("#exportOrdersCSV");

let ordersCacheFlat = []; // exported for orders.js
export function getOrdersCache(){ return ordersCacheFlat; }

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

exportOrdersCSV.onclick = ()=> {
  const rows = getOrdersCache().map(o=>({
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

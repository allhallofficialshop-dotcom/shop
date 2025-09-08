import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, push, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
const db = getDatabase(app);

// Sidebar navigation
document.querySelectorAll(".admin-sidebar a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.add("hidden"));
    document.querySelector(link.getAttribute("href")).classList.remove("hidden");
    document.querySelectorAll(".admin-sidebar a").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  });
});

// Dashboard
const statsDiv = document.getElementById("stats");
const todayOrdersDiv = document.getElementById("todayOrders");

onValue(ref(db, "orders"), (snapshot) => {
  const orders = snapshot.val();
  let todayCount = 0, pending = 0, cancelled = 0, delivered = 0;

  if (orders) {
    Object.values(orders).forEach(userOrders => {
      Object.values(userOrders).forEach(order => {
        const orderDate = new Date(order.createdAt);
        const today = new Date();
        if (orderDate.toDateString() === today.toDateString()) todayCount++;
        if (order.status === "pending") pending++;
        if (order.status === "cancelled") cancelled++;
        if (order.status === "delivered") delivered++;
      });
    });
  }

  statsDiv.innerHTML = `
    <div class="stat glass-subcard">Today: ${todayCount}</div>
    <div class="stat glass-subcard">Pending: ${pending}</div>
    <div class="stat glass-subcard">Cancelled: ${cancelled}</div>
    <div class="stat glass-subcard">Delivered: ${delivered}</div>
  `;
});

// Products
const addProductBtn = document.getElementById("addProductBtn");
const productList = document.getElementById("productList");

addProductBtn.addEventListener("click", () => {
  const name = prompt("Product name:");
  const price = prompt("Price:");
  const description = prompt("Description:");
  const category = prompt("Category (bags, clothes, etc.):");
  const images = prompt("Image URLs (comma separated):").split(",");
  const colors = prompt("Colors (comma separated):");

  push(ref(db, "products"), {
    name, price, description, category, images, colors, createdAt: Date.now()
  });
});

onValue(ref(db, "products"), (snapshot) => {
  const products = snapshot.val();
  productList.innerHTML = "";
  if (!products) return;
  Object.entries(products).forEach(([id, p]) => {
    let div = document.createElement("div");
    div.className = "product glass-subcard";
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.category} | Rs.${p.price}</p>
      <button class="btn-gold editBtn" data-id="${id}">Edit</button>
      <button class="btn-rose deleteBtn" data-id="${id}">Delete</button>
    `;
    productList.appendChild(div);
  });

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async e => {
      await remove(ref(db, "products/" + e.target.dataset.id));
      alert("Product deleted ❌");
    });
  });
});

// Orders management
const orderList = document.getElementById("orderList");
onValue(ref(db, "orders"), (snapshot) => {
  const orders = snapshot.val();
  orderList.innerHTML = "";
  if (!orders) return;

  Object.entries(orders).forEach(([userId, userOrders]) => {
    Object.entries(userOrders).forEach(([orderId, order]) => {
      let div = document.createElement("div");
      div.className = "order glass-subcard";
      div.innerHTML = `
        <h4>Order #${orderId}</h4>
        <p>User: ${userId}</p>
        <p>Status: ${order.status}</p>
        <p>Payment: ${order.payment}</p>
        <button class="btn-gold statusBtn" data-user="${userId}" data-id="${orderId}" data-status="accepted">Accept</button>
        <button class="btn-rose statusBtn" data-user="${userId}" data-id="${orderId}" data-status="cancelled">Cancel</button>
        <button class="btn-gold statusBtn" data-user="${userId}" data-id="${orderId}" data-status="delivered">Delivered</button>
      `;
      orderList.appendChild(div);
    });
  });

  document.querySelectorAll(".statusBtn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const { user, id, status } = e.target.dataset;
      await update(ref(db, `orders/${user}/${id}`), { status });
      alert(`Order updated → ${status}`);
    });
  });
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const userId = "user123"; // later use Firebase Auth
const ordersList = document.getElementById("ordersList");

onValue(ref(db, "orders/" + userId), (snapshot) => {
  const orders = snapshot.val();
  ordersList.innerHTML = "";

  if (!orders) {
    ordersList.innerHTML = "<p>No orders found.</p>";
    return;
  }

  Object.values(orders).reverse().forEach(order => {
    let orderDiv = document.createElement("div");
    orderDiv.className = "order glass-subcard";

    const orderDate = new Date(order.createdAt).toLocaleString();
    const canCancel = (Date.now() - order.createdAt) < (2 * 60 * 60 * 1000); // 2h

    orderDiv.innerHTML = `
      <h3>Order #${order.id}</h3>
      <p><b>Status:</b> ${order.status}</p>
      <p><b>Placed:</b> ${orderDate}</p>
      <p><b>Payment:</b> ${order.payment}</p>
      <h4>Items:</h4>
      <ul>${order.items.map(i => `<li>${i.name} (${i.color}) x${i.qty}</li>`).join("")}</ul>
      <div class="order-actions">
        ${canCancel && order.status === "pending" ? `<button class="btn-rose cancelBtn" data-id="${order.id}">Cancel</button>` : ""}
        ${order.status === "delivered" ? `<button class="btn-gold returnBtn" data-id="${order.id}">Return</button>
        <button class="btn-gold reviewBtn" data-id="${order.id}">⭐ Review</button>` : ""}
      </div>
    `;
    ordersList.appendChild(orderDiv);
  });

  // Cancel
  document.querySelectorAll(".cancelBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      await update(ref(db, `orders/${userId}/${id}`), { status: "cancelled" });
      alert("Order cancelled ✅");
    });
  });

  // Return
  document.querySelectorAll(".returnBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      await update(ref(db, `orders/${userId}/${id}`), { status: "return-requested" });
      alert("Return request sent 📦");
    });
  });

  // Review
  document.querySelectorAll(".reviewBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const rating = prompt("Rate your order (1-5 ⭐):");
      const comment = prompt("Write a review:");
      if (rating) {
        update(ref(db, `orders/${userId}/${id}/review`), {
          rating,
          comment
        });
        alert("Thank you for your feedback 🙏");
      }
    });
  });
});

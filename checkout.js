import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const userId = "user123"; // later: use Firebase Auth

const orderSummary = document.getElementById("orderSummary");
const placeOrderBtn = document.getElementById("placeOrder");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Show order summary
function renderSummary() {
  if (cart.length === 0) {
    orderSummary.innerHTML = "<p>No items in cart.</p>";
    return;
  }
  let html = "<h3>Order Summary</h3><ul>";
  let total = 0;
  cart.forEach(item => {
    html += `<li>${item.name} (${item.color}) x${item.qty}</li>`;
    total += (item.price || 0) * item.qty;
  });
  html += `</ul><p>Total: ₹${total}</p>`;
  orderSummary.innerHTML = html;
}
renderSummary();

placeOrderBtn.addEventListener("click", async () => {
  const addressChoice = document.querySelector('input[name="address"]:checked');
  const paymentChoice = document.querySelector('input[name="payment"]:checked');

  if (!addressChoice || !paymentChoice) {
    alert("Please select address and payment method.");
    return;
  }

  // Load address from Firebase
  const snap = await get(ref(db, "users/" + userId));
  let user = snap.val() || {};
  let address = (addressChoice.value === "home") ? user.homeAddress : user.officeAddress;

  // Save order to Firebase
  const orderRef = push(ref(db, "orders/" + userId));
  const orderId = orderRef.key;
  await set(orderRef, {
    id: orderId,
    items: cart,
    address,
    payment: paymentChoice.value,
    status: "pending",
    createdAt: Date.now()
  });

  // Clear cart
  localStorage.removeItem("cart");

  // WhatsApp redirect
  const msg = `Hello, I placed an order.\nOrder ID: ${orderId}\nPayment: ${paymentChoice.value}\nItems: ${cart.map(i=>i.name+" x"+i.qty).join(", ")}`;
  window.open(`https://wa.me/1234567890?text=${encodeURIComponent(msg)}`, "_blank");

  alert("Order placed successfully ✅");
  window.location.href = "orders.html";
});

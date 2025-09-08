// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD2-n2E63mxeYwQBfyIDd-OmRMQzu3z9xw",
  authDomain: "all-hall-shop.firebaseapp.com",
  databaseURL: "https://all-hall-shop-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "all-hall-shop",
  storageBucket: "all-hall-shop.appspot.com",
  messagingSenderId: "741136437274",
  appId: "1:741136437274:web:86931f347cd0127faf81a3",
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Get product ID from URL
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

// DOM Elements
const productTitle = document.getElementById("productTitle");
const productDesc = document.getElementById("productDesc");
const productPrice = document.getElementById("productPrice");
const productDiscount = document.getElementById("productDiscount");
const productRating = document.getElementById("productRating");
const colorSelect = document.getElementById("colorSelect");
const quantityInput = document.getElementById("quantity");
const slideshow = document.getElementById("slideshow");

// Load product data
async function loadProduct() {
  if (!productId) return;
  const snap = await get(ref(db, "products/" + productId));
  if (!snap.exists()) return;

  const data = snap.val();

  // Fill UI
  document.getElementById("productName").textContent = data.name;
  productTitle.textContent = data.name;
  productDesc.textContent = data.description || "";
  productPrice.textContent = "₹" + data.price;
  productDiscount.textContent = data.discount ? `(${data.discount}% OFF)` : "";
  productRating.textContent = data.rating || 4;

  // Colors
  colorSelect.innerHTML = "";
  if (data.colors) {
    data.colors.split(",").forEach(c => {
      let opt = document.createElement("option");
      opt.value = c.trim();
      opt.textContent = c.trim();
      colorSelect.appendChild(opt);
    });
  }

  // Slideshow
  slideshow.innerHTML = "";
  if (data.images) {
    data.images.forEach((img, i) => {
      let div = document.createElement("div");
      div.className = "slide";
      if (i === 0) div.classList.add("active");
      div.innerHTML = `<img src="${img}" alt="Product Image">`;
      slideshow.appendChild(div);
    });

    // Auto-slide every 5s
    let index = 0;
    setInterval(() => {
      const slides = document.querySelectorAll(".slide");
      slides.forEach(s => s.classList.remove("active"));
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
    }, 5000);
  }
}
loadProduct();

// Add to cart
document.getElementById("addToCart").addEventListener("click", () => {
  const qty = parseInt(quantityInput.value);
  const color = colorSelect.value;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ id: productId, name: productTitle.textContent, qty, color });
  if (cart.length > 50) cart = cart.slice(0, 50); // Max 50 items
  localStorage.setItem("cart", JSON.stringify(cart));

  alert("Item added to cart ✅");
});

// Order Now → WhatsApp
document.getElementById("orderNow").addEventListener("click", () => {
  const qty = quantityInput.value;
  const color = colorSelect.value;
  const msg = `Hello, I want to order:\n${productTitle.textContent}\nColor: ${color}\nQty: ${qty}`;
  window.open(`https://wa.me/+94768653486?text=${encodeURIComponent(msg)}`, "_blank");
});

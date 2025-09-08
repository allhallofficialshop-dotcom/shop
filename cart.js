const cartItemsDiv = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function renderCart() {
  cartItemsDiv.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cart.forEach((item, index) => {
    let div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <h4>${item.name}</h4>
      <p>Color: ${item.color}</p>
      <p>Qty: <input type="number" value="${item.qty}" min="1" max="50" data-index="${index}" class="qtyInput"></p>
      <button data-index="${index}" class="removeBtn btn-rose">Remove</button>
    `;
    cartItemsDiv.appendChild(div);
    total += (item.price || 0) * item.qty;
  });

  cartTotal.textContent = "₹" + total;
  localStorage.setItem("cart", JSON.stringify(cart));

  // Bind events
  document.querySelectorAll(".qtyInput").forEach(input => {
    input.addEventListener("change", (e) => {
      const i = e.target.dataset.index;
      cart[i].qty = parseInt(e.target.value);
      renderCart();
    });
  });

  document.querySelectorAll(".removeBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const i = e.target.dataset.index;
      cart.splice(i, 1);
      renderCart();
    });
  });
}

renderCart();

checkoutBtn.addEventListener("click", () => {
  window.location.href = "checkout.html";
});

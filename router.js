import { renderDashboard } from "./dashboard.js";
import { renderProducts } from "./products.js";
import { renderOrders } from "./orders.js";

const routes = {
  "#dashboard": renderDashboard,
  "#products": renderProducts,
  "#orders": renderOrders,
};

function router() {
  const hash = window.location.hash || "#dashboard";
  const page = routes[hash];
  if (page) {
    document.getElementById("content").innerHTML = "";
    page(document.getElementById("content"));
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);

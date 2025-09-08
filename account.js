import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const userId = "user123"; // TODO: replace with Firebase Auth later

// UI Elements
const uploadProfilePic = document.getElementById("uploadProfilePic");
const profileImage = document.getElementById("profileImage");
const fields = ["firstName", "lastName", "email", "phone", "birthday", "gender"];
const addressList = document.getElementById("addressList");
const addAddressBtn = document.getElementById("addAddressBtn");
const darkModeToggle = document.getElementById("darkModeToggle");

// Load profile data
async function loadProfile() {
  const snap = await get(ref(db, "users/" + userId));
  if (!snap.exists()) return;
  const user = snap.val();

  fields.forEach(f => {
    if (user[f]) document.getElementById(f).value = user[f];
  });
  if (user.profilePic) profileImage.src = user.profilePic;
  if (user.addresses) {
    addressList.innerHTML = "";
    Object.entries(user.addresses).forEach(([key, addr]) => {
      const div = document.createElement("div");
      div.className = "address glass-subcard";
      div.innerHTML = `
        <p><b>${key}</b>: ${addr.line}, ${addr.town}, ${addr.district}</p>
      `;
      addressList.appendChild(div);
    });
  }
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    darkModeToggle.checked = true;
  }
}
loadProfile();

// Save profile on change
fields.forEach(f => {
  document.getElementById(f).addEventListener("change", e => {
    update(ref(db, "users/" + userId), { [f]: e.target.value });
  });
});

// Upload profile picture to Cloudinary
uploadProfilePic.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  let formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default"); // 🔥 replace with your Cloudinary preset

  const res = await fetch("https://api.cloudinary.com/v1_1/dzgsde4su/image/upload", {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  profileImage.src = data.secure_url;
  update(ref(db, "users/" + userId), { profilePic: data.secure_url });
});

// Add new address
addAddressBtn.addEventListener("click", () => {
  const label = prompt("Address label (Home / Office / Other):");
  const line = prompt("Street + Number:");
  const town = prompt("Town:");
  const district = prompt("District:");
  if (label && line) {
    update(ref(db, "users/" + userId + "/addresses"), {
      [label]: { line, town, district }
    });
    loadProfile();
  }
});

// Dark Mode toggle
darkModeToggle.addEventListener("change", (e) => {
  if (e.target.checked) {
    document.body.classList.add("dark");
    localStorage.setItem("darkMode", "true");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("darkMode", "false");
  }
});

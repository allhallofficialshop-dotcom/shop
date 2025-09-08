// Import Firebase + Cloudinary
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Fake user id (replace with Firebase Auth later)
const userId = "user123";

// DOM elements
const profileImg = document.getElementById("profileImg");
const uploadPic = document.getElementById("uploadPic");

const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const birthday = document.getElementById("birthday");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const gender = document.getElementById("gender");

const homeAddress = document.getElementById("homeAddress");
const officeAddress = document.getElementById("officeAddress");

// Load profile from Firebase
async function loadProfile() {
  const snap = await get(ref(db, "users/" + userId));
  if (snap.exists()) {
    const data = snap.val();
    firstName.value = data.firstName || "";
    lastName.value = data.lastName || "";
    birthday.value = data.birthday || "";
    email.value = data.email || "";
    phone.value = data.phone || "";
    gender.value = data.gender || "";
    homeAddress.value = data.homeAddress || "";
    officeAddress.value = data.officeAddress || "";
    profileImg.src = data.profileImg || "default-profile.png";
  }
}
loadProfile();

// Auto-save to Firebase
function saveProfile() {
  set(ref(db, "users/" + userId), {
    firstName: firstName.value,
    lastName: lastName.value,
    birthday: birthday.value,
    email: email.value,
    phone: phone.value,
    gender: gender.value,
    homeAddress: homeAddress.value,
    officeAddress: officeAddress.value,
    profileImg: profileImg.src,
  });
}
[firstName, lastName, birthday, email, phone, gender, homeAddress, officeAddress]
  .forEach(el => el.addEventListener("change", saveProfile));

// Upload profile picture to Cloudinary
uploadPic.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  let formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "shop_unsigned");

  const res = await fetch("https://api.cloudinary.com/v1_1/dzgsde4su/image/upload", {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  profileImg.src = data.secure_url;
  saveProfile();
});

// Theme toggle
document.getElementById("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
});

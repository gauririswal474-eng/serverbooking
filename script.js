// JavaScript DOM - Service Booking Web App

// ---------- Data ----------
const services = [
  { id: 1, name: "Dry Cleaning", price: 200, image: "images/dry-cleaning.svg" },
  { id: 2, name: "Washing & Folding", price: 150, image: "images/washing-folding.svg" },
  { id: 3, name: "Ironing", price: 100, image: "images/ironing.svg" },
  { id: 4, name: "Home Cleaning", price: 500, image: "images/home-cleaning.svg" },
  { id: 5, name: "AC Servicing", price: 800, image: "images/ac-servicing.svg" },
  { id: 6, name: "Plumbing", price: 300, image: "images/plumbing.svg" }
];

let currentIndex = 0; // which service is shown in the right section
// ---------- localStorage: keep the cart across browser sessions ----------
const STORAGE_KEY = "serviceBookingCart";

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.map((item) => item.id)));
  } catch (error) {
    // storage may be blocked (private mode etc.), the app still works without it
  }
}

function loadCart() {
  try {
    const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return services.filter((service) => Array.isArray(ids) && ids.includes(service.id));
  } catch (error) {
    return [];
  }
}

let cart = loadCart(); // services added by the user (restored from localStorage)

// ---------- DOM elements ----------
const serviceDisplay = document.getElementById("serviceDisplay");
const cartBody = document.getElementById("cartBody");
const totalAmount = document.getElementById("totalAmount");
const bookingForm = document.getElementById("bookingForm");
const bookBtn = document.getElementById("bookBtn");
const formMessage = document.getElementById("formMessage");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("toast");

// ---------- Helpers ----------
const formatPrice = (amount) => "₹ " + amount.toLocaleString("en-IN");

const isInCart = (id) => cart.some((item) => item.id === id);

let toastTimer;
function showToast(message, type) {
  toast.textContent = message;
  toast.className = "toast show" + (type ? " " + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 2800);
}

// ---------- Right section: show one service at a time ----------
function renderService() {
  const service = services[currentIndex];
  const added = isInCart(service.id);

  serviceDisplay.innerHTML = `
    <div class="service-count">Service ${currentIndex + 1} of ${services.length}</div>
    <img src="${service.image}" alt="${service.name}">
    <div class="service-meta">
      <span class="service-name">${service.name}</span>
      <span class="service-price">${formatPrice(service.price)}</span>
    </div>
    <div class="service-actions">
      <button type="button" class="skip-btn" id="skipBtn">Skip Item &#8854;</button>
      <button type="button" class="add-btn" id="addBtn" ${added ? "disabled" : ""}>
        ${added ? "Added &#10003;" : "Add Item &#8853;"}
      </button>
    </div>
  `;

  document.getElementById("skipBtn").addEventListener("click", showNextService);
  document.getElementById("addBtn").addEventListener("click", addCurrentService);
}

function showNextService() {
  currentIndex = (currentIndex + 1) % services.length;
  renderService();
}

// ---------- Left section: cart ----------
function addCurrentService() {
  const service = services[currentIndex];
  if (!isInCart(service.id)) {
    cart.push(service);
    showToast(`${service.name} added to cart`);
  }
  renderCart();
  showNextService();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  renderCart();
  renderService();
}

function renderCart() {
  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">i</div>
        No Items Added
        <small>Add items to the cart from the services bar</small>
      </div>`;
  } else {
    cartBody.innerHTML = cart
      .map(
        (item, index) => `
        <div class="cart-row">
          <span>${index + 1}</span>
          <span>${item.name}</span>
          <span class="right">${formatPrice(item.price)}</span>
          <button type="button" class="remove-btn" data-id="${item.id}" aria-label="Remove ${item.name}">&times;</button>
        </div>`
      )
      .join("");

    cartBody.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id)));
    });
  }

  // Total amount updates dynamically
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  totalAmount.textContent = formatPrice(total);

  saveCart();
  updateBookButton();
}

// ---------- Booking form ----------
function updateBookButton() {
  const filled =
    fullName.value.trim() && email.value.trim() && phone.value.trim() && password.value;
  bookBtn.disabled = !(cart.length > 0 && filled);
}

function validateForm() {
  let message = "";
  const nameOk = fullName.value.trim().length >= 2;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  const phoneOk = /^\d{10}$/.test(phone.value.replace(/[\s-]/g, ""));

  const passwordOk = password.value.length >= 6;

  fullName.classList.toggle("invalid", !nameOk);
  email.classList.toggle("invalid", !emailOk);
  phone.classList.toggle("invalid", !phoneOk);
  password.classList.toggle("invalid", !passwordOk);

  if (!nameOk) {
    message = "Please enter your full name.";
  } else if (!emailOk) {
    message = "Please enter a valid email address.";
  } else if (!phoneOk) {
    message = "Please enter a valid 10 digit phone number.";
  } else if (!passwordOk) {
    message = "Password must be at least 6 characters.";
  }

  formMessage.textContent = message;
  return message === "";
}

[fullName, email, phone, password].forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("invalid");
    formMessage.textContent = "";
    updateBookButton();
  });
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (cart.length === 0) {
    formMessage.textContent = "Please add at least one service to the cart.";
    return;
  }
  if (!validateForm()) {
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const name = fullName.value.trim();
  showToast(`Thank you ${name}! ${cart.length} service(s) booked. Total ${formatPrice(total)}`, "success");

  // Reset everything after a successful booking
  cart = [];
  bookingForm.reset();
  currentIndex = 0;
  renderCart();
  renderService();
});

// ---------- Logout button ----------
logoutBtn.addEventListener("click", () => {
  showToast("You have been logged out (demo)");
});

// ---------- Initial render ----------
renderCart();
renderService();

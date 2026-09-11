const PRODUCT_SERVICE_URL = "http://localhost:8081";
const ORDER_SERVICE_URL = "http://localhost:8082";
const AUTH_SERVICE_URL = "http://localhost:8083";
const TOKEN_KEY = "cloudcart_token";

const productGrid = document.getElementById("productGrid");
const feedback = document.getElementById("feedback");
const orderList = document.getElementById("orderList");
const statusDot = document.querySelector(".dot");
const statusText = document.getElementById("statusText");
const authNav = document.getElementById("authNav");
const authModal = document.getElementById("authModal");

function formatPrice(price) {
    return "₹" + Number(price).toLocaleString("en-IN");
}

// Product Service now stores a real imageUrl per product. If a product was
// created without one (e.g. older test data), fall back to a placeholder
// so the layout never breaks.
function imageUrlFor(product) {
    return product.imageUrl;
}

function showFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = "feedback container " + type;
    setTimeout(() => {
        feedback.className = "feedback container hidden";
    }, 4000);
}

function setStatus(online) {
    if (online) {
        statusDot.classList.add("online");
        statusDot.classList.remove("offline");
        statusText.textContent = "Services online";
    } else {
        statusDot.classList.add("offline");
        statusDot.classList.remove("online");
        statusText.textContent = "Services unreachable";
    }
}

/* ============================================================
   AUTH STATE HELPERS
   Only the JWT itself is stored in localStorage, per the spec.
   Anything else shown in the UI (like the logged-in email) is
   read back out of the token's payload at render time, never
   stored separately.
   ============================================================ */

function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function isLoggedIn() {
    return !!getAuthToken();
}

function getAuthHeaders() {
    const token = getAuthToken();
    return token
        ? {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        : {
            "Content-Type": "application/json"
          };
}

// Reads the "sub" (email) claim out of the JWT payload purely for display
// in the navbar greeting. This does NOT verify the token - that only
// happens server-side. It's just a convenience read of already-public data.
function getLoggedInEmail() {
    const token = getAuthToken();
    if (!token) return null;
    try {
        const payload = token.split(".")[1];
        const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        const parsed = JSON.parse(decoded);
        return parsed.sub || null;
    } catch (err) {
        return null;
    }
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    renderAuthNav();
    showFeedback("You've been logged out.", "success");
}

// Renders the navbar auth area based on current login state.
// Called on page load and after every login/logout.
function renderAuthNav() {
    if (isLoggedIn()) {
        const email = getLoggedInEmail() || "there";
        authNav.innerHTML = `
            <span class="auth-greeting" title="${email}">Hi, ${email}</span>
            <button type="button" class="auth-btn ghost" id="logoutBtn">Logout</button>
        `;
        document.getElementById("logoutBtn").addEventListener("click", logout);
    } else {
        authNav.innerHTML = `
            <button type="button" class="auth-btn ghost" id="loginNavBtn">Login</button>
            <button type="button" class="auth-btn primary" id="signupNavBtn">Sign Up</button>
        `;
        document.getElementById("loginNavBtn").addEventListener("click", () => openAuthModal("login"));
        document.getElementById("signupNavBtn").addEventListener("click", () => openAuthModal("signup"));
    }
}

/* ============================================================
   AUTH MODAL CONTROL
   ============================================================ */

function openAuthModal(tab) {
    switchAuthTab(tab || "login");
    authModal.classList.remove("hidden");
}

function closeAuthModal() {
    authModal.classList.add("hidden");
    clearAuthMessages();
}

function switchAuthTab(tab) {
    document.querySelectorAll(".modal-tab").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
    document.getElementById("signupForm").classList.toggle("hidden", tab !== "signup");
    clearAuthMessages();
}

function clearAuthMessages() {
    document.getElementById("loginError").classList.add("hidden");
    document.getElementById("signupError").classList.add("hidden");
    document.getElementById("signupSuccess").classList.add("hidden");
}

document.getElementById("authModalClose").addEventListener("click", closeAuthModal);

// Click outside the modal card to close it
authModal.addEventListener("click", (e) => {
    if (e.target === authModal) closeAuthModal();
});

// Escape key to close
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !authModal.classList.contains("hidden")) {
        closeAuthModal();
    }
});

document.querySelectorAll(".modal-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchAuthTab(btn.dataset.tab));
});

/* ============================================================
   SIGNUP
   ============================================================ */

document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;

    const errorEl = document.getElementById("signupError");
    const successEl = document.getElementById("signupSuccess");
    errorEl.classList.add("hidden");
    successEl.classList.add("hidden");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !password || !confirmPassword) {
        errorEl.textContent = "Please fill in all fields.";
        errorEl.classList.remove("hidden");
        return;
    }
    if (!emailPattern.test(email)) {
        errorEl.textContent = "Please enter a valid email address.";
        errorEl.classList.remove("hidden");
        return;
    }
    if (password !== confirmPassword) {
        errorEl.textContent = "Passwords do not match.";
        errorEl.classList.remove("hidden");
        return;
    }

    const submitBtn = e.target.querySelector(".auth-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account…";

    try {
        const res = await fetch(`${AUTH_SERVICE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        if (res.status === 409) {
            errorEl.textContent = "Email is already registered.";
            errorEl.classList.remove("hidden");
            return;
        }

        if (!res.ok) {
            // Try to surface a backend message if there is one, otherwise
            // fall back to a generic "already registered" guess since that's
            // the most common non-2xx case for signup, or a network message.
            let message = "Something went wrong creating your account. Please try again.";
            try {
                const body = await res.json();
                if (body && body.message) message = body.message;
            } catch (_) {
                // response wasn't JSON - keep the generic message
            }
            errorEl.textContent = message;
            errorEl.classList.remove("hidden");
            return;
        }

        successEl.textContent = "Account created! You can log in now.";
        successEl.classList.remove("hidden");
        e.target.reset();

        setTimeout(() => {
            switchAuthTab("login");
            document.getElementById("loginEmail").value = email;
        }, 1200);
    } catch (err) {
        errorEl.textContent = "Auth Service is unavailable right now. Please try again shortly.";
        errorEl.classList.remove("hidden");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
    }
});

/* ============================================================
   LOGIN
   ============================================================ */

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("loginError");
    errorEl.classList.add("hidden");

    if (!email || !password) {
        errorEl.textContent = "Please enter both email and password.";
        errorEl.classList.remove("hidden");
        return;
    }

    const submitBtn = e.target.querySelector(".auth-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in…";

    try {
        const res = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (res.status === 401 || res.status === 400 || res.status === 404) {
            errorEl.textContent = "Incorrect email or password.";
            errorEl.classList.remove("hidden");
            return;
        }

        if (!res.ok) {
            throw new Error("network");
        }

        const data = await res.json();
        if (!data.token) throw new Error("network");

        localStorage.setItem(TOKEN_KEY, data.token);

        e.target.reset();
        closeAuthModal();
        renderAuthNav();
        showFeedback("Welcome back — you're logged in.", "success");
    } catch (err) {
        errorEl.textContent = "Auth Service is unavailable right now. Please try again shortly.";
        errorEl.classList.remove("hidden");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Log In";
    }
});

/* ============================================================
   PRODUCTS
   ============================================================ */

async function loadProducts() {
    try {
        const res = await fetch(`${PRODUCT_SERVICE_URL}/products`);
        if (!res.ok) throw new Error("Failed to load products");
        const products = await res.json();
        setStatus(true);
        renderProducts(products);
    } catch (err) {
        setStatus(false);
        productGrid.innerHTML = `<p class="empty-state">Could not reach Product Service at ${PRODUCT_SERVICE_URL}. Is it running?</p>`;
    }
}

function renderProducts(products) {
    if (!products.length) {
        productGrid.innerHTML = `<p class="empty-state">No products yet. Create one via POST ${PRODUCT_SERVICE_URL}/products</p>`;
        return;
    }

    productGrid.innerHTML = "";
    products.forEach((product) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <div class="product-image-wrap">
                <img src="${imageUrlFor(product)}" alt="${product.name}" loading="lazy" />
            </div>
            <div class="product-body">
                <div class="product-name">${product.name}</div>
                <div class="product-desc">${product.description || ""}</div>
                <div class="product-row">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <span class="product-stock">In stock: ${product.quantity}</span>
                </div>
                <button class="order-btn" data-id="${product.id}" data-price="${product.price}">Add to order</button>
            </div>
        `;
        productGrid.appendChild(card);
    });

    document.querySelectorAll(".order-btn").forEach((btn) => {
        btn.addEventListener("click", () => placeOrder(btn));
    });
}

/* ============================================================
   ORDERS
   "Add to order" now checks login state first. If not logged in,
   no request is sent to Order Service at all - the user just sees
   a message with a Login link. If logged in, the JWT is attached
   as an Authorization header (the backend doesn't validate it yet,
   but the frontend is already wired to send it correctly).
   ============================================================ */

async function placeOrder(btn) {
    if (!isLoggedIn()) {
        feedback.innerHTML = `Please login to place an order. <a href="#" class="inline-login-link" id="inlineLoginLink">Login</a>`;
        feedback.className = "feedback container error";
        document.getElementById("inlineLoginLink").addEventListener("click", (e) => {
            e.preventDefault();
            openAuthModal("login");
        });
        return;
    }

    const productId = btn.getAttribute("data-id");
    const price = Number(btn.getAttribute("data-price"));

    btn.disabled = true;
    btn.textContent = "Ordering…";

    try {
        const res = await fetch(`${ORDER_SERVICE_URL}/orders`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                productId: Number(productId),
                quantity: 1,
                totalPrice: price,
                status: "PLACED"
            }),
        });

        // Backend JWT validation isn't implemented yet, but this is here
        // so ordering behaves correctly once it is: an expired/invalid
        // token should send the user back to login, not fail silently.
        if (res.status === 401 || res.status === 403) {
            showFeedback("Your session has expired. Please log in again.", "error");
            logout();
            openAuthModal("login");
            return;
        }

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Order failed");
        }

        showFeedback(`Order #${data.id} placed - total ${formatPrice(data.totalPrice)}`, "success");
        loadOrders();
    } catch (err) {
        showFeedback(err.message || "Could not reach Order Service.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Add to order";
    }
}

async function loadOrders() {
    try {
        const res = await fetch(`${ORDER_SERVICE_URL}/orders`);
        if (!res.ok) throw new Error();
        const orders = await res.json();
        renderOrders(orders);
    } catch (err) {
        // Order service may not be up yet - product browsing still works.
    }
}

function renderOrders(orders) {
    if (!orders.length) {
        orderList.innerHTML = `<p class="empty-state">No orders yet. Order a product above.</p>`;
        return;
    }

    orderList.innerHTML = "";
    orders
        .slice()
        .reverse()
        .forEach((order) => {
            const row = document.createElement("div");
            row.className = "order-row";
            row.innerHTML = `
                <span>Order #${order.id} · Product ${order.productId} · Qty ${order.quantity}</span>
                <span>${formatPrice(order.totalPrice)}</span>
                <span class="order-status">${order.status}</span>
            `;
            orderList.appendChild(row);
        });
}

/* ============================================================
   INIT
   ============================================================ */

renderAuthNav();
loadProducts();
loadOrders();

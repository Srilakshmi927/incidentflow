const API_BASE = "http://localhost:8080/api/incidents";

let page = 0;
let totalPages = 1;

const incidentsBody = document.getElementById("incidentsBody");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const sortSelect = document.getElementById("sortSelect");
const pageSize = document.getElementById("pageSize");
const pageInfo = document.getElementById("pageInfo");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const applyBtn = document.getElementById("applyBtn");
const resetBtn = document.getElementById("resetBtn");

const alertBox = document.getElementById("alert");
const loading = document.getElementById("loading");
const empty = document.getElementById("empty");
// Create form elements
const createForm = document.getElementById("createForm");
const titleInput = document.getElementById("titleInput");
const priorityInput = document.getElementById("priorityInput");
const descInput = document.getElementById("descInput");
const clearBtn = document.getElementById("clearBtn");
const formMsg = document.getElementById("formMsg");

function showAlert(msg) {
  alertBox.textContent = msg;
  alertBox.classList.remove("hidden");
}
function hideAlert() {
  alertBox.classList.add("hidden");
  alertBox.textContent = "";
}

function setLoading(isLoading) {
  if (isLoading) loading.classList.remove("hidden");
  else loading.classList.add("hidden");
}

function formatDate(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleString();
}

function badge(text) {
  return `<span class="badge">${text ?? "-"}</span>`;
}

function renderRows(items) {
  incidentsBody.innerHTML = "";
  items.forEach(i => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i.id ?? "-"}</td>
      <td>${i.title ?? "-"}</td>
      <td>${badge(i.priority)}</td>
      <td>${badge(i.status)}</td>
      <td>${i.assignedTo ? badge(i.assignedTo) : "-"}</td>
      <td>${formatDate(i.createdAt)}</td>
    `;
    incidentsBody.appendChild(tr);
  });
}

function updatePager() {
  pageInfo.textContent = `Page ${page + 1} of ${totalPages}`;
  prevBtn.disabled = page <= 0;
  nextBtn.disabled = page >= totalPages - 1;
}

function buildUrl() {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", pageSize.value);

  // sort: "createdAt,desc"
  params.set("sort", sortSelect.value);

  if (statusFilter.value) params.set("status", statusFilter.value);
  if (priorityFilter.value) params.set("priority", priorityFilter.value);

  return `${API_BASE}?${params.toString()}`;
}
function setFormMsg(message, type) {
  formMsg.textContent = message || "";
  formMsg.classList.remove("ok", "err");
  if (type) formMsg.classList.add(type);
}

function clearForm() {
  titleInput.value = "";
  priorityInput.value = "";
  descInput.value = "";
  setFormMsg("", null);
}

async function loadIncidents() {
  hideAlert();
  empty.classList.add("hidden");
  setLoading(true);

  try {
    const url = buildUrl();
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error (${res.status}): ${text}`);
    }

    const data = await res.json();

    // Spring Page format: { content: [], totalPages: n, number: currentPage, ... }
    const items = data.content ?? [];
    totalPages = data.totalPages ?? 1;
    page = data.number ?? page;

    if (items.length === 0) {
      incidentsBody.innerHTML = "";
      empty.classList.remove("hidden");
    } else {
      renderRows(items);
    }

    updatePager();
  } catch (e) {
    showAlert(e.message || "Something went wrong while loading incidents.");
  } finally {
    setLoading(false);
  }
}
async function createIncident() {
  const title = titleInput.value.trim();
  const priority = priorityInput.value;
  const description = descInput.value.trim();

  // Basic client-side validation
  if (!title) return setFormMsg("Title is required.", "err");
  if (!priority) return setFormMsg("Priority is required.", "err");
  if (!description) return setFormMsg("Description is required.", "err");

  setFormMsg("Creating incident...", null);

  const payload = { title, description, priority };

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Try to show clean error from backend (your GlobalExceptionHandler)
      let msg = `Failed (${res.status})`;
      try {
        const errJson = await res.json();
        msg = errJson.error || msg;
      } catch {
        const txt = await res.text();
        if (txt) msg = txt;
      }
      throw new Error(msg);
    }

    setFormMsg("Incident created successfully.", "ok");
    clearForm();

    // Refresh list (go back to page 0 to see newest items)
    page = 0;
    await loadIncidents();

  } catch (e) {
    setFormMsg(e.message || "Unable to create incident.", "err");
  }
}

applyBtn.addEventListener("click", () => {
  page = 0;
  loadIncidents();
});

resetBtn.addEventListener("click", () => {
  statusFilter.value = "";
  priorityFilter.value = "";
  sortSelect.value = "createdAt,desc";
  pageSize.value = "10";
  page = 0;
  loadIncidents();
});

prevBtn.addEventListener("click", () => {
  if (page > 0) {
    page--;
    loadIncidents();
  }
});

nextBtn.addEventListener("click", () => {
  if (page < totalPages - 1) {
    page++;
    loadIncidents();
  }
});
createForm.addEventListener("submit", (e) => {
  e.preventDefault();
  createIncident();
});

clearBtn.addEventListener("click", () => {
  clearForm();
});

// initial load
loadIncidents();

const API_BASE = "http://localhost:8080/api/incidents";

let page = 0;
let totalPages = 1;
// Status update form elements
const statusForm = document.getElementById("statusForm");
const statusIncidentId = document.getElementById("statusIncidentId");
const newStatus = document.getElementById("newStatus");
const statusRole = document.getElementById("statusRole");
const statusClearBtn = document.getElementById("statusClearBtn");
const statusMsg = document.getElementById("statusMsg");

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
// Assign form elements
const assignForm = document.getElementById("assignForm");
const assignIncidentId = document.getElementById("assignIncidentId");
const assignTo = document.getElementById("assignTo");
const assignRole = document.getElementById("assignRole");
const assignClearBtn = document.getElementById("assignClearBtn");
const assignMsg = document.getElementById("assignMsg");


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
    const isAssigned = i.assignedTo && i.assignedTo.trim() !== "";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i.id ?? "-"}</td>
      <td>${i.title ?? "-"}</td>
      <td>${badge(i.priority)}</td>
      <td>${badge(i.status)}</td>
      <td>${isAssigned ? badge(i.assignedTo) : "<span class='unassigned'>Unassigned</span>"}</td>
      <td>${formatDate(i.createdAt)}</td>
      <td>
        <div class="actionsCell">
          <button class="btn btn-secondary btn-sm js-assign" type="button">Assign</button>
          <button class="btn btn-ghost btn-sm js-status" type="button">Status</button>
        </div>
      </td>
    `;

    // Row click = auto fill ID in both forms (quick use)
    tr.addEventListener("click", (e) => {
      // ignore clicks on buttons (buttons have their own handlers)
      if (e.target.closest("button")) return;
      fillAssignFormFromIncident(i);
      fillStatusFormFromIncident(i);
    });

    // Assign button
    tr.querySelector(".js-assign").addEventListener("click", () => {
      fillAssignFormFromIncident(i);
      // Helpful message
      setAssignMsg(`Editing assignment for Incident #${i.id}`, null);
    });

    // Status button
    tr.querySelector(".js-status").addEventListener("click", () => {
      if (!isAssigned) {
        setStatusMsg("Please assign the incident before changing its status.", "err");
        fillStatusFormFromIncident(i);
        return;
      }
      fillStatusFormFromIncident(i);
      setStatusMsg(`Updating status for Incident #${i.id}`, null);
    });

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
function setAssignMsg(message, type) {
  assignMsg.textContent = message || "";
  assignMsg.classList.remove("ok", "err");
  if (type) assignMsg.classList.add(type);
}

function clearAssignForm() {
  assignIncidentId.value = "";
  assignTo.value = "";
  assignRole.value = "";
  setAssignMsg("", null);
}
function setStatusMsg(message, type) {
  statusMsg.textContent = message || "";
  statusMsg.classList.remove("ok", "err");
  if (type) statusMsg.classList.add(type);
}

function clearStatusForm() {
  statusIncidentId.value = "";
  newStatus.value = "";
  statusRole.value = "";
  setStatusMsg("", null);
}
function fillAssignFormFromIncident(incident) {
  assignIncidentId.value = incident.id ?? "";
  assignTo.value = incident.assignedTo ?? "";
  // Keep role as-is so user doesn't have to reselect every time
  setAssignMsg("", null);
  assignIncidentId.scrollIntoView({ behavior: "smooth", block: "center" });
}

function fillStatusFormFromIncident(incident) {
  statusIncidentId.value = incident.id ?? "";
  // Keep role as-is, only set message
  setStatusMsg("", null);
  statusIncidentId.scrollIntoView({ behavior: "smooth", block: "center" });
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
async function assignIncident() {
  const id = String(assignIncidentId.value || "").trim();
  const assignedTo = assignTo.value.trim();
  const userRole = assignRole.value;

  if (!id || Number(id) <= 0) return setAssignMsg("Incident ID is required.", "err");
  if (!assignedTo) return setAssignMsg("Assign To is required.", "err");
  if (!userRole) return setAssignMsg("User Role is required.", "err");

  setAssignMsg("Assigning incident...", null);

  const payload = { assignedTo, userRole };

  try {
    const res = await fetch(`${API_BASE}/${id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
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

    setAssignMsg("Incident assigned successfully.", "ok");
    clearAssignForm();

    // refresh list to see the updated assignedTo
    page = 0;
    await loadIncidents();

  } catch (e) {
    setAssignMsg(e.message || "Unable to assign incident.", "err");
  }
}
async function updateIncidentStatus() {
  const id = String(statusIncidentId.value || "").trim();
  const status = newStatus.value;
  const userRole = statusRole.value;

  if (!id || Number(id) <= 0) return setStatusMsg("Incident ID is required.", "err");
  if (!status) return setStatusMsg("New status is required.", "err");
  if (!userRole) return setStatusMsg("User role is required.", "err");
const incidentRow = Array.from(document.querySelectorAll("#incidentsBody tr"))
    .find(row => row.children[0].textContent.trim() === id);

  if (incidentRow) {
    const assignedCell = incidentRow.children[4].textContent.trim();
    if (assignedCell === "Unassigned") {
      return setStatusMsg("Please assign the incident before changing its status.", "err");
    }
  }
  setStatusMsg("Updating status...", null);

  const payload = { status, userRole };

  try {
    const res = await fetch(`${API_BASE}/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
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

    setStatusMsg("Status updated successfully.", "ok");
    clearStatusForm();

    // refresh table
    page = 0;
    await loadIncidents();

  } catch (e) {
    setStatusMsg(e.message || "Unable to update status.", "err");
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
assignForm.addEventListener("submit", (e) => {
  e.preventDefault();
  assignIncident();
});

assignClearBtn.addEventListener("click", () => {
  clearAssignForm();
});
statusForm.addEventListener("submit", (e) => {
  e.preventDefault();
  updateIncidentStatus();
});

statusClearBtn.addEventListener("click", () => {
  clearStatusForm();
});

// initial load
loadIncidents();

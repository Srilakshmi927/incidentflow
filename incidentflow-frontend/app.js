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
const exportBtn = document.getElementById("exportBtn");

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
const deleteModal = document.getElementById("deleteModal");
const closeDeleteBtn = document.getElementById("closeDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deleteText = document.getElementById("deleteText");
const deleteRole = document.getElementById("deleteRole");
const editModal = document.getElementById("editModal");
const closeEditBtn = document.getElementById("closeEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");

const editId = document.getElementById("editId");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editPriority = document.getElementById("editPriority");
const editRole = document.getElementById("editRole");
const detailsModal = document.getElementById("detailsModal");
const closeDetailsBtn = document.getElementById("closeDetailsBtn");

const detailId = document.getElementById("detailId");
const detailTitle = document.getElementById("detailTitle");
const detailDescription = document.getElementById("detailDescription");
const detailStatus = document.getElementById("detailStatus");
const detailPriority = document.getElementById("detailPriority");

const detailUpdatedBy = document.getElementById("detailUpdatedBy");
const detailUpdatedAt = document.getElementById("detailUpdatedAt");
const editUpdatedBy = document.getElementById("editUpdatedBy");
const editUpdatedAt = document.getElementById("editUpdatedAt");
const dashTotal = document.getElementById("dashTotal");
const dashOpen = document.getElementById("dashOpen");
const dashInProgress = document.getElementById("dashInProgress");
const dashResolved = document.getElementById("dashResolved");
const dashClosed = document.getElementById("dashClosed");
const dashHigh = document.getElementById("dashHigh");
const statusChart = document.getElementById("statusChart");
const refreshChartBtn = document.getElementById("refreshChartBtn");

let deleteIncidentId = null;


const incidentModal = document.getElementById("incidentModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");
const toastContainer = document.getElementById("toastContainer");

function drawBarChart(canvas, labels, values) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  // clear
  ctx.clearRect(0, 0, w, h);

  // padding
  const padLeft = 60;
  const padRight = 20;
  const padTop = 30;
  const padBottom = 50;

  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  const maxVal = Math.max(...values, 1); // avoid divide by 0
  const barCount = values.length;
  const gap = 18;
  const barW = (chartW - gap * (barCount - 1)) / barCount;

  // axis
  ctx.font = "14px Arial";
  ctx.fillStyle = "#333";
  ctx.strokeStyle = "#999";

  // y-axis
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + chartH);
  ctx.stroke();

  // x-axis
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop + chartH);
  ctx.lineTo(padLeft + chartW, padTop + chartH);
  ctx.stroke();

  // y-axis ticks (0, mid, max)
  const ticks = [0, Math.round(maxVal / 2), maxVal];
  ctx.fillStyle = "#555";
  ticks.forEach(t => {
    const y = padTop + chartH - (t / maxVal) * chartH;
    ctx.beginPath();
    ctx.moveTo(padLeft - 6, y);
    ctx.lineTo(padLeft, y);
    ctx.stroke();
    ctx.fillText(String(t), 10, y + 5);
  });

  // bars
  values.forEach((v, idx) => {
    const barH = (v / maxVal) * chartH;
    const x = padLeft + idx * (barW + gap);
    const y = padTop + chartH - barH;

    // bar (default browser color) - no custom palette
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x, y, barW, barH);

    // value label
    ctx.fillStyle = "#111";
    ctx.fillText(String(v), x + barW / 2 - 5, y - 8);

    // x labels
    ctx.fillStyle = "#333";
    ctx.save();
    ctx.translate(x + barW / 2, padTop + chartH + 20);
    ctx.rotate(0);
    ctx.textAlign = "center";
    ctx.fillText(labels[idx], 0, 0);
    ctx.restore();
  });

  // title
  ctx.fillStyle = "#111";
  ctx.font = "16px Arial";
  ctx.fillText("Incident Status Counts", padLeft, 20);
}

function downloadCSV(filename, rows) {
  const processRow = (row) =>
    row.map(value => {
      const v = value === null || value === undefined ? "" : String(value);
      const escaped = v.replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(",");

  const csvContent = rows.map(processRow).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function openEditModal(incident) {
  editId.value = incident.id;
  editTitle.value = incident.title;
  editDescription.value = incident.description;
  editPriority.value = incident.priority;
  editRole.value = "";
  
  if (editUpdatedBy) editUpdatedBy.textContent = incident.lastUpdatedBy || "N/A";
  if (editUpdatedAt) editUpdatedAt.textContent = incident.lastUpdatedAt || "N/A";
  editModal.classList.remove("hidden");
}

function closeEditModal() {
  editModal.classList.add("hidden");
}

function openDeleteModal(id) {
  deleteIncidentId = id;
  deleteText.textContent = `Are you sure you want to delete Incident #${id}? This action cannot be undone.`;
  deleteRole.value = "";
  deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
  deleteModal.classList.add("hidden");
  deleteIncidentId = null;
}

function showToast(message, type = "info") {
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

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
          
      <div class="actionsCell">
        <button class="btn btn-secondary btn-sm js-view" type="button">View</button>
        <button class="btn btn-secondary btn-sm js-assign" type="button">Assign</button>
        <button class="btn btn-ghost btn-sm js-status" type="button">Status</button>
        <button class="btn btn-secondary btn-sm js-edit" type="button">Edit</button>
        <button class="btn btn-ghost btn-sm js-delete" type="button">Delete</button>
      </div>


      </td>
    `;
    tr.querySelector(".js-view").addEventListener("click", () => {
      viewIncidentDetails(i.id);

    });

    
tr.querySelector(".js-edit").addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_BASE}/${i.id}`);
    const fullIncident = await res.json();
    openEditModal(fullIncident);
  } catch (e) {
    showToast("Unable to load incident for edit", "error");
  }
});

      tr.querySelector(".js-delete").addEventListener("click", () => {
  openDeleteModal(i.id);
});
tr.querySelector(".js-view").addEventListener("click", () => {
  openDetailsModal(i);
});


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
function openDetailsModal(incident) {

  detailId.textContent = incident.id;
  detailTitle.textContent = incident.title;
  detailDescription.textContent = incident.description;
  detailStatus.textContent = incident.status;
  detailPriority.textContent = incident.priority;

  // NEW AUDIT FIELDS
  detailUpdatedBy.textContent = incident.lastUpdatedBy || "N/A";
  detailUpdatedAt.textContent = incident.lastUpdatedAt || "N/A";

  detailsModal.classList.remove("hidden");
}


function openModal() {
  if (!incidentModal) return;
  incidentModal.classList.remove("hidden");
}

function closeModal() {
  if (!incidentModal || !modalBody) return;
  incidentModal.classList.add("hidden");
  modalBody.innerHTML = "";
}
if (closeEditBtn) closeEditBtn.addEventListener("click", closeEditModal);
if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditModal);
if (closeDetailsBtn) {
  closeDetailsBtn.addEventListener("click", () => {
    detailsModal.classList.add("hidden");
  });
}

// ✅ Only attach event if button exists
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}
if (closeDeleteBtn) closeDeleteBtn.addEventListener("click", closeDeleteModal);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
async function saveEditedIncident() {

  const id = editId.value;
  const role = editRole.value;

  if (!role) {
    showToast("Please select role", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}?userRole=${encodeURIComponent(role)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: editTitle.value,
        description: editDescription.value,
        priority: editPriority.value
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Update failed");
    }

const updated = await res.json();

showToast("Incident updated successfully", "success");

// ✅ update audit fields shown in edit modal
if (editUpdatedBy) editUpdatedBy.textContent = updated.lastUpdatedBy || "N/A";
if (editUpdatedAt) editUpdatedAt.textContent = updated.lastUpdatedAt || "N/A";

// optionally close modal after showing updated audit
closeEditModal();

    await refreshAll();

  } catch (e) {
    showToast(e.message, "error");
  }
}

if (saveEditBtn) saveEditBtn.addEventListener("click", saveEditedIncident);
async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    const data = await res.json();

    dashTotal.textContent = data.total;
    dashOpen.textContent = data.open;
    dashInProgress.textContent = data.inProgress;
    dashResolved.textContent = data.resolved;
    dashClosed.textContent = data.closed;
    dashHigh.textContent = data.highPriority;

  } catch (e) {
    console.error("Dashboard load failed");
  }
}
async function loadStatusChart() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error("Failed to load dashboard summary");

    const d = await res.json();

    const labels = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    const values = [d.open, d.inProgress, d.resolved, d.closed];

    drawBarChart(statusChart, labels, values);

  } catch (e) {
    console.error(e);
    showToast("Unable to load chart data", "error");
  }
}
if (refreshChartBtn) {
  refreshChartBtn.addEventListener("click", loadStatusChart);
}

async function exportIncidentsCSV() {
  try {
    // use current filters
    const status = statusFilter.value || "";
    const priority = priorityFilter.value || "";
    const sort = sortSelect.value || "createdAt,desc";

    const url = `${API_BASE}?status=${encodeURIComponent(status)}&priority=${encodeURIComponent(priority)}&page=0&size=1000&sort=${encodeURIComponent(sort)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch incidents for export");

    const data = await res.json();
    const incidents = data.content || [];

    if (!incidents.length) {
      showToast("No incidents found to export", "error");
      return;
    }

    const rows = [];
    rows.push([
      "ID", "Title", "Priority", "Status", "Assigned To",
      "Created At", "Last Updated By", "Last Updated At"
    ]);

    incidents.forEach(i => {
      rows.push([
        i.id,
        i.title,
        i.priority,
        i.status,
        i.assignedTo || "",
        i.createdAt || "",
        i.lastUpdatedBy || "",
        i.lastUpdatedAt || ""
      ]);
    });

    const today = new Date().toISOString().slice(0,10);
    downloadCSV(`incidentflow_export_${today}.csv`, rows);

    showToast("CSV exported successfully", "success");

  } catch (e) {
    showToast(e.message || "Export failed", "error");
  }
}

async function deleteIncidentById() {
  if (!deleteIncidentId) return;

  const role = deleteRole.value;
  if (!role) {
    showToast("Please select a role to continue", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${deleteIncidentId}?userRole=${encodeURIComponent(role)}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      let msg = `Delete failed (${res.status})`;
      try {
        const errJson = await res.json();
        msg = errJson.error || msg;
      } catch {
        const txt = await res.text();
        if (txt) msg = txt;
      }
      throw new Error(msg);
    }

    showToast(`Incident #${deleteIncidentId} deleted`, "success");
    closeDeleteModal();
    page = 0;
await refreshAll();


  } catch (e) {
    showToast(e.message || "Unable to delete incident", "error");
  }
}

if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", deleteIncidentById);
if (exportBtn) {
  exportBtn.addEventListener("click", exportIncidentsCSV);
}

async function viewIncidentDetails(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error("Failed to fetch incident details");

    const i = await res.json();

    modalBody.innerHTML = `
      <p><strong>ID:</strong> <span>${i.id}</span></p>
      <p><strong>Title:</strong> <span>${i.title}</span></p>
      <p><strong>Description:</strong> <span>${i.description}</span></p>
      <p><strong>Priority:</strong> <span>${i.priority}</span></p>
      <p><strong>Status:</strong> <span>${i.status}</span></p>
      <p><strong>Assigned To:</strong> <span>${i.assignedTo ?? "Unassigned"}</span></p>
      <p><strong>Created At:</strong> <span>${formatDate(i.createdAt)}</span></p>
      
  <p><strong>Last Updated By:</strong> <span>${i.lastUpdatedBy ?? "N/A"}</span></p>
  <p><strong>Last Updated At:</strong> <span>${i.lastUpdatedAt ?? "N/A"}</span></p>
    `;

    openModal();
  } catch (e) {
    alert("Unable to load incident details");
  }
}
async function refreshAll() {
  await loadIncidents();
  await loadDashboard();
  await loadStatusChart();
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

    showToast("Incident created successfully", "success");

    clearForm();

    // Refresh list (go back to page 0 to see newest items)
    page = 0;
    await refreshAll();


  } catch (e) {
    showToast(e.message|| "Unable to create incident.", "error");

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

    showToast("Incident assigned successfully", "success");

    clearAssignForm();

    // refresh list to see the updated assignedTo
    page = 0;
    await refreshAll();


  } catch (e) {
    showToast(e.message  || "Unable to assign incident.", "error");

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
    showToast("Incident status updated successfully", "success");
    clearStatusForm();

    // refresh table
    page = 0;
    await refreshAll();


  } catch (e) {
    showToast(e.message || "Unable to update status.", "error");
  }
}

applyBtn.addEventListener("click", () => {
  page = 0;
  loadIncidents();
  loadDashboard();

});

resetBtn.addEventListener("click", () => {
  statusFilter.value = "";
  priorityFilter.value = "";
  sortSelect.value = "createdAt,desc";
  pageSize.value = "10";
  page = 0;
  loadIncidents();
  loadDashboard();

});

prevBtn.addEventListener("click", () => {
  if (page > 0) {
    page--;
    loadIncidents();
    loadDashboard();

  }
});

nextBtn.addEventListener("click", () => {
  if (page < totalPages - 1) {
    page++;
    loadIncidents();
    loadDashboard();

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
refreshAll();



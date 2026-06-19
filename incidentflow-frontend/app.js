/* =========================
   IncidentFlow - app.js
   Clean version (Edit/Delete fixed)
   ========================= */

const API_HOST = window.location.hostname; // "localhost" or "127.0.0.1"
const API_BASE = `http://${API_HOST}:8080/api/incidents`;
const AUTH_BASE = `http://${API_HOST}:8080/api/auth`;
let showRecentOnly = false;
let page = 0;
let totalPages = 1;
let activeIncidentId = null;
/* ---------- DOM ---------- */
const incidentsBody = document.getElementById("incidentsBody");
const generateAiSummaryBtn = document.getElementById("generateAiSummaryBtn");
const aiSummaryBox = document.getElementById("aiSummaryBox");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const sortSelect = document.getElementById("sortSelect");
const pageSize = document.getElementById("pageSize");
const pageInfo = document.getElementById("pageInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const applyBtn = document.getElementById("applyBtn");
const resetBtn = document.getElementById("resetBtn");
const titleSearch = document.getElementById("titleSearch");
const alertBox = document.getElementById("alert");
const loading = document.getElementById("loading");
const empty = document.getElementById("empty");
const findSimilarBtn = document.getElementById("findSimilarBtn");
const similarIncidentBox = document.getElementById("similarIncidentBox");
/* Create */
const createForm = document.getElementById("createForm");
const titleInput = document.getElementById("titleInput");
const priorityInput = document.getElementById("priorityInput");
const descInput = document.getElementById("descInput");
const clearBtn = document.getElementById("clearBtn");
const formMsg = document.getElementById("formMsg");

/* Assign */
const assignForm = document.getElementById("assignForm");
const assignIncidentId = document.getElementById("assignIncidentId");
const assignTo = document.getElementById("assignTo");
const assignClearBtn = document.getElementById("assignClearBtn");
const assignMsg = document.getElementById("assignMsg");

/* Status */
const statusForm = document.getElementById("statusForm");
const statusIncidentId = document.getElementById("statusIncidentId");
const newStatus = document.getElementById("newStatus");
const statusClearBtn = document.getElementById("statusClearBtn");
const statusMsg = document.getElementById("statusMsg");

/* Modals */
const incidentModal = document.getElementById("incidentModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");

const editModal = document.getElementById("editModal");
const closeEditBtn = document.getElementById("closeEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
const editId = document.getElementById("editId");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editPriority = document.getElementById("editPriority");
const generateResolutionBtn = document.getElementById("generateResolutionBtn");
const aiResolutionBox = document.getElementById("aiResolutionBox");

const detailUpdatedBy = document.getElementById("editUpdatedBy");
const detailUpdatedAt = document.getElementById("editUpdatedAt");

const deleteModal = document.getElementById("deleteModal");
const closeDeleteBtn = document.getElementById("closeDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deleteText = document.getElementById("deleteText");
const toggleDetailsBtn = document.getElementById("toggleDetailsBtn");
const detailsContent = document.getElementById("detailsContent");

/* Toast */
const toastContainer = document.getElementById("toastContainer");

/* Login */
const loginRole = document.getElementById("loginRole");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");
const currentUserRole = document.getElementById("currentUserRole");
const logoutBtn = document.getElementById("logoutBtn");
const loginSection = document.getElementById("loginSection");
const assignSection = document.getElementById("assignSection");
const statusSection = document.getElementById("statusSection");
const roleNote = document.getElementById("roleNote");
/* Dashboard (optional if present) */
const dashTotal = document.getElementById("dashTotal");
const dashOpen = document.getElementById("dashOpen");
const dashInProgress = document.getElementById("dashInProgress");
const dashResolved = document.getElementById("dashResolved");
const dashClosed = document.getElementById("dashClosed");
const dashHigh = document.getElementById("dashHigh");
const statusChart = document.getElementById("statusChart");
const refreshChartBtn = document.getElementById("refreshChartBtn");
const exportBtn = document.getElementById("exportBtn");
const exportDashboardBtn = document.getElementById("exportDashboardBtn");
const assignedSearch = document.getElementById("assignedSearch");
const notificationsContainer = document.getElementById("notificationsContainer");
const showAllNotificationsBtn = document.getElementById("showAllNotificationsBtn");
const currentStatusInfo = document.getElementById("currentStatusInfo");
const nextStatusInfo = document.getElementById("nextStatusInfo");
const timelineSection = document.getElementById("timelineSection");
const timelineContainer = document.getElementById("timelineContainer");
const toggleTimelineBtn = document.getElementById("toggleTimelineBtn");
const toggleCommentsBtn = document.getElementById("toggleCommentsBtn");
const commentsContent = document.getElementById("commentsContent");
const recentToggle = document.getElementById("recentOnlyToggle");
const suggestCategoryBtn = document.getElementById("suggestCategoryBtn");
const aiCategoryBox = document.getElementById("aiCategoryBox");

if (recentToggle) {
  recentToggle.addEventListener("change", async (e) => {
    showRecentOnly = e.target.checked;
    await loadIncidents(); // reload table
  });
}
let allNotificationsLoaded = false;
async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include", // ✅ sends session cookie
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}
/* ---------- Helpers ---------- */
function getRole() {
  return (sessionStorage.getItem("userRole") || "").toUpperCase();
}
function toggleComments() {
  if (!commentsContent || !toggleCommentsBtn) return;

  const isHidden = commentsContent.classList.contains("hidden");

  if (isHidden) {
    commentsContent.classList.remove("hidden");
    toggleCommentsBtn.textContent = "Hide";
  } else {
    commentsContent.classList.add("hidden");
    toggleCommentsBtn.textContent = "Show";
  }
}
function getLoggedInRoleOrBlock() {
  const role = getRole();
  if (!role) {
    showToast("Please login first", "error");
    return null;
  }
  return role;
}
function toggleTimeline() {
  if (!timelineContainer || !toggleTimelineBtn) return;

  const isHidden = timelineContainer.classList.contains("hidden");

  if (isHidden) {
    timelineContainer.classList.remove("hidden");
    toggleTimelineBtn.textContent = "Hide";
  } else {
    timelineContainer.classList.add("hidden");
    toggleTimelineBtn.textContent = "Show";
  }
}
function applyRoleBasedUI() {
  const role = getRole();
  if (!role) return;

  if (assignSection) assignSection.classList.remove("hidden");
  if (statusSection) statusSection.classList.remove("hidden");

  if (roleNote) {
    roleNote.classList.remove("hidden");
    if (role === "EMPLOYEE") {
      roleNote.textContent = "EMPLOYEE: You can create and view incidents. Assign/Status/Edit/Delete are restricted.";
    } else if (role === "SUPPORT") {
      roleNote.textContent = "SUPPORT: You can assign, update status, and edit incidents. Delete is ADMIN-only.";
    } else if (role === "ADMIN") {
      roleNote.textContent = "ADMIN: Full access enabled (including delete for CLOSED incidents).";
    }
  }

  if (role === "EMPLOYEE") {
    if (assignSection) assignSection.classList.add("hidden");
    if (statusSection) statusSection.classList.add("hidden");
  }
}
async function findSimilarIncidents() {
  if (!activeIncidentId) {
    showToast("No active incident selected", "error");
    return;
  }

  if (!similarIncidentBox) return;

  try {
    similarIncidentBox.textContent = "Finding similar incidents...";

    const res = await apiFetch(`${API_BASE}/${activeIncidentId}/similar`, {
      method: "GET",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to find similar incidents");
    }

    const items = await res.json();

    if (!items || items.length === 0) {
      similarIncidentBox.textContent = "No similar incidents found.";
      return;
    }

    similarIncidentBox.innerHTML = items.map(item => `
      <div style="margin-bottom:8px;">
        <strong>#${item.id}</strong> - ${item.title}<br>
        <small>Status: ${item.status} | Priority: ${item.priority}</small>
      </div>
    `).join("");

  } catch (e) {
    similarIncidentBox.textContent = "Unable to find similar incidents.";
    showToast(e.message || "Similar incident search failed", "error");
  }
}

async function generateResolutionNote() {
  if (!activeIncidentId) {
    showToast("No active incident selected", "error");
    return;
  }

  if (!aiResolutionBox) return;

  try {
    aiResolutionBox.textContent = "Generating AI resolution note...";

    const res = await apiFetch(`${API_BASE}/${activeIncidentId}/ai-resolution-note`, {
      method: "GET",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to generate resolution note");
    }

    const data = await res.json();
    aiResolutionBox.textContent = data.resolutionNote || "No resolution note returned.";

  } catch (e) {
    aiResolutionBox.textContent = "Unable to generate AI resolution note.";
    showToast(e.message || "AI resolution note failed", "error");
  }
}
async function suggestCategory() {
  if (!activeIncidentId) {
    showToast("No active incident selected", "error");
    return;
  }

  if (!aiCategoryBox) return;

  try {
    aiCategoryBox.textContent = "Generating AI category suggestion...";

    const res = await apiFetch(`${API_BASE}/${activeIncidentId}/ai-category`, {
      method: "GET",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to suggest category");
    }

    const data = await res.json();
    aiCategoryBox.textContent = data.category || "No category returned.";

  } catch (e) {
    aiCategoryBox.textContent = "Unable to generate AI category suggestion.";
    showToast(e.message || "AI category suggestion failed", "error");
  }
}
async function loadNotifications() {
  if (!notificationsContainer) return;

  try {
    const res = await apiFetch(`${API_BASE}/notifications`, {
      method: "GET",
      headers: {}
    });

    if (!res.ok) throw new Error("Failed to load notifications");

    const notifications = await res.json();

    if (!notifications || notifications.length === 0) {
      notificationsContainer.innerHTML = "<p>No notifications yet.</p>";
      return;
    }

    notificationsContainer.innerHTML = "";

    const latest = notifications.slice(0, 10);

    latest.forEach(n => {
      const div = document.createElement("div");
      div.className = "comment-box";
      div.innerHTML = `
        <p>${n.message}</p>
        <small>${n.recipientRole} • ${formatDate(n.createdAt)}</small>
      `;
      notificationsContainer.appendChild(div);
    });
allNotificationsLoaded = false;
if (showAllNotificationsBtn) {
  showAllNotificationsBtn.textContent = "Show All Notifications";
}


  } catch (e) {
    notificationsContainer.innerHTML = "<p>Unable to load notifications.</p>";
    console.error("loadNotifications error:", e);
  }
}
async function loadIncidentTimeline(incidentId) {
  if (!timelineContainer) return;

  try {
    const res = await apiFetch(`${API_BASE}/${incidentId}/notifications`, {
      method: "GET",
      headers: {}
    });

    if (!res.ok) throw new Error("Failed to load incident history");

    const items = await res.json();

    if (!items || items.length === 0) {
      timelineContainer.innerHTML = "<p>No history yet.</p>";
      return;
    }

    timelineContainer.innerHTML = "";

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "timeline-item";

      div.innerHTML = `
        <p>${item.message}</p>
        <small>${item.recipientRole} • ${formatDate(item.createdAt)}</small>
      `;

      timelineContainer.appendChild(div);
    });

  } catch (e) {
    timelineContainer.innerHTML = "<p>Unable to load incident history.</p>";
    console.error("loadIncidentTimeline error:", e);
  }
}


async function loadAllNotifications() {
  if (!notificationsContainer) return;

  try {
    const res = await apiFetch(`${API_BASE}/notifications`, {
      method: "GET",
      headers: {}
    });

    if (!res.ok) throw new Error("Failed to load notifications");

    const notifications = await res.json();

    if (!notifications || notifications.length === 0) {
      notificationsContainer.innerHTML = "<p>No notifications yet.</p>";
      return;
    }

    notificationsContainer.innerHTML = "";

    notifications.forEach(n => {
      const div = document.createElement("div");
      div.className = "comment-box";
      div.innerHTML = `
        <p>${n.message}</p>
        <small>${n.recipientRole} • ${formatDate(n.createdAt)}</small>
      `;
      notificationsContainer.appendChild(div);
    });

    allNotificationsLoaded = true;



  } catch (e) {
    notificationsContainer.innerHTML = "<p>Unable to load notifications.</p>";
    console.error("loadAllNotifications error:", e);
  }
}


async function handleLogin() {
  const role = (loginRole?.value || "").trim().toUpperCase();
  if (!role) {
    if (loginMsg) loginMsg.textContent = "Please select a role";
    return;
  }

  try {
    const res = await apiFetch(`${AUTH_BASE}/login`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }

    sessionStorage.setItem("userRole", role); // UI only
    if (loginMsg) loginMsg.textContent = "";
    updateLoginUI();
    refreshAll();
    
    showToast("Logged in as " + role, "success");
  } catch (e) {
    showToast(e.message || "Login failed", "error");
  }
}

async function handleLogout() {
  try {
    
await apiFetch(`${AUTH_BASE}/logout`, { method: "POST" });
  } catch (e) {
    console.error("Logout error:", e);
  }
  sessionStorage.removeItem("userRole");
  updateLoginUI();
  showToast("Logged out successfully", "success");
}

function updateLoginUI() {
  const role = getRole();
  const mainContainer = document.querySelector(".container");

  if (role) {
    if (currentUserRole) currentUserRole.textContent = "Logged in as: " + role;
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (loginSection) loginSection.classList.add("hidden");
    if (mainContainer) mainContainer.classList.remove("hidden");
    applyRoleBasedUI();
  } else {
    if (currentUserRole) currentUserRole.textContent = "";
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (loginSection) loginSection.classList.remove("hidden");
    if (mainContainer) mainContainer.classList.add("hidden");
  }
}

function showToast(message, type = "info") {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showAlert(msg) {
  if (!alertBox) return;
  alertBox.textContent = msg;
  alertBox.classList.remove("hidden");
}
function hideAlert() {
  if (!alertBox) return;
  alertBox.classList.add("hidden");
  alertBox.textContent = "";
}
function setLoading(isLoading) {
  if (!loading) return;
  if (isLoading) loading.classList.remove("hidden");
  else loading.classList.add("hidden");
}

function formatDate(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString();
}
function badge(text) {
  return `<span class="badge">${text ?? "-"}</span>`;
}

/* ---------- Modal helpers ---------- */
function openModal() {
  if (!incidentModal) return;
  incidentModal.classList.remove("hidden");
}

function closeModal() {
  if (!incidentModal || !modalBody) return;
  incidentModal.classList.add("hidden");
  modalBody.innerHTML = "";
  activeIncidentId = null;
}
function closeEditModal() {
  if (editModal) editModal.classList.add("hidden");
}

function openEditModalWithIncident(incident) {
  if (!editModal) return;

  editId.value = incident.id;
  editTitle.value = incident.title || "";
  editDescription.value = incident.description || "";
  editPriority.value = incident.priority || "LOW";

  // show audit (optional)
  if (detailUpdatedBy) detailUpdatedBy.textContent = incident.lastUpdatedBy || "-";
  if (detailUpdatedAt) detailUpdatedAt.textContent = incident.lastUpdatedAt ? formatDate(incident.lastUpdatedAt) : "-";

  editModal.classList.remove("hidden");
}

function openDeleteModal(id) {
  if (!deleteModal || !confirmDeleteBtn || !deleteText) return;

  deleteModal.classList.remove("hidden");
  confirmDeleteBtn.dataset.id = id;
  deleteText.textContent = `Are you sure you want to delete incident #${id}? Only CLOSED incidents can be deleted.`;
}

function closeDeleteModal() {
  if (deleteModal) deleteModal.classList.add("hidden");
  if (confirmDeleteBtn) confirmDeleteBtn.dataset.id = "";
}

/* ---------- Pager/URL ---------- */
function updatePager() {
  if (!pageInfo || !prevBtn || !nextBtn) return;
  pageInfo.textContent = `Page ${page + 1} of ${totalPages}`;
  prevBtn.disabled = page <= 0;
  nextBtn.disabled = page >= totalPages - 1;
}

function buildUrl() {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", pageSize?.value || "10");
  params.set("sort", sortSelect?.value || "createdAt,desc");

  const title = titleSearch?.value?.trim();
  const status = statusFilter?.value;
  const priority = priorityFilter?.value;
  const assignedTo = assignedSearch?.value?.trim();

  if (title) params.set("title", title);
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (assignedTo) params.set("assignedTo", assignedTo);

  if (title || status || priority || assignedTo) {
    return `${API_BASE}/search?${params.toString()}`;
  }

  return `${API_BASE}?${params.toString()}`;
}

/* ---------- Forms messages ---------- */
function setFormMsg(message, type) {
  if (!formMsg) return;
  formMsg.textContent = message || "";
  formMsg.classList.remove("ok", "err");
  if (type) formMsg.classList.add(type);
}
function setAssignMsg(message, type) {
  if (!assignMsg) return;
  assignMsg.textContent = message || "";
  assignMsg.classList.remove("ok", "err");
  if (type) assignMsg.classList.add(type);
}
function setStatusMsg(message, type) {
  if (!statusMsg) return;
  statusMsg.textContent = message || "";
  statusMsg.classList.remove("ok", "err");
  if (type) statusMsg.classList.add(type);
}

/* ---------- Clear forms ---------- */
function clearForm() {
  if (titleInput) titleInput.value = "";
  if (priorityInput) priorityInput.value = "";
  if (descInput) descInput.value = "";
  setFormMsg("", null);
}
function clearAssignForm() {
  if (assignIncidentId) assignIncidentId.value = "";
  if (assignTo) assignTo.value = "";
  setAssignMsg("", null);
}
function clearStatusForm() {
  if (statusIncidentId) statusIncidentId.value = "";
  if (newStatus) {
    newStatus.innerHTML = `<option value="">Select</option>`;
  }
  if (currentStatusInfo) currentStatusInfo.textContent = "";
  if (nextStatusInfo) nextStatusInfo.textContent = "";
  setStatusMsg("", null);
}
/* ---------- Fill forms ---------- */
function fillAssignFormFromIncident(incident) {
  if (assignIncidentId) assignIncidentId.value = incident.id ?? "";
  if (assignTo) assignTo.value = incident.assignedTo ?? "";
  setAssignMsg("", null);
  assignIncidentId?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function fillStatusFormFromIncident(incident) {
  if (statusIncidentId) statusIncidentId.value = incident.id ?? "";
  populateStatusOptions(incident.status);
  updateStatusGuidance(incident.status);
  setStatusMsg("", null);
  statusIncidentId?.scrollIntoView({ behavior: "smooth", block: "center" });
}
/* =========================
   Render incidents table
   ========================= */
function isRecentlyUpdated(timestamp) {
  if (!timestamp) return false;

  const updatedTime = new Date(timestamp).getTime();
  const now = Date.now();

  const diffMinutes = (now - updatedTime) / (1000 * 60);

  return diffMinutes <= 2; // last 2 minutes
}

function renderRows(items) {
  incidentsBody.innerHTML = "";

  const role = getRole(); // ADMIN / SUPPORT / EMPLOYEE
  if (showRecentOnly && items.length > 0) {
  const hasRecent = items.some(i => isRecentlyUpdated(i.lastUpdatedAt));
  if (!hasRecent) {
    incidentsBody.innerHTML = "<tr><td colspan='10'>No recently updated incidents</td></tr>";
    return;
  }
}
items.forEach((i) => {

  const isRecent = isRecentlyUpdated(i.lastUpdatedAt);

  if (showRecentOnly && !isRecent) {
    return;
  }
    const tr = document.createElement("tr");
    const recentBadge = isRecent ? `<span class="recent-badge">NEW</span>` : "";
    const isAssigned = i.assignedTo && i.assignedTo.trim() !== "";

    // ✅ SLA display
    let slaText = "-";

    if (i.slaBreached) {
      slaText = `<span style="color:red;font-weight:bold;">BREACHED</span>`;
    } else if (typeof i.slaRemainingMinutes === "number") {
      const mins = i.slaRemainingMinutes;

      if (mins <= 0) {
        slaText = `<span style="color:red;font-weight:bold;">BREACHED</span>`;
      } else {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        slaText = `${h}h ${m}m left`;

        if (i.slaDueSoon) {
          slaText += ` <span style="color:orange;font-weight:bold;">(DUE SOON)</span>`;
        }
      }
    } else if (i.slaDeadline) {
      slaText = formatDate(i.slaDeadline);
    }

    const isLoggedIn = !!role;
    const canEdit = isLoggedIn && (role === "ADMIN" || role === "SUPPORT");
    const canDelete = isLoggedIn && role === "ADMIN";
    const showOps = isLoggedIn && role !== "EMPLOYEE";

    const commentsCount = i.commentsCount ?? 0;
const historyCount = i.historyCount ?? 0;

tr.innerHTML = `
  <td>${i.id ?? "-"}</td>
  <td>${i.title ?? "-"} ${recentBadge}</td>
  <td>${badge(i.priority)}</td>
  <td>${badge(i.status)}</td>
  <td>${isAssigned ? badge(i.assignedTo) : "<span class='unassigned'>Unassigned</span>"}</td>
  <td>${formatDate(i.createdAt)}</td>

  <!-- NEW -->
  <td><span class="count-badge">${commentsCount}</span></td>
  <td><span class="count-badge">${historyCount}</span></td>

  <td>${slaText}</td>

  <td>
    <div class="actionsCell">
      <button class="btn btn-secondary btn-sm js-view" type="button">View</button>
      ${showOps ? `<button class="btn btn-secondary btn-sm js-assign" type="button">Assign</button>` : ""}
      ${showOps ? `<button class="btn btn-ghost btn-sm js-status" type="button">Status</button>` : ""}
      ${canEdit ? `<button class="btn btn-secondary btn-sm js-edit" type="button">Edit</button>` : ""}
      ${canDelete ? `<button class="btn btn-ghost btn-sm js-delete" type="button">Delete</button>` : ""}
    </div>
  </td>
`;

    // ✅ Priority-based row highlight
    if (i.priority === "HIGH") {
  tr.style.backgroundColor = "#3a1f24";
} else if (i.priority === "MEDIUM") {
  tr.style.backgroundColor = "#3a3420";
} else if (i.priority === "LOW") {
  tr.style.backgroundColor = "#1f3324";
}

if (i.slaBreached) {
  tr.style.backgroundColor = "#4a1620";
} else if (i.slaDueSoon) {
  tr.style.backgroundColor = "#4a341c";
}
if (isRecent) {
  tr.style.backgroundColor = "rgba(34,197,94,0.12)"; // green highlight
  tr.style.borderLeft = "4px solid #22c55e";
}
tr.style.color = "#f5f7fb";


    // Handlers
    tr.querySelector(".js-view").addEventListener("click", () => viewIncidentDetails(i.id));

    const assignBtn = tr.querySelector(".js-assign");
    if (assignBtn) {
      assignBtn.addEventListener("click", () => {
        fillAssignFormFromIncident(i);
        setAssignMsg(`Editing assignment for Incident #${i.id}`, null);
      });
    }

    const statusBtn = tr.querySelector(".js-status");
if (statusBtn) {
  statusBtn.addEventListener("click", () => {
    if (!isAssigned) {
      setStatusMsg("Please assign the incident before changing its status.", "err");
      fillStatusFormFromIncident(i);
      return;
    }

    fillStatusFormFromIncident(i);
    populateStatusOptions(i.status); // ✅ only show valid next statuses
    setStatusMsg(`Updating status for Incident #${i.id}`, null);
  });
}

    const editBtn = tr.querySelector(".js-edit");
    if (editBtn) {
      editBtn.addEventListener("click", async () => {
        try {
          const res = await apiFetch(`${API_BASE}/${i.id}`, { method: "GET", headers: {} });
          if (!res.ok) throw new Error("Unable to load incident for edit");
          const incident = await res.json();
          openEditModalWithIncident(incident);
        } catch (e) {
          showToast(e.message || "Unable to load incident for edit", "error");
        }
      });
    }

    const delBtn = tr.querySelector(".js-delete");
    if (delBtn) {
      delBtn.addEventListener("click", () => openDeleteModal(i.id));
    }

    incidentsBody.appendChild(tr);
  });
}

/* =========================
   API calls
   ========================= */

async function loadIncidents() {
  hideAlert();
  empty?.classList.add("hidden");
  setLoading(true);

  try {
    const url = buildUrl();
    const res = await apiFetch(url, { method: "GET", headers: {} });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error (${res.status}): ${text}`);
    }

    const data = await res.json();
    const items = data.content ?? [];
    totalPages = data.totalPages ?? 1;
    page = data.number ?? page;

    if (items.length === 0) {
      if (incidentsBody) incidentsBody.innerHTML = "";
      empty?.classList.remove("hidden");
    } else {
      renderRows(items);
    }
    updatePager();
  } catch (e) {
    showAlert(e.message || "Failed to load incidents.");
  } finally {
    setLoading(false);
  }
}

async function createIncident() {
  const title = titleInput.value.trim();
  const priority = priorityInput.value;
  const description = descInput.value.trim();

  if (!title) return setFormMsg("Title is required.", "err");
  if (!priority) return setFormMsg("Priority is required.", "err");
  if (!description) return setFormMsg("Description is required.", "err");

  setFormMsg("Creating incident...", null);

  const payload = { title, description, priority };

  try {
    const res = await apiFetch(API_BASE, {
  method: "POST",
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

    showToast("Incident created successfully", "success");
    clearForm();
    page = 0;
    await refreshAfterAction();
  } catch (e) {
    showToast(e.message || "Unable to create incident.", "error");
  }
}
async function assignIncident(incidentId, assignedToVal) {
  const role = getLoggedInRoleOrBlock();
  if (!role) return;

  const url = `${API_BASE}/${incidentId}/assign?assignedTo=${encodeURIComponent(assignedToVal)}&userRole=${encodeURIComponent(role)}`;

  try {
    const res = await apiFetch(url, {
      method: "PUT",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Failed (${res.status})`);
    }

    showToast("Incident assigned successfully", "success");
    clearAssignForm();
    page = 0;
    await refreshAfterAction();
  } catch (e) {
    showToast(e.message || "Unable to assign incident.", "error");
    console.error("assignIncident error:", e);
  }
}
async function refreshActiveModal() {
  if (!activeIncidentId) return;
  if (!incidentModal || incidentModal.classList.contains("hidden")) return;

  try {
    const res = await apiFetch(`${API_BASE}/${activeIncidentId}`, { method: "GET", headers: {} });
    if (!res.ok) throw new Error("Failed to refresh incident details");

    const i = await res.json();

    if (!modalBody) return;

    modalBody.innerHTML = `
      <p><strong>ID:</strong> <span>${i.id}</span></p>
      <p><strong>Title:</strong> <span>${i.title}</span></p>
      <p><strong>Description:</strong> <span>${i.description}</span></p>
      <p><strong>Priority:</strong> <span>${i.priority}</span></p>
      <p><strong>Status:</strong> <span>${i.status}</span></p>
      <p><strong>Assigned To:</strong> <span>${i.assignedTo ?? "Unassigned"}</span></p>
      <p><strong>Created At:</strong> <span>${formatDate(i.createdAt)}</span></p>
      <p><strong>Last Updated By:</strong> <span>${i.lastUpdatedBy ?? "-"}</span></p>
      <p><strong>Last Updated At:</strong> <span>${i.lastUpdatedAt ? formatDate(i.lastUpdatedAt) : "-"}</span></p>
      <p><strong>Resolution Notes:</strong> <span>${i.resolutionNotes ?? "-"}</span></p>
      <p><strong>Reopen Reason:</strong> <span>${i.reopenReason ?? "-"}</span></p>
    `;

    await loadComments(activeIncidentId);
    await loadIncidentTimeline(activeIncidentId);

  } catch (e) {
    console.error("refreshActiveModal error:", e);
  }
}

async function refreshAfterAction() {
  await refreshAll();
  await refreshActiveModal();
}

async function loadComments(incidentId) {
  try {
    const res = await apiFetch(`${API_BASE}/${incidentId}/comments`, {
      method: "GET",
      headers: {}
    });

    if (!res.ok) throw new Error("Failed to load comments");

    const comments = await res.json();
    const container = document.getElementById("commentsContainer");

    if (!container) return;

    container.innerHTML = "";

    const role = getRole();
    const canModify = role === "ADMIN" || role === "SUPPORT";

    comments.forEach(c => {

      const div = document.createElement("div");
      div.className = "comment-box";

      div.innerHTML = `
        <div class="comment-text">
          <span id="comment-text-${c.id}">${c.comment}</span>
          <input type="text" id="edit-input-${c.id}" class="hidden" value="${c.comment}" />
        </div>

        <small>By ${c.createdBy} at ${formatDate(c.createdAt)}</small>

        ${
          canModify
            ? `
              <div class="comment-actions">
                <button onclick="startEdit(${c.id})">Edit</button>
                <button onclick="saveEdit(${c.id})" class="hidden" id="save-btn-${c.id}">Save</button>
                <button onclick="cancelEdit(${c.id})" class="hidden" id="cancel-btn-${c.id}">Cancel</button>
                <button onclick="deleteComment(${c.id})">Delete</button>
              </div>
            `
            : ""
        }
      `;

      container.appendChild(div);
    });

  } catch (e) {
    const container = document.getElementById("commentsContainer");
    if (container) container.innerHTML = "<p>Unable to load comments.</p>";
  }
}
function toggleDetails() {
  if (!detailsContent || !toggleDetailsBtn) return;

  const isHidden = detailsContent.classList.contains("hidden");

  if (isHidden) {
    detailsContent.classList.remove("hidden");
    toggleDetailsBtn.textContent = "Hide";
  } else {
    detailsContent.classList.add("hidden");
    toggleDetailsBtn.textContent = "Show";
  }
}
function getAllowedNextStatuses(currentStatus) {
  switch (currentStatus) {
    case "OPEN":
      return ["IN_PROGRESS"];
    case "IN_PROGRESS":
      return ["RESOLVED"];
    case "RESOLVED":
      return ["CLOSED"];
    case "CLOSED":
      return ["REOPENED"];
    case "REOPENED":
      return ["IN_PROGRESS", "CLOSED"]; // remove CLOSED if backend does not allow direct close
    default:
      return [];
  }
}
function populateStatusOptions(currentStatus) {
  if (!newStatus) return;

  const allowed = getAllowedNextStatuses(currentStatus);

  newStatus.innerHTML = `<option value="">Select</option>`;

  allowed.forEach(status => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    newStatus.appendChild(option);
  });
}
function updateStatusGuidance(currentStatus) {
  if (currentStatusInfo) {
    currentStatusInfo.textContent = `Current Status: ${currentStatus}`;
  }

  const allowed = getAllowedNextStatuses(currentStatus);

  if (nextStatusInfo) {
    if (!allowed.length) {
      nextStatusInfo.textContent = "No valid next status available.";
    } else if (allowed.length === 1) {
      nextStatusInfo.textContent = `Allowed Next Status: ${allowed[0]}`;
    } else {
      nextStatusInfo.textContent = `Allowed Next Statuses: ${allowed.join(", ")}`;
    }
  }
}
function startEdit(commentId) {

  document.getElementById(`comment-text-${commentId}`).classList.add("hidden");
  document.getElementById(`edit-input-${commentId}`).classList.remove("hidden");

  document.getElementById(`save-btn-${commentId}`).classList.remove("hidden");
  document.getElementById(`cancel-btn-${commentId}`).classList.remove("hidden");
}
function cancelEdit(commentId) {    
  document.getElementById(`comment-text-${commentId}`).classList.remove("hidden");  
  document.getElementById(`edit-input-${commentId}`).classList.add("hidden");
  document.getElementById(`save-btn-${commentId}`).classList.add("hidden");
  document.getElementById(`cancel-btn-${commentId}`).classList.add("hidden");
}
async function saveEdit(commentId) {
  const role = getRole();

  if (role !== "ADMIN" && role !== "SUPPORT") {
    showToast("Only ADMIN or SUPPORT can edit comments", "error");
    return;
  }

  const input = document.getElementById(`edit-input-${commentId}`);
  const updatedComment = input.value.trim();

  if (!updatedComment) {
    showToast("Comment cannot be empty", "error");
    return;
  }

  try {
    const url = `${API_BASE}/comments/${commentId}?comment=${encodeURIComponent(updatedComment)}&user=${encodeURIComponent(role)}`;

    const res = await apiFetch(url, {
      method: "PUT",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to update comment");
    }

    const incidentId = document.getElementById("commentsSection")?.dataset?.incidentId;


    await refreshAfterAction(); // important
    showToast("Comment updated successfully", "success");
  } catch (e) {
    showToast(e.message || "Unable to update comment", "error");
  }
}


async function addComment() {
  const commentInput = document.getElementById("newComment");
  const commentsSection = document.getElementById("commentsSection");

  if (!commentInput) {
    showToast("Comment input not found", "error");
    return;
  }

  const comment = commentInput.value.trim();
  const incidentId = commentsSection?.dataset?.incidentId;
  const user = getRole();

  if (!comment) {
    showToast("Comment cannot be empty", "error");
    return;
  }

  if (!incidentId) {
    showToast("Incident id missing", "error");
    return;
  }

  if (!user) {
    showToast("Please login first", "error");
    return;
  }

  try {
    const url = `${API_BASE}/${incidentId}/comments?comment=${encodeURIComponent(comment)}&user=${encodeURIComponent(user)}`;

    const res = await apiFetch(url, {
      method: "POST",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to add comment");
    }

    commentInput.value = "";

    // only refresh the needed sections
    await loadComments(incidentId);
    await loadIncidentTimeline(incidentId);
    await loadIncidents();
    await loadDashboard();
    await loadStatusChart();
    await loadNotifications();

    showToast("Comment added successfully", "success");
  } catch (e) {
    showToast(e.message || "Unable to add comment", "error");
  }
}
async function editComment(commentId) {
  const role = getRole();

  if (role !== "ADMIN" && role !== "SUPPORT") {
    showToast("Only ADMIN or SUPPORT can edit comments", "error");
    return;
  }

  const currentTextEl = document.getElementById(`comment-text-${commentId}`);
  const currentText = currentTextEl ? currentTextEl.textContent.trim() : "";

  const updatedComment = prompt("Edit comment:", currentText);

  if (updatedComment === null) return;

  if (!updatedComment.trim()) {
    showToast("Updated comment cannot be empty", "error");
    return;
  }

  try {
    const url = `http://${API_HOST}:8080/api/incidents/comments/${commentId}?comment=${encodeURIComponent(updatedComment.trim())}&user=${encodeURIComponent(role)}`;

    const res = await apiFetch(url, {
      method: "PUT",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to update comment");
    }

    const incidentId = document.getElementById("commentsSection")?.dataset?.incidentId;
    if (incidentId) {
      await loadComments(incidentId);
    }

    showToast("Comment updated successfully", "success");

  } catch (e) {
    showToast(e.message || "Unable to update comment", "error");
  }
}
async function deleteComment(commentId) {
  const role = getRole();

  if (role !== "ADMIN" && role !== "SUPPORT") {
    showToast("Only ADMIN or SUPPORT can delete comments", "error");
    return;
  }

  const confirmed = confirm("Are you sure you want to delete this comment?");
  if (!confirmed) return;

  try {
    const url = `${API_BASE}/comments/${commentId}?user=${encodeURIComponent(role)}`;

    const res = await apiFetch(url, {
      method: "DELETE",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to delete comment");
    }

    const incidentId = document.getElementById("commentsSection")?.dataset?.incidentId;

    if (incidentId) {
      await loadComments(incidentId);
      await loadIncidentTimeline(incidentId);
    }

    await loadIncidents();
    await loadDashboard();
    await loadStatusChart();
    await loadNotifications();

    showToast("Comment deleted successfully", "success");
  } catch (e) {
    showToast(e.message || "Unable to delete comment", "error");
  }
}

async function updateIncidentStatus() {
  const id = String(statusIncidentId.value || "").trim();
  const newStatusVal = newStatus.value;
  const role = getLoggedInRoleOrBlock();

  if (!role) {
    setStatusMsg("Please login first.", "err");
    return;
  }

  if (!id || Number(id) <= 0) {
    setStatusMsg("Incident ID is required.", "err");
    return;
  }

  if (!newStatusVal) {
    setStatusMsg("New status is required.", "err");
    return;
  }

  let resolutionNotes = "";
  let reopenReason = "";

  if (newStatusVal === "CLOSED") {
    resolutionNotes = prompt("Enter resolution notes before closing the incident:");

    if (!resolutionNotes || !resolutionNotes.trim()) {
      setStatusMsg("Resolution notes are required before closing the incident.", "err");
      return;
    }
  }

  if (newStatusVal === "REOPENED") {
    reopenReason = prompt("Enter reopen reason:");

    if (!reopenReason || !reopenReason.trim()) {
      setStatusMsg("Reopen reason is required to reopen the incident.", "err");
      return;
    }
  }

  setStatusMsg("Updating status...", null);

  try {
    let url = `${API_BASE}/${id}/status?newStatus=${encodeURIComponent(newStatusVal)}&userRole=${encodeURIComponent(role)}`;

    if (resolutionNotes) {
      url += `&resolutionNotes=${encodeURIComponent(resolutionNotes.trim())}`;
    }

    if (reopenReason) {
      url += `&reopenReason=${encodeURIComponent(reopenReason.trim())}`;
    }

    const res = await apiFetch(url, {
      method: "PUT",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Failed (${res.status})`);
    }

    showToast("Incident status updated successfully", "success");
    clearStatusForm();

    // ✅ force incident list + dashboard + chart reload
    page = 0;
    await refreshAfterAction();

  } catch (e) {
    showToast(e.message || "Unable to update status.", "error");
  }
}

async function viewIncidentDetails(id) {
  try {
    const res = await apiFetch(`${API_BASE}/${id}`, { method: "GET", headers: {} });
    
    if (!res.ok) throw new Error("Failed to fetch incident details");

    const i = await res.json();
activeIncidentId = id;
if (aiSummaryBox) {
  aiSummaryBox.textContent = "No AI summary generated yet.";
}
if (aiResolutionBox) {
  aiResolutionBox.textContent = "No AI resolution note generated yet.";
}
if (aiCategoryBox) {
  aiCategoryBox.textContent = "No AI category suggested yet.";
}
if (similarIncidentBox) {
  similarIncidentBox.textContent = "No similar incidents suggested yet.";
}
    if (!modalBody) return;

    modalBody.innerHTML = `
      <p><strong>ID:</strong> <span>${i.id}</span></p>
      <p><strong>Title:</strong> <span>${i.title}</span></p>
      <p><strong>Description:</strong> <span>${i.description}</span></p>
      <p><strong>Priority:</strong> <span>${i.priority}</span></p>
      <p><strong>Status:</strong> <span>${i.status}</span></p>
      <p><strong>Assigned To:</strong> <span>${i.assignedTo ?? "Unassigned"}</span></p>
      <p><strong>Created At:</strong> <span>${formatDate(i.createdAt)}</span></p>
      <p><strong>Last Updated By:</strong> <span>${i.lastUpdatedBy ?? "-"}</span></p>
      <p><strong>Last Updated At:</strong> <span>${i.lastUpdatedAt ? formatDate(i.lastUpdatedAt) : "-"}</span></p>
      <p><strong>Resolution Notes:</strong> <span>${i.resolutionNotes ?? "-"}</span></p>
      <p><strong>Reopen Reason:</strong> <span>${i.reopenReason ?? "-"}</span></p>
    `;

    if (commentsSection) {
      commentsSection.dataset.incidentId = String(id);
    }

    if (timelineSection) {
      timelineSection.dataset.incidentId = String(id);
    }

    const commentInput = document.getElementById("newComment");
    if (commentInput) {
      commentInput.value = "";
    }
if (commentsContent) {
  commentsContent.classList.remove("hidden");
}
if (toggleCommentsBtn) {
  toggleCommentsBtn.textContent = "Hide";
}
    await loadComments(id);
    if (timelineContainer) {
  timelineContainer.classList.remove("hidden");
}
if (toggleTimelineBtn) {
  toggleTimelineBtn.textContent = "Hide";
}
if (detailsContent) {
  detailsContent.classList.remove("hidden");
}
if (toggleDetailsBtn) {
  toggleDetailsBtn.textContent = "Hide";
}
    await loadIncidentTimeline(id);

    openModal();

  } catch (e) {
    showToast("Unable to load incident details", "error");
  }
}

/* ---------- Edit Save ---------- */
async function saveEditedIncident() {
  const role = getLoggedInRoleOrBlock();
  if (!role) return;

  if (role !== "ADMIN" && role !== "SUPPORT") {
    showToast("Only ADMIN or SUPPORT can edit incidents", "error");
    return;
  }

  const id = editId.value;
  const title = editTitle.value.trim();
  const description = editDescription.value.trim();
  const priority = editPriority.value;

  if (!title || !description) {
    showToast("Title and Description are required", "error");
    return;
  }

  const payload = {
    title,
    description,
    priority
  };

  try {
    const url = `${API_BASE}/${id}?userRole=${encodeURIComponent(role)}`;

    const res = await apiFetch(url, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Edit failed (${res.status})`);
    }

    showToast("Incident updated successfully", "success");
    closeEditModal();
    await refreshAfterAction();
  } catch (e) {
    showToast(e.message || "Unable to update incident", "error");
  }
}

/* ---------- Delete Confirm ---------- */
async function confirmDelete() {
  const role = getLoggedInRoleOrBlock();
  if (!role) return;

  if (role !== "ADMIN") {
    showToast("Only ADMIN can delete incidents", "error");
    return;
  }

  const id = confirmDeleteBtn?.dataset?.id;
  if (!id) return showToast("Delete id missing", "error");

  try {
    const res = await apiFetch(`${API_BASE}/${id}`, { method: "DELETE", headers: {} });
   
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Delete failed (${res.status})`);
    }

    showToast("Incident deleted successfully", "success");
closeDeleteModal();

if (String(activeIncidentId) === String(id)) {
  closeModal();
}

page = 0;
await refreshAfterAction();
  } catch (e) {
    showToast(e.message || "Unable to delete incident", "error");
  }
}

/* ---------- Dashboard (optional) ---------- */
async function loadDashboard() {
  if (!dashTotal) return; // dashboard not present
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) return;
    const data = await res.json();

    dashTotal.textContent = data.total;
    dashOpen.textContent = data.open;
    dashInProgress.textContent = data.inProgress;
    dashResolved.textContent = data.resolved;
    dashClosed.textContent = data.closed;
    dashHigh.textContent = data.highPriority;
  } catch {}
}

function drawBarChart(canvas, labels, values) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const padLeft = 60;
  const padRight = 20;
  const padTop = 30;
  const padBottom = 50;

  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  const maxVal = Math.max(...values, 1);
  const barCount = values.length;
  const gap = 18;
  const barW = (chartW - gap * (barCount - 1)) / barCount;

  ctx.font = "14px Arial";
  ctx.fillStyle = "#333";
  ctx.strokeStyle = "#999";

  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + chartH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padLeft, padTop + chartH);
  ctx.lineTo(padLeft + chartW, padTop + chartH);
  ctx.stroke();

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

  values.forEach((v, idx) => {
    const barH = (v / maxVal) * chartH;
    const x = padLeft + idx * (barW + gap);
    const y = padTop + chartH - barH;

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = "#111";
    ctx.fillText(String(v), x + barW / 2 - 5, y - 8);

    ctx.fillStyle = "#333";
    ctx.save();
    ctx.translate(x + barW / 2, padTop + chartH + 20);
    ctx.textAlign = "center";
    ctx.fillText(labels[idx], 0, 0);
    ctx.restore();
  });

  ctx.fillStyle = "#111";
  ctx.font = "16px Arial";
  ctx.fillText("Incident Status Counts", padLeft, 20);
}

async function loadStatusChart() {
  if (!statusChart) return;
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) return;
    const d = await res.json();
    const labels = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    const values = [d.open, d.inProgress, d.resolved, d.closed];
    drawBarChart(statusChart, labels, values);
  } catch {}
}

async function refreshAll() {
  await loadIncidents();
  await loadDashboard();
  await loadStatusChart();
  await loadNotifications();
  startAutoRefresh();
  const el = document.getElementById("lastRefreshTime");
  if (el) {
    el.textContent = "Last updated: " + new Date().toLocaleTimeString();
  }
}
let autoRefreshInterval = null;

  function startAutoRefresh() {
  if (autoRefreshInterval) return;

  autoRefreshInterval = setInterval(async () => {
    try {
      // skip refresh if modal is open
      if (incidentModal && !incidentModal.classList.contains("hidden")) {
        return;
      }

      await refreshAll();
      console.log("Auto-refreshed dashboard");
    } catch (e) {
      console.error("Auto refresh failed:", e);
    }
  }, 30000);
}
/* ---------- CSV export (optional if button exists) ---------- */
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
async function generateAiSummary() {
  if (!activeIncidentId) {
    showToast("No active incident selected", "error");
    return;
  }

  if (!aiSummaryBox) return;

  try {
    aiSummaryBox.textContent = "Generating AI summary...";

    const res = await apiFetch(`${API_BASE}/${activeIncidentId}/ai-summary`, {
      method: "GET",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to generate AI summary");
    }

    const data = await res.json();
    aiSummaryBox.textContent = data.summary || "No summary returned.";

  } catch (e) {
    aiSummaryBox.textContent = "Unable to generate AI summary.";
    showToast(e.message || "AI summary failed", "error");
  }
}
async function suggestPriority() {
  if (!activeIncidentId) {
    showToast("No incident selected", "error");
    return;
  }

  try {
    showToast("Analyzing priority...", "info");

    const res = await apiFetch(`${API_BASE}/${activeIncidentId}/ai-priority`, {
      method: "GET",
      headers: {}
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to suggest priority");
    }

    const data = await res.json();

    showToast(`Suggested Priority: ${data.priority}`, "success");

  } catch (e) {
    showToast(e.message || "AI priority failed", "error");
  }
}
async function exportIncidentsCSV() {
  try {
    const status = statusFilter?.value || "";
    const priority = priorityFilter?.value || "";
    const sort = sortSelect?.value || "createdAt,desc";

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
    rows.push(["ID","Title","Priority","Status","Assigned To","Created At","Last Updated By","Last Updated At"]);
    incidents.forEach(i => {
      rows.push([
        i.id, i.title, i.priority, i.status, i.assignedTo || "",
        i.createdAt || "", i.lastUpdatedBy || "", i.lastUpdatedAt || ""
      ]);
    });

    const today = new Date().toISOString().slice(0,10);
    downloadCSV(`incidentflow_export_${today}.csv`, rows);
    showToast("CSV exported successfully", "success");
  } catch (e) {
    showToast(e.message || "Export failed", "error");
  }
}
async function refreshAfterAction() {
  await refreshAfterAction();
  await refreshActiveModal();
}
async function exportDashboardCSV() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error("Failed to load dashboard data");
    const d = await res.json();

    const generatedAt = new Date().toISOString();
    const rows = [
      ["Generated At", generatedAt],
      [],
      ["Metric","Count"],
      ["Total", d.total],
      ["Open", d.open],
      ["In Progress", d.inProgress],
      ["Resolved", d.resolved],
      ["Closed", d.closed],
      ["High Priority", d.highPriority]
    ];

    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(`incidentflow_dashboard_${today}.csv`, rows);
    showToast("Dashboard CSV exported successfully", "success");
  } catch (e) {
    showToast(e.message || "Dashboard export failed", "error");
  }
}
if (assignedSearch) {
  assignedSearch.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      page = 0;
      refreshAll();
    }
  });
}
/* =========================
   Event bindings
   ========================= */
if (toggleTimelineBtn) {
  toggleTimelineBtn.addEventListener("click", toggleTimeline);
}
// Filters + Paging
if (applyBtn) applyBtn.addEventListener("click", () => { page = 0; refreshAll(); });

if (titleSearch) {
  titleSearch.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      page = 0;
      refreshAll();
    }
  });
}
if (generateAiSummaryBtn) {
  generateAiSummaryBtn.addEventListener("click", generateAiSummary);
}
if (generateResolutionBtn) {
  generateResolutionBtn.addEventListener("click", generateResolutionNote);
}

if (resetBtn) applyBtn?.addEventListener && resetBtn.addEventListener("click", () => {
  if (statusFilter) statusFilter.value = "";
  if (priorityFilter) priorityFilter.value = "";
  if (sortSelect) sortSelect.value = "createdAt,desc";
  if (pageSize) pageSize.value = "10";
  if (titleSearch) titleSearch.value = "";
  if (assignedSearch) assignedSearch.value = "";
  page = 0;
  refreshAll();
});
if (prevBtn) prevBtn.addEventListener("click", () => { if (page > 0) { page--; refreshAll(); } });
if (nextBtn) nextBtn.addEventListener("click", () => { if (page < totalPages - 1) { page++; refreshAll(); } });

// Create
if (createForm) createForm.addEventListener("submit", (e) => { e.preventDefault(); createIncident(); });
if (clearBtn) clearBtn.addEventListener("click", clearForm);

// Assign
if (assignForm) assignForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = String(assignIncidentId?.value || "").trim();
  const assignedToVal = (assignTo?.value || "").trim();

  if (!id || Number(id) <= 0) {
    return setAssignMsg("Incident ID is required.", "err");
  }

  if (!assignedToVal) {
    return setAssignMsg("Assign To is required.", "err");
  }

  setAssignMsg("Assigning incident...", null);
  await assignIncident(id, assignedToVal);
});
if (assignClearBtn) assignClearBtn.addEventListener("click", clearAssignForm);

// Status
if (statusForm) statusForm.addEventListener("submit", (e) => { e.preventDefault(); updateIncidentStatus(); });
if (statusClearBtn) statusClearBtn.addEventListener("click", clearStatusForm);
if (showAllNotificationsBtn) {
  showAllNotificationsBtn.addEventListener("click", async () => {
    console.log("BUTTON CLICKED"); // 👈 ADD THIS

    if (allNotificationsLoaded) {
      await loadNotifications();
    } else {
      await loadAllNotifications();
    }
  });
}
if (toggleDetailsBtn) {
  toggleDetailsBtn.addEventListener("click", toggleDetails);
}
if (findSimilarBtn) {
  findSimilarBtn.addEventListener("click", findSimilarIncidents);
}
// Modals
if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (closeEditBtn) closeEditBtn.addEventListener("click", closeEditModal);
if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditModal);
if (saveEditBtn) saveEditBtn.addEventListener("click", saveEditedIncident);
if (toggleCommentsBtn) {
  toggleCommentsBtn.addEventListener("click", toggleComments);
}
if (closeDeleteBtn) closeDeleteBtn.addEventListener("click", closeDeleteModal);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDelete);

// Login
if (loginBtn) loginBtn.addEventListener("click", handleLogin);
if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

// Export
if (exportBtn) exportBtn.addEventListener("click", exportIncidentsCSV);
if (exportDashboardBtn) exportDashboardBtn.addEventListener("click", exportDashboardCSV);
if (refreshChartBtn) refreshChartBtn.addEventListener("click", loadStatusChart);

const suggestPriorityBtn = document.getElementById("suggestPriorityBtn");

if (suggestPriorityBtn) {
  suggestPriorityBtn.addEventListener("click", suggestPriority);
}
if (suggestCategoryBtn) {
  suggestCategoryBtn.addEventListener("click", suggestCategory);
}
const prioritySelect = document.getElementById("editPriority");

if (prioritySelect && data.priority) {
  prioritySelect.value = data.priority;
}
/* =========================
   Initial load
   ========================= */
   const addCommentBtn = document.getElementById("addCommentBtn");
if (addCommentBtn) addCommentBtn.addEventListener("click", addComment);
updateLoginUI();
refreshAll();
setInterval(() => {
  if (getRole()) refreshAll();
}, 60000); // refresh every 60 seconds

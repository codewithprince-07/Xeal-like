// Xeal-like student table logic (localStorage)
const STORAGE_KEY = "xeal_student_records_v1";

let dataList = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentUser = "";

// DOM refs
const tableBody = document.getElementById("tableBody");
const studentIDInput = document.getElementById("studentID");
const setIdBtn = document.getElementById("setIdBtn");
const currentUserSpan = document.getElementById("currentUser");

const siInput = document.getElementById("si");
const idInput = document.getElementById("id");
const nameInput = document.getElementById("name");
const topicInput = document.getElementById("topic");
const addBtn = document.getElementById("addBtn");

const searchInput = document.getElementById("search");
const clearAllBtn = document.getElementById("clearAll");

// initialize UI
renderTable();
updateCurrentUserDisplay();

// set current user
setIdBtn.addEventListener("click", () => {
  const v = studentIDInput.value.trim();
  if (!v) { alert("Please enter your Student ID."); return; }
  currentUser = v;
  updateCurrentUserDisplay();
});

// add new record (Auto SI + Auto Student ID)
addBtn.addEventListener("click", () => {
  if (!currentUser) { 
    alert("Please set your Student ID at top first."); 
    return; 
  }

  const name = nameInput.value.trim();
  const topic = topicInput.value.trim();

  if (!name || !topic) { 
    alert("Fill Name & Topic."); 
    return; 
  }

  // AUTO SERIAL NO.
  const si = dataList.length + 1;

  // AUTO ID LIKE STU-1, STU-2
  const sid = "STU-" + si;

  const obj = {
    si,
    id: sid,
    name,
    topic,
    ownerID: currentUser,  // owner lock
    referenced: false,
    createdAt: Date.now()
  };

  dataList.push(obj);
  saveAndRender();

  // clear inputs
  nameInput.value = topicInput.value = "";
});

// search
searchInput.addEventListener("input", () =>
  renderTable(searchInput.value.trim().toLowerCase())
);

// clear all
clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear all local records?")) return;
  dataList = [];
  saveAndRender();
});

// helpers
function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataList));
  renderTable();
}

function updateCurrentUserDisplay() {
  currentUserSpan.textContent =
    currentUser ? `Logged in: ${currentUser}` : "";
}

// render table
function renderTable(filter = "") {
  tableBody.innerHTML = "";

  const list = dataList.slice().sort((a, b) => a.si - b.si);

  list.forEach((item) => {
    if (filter) {
      const combined = `${item.name} ${item.topic} ${item.id}`.toLowerCase();
      if (!combined.includes(filter)) return;
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(item.si)}</td>
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.topic)}</td>
      <td>${item.referenced ? "YES" : "NO"}</td>
      <td></td>
    `;

    const actionsTd = tr.querySelector("td:last-child");

    // Reference toggle
    const refBtn = document.createElement("button");
    refBtn.className = "action-btn ref";
    refBtn.textContent = item.referenced ? "Unreference" : "Reference";
    refBtn.addEventListener("click", () => {
      item.referenced = !item.referenced;
      saveAndRender();
    });
    actionsTd.appendChild(refBtn);

    // Edit button (Owner Only — SI & ID cannot be changed)
    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      if (!currentUser) return alert("Set your Student ID.");
      if (item.ownerID !== currentUser)
        return alert("You cannot edit another person's data.");

      // Only Name + Topic editable
      const newName = prompt("Name:", item.name);
      if (newName === null) return;

      const newTopic = prompt("Topic:", item.topic);
      if (newTopic === null) return;

      item.name = newName.trim();
      item.topic = newTopic.trim();

      saveAndRender();
    });
    actionsTd.appendChild(editBtn);

    // Delete button (Owner + Not Referenced)
    const delBtn = document.createElement("button");
    delBtn.className = "action-btn delete";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      if (!currentUser) return alert("Set your Student ID.");
      if (item.ownerID !== currentUser)
        return alert("You cannot delete another person's data.");
      if (item.referenced)
        return alert("This record is referenced & cannot be deleted.");

      if (!confirm("Delete this record?")) return;

      const i = dataList.findIndex(
        (d) => d.createdAt === item.createdAt
      );
      if (i >= 0) dataList.splice(i, 1);
      saveAndRender();
    });
    actionsTd.appendChild(delBtn);

    tableBody.appendChild(tr);
  });

  updateCurrentUserDisplay();
}

// HTML escape
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


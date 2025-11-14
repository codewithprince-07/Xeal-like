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

// add new record
addBtn.addEventListener("click", () => {
  if (!currentUser) { alert("Please set your Student ID at top first."); return; }

  const si = siInput.value.trim();
  const sid = idInput.value.trim();
  const name = nameInput.value.trim();
  const topic = topicInput.value.trim();

  if (!si || !sid || !name || !topic) { alert("Fill all fields."); return; }

  const obj = {
    si, id: sid, name, topic,
    ownerID: currentUser,   // owner lock
    referenced: false,
    createdAt: Date.now()
  };

  dataList.push(obj);
  saveAndRender();
  siInput.value = idInput.value = nameInput.value = topicInput.value = "";
});

// search
searchInput.addEventListener("input", () => renderTable(searchInput.value.trim().toLowerCase()));

// clear all (local)
clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear all local records? This will remove all data from this browser.")) return;
  dataList = [];
  saveAndRender();
});

// helpers
function saveAndRender(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataList));
  renderTable();
}

function updateCurrentUserDisplay(){
  currentUserSpan.textContent = currentUser ? `Logged in: ${currentUser}` : "";
}

// render with optional filter
function renderTable(filter=""){
  tableBody.innerHTML = "";
  const list = dataList.slice().sort((a,b)=> a.si - b.si);

  list.forEach((item, idx) => {
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

    // Reference button (anyone can reference)
    const refBtn = document.createElement("button");
    refBtn.className = "action-btn ref";
    refBtn.textContent = item.referenced ? "Unreference" : "Reference";
    refBtn.addEventListener("click", () => {
      item.referenced = !item.referenced;
      saveAndRender();
    });
    actionsTd.appendChild(refBtn);

    // Edit button (only owner)
    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit";
    editBtn.textContent = "Edit";
    editBtn.title = "Only owner can edit";
    editBtn.addEventListener("click", () => {
      if (!currentUser) { alert("Set your Student ID first."); return; }
      if (item.ownerID !== currentUser) { alert("You cannot edit another person's data."); return; }

      // inline edit modal (prompt for fields)
      const newSi = prompt("SI No:", item.si);
      if (newSi === null) return;
      const newId = prompt("ID:", item.id);
      if (newId === null) return;
      const newName = prompt("Name:", item.name);
      if (newName === null) return;
      const newTopic = prompt("Topic:", item.topic);
      if (newTopic === null) return;

      item.si = newSi.trim();
      item.id = newId.trim();
      item.name = newName.trim();
      item.topic = newTopic.trim();
      saveAndRender();
    });
    actionsTd.appendChild(editBtn);

    // Delete button (only owner and only if not referenced)
    const delBtn = document.createElement("button");
    delBtn.className = "action-btn delete";
    delBtn.textContent = "Delete";
    delBtn.title = "Only owner can delete; can't delete if Referenced";
    delBtn.addEventListener("click", () => {
      if (!currentUser) { alert("Set your Student ID first."); return; }
      if (item.ownerID !== currentUser) { alert("You cannot delete another person's data."); return; }
      if (item.referenced) { alert("This record is referenced and cannot be deleted."); return; }

      if (!confirm("Delete this record?")) return;
      // remove by identity (safe)
      const i = dataList.findIndex(d => d.createdAt === item.createdAt);
      if (i >= 0) dataList.splice(i,1);
      saveAndRender();
    });
    actionsTd.appendChild(delBtn);

    tableBody.appendChild(tr);
  });

  updateCurrentUserDisplay();
}

// small helper to avoid XSS (since using prompt / innerHTML)
function escapeHtml(text){
  return String(text)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

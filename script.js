// DOM elements
const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoDateInput = document.getElementById("todoDate");
const todoList = document.getElementById("todoList");
const calendar = document.getElementById("calendar");
const dailySummary = document.getElementById("dailySummary");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

// Data storage for tasks
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Current selected date
let selectedDate = new Date();
selectedDate.setHours(0, 0, 0, 0);

// Theme
let isDarkMode = localStorage.getItem("darkMode") === "true";
if (isDarkMode) document.body.classList.add("dark-mode");
updateThemeUI();

// Utils
function formatDate(date) {
  return date.toISOString().split("T")[0];
}
function formatDateDisplay(date) {
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Task rendering
function renderTasks() {
  todoList.innerHTML = "";
  const dateStr = formatDate(selectedDate);
  const filteredTasks = tasks.filter(task => task.date === dateStr);

  if (filteredTasks.length === 0) {
    const emptyMsg = document.createElement("li");
    emptyMsg.textContent = "No tasks for this date.";
    emptyMsg.style.fontStyle = "italic";
    emptyMsg.style.color = "gray";
    emptyMsg.style.cursor = "default";
    todoList.appendChild(emptyMsg);
    return;
  }

  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.textContent = task.text;
    li.setAttribute("tabindex", "0");
    if (task.completed) li.classList.add("completed");

    li.addEventListener("click", () => toggleComplete(task.id));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleComplete(task.id);
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("aria-label", "Remove task");
    removeBtn.className = "remove-btn";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeTask(task.id);
    });

    li.appendChild(removeBtn);
    todoList.appendChild(li);
  });
}

function toggleComplete(id) {
  tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();
  updateDailySummary();
}

function removeTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  updateDailySummary();
}

todoForm.addEventListener("submit", e => {
  e.preventDefault();

  const text = todoInput.value.trim();
  let date = todoDateInput.value;

  if (!text) return alert("Task description cannot be empty.");
  if (!date) date = formatDate(selectedDate);

  const newTask = {
    id: Date.now(),
    text,
    date,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();

  if (date === formatDate(selectedDate)) {
    renderTasks();
    updateDailySummary();
  }

  todoInput.value = "";
  todoDateInput.value = "";
});

// Calendar rendering
function renderCalendar() {
  calendar.innerHTML = "";
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "12px";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "‹";
  prevBtn.title = "Previous Month";
  prevBtn.setAttribute("aria-label", "Previous month");
  prevBtn.style.cssText = "font-size:24px;border:none;background:transparent;cursor:pointer;color:" + getComputedStyle(document.body).color;
  prevBtn.addEventListener("click", () => {
    selectedDate = new Date(year, month - 1, selectedDate.getDate());
    renderCalendar();
    renderTasks();
    updateDailySummary();
  });

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "›";
  nextBtn.title = "Next Month";
  nextBtn.setAttribute("aria-label", "Next month");
  nextBtn.style.cssText = "font-size:24px;border:none;background:transparent;cursor:pointer;color:" + getComputedStyle(document.body).color;
  nextBtn.addEventListener("click", () => {
    selectedDate = new Date(year, month + 1, selectedDate.getDate());
    renderCalendar();
    renderTasks();
    updateDailySummary();
  });

  const monthYear = document.createElement("h3");
  monthYear.textContent = `${monthNames[month]} ${year}`;
  monthYear.style.margin = "0 auto";
  monthYear.style.userSelect = "none";

  header.appendChild(prevBtn);
  header.appendChild(monthYear);
  header.appendChild(nextBtn);
  calendar.appendChild(header);

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const trHead = document.createElement("tr");
  daysOfWeek.forEach(day => {
    const th = document.createElement("th");
    th.textContent = day;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  let dayCount = 1;
  for (let row = 0; row < 6; row++) {
    const tr = document.createElement("tr");

    for (let col = 0; col < 7; col++) {
      const td = document.createElement("td");

      if (row === 0 && col < firstDay || dayCount > totalDays) {
        td.classList.add("disabled");
        td.textContent = "";
      } else {
        const currentDay = dayCount;
        td.textContent = currentDay;

        if (
          currentDay === selectedDate.getDate() &&
          month === selectedDate.getMonth() &&
          year === selectedDate.getFullYear()
        ) {
          td.classList.add("selected");
          td.setAttribute("aria-current", "date");
        }

        const dayDateStr = formatDate(new Date(year, month, currentDay));
        if (tasks.some(task => task.date === dayDateStr)) {
          const dot = document.createElement("span");
          dot.style.cssText = "display:inline-block;width:6px;height:6px;border-radius:50%;margin-left:4px;vertical-align:middle;";
          dot.style.backgroundColor = document.body.classList.contains("dark-mode") ? "#ab47bc" : "#fb8c00";
          td.appendChild(dot);
        }

        td.tabIndex = 0;
        td.setAttribute("role", "button");
        td.setAttribute("aria-label", `Select date ${monthNames[month]} ${currentDay}, ${year}`);

        td.addEventListener("click", () => {
          selectedDate = new Date(year, month, currentDay);
          renderCalendar();
          renderTasks();
          updateDailySummary();
        });

        td.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectedDate = new Date(year, month, currentDay);
            renderCalendar();
            renderTasks();
            updateDailySummary();
          }
        });

        dayCount++;
      }

      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  calendar.appendChild(table);
}

// Daily summary
function updateDailySummary() {
  const dateStr = formatDate(selectedDate);
  const filteredTasks = tasks.filter(task => task.date === dateStr);

  const total = filteredTasks.length;
  const completed = filteredTasks.filter(task => task.completed).length;
  const pending = total - completed;

  const dateDisplay = formatDateDisplay(selectedDate);

  if (total === 0) {
    dailySummary.textContent = `No tasks scheduled for ${dateDisplay}.`;
  } else {
    dailySummary.textContent = `Summary for ${dateDisplay}: Total tasks: ${total}, Completed: ${completed}, Pending: ${pending}.`;
  }
}

themeToggleBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  localStorage.setItem("darkMode", isDarkMode);
  document.body.classList.toggle("dark-mode");
  themeIcon.classList.add("spin");
  setTimeout(() => themeIcon.classList.remove("spin"), 600);
  updateThemeUI();
  renderCalendar();
  renderTasks();
  updateDailySummary();
});

function updateThemeUI() {
  themeIcon.textContent = isDarkMode ? "☀️" : "🌙";
  themeText.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
}

renderCalendar();
renderTasks();
updateDailySummary();

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

// Data storage for tasks, format: [{id, text, date, completed}]
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Current selected date on calendar (default today)
let selectedDate = new Date();
selectedDate.setHours(0, 0, 0, 0);

// Initialize theme based on localStorage or default light
let isDarkMode = localStorage.getItem("darkMode") === "true";
if (isDarkMode) document.body.classList.add("dark-mode");
updateThemeUI();

// Utility functions
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(date) {
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Render todo list for selected date
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

    // Toggle complete on click or Enter key
    li.addEventListener("click", () => toggleComplete(task.id));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleComplete(task.id);
      }
    });

    // Remove button
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

// Toggle complete state
function toggleComplete(id) {
  tasks = tasks.map(task => task.id === id ? {...task, completed: !task.completed} : task);
  saveTasks();
  renderTasks();
  updateDailySummary();
}

// Remove task
function removeTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  updateDailySummary();
}

// Add new task
todoForm.addEventListener("submit", e => {
  e.preventDefault();

  const text = todoInput.value.trim();
  let date = todoDateInput.value;

  if (!text) return alert("Task description cannot be empty.");

  if (!date) {
    // Default to selected date if date input is empty
    date = formatDate(selectedDate);
  }

  const newTask = {
    id: Date.now(),
    text,
    date,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();

  // If the new task is for selected date, render immediately
  if (date === formatDate(selectedDate)) {
    renderTasks();
    updateDailySummary();
  }

  todoInput.value = "";
  todoDateInput.value = "";
});

// Render calendar with current selected month/year
function renderCalendar() {
  calendar.innerHTML = "";

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // Month and year header with navigation
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
  prevBtn.style.fontSize = "24px";
  prevBtn.style.border = "none";
  prevBtn.style.background = "transparent";
  prevBtn.style.cursor = "pointer";
  prevBtn.style.color = getComputedStyle(document.body).color;
  prevBtn.addEventListener("click", () => {
    selectedDate = new Date(year, month - 1, 1);
    renderCalendar();
    renderTasks();
    updateDailySummary();
  });

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "›";
  nextBtn.title = "Next Month";
  nextBtn.setAttribute("aria-label", "Next month");
  nextBtn.style.fontSize = "24px";
  nextBtn.style.border = "none";
  nextBtn.style.background = "transparent";
  nextBtn.style.cursor = "pointer";
  nextBtn.style.color = getComputedStyle(document.body).color;
  nextBtn.addEventListener("click", () => {
    selectedDate = new Date(year, month + 1, 1);
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

  // Create table for days
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

  // Calculate first day index and total days
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  let dayCount = 1;
  for (let row = 0; row < 6; row++) {
    const tr = document.createElement("tr");

    for (let col = 0; col < 7; col++) {
      const td = document.createElement("td");

      if (row === 0 && col < firstDay) {
        // Empty cells before first day
        td.classList.add("disabled");
        td.textContent = "";
      } else if (dayCount > totalDays) {
        // Empty cells after last day
        td.classList.add("disabled");
        td.textContent = "";
      } else {
        td.textContent = dayCount;

        // Highlight selected date
        if (
          dayCount === selectedDate.getDate() &&
          month === selectedDate.getMonth() &&
          year === selectedDate.getFullYear()
        ) {
          td.classList.add("selected");
          td.setAttribute("aria-current", "date");
        }

        // If tasks exist on this date, add dot or indicator
        const dayDateStr = formatDate(new Date(year, month, dayCount));
        if (tasks.some(task => task.date === dayDateStr)) {
          const dot = document.createElement("span");
          dot.style.display = "inline-block";
          dot.style.width = "6px";
          dot.style.height = "6px";
          dot.style.backgroundColor = "#fb8c00";
          dot.style.borderRadius = "50%";
          dot.style.marginLeft = "4px";
          dot.style.verticalAlign = "middle";

          if (document.body.classList.contains("dark-mode")) {
            dot.style.backgroundColor = "#ab47bc";
          }

          td.appendChild(dot);
        }

        // Make dates clickable
        td.tabIndex = 0;
        td.setAttribute("role", "button");
        td.setAttribute("aria-label", `Select date ${monthNames[month]} ${dayCount}, ${year}`);

        td.addEventListener("click", () => {
          selectedDate = new Date(year, month, dayCount);
          renderCalendar();
          renderTasks();
          updateDailySummary();
        });

        td.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectedDate = new Date(year, month, dayCount);
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

// Update daily summary widget
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

// Theme toggle handler
themeToggleBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  localStorage.setItem("darkMode", isDarkMode);
  document.body.classList.toggle("dark-mode");

  // Animate icon spin
  themeIcon.classList.add("spin");
  setTimeout(() => themeIcon.classList.remove("spin"), 600);

  updateThemeUI();
  renderCalendar();
  renderTasks();
  updateDailySummary();
});

function updateThemeUI() {
  if (isDarkMode) {
    themeIcon.textContent = "☀️";
    themeText.textContent = "Light Mode";
  } else {
    themeIcon.textContent = "🌙";
    themeText.textContent = "Dark Mode";
  }
}

// Initialize everything
renderCalendar();
renderTasks();
updateDailySummary();

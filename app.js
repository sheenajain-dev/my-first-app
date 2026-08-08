const SUPABASE_URL = "https://fukbeimrpkvdhhwyaptl.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_3iRluxnGuf6KTVMVBn9ufg_Qlb7i688";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const addForm = document.getElementById("addForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const stats = document.getElementById("stats");
const taskCount = document.getElementById("taskCount");
const clearCompletedBtn = document.getElementById("clearCompleted");

let tasks = [];

function fromRow(row) {
  return {
    id: row.id,
    text: row.text,
    completed: row.is_complete ?? false,
  };
}

function render() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark "${task.text}" as ${task.completed ? "incomplete" : "complete"}`);

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.setAttribute("aria-label", `Delete "${task.text}"`);
    deleteBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    checkbox.addEventListener("change", () => toggleTask(task.id));
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.append(checkbox, span, deleteBtn);
    taskList.appendChild(li);
  });

  const hasTasks = tasks.length > 0;
  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.length - activeCount;

  emptyState.hidden = hasTasks;
  stats.hidden = !hasTasks;

  if (hasTasks) {
    const label = activeCount === 1 ? "task" : "tasks";
    taskCount.textContent = `${activeCount} ${label} remaining`;
    clearCompletedBtn.hidden = completedCount === 0;
  }
}

async function fetchTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch tasks:", error.message);
    return;
  }

  tasks = data.map(fromRow);
  render();
}

async function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const { data, error } = await supabase
    .from("tasks")
    .insert({ text: trimmed, is_complete: false })
    .select()
    .single();

  if (error) {
    console.error("Failed to add task:", error.message);
    return;
  }

  tasks.unshift(fromRow(data));
  render();
}

async function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const completed = !task.completed;

  const { error } = await supabase
    .from("tasks")
    .update({ is_complete: completed })
    .eq("id", id);

  if (error) {
    console.error("Failed to update task:", error.message);
    return;
  }

  task.completed = completed;
  render();
}

async function deleteTask(id) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete task:", error.message);
    return;
  }

  tasks = tasks.filter((t) => t.id !== id);
  render();
}

async function clearCompleted() {
  const completedIds = tasks.filter((t) => t.completed).map((t) => t.id);
  if (completedIds.length === 0) return;

  const { error } = await supabase.from("tasks").delete().in("id", completedIds);

  if (error) {
    console.error("Failed to clear completed tasks:", error.message);
    return;
  }

  tasks = tasks.filter((t) => !t.completed);
  render();
}

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

clearCompletedBtn.addEventListener("click", clearCompleted);

fetchTasks();

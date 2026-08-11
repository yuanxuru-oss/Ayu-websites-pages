const storageKey = 'ayu-dashboard-v1';
const initialState = { focus: '让作品集首页更接近心里想要的样子', tasks: {} };
let state = { ...initialState };

try { state = { ...initialState, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; } catch (_) {}

const persist = () => localStorage.setItem(storageKey, JSON.stringify(state));
const focusInput = document.querySelector('#focus-input');
const saveStatus = document.querySelector('#save-status');
const taskCount = document.querySelector('#task-count');

focusInput.value = state.focus;
document.querySelector('#save-focus').addEventListener('click', () => {
  state.focus = focusInput.value.trim() || initialState.focus;
  focusInput.value = state.focus;
  persist();
  saveStatus.textContent = '已保存到这个浏览器';
  setTimeout(() => saveStatus.textContent = '', 1800);
});

function updateTasks() {
  const tasks = [...document.querySelectorAll('[data-task]')];
  const completed = tasks.filter(task => task.checked).length;
  taskCount.textContent = `${completed} / ${tasks.length}`;
}

document.querySelectorAll('[data-task]').forEach(task => {
  task.checked = Boolean(state.tasks[task.dataset.task]);
  task.addEventListener('change', () => {
    state.tasks[task.dataset.task] = task.checked;
    persist();
    updateTasks();
  });
});
updateTasks();

document.querySelectorAll('.nav-link').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav-link').forEach(item => item.classList.toggle('is-active', item === button));
  document.getElementById(button.dataset.view)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

document.querySelector('#journal-button').addEventListener('click', () => {
  const status = document.querySelector('#journal-status');
  status.textContent = '今天的空白页已经打开。';
  setTimeout(() => status.textContent = '', 2400);
});

document.querySelector('#shuffle-inspiration').addEventListener('click', () => {
  document.querySelector('#inspiration-grid').classList.toggle('is-shuffled');
});

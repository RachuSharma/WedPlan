(() => {
  const key = 'tasks';

  const storage = window.WedPlanStorage;
  if (!storage) return;
  let tasks = storage.get(key, null);
  if (!Array.isArray(tasks)) tasks = [];
  const demoIds = new Set(['sample-photo', 'sample-guests', 'sample-outfits']);
  const cleanedTasks = tasks.filter(task => !demoIds.has(task.id));
  if (cleanedTasks.length !== tasks.length || storage.get(key, null) === null) { tasks = cleanedTasks; storage.set(key, tasks); }

  const editor = document.querySelector('#task-form-wrap');
  const form = document.querySelector('#task-form');
  const managerList = document.querySelector('#managed-task-list');
  const dashboardList = document.querySelector('#task-list');
  const filter = document.querySelector('#task-filter');
  const notify = message => window.WedPlan?.showToast(message);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const prettyDate = value => {
    if (!value) return 'No due date';
    const date = new Date(`${value}T12:00:00`);
    const ad = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
    return window.WedPlan?.withBS ? window.WedPlan.withBS(ad, value) : ad;
  };
  // Ticking off the last open task is a milestone
  function toggled(task) {
    if (task.completed && tasks.length > 1 && tasks.every(item => item.completed)) window.WedPlan?.celebrate?.('Every task is done. Time to enjoy it. ♥');
    else notify(task.completed ? 'Task marked complete.' : 'Task moved back to your list.');
  }
  const persist = () => storage.set(key, tasks);

  function renderManager() {
    if (!managerList) return;
    const selection = filter?.value || 'all';
    const visible = tasks.filter(task => selection === 'all' || (selection === 'completed') === Boolean(task.completed));
    const count = document.querySelector('#task-count');
    const note = document.querySelector('#task-count-note');
    if (count) count.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
    if (note) note.textContent = `· ${tasks.filter(task => !task.completed).length} to do`;
    if (!visible.length) {
      managerList.innerHTML = `<div class="tasks-empty"><span aria-hidden="true">✿</span><strong>${tasks.length ? 'Nothing in this view.' : 'Your list is ready.'}</strong><p>${tasks.length ? 'Try another filter, or add a new task.' : 'Add your first task and take one small step forward.'}</p></div>`;
      return;
    }
    managerList.innerHTML = visible.map(task => `<article class="managed-task${task.completed ? ' completed' : ''}" data-id="${escape(task.id)}">
      <button class="task-toggle${task.completed ? ' checked' : ''}" type="button" data-action="toggle" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}: ${escape(task.title)}">${task.completed ? '✓' : ''}</button>
      <div class="managed-task-main"><strong>${escape(task.title)}</strong>${task.notes ? `<p>${escape(task.notes)}</p>` : ''}<div class="managed-task-meta"><span>◷ ${escape(prettyDate(task.dueDate))}</span>${task.assignee ? `<span>· ${escape(task.assignee)}</span>` : ''}<span class="priority ${escape(task.priority)}">${escape(task.priority)} priority</span></div></div>
      <div class="task-actions"><button type="button" data-action="edit">Edit</button><button type="button" data-action="delete" class="delete-action">Remove</button></div>
    </article>`).join('');
  }

  function renderDashboard() {
    if (!dashboardList) return;
    const next = tasks.filter(task => !task.completed).slice(0, 3);
    if (!next.length) {
      dashboardList.innerHTML = '<div class="dashboard-empty-task">All caught up. Add a task whenever a new step comes up.</div>';
      return;
    }
    dashboardList.innerHTML = next.map(task => `<label class="task-row"><input type="checkbox" data-dashboard-toggle="${escape(task.id)}"><span class="task-check"></span><span class="task-text"><strong>${escape(task.title)}</strong><small>${escape(prettyDate(task.dueDate))}${task.assignee ? ` <span class="task-bullet">·</span> ${escape(task.assignee)}` : ''}</small></span><span class="priority ${escape(task.priority)}">${escape(task.priority)}</span></label>`).join('');
  }

  function render() {
    renderManager(); renderDashboard();
    const dashboardCount = document.querySelector('#dashboard-todo-count');
    if (dashboardCount) dashboardCount.textContent = tasks.filter(task => !task.completed).length;
  }
  function showEditor(task) {
    if (!editor || !form) return;
    form.reset();
    document.querySelector('#task-id').value = task?.id || '';
    document.querySelector('#task-name').value = task?.title || '';
    document.querySelector('#task-due').value = task?.dueDate || '';
    document.querySelector('#task-assignee').value = task?.assignee || '';
    document.querySelector('#task-priority').value = task?.priority || 'normal';
    document.querySelector('#task-notes').value = task?.notes || '';
    const more = document.querySelector('#task-more');
    if (more) more.open = Boolean(task?.notes || (task && task.priority !== 'normal'));
    document.querySelector('#form-eyebrow').textContent = task ? 'UPDATE TASK' : 'NEW TASK';
    document.querySelector('#form-title').textContent = task ? 'Edit your task' : 'Add a task';
    document.querySelector('#save-task').textContent = task ? 'Save changes' : 'Save task';
    editor.hidden = false;
    document.querySelector('#task-name').focus();
    editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function closeEditor() { if (editor) editor.hidden = true; if (form) form.reset(); }

  document.querySelector('#open-task-form')?.addEventListener('click', () => showEditor());
  document.querySelector('#cancel-task')?.addEventListener('click', closeEditor);
  document.querySelector('#close-task-form')?.addEventListener('click', closeEditor);
  filter?.addEventListener('change', renderManager);
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const id = document.querySelector('#task-id').value;
    const record = {
      id: id || (window.crypto?.randomUUID?.() ?? `task-${Date.now()}`),
      title: document.querySelector('#task-name').value.trim(),
      dueDate: document.querySelector('#task-due').value,
      assignee: document.querySelector('#task-assignee').value.trim(),
      priority: document.querySelector('#task-priority').value,
      notes: document.querySelector('#task-notes').value.trim(),
      completed: id ? Boolean(tasks.find(task => task.id === id)?.completed) : false
    };
    if (!record.title) { document.querySelector('#task-name').focus(); return; }
    tasks = id ? tasks.map(task => task.id === id ? record : task) : [record, ...tasks];
    persist(); render(); closeEditor(); notify(id ? 'Task updated.' : 'Task added.');
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const row = button.closest('[data-id]');
    const task = tasks.find(item => item.id === row?.dataset.id);
    if (!task) return;
    if (button.dataset.action === 'edit') showEditor(task);
    // Remove straight away and offer Undo, instead of asking "Are you sure?" first
    if (button.dataset.action === 'delete') {
      const index = tasks.indexOf(task);
      tasks = tasks.filter(item => item.id !== task.id); persist(); render();
      window.WedPlan?.showToast(`“${task.title}” removed.`, { label: 'Undo', run: () => {
        if (tasks.some(item => item.id === task.id)) return;
        tasks.splice(Math.min(index, tasks.length), 0, task); persist(); render(); notify(`“${task.title}” is back.`);
      } });
    }
    if (button.dataset.action === 'toggle') {
      task.completed = !task.completed; persist(); render(); toggled(task);
    }
  });
  dashboardList?.addEventListener('change', event => {
    const input = event.target.closest('[data-dashboard-toggle]');
    if (!input) return;
    const task = tasks.find(item => item.id === input.dataset.dashboardToggle);
    if (!task) return;
    task.completed = input.checked; persist(); render(); toggled(task);
  });
  if (window.location.hash === '#new-task') window.setTimeout(() => showEditor(), 80);
  render();
})();

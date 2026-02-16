// Modal handlers for adding tasks
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('taskModal');
  const titleInput = document.getElementById('taskTitle');
  const timeHourBtn = document.getElementById('timeHour');
  const timeMinuteBtn = document.getElementById('timeMinute');
  const deadlineInput = document.getElementById('taskDeadline');
  const reminderEnable = document.getElementById('taskReminderEnable');
  const reminderTime = document.getElementById('taskReminderTime');
  const prioritySelect = document.getElementById('taskPriority');
  const saveBtn = document.getElementById('saveTaskBtn');
  const cancelBtn = document.getElementById('cancelTaskBtn');
  const previewTasksList = document.getElementById('previewTasksList');

  // Render all tasks to preview panel
  window.renderPreviewTasks = function() {
    if (!window.calendar) return;
    const tasks = window.calendar.tasks;
    
    if (tasks.length === 0) {
      previewTasksList.innerHTML = '<p class="empty-state">No tasks yet.</p>';
      return;
    }

    const html = tasks.map(task => `
      <div class="task-item ${task.priority}${task.status === 'completed' ? ' completed' : ''}" data-id="${task.id}">
        <span class="dot"></span>
        <span class="task-title-text">${task.title}</span>
        <small class="task-status">${task.status === 'completed' ? 'Completed' : task.status === 'ontime' ? 'On Time' : 'Pending'}</small>
        ${task.status !== 'completed' ? `<button class="mark-complete-btn" data-id="${task.id}" aria-label="Mark completed" title="Mark completed">\
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
            <path d="M20 6L9 17l-5-5"/>\
            <path d="M22 6L11 17l-2-2"/>\
          </svg>\
        </button>` : ''}
      </div>
    `).join('');

    previewTasksList.innerHTML = html;
  };

  // Delegate click for mark complete buttons in preview panel
  previewTasksList.addEventListener('click', (e) => {
    const btn = e.target.closest('.mark-complete-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    if (window.calendar && typeof window.calendar.toggleTask === 'function') {
      window.calendar.toggleTask(isNaN(id) ? id : Number(id));
      window.renderPreviewTasks();
    }
  });

  function closeModal() {
    modal.style.display = 'none';
  }

  window.showTaskModal = function(dateStr) {
    if (!modal) return;
    modal.style.display = 'flex';
    titleInput.value = '';
    // initialize clock buttons
    if (timeHourBtn && timeMinuteBtn) {
      timeHourBtn.textContent = '12';
      timeMinuteBtn.textContent = '00';
    }
    deadlineInput.value = dateStr || '';
    reminderEnable.checked = false;
    reminderTime.value = '';
    prioritySelect.value = 'medium';
    // store selected date
    window.selectedTaskDate = dateStr;
    titleInput.focus();
  }

  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });

  // Clock button interactions: left click increments, right click decrements
  function setupClockButton(btn, min, max, step, padLen=2) {
    if (!btn) return;
    const getVal = () => parseInt(btn.textContent, 10);
    const setVal = (v) => { btn.textContent = String(((v % (max+1)) + (max+1)) % (max+1)).padStart(padLen, '0'); };
    btn.addEventListener('click', (e) => { e.preventDefault(); setVal(getVal() + step); });
    btn.addEventListener('contextmenu', (e) => { e.preventDefault(); setVal(getVal() - step); });
  }

  setupClockButton(timeHourBtn, 0, 23, 1, 2);
  setupClockButton(timeMinuteBtn, 0, 59, 5, 2);

  // Topbar share/settings simple handlers
  const shareBtn = document.getElementById('shareBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  if (shareBtn) shareBtn.addEventListener('click', () => { alert('Share calendar link copied (placeholder)'); });
  if (settingsBtn) settingsBtn.addEventListener('click', () => { alert('Open settings (placeholder)'); });

  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }
    const time = (timeHourBtn && timeMinuteBtn) ? `${String(timeHourBtn.textContent).padStart(2,'0')}:${String(timeMinuteBtn.textContent).padStart(2,'0')}` : null;
    const deadline = deadlineInput.value || null;
    const reminder = reminderEnable.checked ? (reminderTime.value || null) : null;
    const priority = prioritySelect.value || 'medium';
    const dateStr = window.selectedTaskDate || deadline || null;
    if (!dateStr) {
      alert('No date selected');
      return;
    }

    if (window.calendar && typeof window.calendar.addTask === 'function') {
      try {
        await window.calendar.addTask(title, priority, dateStr, { time, deadline, reminder });
        if (typeof window.renderPreviewTasks === 'function') window.renderPreviewTasks();
      } catch (err) {
        console.error('Error adding task:', err);
      }
    }
    closeModal();
  });

  // Close modal when clicking outside modal card
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});

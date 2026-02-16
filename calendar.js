// Calendar Management System (Firebase-enabled)
import { taskDB } from './firebase-config.js';

class TaskCalendar {
  constructor() {
    this.currentDate = new Date();
    this.tasks = [];
    this.init();
  }

  async init() {
    this.tasks = await this.loadTasks();
    this.setupEventListeners();
    this.renderCalendar();
    if (typeof window.renderPreviewTasks === 'function') {
      setTimeout(() => window.renderPreviewTasks(), 100);
    }
  }

  // Load tasks from Firestore via taskDB, fall back to default demo tasks
  async loadTasks() {
    try {
      const tasks = await taskDB.getTasks();
      if (tasks && tasks.length) return tasks.map(t => ({ ...t }));
    } catch (e) {
      console.error('Error loading tasks from Firestore', e);
    }
    return this.getDefaultTasks();
  }

  // Default tasks for demo
  getDefaultTasks() {
    return [
      { id: 1, title: 'Payment UI', priority: 'high', date: '2026-02-05', status: 'pending' },
      { id: 2, title: 'Dashboard Fix', priority: 'medium', date: '2026-02-06', status: 'pending' },
      { id: 3, title: 'Update Docs', priority: 'low', date: '2026-02-07', status: 'completed' },
      { id: 4, title: 'Client Call', priority: 'ontime', date: '2026-02-08', status: 'ontime' },
      { id: 5, title: 'Review mockups', priority: 'high', date: '2026-02-04', status: 'pending' },
      { id: 6, title: 'Team meeting', priority: 'medium', date: '2026-02-10', status: 'pending' },
      { id: 7, title: 'Presentation', priority: 'high', date: '2026-02-12', status: 'pending' },
    ];
  }

  // Save tasks locally (optional) and optionally sync updated tasks
  saveTasks() {
    try {
      localStorage.setItem('flowtrackTasks', JSON.stringify(this.tasks));
    } catch (e) {
      console.warn('Could not save tasks to localStorage', e);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    if (monthSelect) {
      monthSelect.addEventListener('change', () => {
        this.currentDate.setMonth(parseInt(monthSelect.value));
        this.renderCalendar();
      });
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', () => {
        this.currentDate.setFullYear(parseInt(yearSelect.value));
        this.renderCalendar();
      });
    }
  }

  // Get days in month
  getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  // Get first day of month
  getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  // Format date as YYYY-MM-DD
  formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Get tasks for a specific date
  getTasksForDate(dateStr) {
    return this.tasks.filter(task => task.date === dateStr);
  }

  // Render calendar
  renderCalendar() {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = this.getFirstDayOfMonth(this.currentDate);
    const daysInMonth = this.getDaysInMonth(this.currentDate);

    const existingDays = calendarGrid.querySelectorAll('.day');
    existingDays.forEach(day => day.remove());

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'day empty';
      calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'day';

      const dateStr = this.formatDate(year, month, day);
      const tasksForDay = this.getTasksForDate(dateStr);

      const today = new Date();
      if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
        dayEl.classList.add('today');
      }

      const dateNum = document.createElement('span');
      dateNum.className = 'date-num';
      dateNum.textContent = day;
      dayEl.appendChild(dateNum);

      tasksForDay.forEach(task => {
        const eventEl = document.createElement('div');
        eventEl.className = `event ${task.priority}`;
        eventEl.textContent = task.title;
        eventEl.title = task.title;
        eventEl.style.cursor = 'pointer';
        eventEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showTaskDetails(task);
        });
        dayEl.appendChild(eventEl);
      });

      dayEl.addEventListener('click', () => {
        this.openDayMenu(dayEl, dateStr);
      });

      calendarGrid.appendChild(dayEl);
    }

    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    if (monthSelect) monthSelect.value = month;
    if (yearSelect) yearSelect.value = year;

    // Update header showing current month and year
    const currentMonthEl = document.getElementById('currentMonth');
    if (currentMonthEl) {
      currentMonthEl.textContent = `${this.getMonthName(month)} ${year}`;
    }
  }

  showTaskDetails(task) {
    alert(`Task: ${task.title}\nPriority: ${task.priority}\nStatus: ${task.status}`);
  }

  openDayMenu(dayEl, dateStr) {
    document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
    dayEl.classList.add('selected');
    window.selectedTaskDate = dateStr;
    if (typeof window.showTaskModal === 'function') {
      window.showTaskModal(dateStr);
    }
  }

  // Add new task and persist to Firestore
  async addTask(title, priority, dateStr, extras = {}) {
    const tempId = Date.now();
    const task = {
      id: tempId,
      title,
      priority: priority || 'medium',
      date: dateStr,
      status: 'pending',
      time: extras.time || null,
      deadline: extras.deadline || null,
      reminder: extras.reminder || null,
      createdAt: new Date()
    };

    // Add locally first for immediate UI
    this.tasks.push(task);
    this.saveTasks();
    this.renderCalendar();
    if (typeof window.renderPreviewTasks === 'function') window.renderPreviewTasks();

    // Persist to Firestore and replace temp id with Firestore id
    try {
      const saved = await taskDB.addTask(task);
      if (saved && saved.id) {
        // replace the local temp id
        this.tasks = this.tasks.map(t => t.id === tempId ? { ...saved } : t);
        this.saveTasks();
        if (typeof window.renderPreviewTasks === 'function') window.renderPreviewTasks();
      }
    } catch (e) {
      console.error('Failed to save task to Firestore', e);
    }
  }

  // Delete task
  async deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveTasks();
    this.renderCalendar();
    if (typeof window.renderPreviewTasks === 'function') window.renderPreviewTasks();
    try {
      await taskDB.deleteTask(String(taskId));
    } catch (e) {
      console.error('Error deleting task from Firestore', e);
    }
  }

  // Toggle task completion and persist
  async toggleTask(taskId) {
    const task = this.tasks.find(t => String(t.id) === String(taskId));
    if (task) {
      task.status = task.status === 'completed' ? 'pending' : 'completed';
      this.saveTasks();
      this.renderCalendar();
      if (typeof window.renderPreviewTasks === 'function') window.renderPreviewTasks();
      try {
        if (task.id && String(task.id).length > 5) {
          await taskDB.updateTask(String(task.id), { status: task.status });
        }
      } catch (e) {
        console.error('Error updating task status in Firestore', e);
      }
    }
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  }

  getMonthName(monthIndex) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  }
}

// Initialize calendar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.calendar = new TaskCalendar();
});

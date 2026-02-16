// PAGE NAVIGATION
const navLinks = document.querySelectorAll('.nav a');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));

    link.classList.add('active');
    const pageId =
      link.textContent.toLowerCase().replace(" ", "-") + "-page";
    document.getElementById(pageId).classList.add('active');
  });
});

// FOCUS TIMER
let duration = 25 * 60;
let timer = duration;
let running = false;
let interval;

const timerText = document.querySelector('.timer-text');
const timerBtn = document.getElementById('timer-btn');
const resetBtn = document.getElementById('reset-btn');
const ring = document.querySelector('.progress-ring');
const FULL = 502;

function updateUI() {
  const m = Math.floor(timer / 60);
  const s = timer % 60;
  timerText.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  ring.style.strokeDashoffset =
    FULL - (timer / duration) * FULL;
}

timerBtn.addEventListener('click', () => {
  if (!running) {
    running = true;
    timerBtn.textContent = '⏸ Pause Focus';

    interval = setInterval(() => {
      if (timer > 0) {
        timer--;
        updateUI();
      } else {
        clearInterval(interval);
        timerBtn.textContent = '✔ Focus Complete';
        timerBtn.style.background = '#16a34a';
      }
    }, 1000);
  } else {
    running = false;
    clearInterval(interval);
    timerBtn.textContent = '▶ Resume Focus';
  }
});

resetBtn.addEventListener('click', () => {
  clearInterval(interval);
  timer = duration;
  running = false;
  timerBtn.textContent = '▶ Start Focus';
  timerBtn.style.background = '#2563eb';
  updateUI();
});

// SEARCH FUNCTIONALITY
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const focusTasksList = document.getElementById('focusTasksList');
const focusTaskCounter = document.getElementById('focusTaskCounter');
const generatePlanBtn = document.querySelector('.ai-card .btn-gradient');
const AI_INSIGHTS_KEY = 'flowtrackAiInsights';

function renderFocusTasks(tasksToShow = null) {
  if (!focusTasksList) return;

  let taskCalendar = null;
  if (typeof window.calendar !== 'undefined') {
    taskCalendar = window.calendar;
  }

  if (!taskCalendar || !taskCalendar.tasks) {
    focusTasksList.innerHTML = '<p style="text-align: center; color: #94a3b8;">No tasks available</p>';
    return;
  }

  let tasks = tasksToShow || taskCalendar.tasks;
  
  if (tasks.length === 0) {
    focusTasksList.innerHTML = '<p style="text-align: center; color: #94a3b8;">No matching tasks</p>';
    focusTaskCounter.textContent = '0/0';
    return;
  }

  // Sort by priority: high > medium > ontime > low
  const priorityOrder = { high: 0, medium: 1, ontime: 2, low: 3 };
  tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  let html = '';
  let completedCount = 0;

  tasks.forEach(task => {
    const isCompleted = task.status === 'completed';
    if (isCompleted) completedCount++;

    const priorityLabel = {
      high: 'High Priority',
      medium: 'Medium',
      ontime: 'On Time',
      low: 'Low Priority'
    }[task.priority];

    html += `
      <label class="focus-task ${isCompleted ? 'completed' : ''}">
        <input type="checkbox" ${isCompleted ? 'checked' : ''}>
        <div class="task-content">
          <span class="task-title">${task.title}</span>
          <span class="task-badge ${task.priority}">${priorityLabel}</span>
        </div>
        <span class="task-time">${new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        ${!isCompleted ? `<button class="mark-complete-btn" data-id="${task.id}" aria-label="Mark completed" title="Mark completed">\
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
            <path d="M20 6L9 17l-5-5"/>\
            <path d="M22 6L11 17l-2-2"/>\
          </svg>\
        </button>` : ''}
      </label>
    `;
  });

  focusTasksList.innerHTML = html;
  focusTaskCounter.textContent = `${completedCount}/${tasks.length}`;
}

function performSearch() {
  const query = searchInput.value.toLowerCase().trim();

  if (query === '') {
    // Show all tasks if search is empty
    renderFocusTasks();
  } else {
    // Filter tasks matching the search query
    const taskCalendar = window.calendar;
    if (!taskCalendar || !taskCalendar.tasks) return;
    
    const filteredTasks = taskCalendar.tasks.filter(task =>
      task.title.toLowerCase().includes(query)
    );

    // Show filtered tasks, or matching tasks first
    if (filteredTasks.length > 0) {
      renderFocusTasks(filteredTasks);
    } else {
      focusTasksList.innerHTML = '<p style="text-align: center; color: #94a3b8;">No tasks found</p>';
      focusTaskCounter.textContent = '0/0';
    }
  }
}

// Search functionality - Enter key and button click
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

// Delegate mark-complete button clicks in focus tasks list
if (focusTasksList) {
  focusTasksList.addEventListener('click', (e) => {
    const btn = e.target.closest('.mark-complete-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    if (window.calendar && typeof window.calendar.toggleTask === 'function') {
      window.calendar.toggleTask(isNaN(id) ? id : Number(id));
      renderFocusTasks();
      if (typeof window.renderPreviewTasks === 'function') window.renderPreviewTasks();
    }
  });
}

searchBtn.addEventListener('click', performSearch);

function readAiInsights() {
  try {
    const raw = localStorage.getItem(AI_INSIGHTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Unable to read AI insights', err);
    return {};
  }
}

function getTaskDeadline(task) {
  return task.deadline || task.date || null;
}

function getTaskPriorityRank(task) {
  const priorityRank = { high: 3, medium: 2, ontime: 1, low: 0 };
  return priorityRank[task.priority] ?? 0;
}

function getTaskUrgencyRank(task) {
  const deadline = getTaskDeadline(task);
  if (!deadline) return 0;
  const taskDate = new Date(deadline);
  if (Number.isNaN(taskDate.getTime())) return 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  taskDate.setHours(0, 0, 0, 0);
  if (taskDate < now) return 3;
  if (taskDate.getTime() === now.getTime()) return 2;
  return 1;
}

function formatDeadline(deadline) {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return 'No deadline';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function extractTipText(rawTip) {
  return String(rawTip || '')
    .replace(/\*\*/g, '')
    .replace(/^\d+\.\s*/, '')
    .trim();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPlanTips(aiInsights) {
  const latest = Array.isArray(aiInsights.latestTips) ? aiInsights.latestTips : [];
  const base = Array.isArray(aiInsights.baseTips) ? aiInsights.baseTips : [];
  const fallbackTips = [
    'Start with the highest-priority task before checking messages.',
    'Work in 25-minute focus blocks with short breaks between blocks.',
    'Break each task into one clear first step to remove friction.',
    'Batch similar tasks together to reduce context switching.',
    'Mark one task done before starting another to keep momentum.'
  ];
  const tips = [...latest, ...base].map(extractTipText).filter(Boolean);
  return tips.length ? tips : fallbackTips;
}

function buildTodayPlan(tasks, aiInsights) {
  const pending = tasks.filter(task => task.status !== 'completed');
  const sorted = pending.sort((a, b) => {
    const urgencyDiff = getTaskUrgencyRank(b) - getTaskUrgencyRank(a);
    if (urgencyDiff !== 0) return urgencyDiff;

    const priorityDiff = getTaskPriorityRank(b) - getTaskPriorityRank(a);
    if (priorityDiff !== 0) return priorityDiff;

    const aDeadline = getTaskDeadline(a) ? new Date(getTaskDeadline(a)).getTime() : Number.MAX_SAFE_INTEGER;
    const bDeadline = getTaskDeadline(b) ? new Date(getTaskDeadline(b)).getTime() : Number.MAX_SAFE_INTEGER;
    return aDeadline - bDeadline;
  });

  const topTasks = sorted.slice(0, 3);
  const tips = getPlanTips(aiInsights);

  return topTasks.map((task, index) => ({
    title: task.title,
    deadline: formatDeadline(getTaskDeadline(task)),
    tip: tips[index % tips.length]
  }));
}

function renderTodayPlan(planItems) {
  const aiCard = document.querySelector('.ai-card');
  if (!aiCard) return;

  let existingPlan = aiCard.querySelector('.today-plan');
  if (!existingPlan) {
    existingPlan = document.createElement('div');
    existingPlan.className = 'today-plan';
    aiCard.appendChild(existingPlan);
  }

  if (planItems.length === 0) {
    existingPlan.innerHTML = '<p class="today-plan-empty">No pending tasks found. Add tasks in the Tasks page to generate a plan.</p>';
    return;
  }

  const itemsHtml = planItems.map(item => `
    <div class="today-plan-item">
      <h4>${escapeHtml(item.title)}</h4>
      <p class="today-plan-deadline">Deadline: ${escapeHtml(item.deadline)}</p>
      <p class="today-plan-tip">AI tip: ${escapeHtml(item.tip)}</p>
    </div>
  `).join('');

  existingPlan.innerHTML = `
    <h4 class="today-plan-title">Today&apos;s AI Plan</h4>
    ${itemsHtml}
  `;
}

function setupGeneratePlanButton() {
  if (!generatePlanBtn) return;

  generatePlanBtn.addEventListener('click', () => {
    const tasks = (window.calendar && Array.isArray(window.calendar.tasks))
      ? [...window.calendar.tasks]
      : [];
    const aiInsights = readAiInsights();
    const todayPlan = buildTodayPlan(tasks, aiInsights);
    renderTodayPlan(todayPlan);
    generatePlanBtn.textContent = 'Regenerate Today\u2019s Plan';
  });
}

// ANALYTICS PAGE - Productivity Score Animation
function initializeProductivityScore() {
  const scoreValue = 78; // Default score
  const scoreElement = document.getElementById('productivityScore');
  const ringProgress = document.querySelector('.ring-progress');
  
  if (scoreElement && ringProgress) {
    // Calculate the stroke-dashoffset based on the score (0-100)
    // Circle circumference: 2 * π * r = 2 * π * 90 ≈ 565
    const circumference = 565;
    const offset = circumference - (scoreValue / 100) * circumference;
    
    // Wait for page visibility, then animate
    scoreElement.textContent = scoreValue;
    
    // Observer to animate when page becomes visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          ringProgress.style.strokeDashoffset = offset;
          observer.unobserve(entry.target);
        }
      });
    });
    
    const analyticsPage = document.getElementById('analytics-page');
    if (analyticsPage) {
      observer.observe(analyticsPage);
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeProductivityScore();
  initializeAnalyticsFeatures();
  setupGeneratePlanButton();
  
  setTimeout(() => {
    if (window.calendar && window.calendar.tasks) {
      renderFocusTasks();
    }
  }, 100);
});

// ANALYTICS PAGE - Chart Features
function initializeAnalyticsFeatures() {
  // Chart Overlay
  const expandChartBtn = document.getElementById('expandChartBtn');
  const chartOverlay = document.getElementById('chartOverlay');
  const closeOverlay = document.getElementById('closeOverlay');
  
  if (expandChartBtn && chartOverlay && closeOverlay) {
    expandChartBtn.addEventListener('click', () => {
      chartOverlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
    
    closeOverlay.addEventListener('click', () => {
      chartOverlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
    
    chartOverlay.addEventListener('click', (e) => {
      if (e.target === chartOverlay) {
        chartOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  }
  
  // PDF Download
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
      generateAnalyticsPDF();
    });
  }
  
  // Share
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      shareAnalytics();
    });
  }
}

// Generate PDF with analytics data
function generateAnalyticsPDF() {
  const element = document.querySelector('.analytics-section');
  const printWindow = window.open('', '', 'height=600,width=800');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>FlowTrack Analytics Report</title>
      <style>
        body {
          font-family: 'Inter', sans-serif;
          margin: 20px;
          color: #0f172a;
        }
        h1 {
          text-align: center;
          color: #2563eb;
          margin-bottom: 30px;
        }
        .report-section {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .metric {
          display: inline-block;
          margin-right: 40px;
          margin-bottom: 15px;
        }
        .metric-label {
          font-size: 12px;
          color: #64748b;
        }
        .metric-value {
          font-size: 24px;
          font-weight: 600;
          color: #0f172a;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <h1>📊 FlowTrack Analytics Report</h1>
      
      <div class="report-section">
        <h2>Productivity Metrics</h2>
        <div class="metric">
          <div class="metric-label">Productivity Score</div>
          <div class="metric-value">78%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Completed Tasks</div>
          <div class="metric-value">18/24</div>
        </div>
        <div class="metric">
          <div class="metric-label">Incomplete Tasks</div>
          <div class="metric-value">6/24</div>
        </div>
        <div class="metric">
          <div class="metric-label">Average Hours/Task</div>
          <div class="metric-value">5.2 hrs</div>
        </div>
      </div>
      
      <div class="report-section">
        <h2>Weekly Summary</h2>
        <p><strong>Total Hours:</strong> 32 hours</p>
        <p><strong>Target Hours:</strong> 40 hours</p>
        <p><strong>Day Streak:</strong> 5 days</p>
        <p><strong>Completion Rate:</strong> 92%</p>
      </div>
      
      <div class="footer">
        <p>Report generated on ${new Date().toLocaleDateString()}</p>
        <p>FlowTrack - Productivity Analytics Dashboard</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
}

// Share analytics
function shareAnalytics() {
  const shareText = "Check out my FlowTrack Analytics! 📊 I've completed 18/24 tasks with a 78% productivity score and maintained a 5-day streak. #productivity #flowtrack";
  
  if (navigator.share) {
    navigator.share({
      title: 'FlowTrack Analytics',
      text: shareText,
      url: window.location.href
    }).catch(() => {
      // Fallback if share fails
      copyToClipboard(shareText);
    });
  } else {
    // Fallback for browsers that don't support Web Share API
    copyToClipboard(shareText);
  }
}

// Copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Analytics summary copied to clipboard! You can now paste it anywhere.');
  }).catch(() => {
    // Manual fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Analytics summary copied to clipboard! You can now paste it anywhere.');
  });
}

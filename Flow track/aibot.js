// AI BOT FUNCTIONALITY

const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const clearChatBtn = document.getElementById('clearChatBtn');
const quickActionBtns = document.querySelectorAll('.quick-action-btn');
const AI_INSIGHTS_KEY = 'flowtrackAiInsights';

// AI Responses Database
const aiResponses = {
  analyze: `I've analyzed your tasks. Here's what I found:
  
📊 **Task Breakdown:**
- High Priority: 5 tasks (2 overdue)
- Medium Priority: 8 tasks
- Low Priority: 4 tasks

💡 **Recommendation:** Focus on the 2 overdue tasks first. They're short-duration tasks that will free up mental space.

⏱️ **Estimated Time:** ~2.5 hours to complete high-priority items`,

  schedule: `Let me optimize your schedule for maximum productivity:

🌅 **9:00 AM - 11:00 AM:** Focus Block (Deep Work)
- Best time for your most challenging task

☕ **11:00 AM - 11:15 AM:** Break + Hydration

📚 **11:15 AM - 12:45 PM:** Secondary Tasks

🍽️ **12:45 PM - 1:30 PM:** Lunch Break

🎯 **1:30 PM - 3:00 PM:** Meetings & Collaboration

⏰ **3:00 PM - 4:00 PM:** Review & Planning

This schedule aligns with your peak focus times!`,

  tips: `Here are 5 productivity tips for today:

1. **Use the Pomodoro Technique** - Work for 25 mins, rest for 5 mins
2. **Single-task First** - Start with your most important task
3. **Batch Similar Tasks** - Group similar work together
4. **Take Regular Breaks** - Every 90 mins, take a 15-min break
5. **Track Your Progress** - Use the focus timer to stay accountable

💪 You're doing great! Keep up the momentum!`,

  summary: `📈 **Daily Productivity Summary:**

✅ **Completed:** 3 tasks today
⏱️ **Focus Time:** 2.5 hours
📊 **Efficiency:** 87%
🎯 **On Track:** Yes

**What went well:**
- Great morning focus session
- All meetings finished on time

**Areas to improve:**
- Schedule buffer time between meetings
- Take more breaks to prevent burnout

See you tomorrow! 🚀`,

  greeting: `Hello! 👋 How can I help you today? I can:
- Analyze your tasks and workload
- Optimize your daily schedule
- Provide productivity tips and strategies
- Give you a daily summary
- Answer questions about your productivity

What would you like to explore?`,

  default: `That's an interesting question! Based on your task patterns, here's my insight:

Your productivity is strongest in the morning hours. I recommend scheduling your most important work between 9 AM - 11 AM for maximum flow state.

Would you like me to:
1. Analyze your current workload?
2. Create an optimized schedule?
3. Suggest productivity strategies?

Let me know! 😊`
};

function readAiInsights() {
  try {
    const raw = localStorage.getItem(AI_INSIGHTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Unable to read AI insights', err);
    return {};
  }
}

function saveAiInsights(partial) {
  const existing = readAiInsights();
  const merged = {
    ...existing,
    ...partial,
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(AI_INSIGHTS_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn('Unable to save AI insights', err);
  }
}

function extractTips(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\d+\.\s+/.test(line))
    .map(line => line.replace(/^\d+\.\s+/, '').replace(/\*\*/g, ''))
    .filter(Boolean)
    .slice(0, 5);
}

function cacheAiResponse(userMessage, responseText) {
  const latestTips = extractTips(responseText);
  const lowerMessage = userMessage.toLowerCase();
  const lastAction = lowerMessage.includes('analyze') || lowerMessage.includes('analysis')
    ? 'analyze'
    : lowerMessage.includes('schedule') || lowerMessage.includes('optimize')
      ? 'schedule'
      : lowerMessage.includes('tip') || lowerMessage.includes('productivity')
        ? 'tips'
        : lowerMessage.includes('summary') || lowerMessage.includes('progress')
          ? 'summary'
          : 'chat';

  saveAiInsights({
    lastAction,
    latestResponse: responseText,
    latestTips
  });
}

// Send message on Enter key or button click
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    sendMessage();
  }
});

sendBtn.addEventListener('click', () => {
  if (chatInput.value.trim()) {
    sendMessage();
  }
});

function sendMessage() {
  const userMessage = chatInput.value.trim();
  
  // Add user message
  addMessage(userMessage, 'user');
  
  // Clear input
  chatInput.value = '';
  chatInput.focus();
  
  // Simulate AI thinking delay
  setTimeout(() => {
    const aiResponse = generateAIResponse(userMessage);
    addMessage(aiResponse, 'ai');
    cacheAiResponse(userMessage, aiResponse);
  }, 500 + Math.random() * 1000); // 500-1500ms delay for realistic feel
}

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  if (sender === 'user') {
    messageDiv.innerHTML = `
      <div class="message-content">
        <p>${escapeHtml(text)}</p>
      </div>
      <div class="message-avatar">👤</div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="message-avatar">✨</div>
      <div class="message-content">
        <p>${text.replace(/\n/g, '<br>')}</p>
      </div>
    `;
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateAIResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for keywords
  if (lowerMessage.includes('analyze') || lowerMessage.includes('analysis')) {
    return aiResponses.analyze;
  } else if (lowerMessage.includes('schedule') || lowerMessage.includes('optimize')) {
    return aiResponses.schedule;
  } else if (lowerMessage.includes('tip') || lowerMessage.includes('productivity')) {
    return aiResponses.tips;
  } else if (lowerMessage.includes('summary') || lowerMessage.includes('progress')) {
    return aiResponses.summary;
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return aiResponses.greeting;
  } else {
    return aiResponses.default;
  }
}

// Quick action buttons
quickActionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.getAttribute('data-action');
    const actionText = {
      analyze: 'Can you analyze my tasks?',
      schedule: 'Can you optimize my schedule?',
      tips: 'What are some productivity tips?',
      summary: 'Give me a daily summary'
    }[action];
    
    if (actionText) {
      chatInput.value = actionText;
      chatInput.focus();
      sendMessage();
    }
  });
});

// Clear chat history
clearChatBtn.addEventListener('click', () => {
  if (confirm('Clear all chat messages? This cannot be undone.')) {
    chatMessages.innerHTML = `
      <div class="message ai-message">
        <div class="message-avatar">✨</div>
        <div class="message-content">
          <p>Chat cleared! 🧹 How can I help you get more productive today?</p>
        </div>
      </div>
    `;
  }
});

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize - set initial message
function initializeChat() {
  // Chat is ready!
  console.log('AI Assistant loaded successfully');

  const suggestionItems = document.querySelectorAll('#suggestionsList .suggestion-item p');
  const suggestions = Array.from(suggestionItems)
    .map(item => item.textContent.trim())
    .filter(Boolean);

  saveAiInsights({
    suggestions,
    baseTips: extractTips(aiResponses.tips),
    latestResponse: aiResponses.greeting
  });
}

initializeChat();

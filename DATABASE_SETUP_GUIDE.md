# Database Setup Guide for FlowTrack

## Current Implementation
Your app uses **localStorage** - data is stored in the browser's local storage.

---

## Option 1: Firebase Firestore (Recommended for Beginners) ⭐

### Pros:
- ✅ No backend server needed
- ✅ Free tier (12.5M read ops/month)
- ✅ Real-time updates
- ✅ Easy setup
- ✅ Automatic authentication

### Setup Instructions:

1. **Go to Firebase Console:** https://firebase.google.com/
2. **Create a New Project:**
   - Click "Create a project"
   - Enter project name (e.g., "flowtrack-app")
   - Click "Create project"

3. **Enable Firestore:**
   - Go to "Build" → "Firestore Database"
   - Click "Create database"
   - Select region (us-central1)
   - Start in "Test mode" (for development)
   - Click "Create"

4. **Get Your Config:**
   - Go to "Project Settings" (gear icon)
   - Scroll to "Your apps"
   - Click "</>" (Web app)
   - Copy the firebaseConfig object

5. **Update firebase-config.js:**
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY_HERE",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID_HERE",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID_HERE",
     appId: "YOUR_APP_ID_HERE"
   };
   ```

6. **Use in calendar.js:**
   ```javascript
   import { taskDB } from './firebase-config.js';
   
   // Replace loadTasks() with:
   async loadTasks() {
     return await taskDB.getTasks();
   }
   
   // Replace saveTasks() with:
   async saveTasks() {
     for (let task of this.tasks) {
       await taskDB.updateTask(task.id, task);
     }
   }
   ```

---

## Option 2: Node.js + MongoDB (Full Backend)

### Pros:
- ✅ Complete control
- ✅ Scalable
- ✅ Professional setup
- ❌ Requires backend server

### Setup:
1. Install Node.js: https://nodejs.org/
2. Create backend with Express.js
3. Use MongoDB Atlas (cloud DB): https://www.mongodb.com/atlas
4. Create REST API endpoints

### Example Backend (server.js):
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://username:password@cluster.mongodb.net/flowtrack');

// Task Schema
const taskSchema = new mongoose.Schema({
  title: String,
  priority: String,
  date: String,
  status: String,
  time: String,
  deadline: String,
  reminder: String,
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// API Routes
app.get('/tasks', async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.post('/tasks', async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

app.put('/tasks/:id', async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

app.delete('/tasks/:id', async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Task deleted' });
});

app.listen(5000, () => console.log('Server running on port 5000'));
```

---

## Option 3: Supabase (Firebase Alternative)

### Pros:
- ✅ Open-source Firebase alternative
- ✅ PostgreSQL database
- ✅ Free tier
- ✅ Good documentation

### Setup:
1. Go to https://supabase.com/
2. Create account and project
3. Get API keys from Project Settings
4. Use SQL queries or REST API

---

## Option 4: Simple JSON Backend (Node.js + JSON file)

### Pros:
- ✅ Simple to set up
- ✅ No database needed
- ❌ Not scalable for many users

### Setup:
```bash
npm init -y
npm install express cors
```

Then create simple API to read/write JSON file.

---

## Migration Path (Recommended)

1. **Start with:** localStorage (current) ✓
2. **Move to:** Firebase Firestore (easiest)
3. **Scale to:** Node.js + MongoDB (if needed later)

---

## Quick Firebase Integration

Update your calendar.js to use Firebase:

```javascript
import { taskDB } from './firebase-config.js';

class TaskCalendar {
  constructor() {
    this.currentDate = new Date();
    this.tasks = [];
    this.init();
  }

  async init() {
    this.tasks = await taskDB.getTasks();
    this.setupEventListeners();
    this.renderCalendar();
  }

  async addTask(task) {
    const newTask = await taskDB.addTask(task);
    this.tasks.push(newTask);
    this.saveTasks();
  }

  async deleteTask(id) {
    await taskDB.deleteTask(id);
    this.tasks = this.tasks.filter(t => t.id !== id);
  }

  async saveTasks() {
    // Auto-syncs with Firebase
    for (let task of this.tasks) {
      await taskDB.updateTask(task.id, task);
    }
  }
}
```

---

## Questions?

- **Just want quick storage?** → Use Firebase
- **Building professional app?** → Use Node.js + MongoDB
- **Want open-source?** → Use Supabase
- **Want offline first?** → Keep localStorage + sync with Firebase

Choose based on your needs! 🚀

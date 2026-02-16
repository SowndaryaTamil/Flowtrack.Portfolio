// Firebase Configuration
// Replace with your Firebase project credentials from https://firebase.google.com

// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// Your Firebase config (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCWxftzDoU_PYAhdodY-byG8qlJwppjSx0",
  authDomain: "flow-track-ab682.firebaseapp.com",
  projectId: "flow-track-ab682",
  storageBucket: "flow-track-ab682.firebasestorage.app",
  messagingSenderId: "409225909877",
  appId: "1:409225909877:web:fb3c91578afae664bd4a3c",
  measurementId: "G-THNJPMEDLC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Anonymous authentication (for demo)
signInAnonymously(auth)
  .then(() => {
    console.log("✅ Authenticated with Firebase");
  })
  .catch((error) => {
    console.error("❌ Authentication failed:", error);
  });

// Task Database Functions
export const taskDB = {
  // Get all tasks
  async getTasks() {
    try {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const tasks = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      return tasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  },

  // Add a new task
  async addTask(task) {
    try {
      const docRef = await addDoc(collection(db, "tasks"), {
        ...task,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { id: docRef.id, ...task };
    } catch (error) {
      console.error("Error adding task:", error);
      return null;
    }
  },

  // Update a task
  async updateTask(taskId, updates) {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error("Error updating task:", error);
      return false;
    }
  },

  // Delete a task
  async deleteTask(taskId) {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      return false;
    }
  }
};

export { db, auth };

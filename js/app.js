// Main application entry point
import { TodoManager } from './todo-manager.js';
import { NotesManager } from './notes-manager.js';
import { CoopManager } from './coop-manager.js';
import { UIManager } from './ui-manager.js';
import { ErrorHandler } from './error-handler.js';

class TodoApp {
  constructor() {
    this.errorHandler = new ErrorHandler();
    this.todoManager = new TodoManager();
    this.notesManager = new NotesManager();
    this.uiManager = new UIManager(this.todoManager, this.notesManager, null); // Initialize UIManager without coopManager initially
    this.coopManager = new CoopManager(this.todoManager, this.notesManager, this.uiManager, this.errorHandler);
    this.uiManager.coopManager = this.coopManager; // Assign coopManager to UIManager after it's created
    
    this.init();
  }
  
  init() {
    try {
      // Initialize the application
      this.uiManager.initUI();
      this.uiManager.hideModal(); // Ensure modal is hidden on load
      this.loadData();
    } catch (error) {
      this.errorHandler.handleError('app initialization', error);
    }
  }
  
  loadData() {
    // Load data from storage
    chrome.storage.local.get(['singleTodos', 'singleNotes', 'coopTodos', 'coopNotes', 'lastMode', 'userName', 'roomId'], (result) => {
      try {
        this.todoManager.loadTodos(result.singleTodos || [], result.coopTodos || []);
        this.notesManager.loadNotes(result.singleNotes || '', result.coopNotes || '');
        
        // Set initial mode based on lastMode, default to single
        this.uiManager.setMode(result.lastMode || 'single');
        
        // Always attempt to reconnect if room data exists, regardless of lastMode
        if (result.roomId && result.userName) {
          this.coopManager.roomId = result.roomId; // Set roomId for reconnection
          this.coopManager.userName = result.userName; // Set userName for reconnection
          this.coopManager.reconnect();
        }
        
        this.uiManager.render();
      } catch (error) {
        this.errorHandler.handleError('data loading', error);
      }
    });
  }
}

// Initialize the app when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TodoApp();
});

// Handle extension closing
window.addEventListener('unload', () => {
  if (window.app && window.app.coopManager) {
    window.app.coopManager.cleanup();
  }
});
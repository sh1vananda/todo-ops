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
    this.coopManager = new CoopManager();
    this.uiManager = new UIManager(this.todoManager, this.notesManager, this.coopManager);
    
    this.init();
  }
  
  init() {
    try {
      // Initialize the application
      this.uiManager.initUI();
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
        this.coopManager.loadCoopData(result.userName || '', result.roomId || null);
        
        // Set initial mode
        if (result.lastMode) {
          this.uiManager.setMode(result.lastMode);
        }
        
        // Reconnect to room if we were in one
        if (this.coopManager.roomId && this.uiManager.mode === 'coop') {
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
// Manages the UI interactions and rendering
export class UIManager {
  constructor(todoManager, notesManager, coopManager) {
    this.todoManager = todoManager;
    this.notesManager = notesManager;
    this.coopManager = coopManager;
    this.mode = 'single';
    this.currentTab = 'todos';
    this.coopTab = 'todos';
    
    // Bind methods to maintain 'this' context
    this.setMode = this.setMode.bind(this);
    this.setTab = this.setTab.bind(this);
    this.setCoopTab = this.setCoopTab.bind(this);
    this.handleTodoInput = this.handleTodoInput.bind(this);
    this.handleCoopTodoInput = this.handleCoopTodoInput.bind(this);
    this.handleNotesInput = this.handleNotesInput.bind(this);
    this.handleCoopNotesInput = this.handleCoopNotesInput.bind(this);
  }
  
  initUI() {
    this.bindEvents();
  }
  
  bindEvents() {
    // Mode toggle
    document.getElementById('singleMode').addEventListener('click', () => this.setMode('single'));
    document.getElementById('coopMode').addEventListener('click', () => this.setMode('coop'));

    // Single mode tab switching
    document.getElementById('todosTab').addEventListener('click', () => this.setTab('todos'));
    document.getElementById('notesTab').addEventListener('click', () => this.setTab('notes'));
    
    // Co-op mode tab switching
    document.getElementById('coopTodosTab').addEventListener('click', () => this.setCoopTab('todos'));
    document.getElementById('coopNotesTab').addEventListener('click', () => this.setCoopTab('notes'));

    // Single mode todo functionality
    document.getElementById('addTodo').addEventListener('click', this.handleTodoInput);
    document.getElementById('todoInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleTodoInput();
    });

    // Co-op mode todo functionality
    document.getElementById('coopAddTodo').addEventListener('click', this.handleCoopTodoInput);
    document.getElementById('coopTodoInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleCoopTodoInput();
    });

    // Notes functionality
    document.getElementById('notesArea').addEventListener('input', this.handleNotesInput);
    
    // Co-op notes functionality
    document.getElementById('coopNotesArea').addEventListener('input', this.handleCoopNotesInput);

    // Co-op functionality
    document.getElementById('joinRoom').addEventListener('click', () => this.coopManager.joinRoom());
    document.getElementById('createRoom').addEventListener('click', () => this.coopManager.createRoom());
    document.getElementById('exitRoom').addEventListener('click', () => this.coopManager.exitRoom());
    
    // Members dropdown
    const membersBtn = document.getElementById('membersBtn');
    if (membersBtn) {
      membersBtn.addEventListener('click', () => {
        document.getElementById('membersDropdown').classList.toggle('show');
      });
    }
    
    // Close dropdown when clicking outside
    window.addEventListener('click', (event) => {
      if (!event.target.matches('.members-btn')) {
        const dropdowns = document.getElementsByClassName('members-content');
        for (let i = 0; i < dropdowns.length; i++) {
          const openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    });
    
    // Add keyboard accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close members dropdown if open
        const membersDropdown = document.getElementById('membersDropdown');
        if (membersDropdown && membersDropdown.classList.contains('show')) {
          membersDropdown.classList.remove('show');
        }
        // Also hide the custom modal if open
        this.hideModal();
      }
    });

    // Modal event listeners
    document.querySelector('#customModal .close-button').addEventListener('click', () => this.hideModal());
    document.getElementById('modalConfirmBtn').addEventListener('click', () => this.handleModalConfirm());
    document.getElementById('modalCancelBtn').addEventListener('click', () => this.handleModalCancel());
  }
  
  // New method to show the custom modal
  showModal(title, message, inputs = [], showCancel = false) {
    console.log('showModal called', { title, message, inputs, showCancel });
    return new Promise(resolve => {
      this.currentModalResolve = resolve; // Store the resolve function
      const modal = document.getElementById('customModal');
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalMessage').textContent = message;
      
      const modalInputsContainer = document.getElementById('modalInputsContainer');
      modalInputsContainer.innerHTML = ''; // Clear previous inputs

      inputs.forEach(inputConfig => {
        const input = document.createElement('input');
        input.type = inputConfig.type || 'text';
        input.id = inputConfig.id;
        input.placeholder = inputConfig.placeholder || '';
        input.value = inputConfig.value || '';
        input.classList.add('modal-input');
        modalInputsContainer.appendChild(input);
      });

      document.getElementById('modalCancelBtn').style.display = showCancel ? 'inline-block' : 'none';

      modal.style.display = 'flex'; // Use flex to center content
    });
  }

  // New method to hide the custom modal
  hideModal() {
    console.log('hideModal called');
    document.getElementById('customModal').style.display = 'none';
    this.currentModalResolve = null; // Clear the resolve function
  }

  handleModalConfirm() {
    if (this.currentModalResolve) {
      const inputs = document.querySelectorAll('#modalInputsContainer .modal-input');
      const result = {};
      inputs.forEach(input => {
        result[input.id] = input.value;
      });
      this.currentModalResolve(result);
      this.hideModal();
    }
  }

  handleModalCancel() {
    if (this.currentModalResolve) {
      this.currentModalResolve(null);
      this.hideModal();
    }
  }
  
  setMode(mode) {
    if (this.mode === mode) return;
    
    this.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(mode + 'Mode').classList.add('active');

    // Show/hide appropriate content
    if (mode === 'single') {
      document.getElementById('singleModeContent').classList.remove('hidden');
      document.getElementById('coopModeContent').classList.add('hidden');
    } else {
      document.getElementById('singleModeContent').classList.add('hidden');
      document.getElementById('coopModeContent').classList.remove('hidden');
    }

    this.saveMode();
  }

  showCoopConnected(roomId, roomName) {
    const coopNotConnected = document.getElementById('coopNotConnected');
    const coopConnected = document.getElementById('coopConnected');
    const currentRoomIdEl = document.getElementById('currentRoomId');

    if (coopNotConnected) coopNotConnected.classList.add('hidden');
    if (coopConnected) coopConnected.classList.remove('hidden');
    if (currentRoomIdEl) currentRoomIdEl.textContent = roomName || roomId; // Display room name or ID
  }

  showCoopNotConnected() {
    const coopNotConnected = document.getElementById('coopNotConnected');
    const coopConnected = document.getElementById('coopConnected');
    const currentRoomIdEl = document.getElementById('currentRoomId');

    if (coopNotConnected) coopNotConnected.classList.remove('hidden');
    if (coopConnected) coopConnected.classList.add('hidden');
    if (currentRoomIdEl) currentRoomIdEl.textContent = ''; // Clear room ID/name
  }

  updateRoomHeader(roomName, roomId) {
    const currentRoomIdEl = document.getElementById('currentRoomId');
    if (currentRoomIdEl) currentRoomIdEl.textContent = `${roomName} (ID: ${roomId})`;
  }

  updateMembersList(members) {
    const membersDropdown = document.getElementById('membersDropdown');
    const membersCountEl = document.getElementById('membersCount');

    if (!membersDropdown || !membersCountEl) return;

    membersDropdown.innerHTML = ''; // Clear previous members
    membersCountEl.textContent = members.length;

    members.forEach(member => {
      const memberItem = document.createElement('div');
      memberItem.className = 'member-item';
      memberItem.innerHTML = `
        <div class="member-status active"></div>
        <div class="member-name">${member.user || 'Anonymous'}</div>
      `;
      membersDropdown.appendChild(memberItem);
    });
  }
  
  setTab(tab) {
    this.currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('#singleModeContent .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');

    // Hide all sections first
    document.getElementById('todosSection').classList.remove('active');
    document.getElementById('notesSection').classList.remove('active');
    
    // Show only the selected section
    document.getElementById(tab + 'Section').classList.add('active');
  }
  
  setCoopTab(tab) {
    this.coopTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('#coopModeContent .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('coop' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab').classList.add('active');

    // Only affect sections inside the connected panel
    const connectedPanel = document.getElementById('coopConnected');
    
    // Hide all sections first
    connectedPanel.querySelector('#coopTodosSection').classList.remove('active');
    connectedPanel.querySelector('#coopNotesSection').classList.remove('active');
    
    // Show only the selected section
    connectedPanel.querySelector('#coop' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Section').classList.add('active');
  }
  
  handleTodoInput() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    if (!text) return;
    
    this.todoManager.addSingleTodo(text);
    input.value = '';
    this.renderSingleTodos();
  }
  
  handleCoopTodoInput() {
    const input = document.getElementById('coopTodoInput');
    const text = input.value.trim();
    if (!text) return;
    
    this.todoManager.addCoopTodo(text, this.coopManager.userName);
    input.value = '';
    this.renderCoopTodos();
    
    if (this.coopManager.roomRef) {
      this.coopManager.updateRoom();
    }
  }
  
  handleNotesInput(e) {
    this.notesManager.updateSingleNotes(e.target.value);
  }
  
  handleCoopNotesInput(e) {
    this.notesManager.updateCoopNotes(e.target.value);
    
    if (this.coopManager.roomRef) {
      // Debounce the sync for notes to avoid too many requests
      clearTimeout(this.notesTimeout);
      this.notesTimeout = setTimeout(() => {
        // Force update to Firebase immediately
        this.coopManager.updateRoom();
      }, 300); // Reduced debounce time for more responsive updates
    }
  }
  
  renderSingleTodos() {
    const activeTodoList = document.getElementById('activeTodoList');
    const completedTodoList = document.getElementById('completedTodoList');
    
    activeTodoList.innerHTML = '';
    completedTodoList.innerHTML = '';

    // Get todos
    const todos = this.todoManager.getSingleTodos();

    // Render active todos
    if (todos.active.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'todo-item empty';
      emptyItem.textContent = 'No active todos';
      activeTodoList.appendChild(emptyItem);
    } else {
      todos.active.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `
          <input type="checkbox" class="todo-checkbox" id="single-todo-${todo.id}">
          <span class="todo-text">${todo.text}</span>
          <button class="todo-delete" data-id="${todo.id}">×</button>
        `;
        activeTodoList.appendChild(li);
        
        // Add event listeners
        li.querySelector('.todo-checkbox').addEventListener('change', () => {
          this.todoManager.toggleSingleTodo(parseInt(todo.id));
          this.renderSingleTodos();
        });
        li.querySelector('.todo-delete').addEventListener('click', (e) => {
          this.todoManager.deleteSingleTodo(parseInt(e.target.dataset.id));
          this.renderSingleTodos();
        });
      });
    }

    // Render completed todos
    if (todos.completed.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'todo-item empty';
      emptyItem.textContent = 'No completed todos';
      completedTodoList.appendChild(emptyItem);
    } else {
      todos.completed.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `
          <input type="checkbox" class="todo-checkbox" id="single-todo-${todo.id}" checked>
          <span class="todo-text completed">${todo.text}</span>
          <button class="todo-delete" data-id="${todo.id}">×</button>
        `;
        completedTodoList.appendChild(li);
        
        // Add event listeners
        li.querySelector('.todo-checkbox').addEventListener('change', () => {
          this.todoManager.toggleSingleTodo(parseInt(todo.id));
          this.renderSingleTodos();
        });
        li.querySelector('.todo-delete').addEventListener('click', (e) => {
          this.todoManager.deleteSingleTodo(parseInt(e.target.dataset.id));
          this.renderSingleTodos();
        });
      });
    }
  }
  
  renderCoopTodos() {
    const activeTodoList = document.getElementById('coopActiveTodoList');
    const completedTodoList = document.getElementById('coopCompletedTodoList');
    
    activeTodoList.innerHTML = '';
    completedTodoList.innerHTML = '';

    // Get todos
    const todos = this.todoManager.getCoopTodos();

    // Render active todos
    if (todos.active.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'todo-item empty';
      emptyItem.textContent = 'No active todos';
      activeTodoList.appendChild(emptyItem);
    } else {
      todos.active.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        
        // Creator name display
        const creatorDisplay = todo.creator ? 
          `<span class="creator-name">${todo.creator}</span>` : '';
        
        li.innerHTML = `
          <input type="checkbox" class="todo-checkbox" id="coop-todo-${todo.id}">
          <span class="todo-text">${todo.text}${creatorDisplay}</span>
          <button class="todo-delete" data-id="${todo.id}">×</button>
        `;
        activeTodoList.appendChild(li);
        
        // Add event listeners
        li.querySelector('.todo-checkbox').addEventListener('change', () => {
          this.todoManager.toggleCoopTodo(parseInt(todo.id));
          this.renderCoopTodos();
          if (this.coopManager.roomRef) {
            this.coopManager.updateRoom();
          }
        });
        li.querySelector('.todo-delete').addEventListener('click', (e) => {
          this.todoManager.deleteCoopTodo(parseInt(e.target.dataset.id));
          this.renderCoopTodos();
          if (this.coopManager.roomRef) {
            this.coopManager.updateRoom();
          }
        });
      });
    }

    // Render completed todos
    if (todos.completed.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'todo-item empty';
      emptyItem.textContent = 'No completed todos';
      completedTodoList.appendChild(emptyItem);
    } else {
      todos.completed.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        
        // Creator name display
        const creatorDisplay = todo.creator ? 
          `<span class="creator-name">${todo.creator}</span>` : '';
        
        li.innerHTML = `
          <input type="checkbox" class="todo-checkbox" id="coop-todo-${todo.id}" checked>
          <span class="todo-text completed">${todo.text}${creatorDisplay}</span>
          <button class="todo-delete" data-id="${todo.id}">×</button>
        `;
        completedTodoList.appendChild(li);
        
        // Add event listeners
        li.querySelector('.todo-checkbox').addEventListener('change', () => {
          this.todoManager.toggleCoopTodo(parseInt(todo.id));
          this.renderCoopTodos();
          if (this.coopManager.roomRef) {
            this.coopManager.updateRoom();
          }
        });
        li.querySelector('.todo-delete').addEventListener('click', (e) => {
          this.todoManager.deleteCoopTodo(parseInt(e.target.dataset.id));
          this.renderCoopTodos();
          if (this.coopManager.roomRef) {
            this.coopManager.updateRoom();
          }
        });
      });
    }
  }
  
  renderSingleContent() {
    this.renderSingleTodos();
    document.getElementById('notesArea').value = this.notesManager.getSingleNotes();
  }
  
  renderCoopContent() {
    this.renderCoopTodos();
    
    // Only update the notes textarea if it's not currently being edited
    const notesArea = document.getElementById('coopNotesArea');
    if (notesArea && document.activeElement !== notesArea) {
      notesArea.value = this.notesManager.getCoopNotes();
    }
  }
  
  render() {
    this.renderSingleContent();
    this.renderCoopContent();
    
    // Make sure the correct tab is active
    this.setTab(this.currentTab);
    if (document.getElementById('coopConnected') && !document.getElementById('coopConnected').classList.contains('hidden')) {
      this.setCoopTab(this.coopTab);
    }
  }
  
  saveMode() {
    chrome.storage.local.set({
      lastMode: this.mode
    });
  }
}
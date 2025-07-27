// Manages cooperative mode functionality
export class CoopManager {
  constructor(todoManager, notesManager, uiManager, errorHandler) {
    this.todoManager = todoManager;
    this.notesManager = notesManager;
    this.uiManager = uiManager;
    this.errorHandler = errorHandler;
  }

  async createRoom() {
    try {
      const roomDataInputs = await this.uiManager.showModal(
        'Create Room',
        'Enter details for your new room:',
        [
          { id: 'userName', placeholder: 'Your Name', type: 'text' },
          { id: 'roomName', placeholder: 'Room Name', type: 'text' }
        ],
        true
      );

      if (!roomDataInputs) return; // User cancelled

      const { userName, roomName } = roomDataInputs;

      if (!userName) {
        this.uiManager.showModal('Error', 'Name cannot be empty.');
        return;
      }
      this.userName = userName;

      if (!roomName) {
        this.uiManager.showModal('Error', 'Room name cannot be empty.');
        return;
      }

      const roomId = Math.random().toString(36).substring(2, 8);

      const roomData = {
        name: roomName,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        todos: [],
        notes: ''
      };

      await firebase.database().ref(`rooms/${roomId}`).set(roomData);
      this.roomId = roomId;
      this.saveData();
      this.uiManager.showCoopConnected(this.roomId, roomName); // Pass roomName
      this.connect();
      this.uiManager.showModal('Room Created', `Room "${roomName}" created with ID: ${roomId}`);

    } catch (error) {
      console.error('Error creating room:', error);
      this.uiManager.showModal('Error', 'Error creating room. Please try again.');
    }
  }
  
  async joinRoom() {
    try {
      const roomDataInputs = await this.uiManager.showModal(
        'Join Room',
        'Enter room details:',
        [
          { id: 'userName', placeholder: 'Your Name', type: 'text' },
          { id: 'roomId', placeholder: 'Room ID', type: 'text' }
        ],
        true
      );

      if (!roomDataInputs) return false; // User cancelled

      const { userName, roomId } = roomDataInputs;

      if (!userName) {
        this.uiManager.showModal('Error', 'Name cannot be empty.');
        return false;
      }
      this.userName = userName;

      if (!roomId) {
        this.uiManager.showModal('Error', 'Please enter a room ID.');
        return false;
      }

      const roomRef = firebase.database().ref(`rooms/${roomId}`);
      const snapshot = await roomRef.once('value');

      if (!snapshot.exists()) {
        this.uiManager.showModal('Room Not Found', `Room "${roomId}" does not exist.`);
        return false;
      } else {
        const roomData = snapshot.val();
        // No password validation
      }
      
      this.roomId = roomId;
      this.saveData();
      
      // Show connected UI
      const roomData = snapshot.val(); // Re-get roomData after password check
      this.uiManager.showCoopConnected(this.roomId, roomData.name); // Pass roomName
      
      this.connect();
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      this.uiManager.showModal('Error', 'Error joining room. Please try again.');
      return false;
    }
  }
  
  // Removed reconnect() method

  async exitRoom() {
    try {
      if (this.roomRef && this.userName) {
        // Remove current user's presence immediately
        await this.roomRef.child('presence').child(this.userName).remove();
        console.log('CoopManager: Current user presence removed.');

        // After removing current user, check if room is empty
        const snapshot = await this.roomRef.child('presence').once('value');
        const remainingMembers = snapshot.val();
        if (!remainingMembers || Object.keys(remainingMembers).length === 0) {
          console.log('CoopManager: No remaining members, deleting room.');
          await this.roomRef.remove();
          console.log('CoopManager: Room deleted successfully on last exit.');
        }
      }

      // Now disconnect and clear local data
      this.disconnect();
      this.roomRef = null; // Nullify roomRef after all async operations
      this.roomId = null;
      this.userName = '';
      this.saveData(); // Clear saved room data
      
      // Show not connected UI
      document.getElementById('coopNotConnected').classList.remove('hidden');
      document.getElementById('coopConnected').classList.add('hidden');
    } catch (error) {
      this.errorHandler.handleError('Error exiting room', error);
    }
  }
  
  connect() {
    console.log('CoopManager: Attempting to connect to room:', this.roomId);
    this.updateConnectionStatus('Connecting...', false);
    
    try {
      this.roomRef = firebase.database().ref(`rooms/${this.roomId}`);
      
      this.roomRef.on('value', (snapshot) => {
        try {
          const roomData = snapshot.val() || {};
          console.log('CoopManager: Received room data update:', roomData);
          
          if (roomData.notes !== undefined) { // Check if notes exist in roomData
            this.notesManager.coopNotes = roomData.notes;
            const notesArea = document.getElementById('coopNotesArea');
            if (notesArea && document.activeElement !== notesArea) {
              notesArea.value = roomData.notes;
            }
          }
          
          if (!this.lastUpdate || (roomData.lastUpdate && roomData.lastUpdate > this.lastUpdate)) {
            if (roomData.todos) {
              this.todoManager.coopTodos = roomData.todos;
              this.todoManager.saveData();
              this.uiManager.renderCoopTodos();
            }
            this.lastUpdate = roomData.lastUpdate || Date.now();
          }
          
          this.updateConnectionStatus('Connected', true);
          if (roomData.name) {
            this.uiManager.updateRoomHeader(roomData.name, this.roomId);
          }
        } catch (error) {
          this.errorHandler.handleError('processing room data', error);
        }
      });
      
      this.roomRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
          console.log('CoopManager: Room does not exist, updating with initial data.');
          this.updateRoom();
        }
      });
      
      // Simplified connection status and removed presence/cleanup for now
      const connectedRef = firebase.database().ref('.info/connected');
      connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
          this.updateConnectionStatus('Connected', true);
          // Setup presence
          this.presenceRef = this.roomRef.child('presence').child(this.userName);
          this.presenceRef.set({ user: this.userName, status: 'active' });
          this.setupMembersDropdown();
        } else {
          this.updateConnectionStatus('Disconnected', false);
        }
      });

    } catch (error) {
      this.errorHandler.handleError('connection setup', error);
    }
  }
  
  disconnect() {
    try {
      if (this.roomRef) {
        this.roomRef.off(); // Detach all listeners
      }
      if (this.presenceRef) {
        this.presenceRef.remove(); // Remove presence immediately on manual disconnect
        this.presenceRef = null;
      }
      this.updateConnectionStatus('Disconnected', false);
    } catch (error) {
      this.errorHandler.handleError('disconnect', error);
    }
  }
  
  updateRoom() {
    if (!this.roomId || !this.roomRef) return;
    
    try {
      this.lastUpdate = Date.now();
      
      const notes = this.notesManager.getCoopNotes();
      
      const roomData = {
        todos: this.todoManager.coopTodos,
        notes: notes,
        lastUpdate: this.lastUpdate
      };
      
      this.roomRef.update(roomData)
        .then(() => console.log('CoopManager: Room data updated successfully'))
        .catch(err => this.errorHandler.handleError('update room', err));
    } catch (error) {
      this.errorHandler.handleError('sync error', error);
    }
  }
  
  updateConnectionStatus(status, connected) {
    try {
      const statusEl = document.getElementById('connectionStatus');
      if (statusEl) {
        statusEl.textContent = status;
        statusEl.className = connected ? 'status-connected' : 'status-disconnected';
      }
    } catch (error) {
      this.errorHandler.handleError('updating connection status', error);
    }
  }
  
  setupMembersDropdown() {
    if (this.roomRef) {
      this.roomRef.child('presence').on('value', (snapshot) => {
        const members = snapshot.val() || {};
        const memberList = Object.values(members);
        this.uiManager.updateMembersList(memberList);
      });
    }
  }
  
  saveData() {
    try {
      chrome.storage.local.set({
        userName: this.userName,
        roomId: this.roomId
      });
    } catch (error) {
      this.errorHandler.handleError('saving coop data', error);
    }
  }
  
  cleanup() {
    // Simplified cleanup: just disconnect
    this.disconnect();
  }

  async reconnect() {
    if (this.roomId && this.userName) {
      console.log('CoopManager: Attempting to reconnect to room:', this.roomId);
      try {
        const roomRef = firebase.database().ref(`rooms/${this.roomId}`);
        const snapshot = await roomRef.once('value');

        if (snapshot.exists()) {
          const roomData = snapshot.val();
          this.uiManager.showCoopConnected(this.roomId, roomData.name);
          this.connect();
          this.uiManager.setMode('coop');
          console.log('CoopManager: Reconnected to room:', this.roomId);
        } else {
          console.log('CoopManager: Room does not exist, cannot reconnect.');
          this.roomId = null;
          this.saveData();
          this.uiManager.showCoopNotConnected();
          this.uiManager.setMode('single');
        }
      } catch (error) {
        this.errorHandler.handleError('reconnect', error);
        this.roomId = null;
        this.saveData();
        this.uiManager.showCoopNotConnected();
        this.uiManager.setMode('single');
      }
    }
  }
}
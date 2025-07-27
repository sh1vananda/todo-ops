// Manages cooperative mode functionality
export class CoopManager {
  constructor() {
    this.roomRef = null;
    this.roomId = null;
    this.lastUpdate = 0;
    this.presenceRef = null;
    this.userName = '';
    this.roomCleanupRef = null;
    
    // Bind methods to maintain 'this' context
    this.updateConnectionStatus = this.updateConnectionStatus.bind(this);
    this.setupMembersDropdown = this.setupMembersDropdown.bind(this);
  }
  
  loadCoopData(userName, roomId) {
    this.userName = userName;
    this.roomId = roomId;
    
    // Set user name in input if available
    if (this.userName) {
      document.getElementById('userName').value = this.userName;
    }
  }
  
  createRoom() {
    try {
      // Generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 8);
      document.getElementById('roomInput').value = roomId;
      this.joinRoom();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }
  
  joinRoom() {
    try {
      const roomInput = document.getElementById('roomInput');
      const userNameInput = document.getElementById('userName');
      const roomId = roomInput.value.trim();
      const userName = userNameInput.value.trim();
      
      if (!roomId) {
        alert('Please enter a room ID');
        return false;
      }
      
      if (!userName) {
        alert('Please enter your name');
        return false;
      }
      
      this.roomId = roomId;
      this.userName = userName;
      this.saveData();
      
      // Show connected UI
      document.getElementById('coopNotConnected').classList.add('hidden');
      document.getElementById('coopConnected').classList.remove('hidden');
      document.getElementById('currentRoomId').textContent = roomId;
      
      this.connect();
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      return false;
    }
  }
  
  reconnect() {
    try {
      // Show connected UI
      document.getElementById('coopNotConnected').classList.add('hidden');
      document.getElementById('coopConnected').classList.remove('hidden');
      document.getElementById('currentRoomId').textContent = this.roomId;
      
      this.connect();
    } catch (error) {
      console.error('Error reconnecting:', error);
    }
  }
  
  exitRoom() {
    try {
      this.disconnect();
      
      // Show not connected UI
      document.getElementById('coopNotConnected').classList.remove('hidden');
      document.getElementById('coopConnected').classList.add('hidden');
    } catch (error) {
      console.error('Error exiting room:', error);
    }
  }
  
  connect() {
    // Use Firebase Realtime Database for seamless collaboration
    this.updateConnectionStatus('Connecting...', false);
    
    try {
      // Get a reference to the room in Firebase
      this.roomRef = firebase.database().ref(`rooms/${this.roomId}`);
      
      // Listen for changes to the room data
      this.roomRef.on('value', (snapshot) => {
        try {
          const roomData = snapshot.val() || {};
          
          // Always update notes to ensure real-time sync
          if (roomData.notes) {
            // Only update if the notes are different to avoid cursor jumping
            const currentNotes = window.app.notesManager.getCoopNotes();
            if (roomData.notes !== currentNotes) {
              window.app.notesManager.coopNotes = roomData.notes;
              
              // Update the textarea if it's not currently focused
              const notesArea = document.getElementById('coopNotesArea');
              if (notesArea && document.activeElement !== notesArea) {
                notesArea.value = roomData.notes;
              }
              
              window.app.notesManager.saveData();
            }
          }
          
          // For todos, only update if the data is newer or this is the initial sync
          if (!this.lastUpdate || (roomData.lastUpdate && roomData.lastUpdate > this.lastUpdate)) {
            if (roomData.todos) {
              window.app.todoManager.coopTodos = roomData.todos;
              window.app.todoManager.saveData();
              window.app.uiManager.renderCoopTodos();
            }
            
            this.lastUpdate = roomData.lastUpdate || Date.now();
          }
          
          this.updateConnectionStatus('Connected', true);
        } catch (error) {
          console.error('Error processing room data:', error);
        }
      });
      
      // Set initial data if room is empty
      this.roomRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
          this.updateRoom();
        }
      });
      
      // Setup presence to detect when users leave
      const connectedRef = firebase.database().ref('.info/connected');
      connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
          // We're connected
          this.updateConnectionStatus('Connected', true);
          
          // Setup presence - use user name as key to avoid duplicates
          this.presenceRef = this.roomRef.child('presence').child(this.userName);
          
          // Remove presence completely when disconnected
          this.presenceRef.onDisconnect().remove();
          
          // Set presence data with user name
          this.presenceRef.set({
            user: this.userName,
            status: 'active',
            timestamp: firebase.database.ServerValue.TIMESTAMP
          });
          
          // Setup members dropdown
          this.setupMembersDropdown();
          
          // Setup room cleanup when last user leaves
          if (this.roomCleanupRef) {
            this.roomCleanupRef.off();
          }
          
          this.roomCleanupRef = this.roomRef.child('presence');
          this.roomCleanupRef.on('value', (presenceSnap) => {
            try {
              const presenceData = presenceSnap.val();
              
              // If no presence data, clean up the room
              if (!presenceData || Object.keys(presenceData).length === 0) {
                console.log('No users in room, cleaning up');
                setTimeout(() => {
                  if (this.roomRef) {
                    this.roomRef.remove()
                      .then(() => console.log('Room deleted successfully'))
                      .catch(err => console.error('Error deleting room:', err));
                  }
                }, 2000); // Give a bit of time for reconnections
              }
            } catch (error) {
              console.error('Error in presence handling:', error);
            }
          });
        } else {
          this.updateConnectionStatus('Connecting...', false);
        }
      });
    } catch (error) {
      console.error('Connection error:', error);
      this.updateConnectionStatus('Connection Error', false);
    }
  }
  
  disconnect() {
    try {
      if (!this.roomRef) {
        this.roomId = null;
        return;
      }
      
      // Remove our presence immediately
      if (this.presenceRef) {
        this.presenceRef.remove()
          .then(() => console.log('Presence removed'))
          .catch(err => console.error('Error removing presence:', err));
        this.presenceRef = null;
      }
      
      if (this.roomCleanupRef) {
        this.roomCleanupRef.off();
        this.roomCleanupRef = null;
      }
      
      // Detach all listeners
      this.roomRef.off();
      this.roomRef = null;
      this.roomId = null;
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }
  
  updateRoom() {
    if (!this.roomId || !this.roomRef) return;
    
    try {
      this.lastUpdate = Date.now();
      
      // Get the latest notes directly from the notes manager
      const notes = window.app.notesManager.getCoopNotes();
      
      const roomData = {
        todos: window.app.todoManager.coopTodos,
        notes: notes,
        lastUpdate: this.lastUpdate
      };
      
      // Use regular update for room data
      this.roomRef.update(roomData)
        .then(() => console.log('Room data updated successfully'))
        .catch(err => console.error('Error updating room data:', err));
    } catch (error) {
      console.error('Sync error:', error);
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
      console.error('Error updating connection status:', error);
    }
  }
  
  setupMembersDropdown() {
    try {
      // Listen for presence changes
      this.roomRef.child('presence').on('value', (snapshot) => {
        try {
          const presenceData = snapshot.val() || {};
          const membersDropdown = document.getElementById('membersDropdown');
          const membersCountEl = document.getElementById('membersCount');
          
          if (!membersDropdown || !membersCountEl) return;
          
          // Clear previous members
          membersDropdown.innerHTML = '';
          
          // Since we're using userName as key, each user will only have one entry
          const members = Object.values(presenceData);
          
          // Always ensure at least 1 member (the current user)
          const membersCount = Math.max(1, members.length);
          
          // Update members count
          membersCountEl.textContent = membersCount;
          
          // Add members to dropdown
          members.forEach(member => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';
            
            const statusClass = member.status === 'active' ? 'active' : 'away';
            
            memberItem.innerHTML = `
              <div class="member-status ${statusClass}"></div>
              <div class="member-name">${member.user || 'Anonymous'}</div>
            `;
            
            membersDropdown.appendChild(memberItem);
          });
        } catch (error) {
          console.error('Error updating members dropdown:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up members dropdown:', error);
    }
  }
  
  saveData() {
    try {
      chrome.storage.local.set({
        userName: this.userName,
        roomId: this.roomId
      });
    } catch (error) {
      console.error('Error saving coop data:', error);
    }
  }
  
  cleanup() {
    try {
      // Remove our presence when closing the extension
      if (this.presenceRef) {
        this.presenceRef.remove().catch(err => console.error('Error removing presence:', err));
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
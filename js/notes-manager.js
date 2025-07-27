// Manages notes for both single and coop modes
export class NotesManager {
  constructor() {
    this.singleNotes = '';
    this.coopNotes = '';
    this.lastNotesUpdate = 0;
  }
  
  loadNotes(singleNotes, coopNotes) {
    this.singleNotes = singleNotes;
    this.coopNotes = coopNotes;
  }
  
  updateSingleNotes(text) {
    this.singleNotes = text;
    this.saveData();
  }
  
  updateCoopNotes(text) {
    this.coopNotes = text;
    this.lastNotesUpdate = Date.now();
    this.saveData();
  }
  
  getSingleNotes() {
    return this.singleNotes;
  }
  
  getCoopNotes() {
    return this.coopNotes;
  }
  
  getLastNotesUpdate() {
    return this.lastNotesUpdate;
  }
  
  saveData() {
    chrome.storage.local.set({
      singleNotes: this.singleNotes,
      coopNotes: this.coopNotes
    });
  }
}
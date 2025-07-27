// Simple background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Todo Ops extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // The popup will handle the UI, no action needed here
});
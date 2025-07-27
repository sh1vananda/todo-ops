# Todo Ops

A collaborative todo and notes Chrome extension.

## Features

- Single-user mode for personal todos and notes
- Collaborative mode for real-time collaboration
- Real-time synchronization using Firebase
- Clean, modern UI

## Project Structure

The project follows a modular architecture:

### JavaScript Modules

- `js/app.js` - Main application entry point
- `js/todo-manager.js` - Manages todo items for both single and coop modes
- `js/notes-manager.js` - Manages notes for both single and coop modes
- `js/coop-manager.js` - Manages cooperative mode functionality
- `js/ui-manager.js` - Manages UI interactions and rendering

### CSS Modules

- `css/main.css` - Main styles for layout and common elements
- `css/todos.css` - Styles specific to todo functionality
- `css/notes.css` - Styles specific to notes functionality
- `css/coop.css` - Styles specific to cooperative mode

### HTML

- `popup.html` - The main extension popup

## Setup

1. Replace the Firebase configuration in `firebase-config.js` with your own Firebase project details
2. Load the extension in Chrome by going to `chrome://extensions/`, enabling Developer mode, and clicking "Load unpacked"
3. Select the directory containing this project

## Usage

- Toggle between Single and Co-op modes using the buttons at the top
- In Single mode, manage your personal todos and notes
- In Co-op mode, create or join a room to collaborate with others in real-time

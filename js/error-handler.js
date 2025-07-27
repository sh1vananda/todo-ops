// Error handling module
export class ErrorHandler {
  constructor() {
    this.setupGlobalErrorHandling();
  }
  
  setupGlobalErrorHandling() {
    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      this.logError('Uncaught error:', event.error);
      return false;
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled promise rejection:', event.reason);
      return false;
    });
  }
  
  logError(message, error) {
    console.error(`${message}`, error);
    
    // In a production app, you might want to send errors to a logging service
    // or display a user-friendly error message
  }
  
  handleError(context, error) {
    this.logError(`Error in ${context}:`, error);
    return false;
  }
}
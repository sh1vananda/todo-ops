// Manages todo items for both single and coop modes
export class TodoManager {
  constructor() {
    this.singleTodos = [];
    this.coopTodos = [];
  }
  
  loadTodos(singleTodos, coopTodos) {
    this.singleTodos = singleTodos;
    this.coopTodos = coopTodos;
  }
  
  addSingleTodo(text) {
    const todo = {
      id: Date.now(),
      text: text,
      completed: false
    };
    
    this.singleTodos.push(todo);
    this.saveData();
    return todo;
  }
  
  addCoopTodo(text, creator) {
    const todo = {
      id: Date.now(),
      text: text,
      completed: false,
      creator: creator
    };
    
    this.coopTodos.push(todo);
    this.saveData();
    return todo;
  }
  
  toggleSingleTodo(id) {
    const todo = this.singleTodos.find(t => t.id === parseInt(id));
    if (todo) {
      todo.completed = !todo.completed;
      this.saveData();
      return true;
    }
    return false;
  }
  
  toggleCoopTodo(id) {
    const todo = this.coopTodos.find(t => t.id === parseInt(id));
    if (todo) {
      todo.completed = !todo.completed;
      this.saveData();
      return true;
    }
    return false;
  }
  
  deleteSingleTodo(id) {
    this.singleTodos = this.singleTodos.filter(t => t.id !== parseInt(id));
    this.saveData();
  }
  
  deleteCoopTodo(id) {
    this.coopTodos = this.coopTodos.filter(t => t.id !== parseInt(id));
    this.saveData();
  }
  
  getSingleTodos() {
    return {
      active: this.singleTodos.filter(todo => !todo.completed),
      completed: this.singleTodos.filter(todo => todo.completed)
    };
  }
  
  getCoopTodos() {
    return {
      active: this.coopTodos.filter(todo => !todo.completed),
      completed: this.coopTodos.filter(todo => todo.completed)
    };
  }
  
  saveData() {
    chrome.storage.local.set({
      singleTodos: this.singleTodos,
      coopTodos: this.coopTodos
    });
  }
}
/**
 * Money Tracker Application
 * Plain JavaScript, LocalStorage persistence, No backend/server dependencies.
 */

// Storage Key
const STORAGE_KEY = 'money_tracker_expenses';

// Application State
let expenses = [];
let editingId = null;
let searchQuery = '';

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseIdInput = document.getElementById('expense-id');
const descInput = document.getElementById('expense-desc');
const amountInput = document.getElementById('expense-amount');
const dateInput = document.getElementById('expense-date');
const formTitle = document.getElementById('form-title');
const editingBadge = document.getElementById('editing-indicator');
const submitBtn = document.getElementById('submit-btn');
const submitBtnText = document.getElementById('submit-btn-text');
const cancelBtn = document.getElementById('cancel-btn');

const descError = document.getElementById('desc-error');
const amountError = document.getElementById('amount-error');
const dateError = document.getElementById('date-error');

const totalCountEl = document.getElementById('total-count');
const totalAmountEl = document.getElementById('total-amount');

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const exportBtn = document.getElementById('export-btn');
const sampleDataBtn = document.getElementById('sample-data-btn');
const expenseList = document.getElementById('expense-list');
const emptyState = document.getElementById('empty-state');
const noSearchState = document.getElementById('no-search-state');

// ==========================================================================
// Utility Helpers
// ==========================================================================

/**
 * Returns today's date in YYYY-MM-DD format (local timezone)
 */
function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a number into a currency string (e.g., $12.50)
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Formats a YYYY-MM-DD string into a clean readable date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }
  return dateStr;
}

// ==========================================================================
// LocalStorage Persistence
// ==========================================================================

function loadExpenses() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      expenses = JSON.parse(rawData);
      if (!Array.isArray(expenses)) {
        expenses = [];
      }
    } else {
      expenses = [];
    }
  } catch (err) {
    console.error('Failed to load expenses from localStorage:', err);
    expenses = [];
  }
}

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.error('Failed to save expenses to localStorage:', err);
    alert('Failed to save data. Your browser storage might be full or disabled.');
  }
}

// ==========================================================================
// Rendering Logic
// ==========================================================================

function render() {
  // 1. Update top summary metrics
  totalCountEl.textContent = expenses.length.toString();
  const sum = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  totalAmountEl.textContent = formatCurrency(sum);

  // 2. Filter expenses by search input
  const query = searchQuery.trim().toLowerCase();
  const filtered = expenses.filter(expense => {
    if (!query) return true;
    const descMatch = expense.description.toLowerCase().includes(query);
    const formattedDateMatch = formatDate(expense.date).toLowerCase().includes(query);
    const rawDateMatch = expense.date.toLowerCase().includes(query);
    const amountMatch = expense.amount.toString().includes(query) || 
                        formatCurrency(expense.amount).toLowerCase().includes(query);
    return descMatch || formattedDateMatch || rawDateMatch || amountMatch;
  });

  // 3. Handle Empty States & Export button visibility
  if (expenses.length === 0) {
    emptyState.classList.remove('hidden');
    noSearchState.classList.add('hidden');
    if (exportBtn) exportBtn.classList.add('hidden');
    expenseList.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');
  if (exportBtn) exportBtn.classList.remove('hidden');

  if (filtered.length === 0) {
    noSearchState.classList.remove('hidden');
    expenseList.innerHTML = '';
    return;
  }

  noSearchState.classList.add('hidden');

  // 4. Render Expense Items
  expenseList.innerHTML = '';
  filtered.forEach(expense => {
    const li = document.createElement('li');
    li.className = 'expense-item';
    if (editingId === expense.id) {
      li.classList.add('is-editing');
    }

    // Left info block (description & date)
    const infoDiv = document.createElement('div');
    infoDiv.className = 'expense-info';

    const descSpan = document.createElement('span');
    descSpan.className = 'expense-desc';
    descSpan.textContent = expense.description;

    const dateSpan = document.createElement('span');
    dateSpan.className = 'expense-date';
    dateSpan.textContent = formatDate(expense.date);

    infoDiv.appendChild(descSpan);
    infoDiv.appendChild(dateSpan);

    // Right meta block (amount & action buttons)
    const metaDiv = document.createElement('div');
    metaDiv.className = 'expense-meta';

    const amountSpan = document.createElement('span');
    amountSpan.className = 'expense-amount';
    amountSpan.textContent = formatCurrency(expense.amount);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'expense-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-action btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit ${expense.description}`);
    editBtn.addEventListener('click', () => startEditing(expense.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-action btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete ${expense.description}`);
    deleteBtn.addEventListener('click', () => deleteExpense(expense.id));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    metaDiv.appendChild(amountSpan);
    metaDiv.appendChild(actionsDiv);

    li.appendChild(infoDiv);
    li.appendChild(metaDiv);

    expenseList.appendChild(li);
  });
}

// ==========================================================================
// Form & Validation Handling
// ==========================================================================

function clearErrors() {
  descError.textContent = '';
  amountError.textContent = '';
  dateError.textContent = '';
  descInput.classList.remove('input-error');
  amountInput.classList.remove('input-error');
  dateInput.classList.remove('input-error');
}

function validateForm(desc, amount, date) {
  clearErrors();
  let isValid = true;

  if (!desc.trim()) {
    descError.textContent = 'Please enter what you spent on.';
    descInput.classList.add('input-error');
    isValid = false;
  }

  if (isNaN(amount) || amount <= 0) {
    amountError.textContent = 'Please enter a valid amount greater than 0.';
    amountInput.classList.add('input-error');
    isValid = false;
  }

  if (!date) {
    dateError.textContent = 'Please select a date.';
    dateInput.classList.add('input-error');
    isValid = false;
  }

  return isValid;
}

function resetForm() {
  expenseForm.reset();
  expenseIdInput.value = '';
  dateInput.value = getTodayString();
  clearErrors();

  editingId = null;
  formTitle.textContent = 'Add New Expense';
  submitBtnText.textContent = 'Add Expense';
  editingBadge.classList.add('hidden');
  cancelBtn.classList.add('hidden');
}

function handleFormSubmit(e) {
  e.preventDefault();

  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const date = dateInput.value;

  if (!validateForm(desc, amount, date)) {
    return;
  }

  if (editingId) {
    // Update existing expense
    const index = expenses.findIndex(exp => exp.id === editingId);
    if (index !== -1) {
      expenses[index] = {
        ...expenses[index],
        description: desc,
        amount: Math.round(amount * 100) / 100, // round to 2 decimals
        date: date
      };
    }
  } else {
    // Add new expense
    const newExpense = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      description: desc,
      amount: Math.round(amount * 100) / 100,
      date: date,
      createdAt: Date.now()
    };
    expenses.unshift(newExpense);
  }

  // Sort expenses primarily by date (newest date first)
  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  saveExpenses();
  resetForm();
  render();
}

// ==========================================================================
// Edit & Delete Actions
// ==========================================================================

function startEditing(id) {
  const expense = expenses.find(exp => exp.id === id);
  if (!expense) return;

  editingId = id;
  expenseIdInput.value = expense.id;
  descInput.value = expense.description;
  amountInput.value = expense.amount;
  dateInput.value = expense.date;

  clearErrors();

  formTitle.textContent = 'Edit Expense';
  submitBtnText.textContent = 'Save Changes';
  editingBadge.classList.remove('hidden');
  cancelBtn.classList.remove('hidden');

  // Smoothly scroll to the form card for great mobile UX
  document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
  descInput.focus();

  render();
}

function deleteExpense(id) {
  const expenseToDelete = expenses.find(exp => exp.id === id);
  const name = expenseToDelete ? `"${expenseToDelete.description}"` : 'this expense';

  const confirmed = window.confirm(`Are you sure you want to delete ${name}?`);
  if (!confirmed) return;

  expenses = expenses.filter(exp => exp.id !== id);

  if (editingId === id) {
    resetForm();
  }

  saveExpenses();
  render();
}

// ==========================================================================
// Search Handling
// ==========================================================================

function handleSearch(e) {
  searchQuery = e.target.value;
  if (searchQuery.trim().length > 0) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
  }
  render();
}

function clearSearch() {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.classList.add('hidden');
  searchInput.focus();
  render();
}

// ==========================================================================
// CSV Export & Sample Data
// ==========================================================================

function exportCSV() {
  if (expenses.length === 0) {
    alert('No expenses to export!');
    return;
  }

  const headers = ['Description', 'Amount', 'Date'];
  const rows = expenses.map(item => [
    `"${(item.description || '').replace(/"/g, '""')}"`,
    item.amount,
    item.date
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${getTodayString()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadSampleData() {
  const today = new Date();
  const formatOffset = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  expenses = [
    {
      id: Date.now().toString(36) + '1',
      description: 'Weekly Groceries',
      amount: 64.50,
      date: formatOffset(0),
      createdAt: Date.now() - 3000
    },
    {
      id: Date.now().toString(36) + '2',
      description: 'Coffee & Bakery',
      amount: 7.25,
      date: formatOffset(1),
      createdAt: Date.now() - 2000
    },
    {
      id: Date.now().toString(36) + '3',
      description: 'Transit Pass',
      amount: 28.00,
      date: formatOffset(3),
      createdAt: Date.now() - 1000
    }
  ];

  saveExpenses();
  render();
}

// ==========================================================================
// Event Listeners & Initialization
// ==========================================================================

function init() {
  loadExpenses();

  // Set default date input to today
  dateInput.value = getTodayString();

  // Attach form listeners
  expenseForm.addEventListener('submit', handleFormSubmit);
  cancelBtn.addEventListener('click', () => {
    resetForm();
    render();
  });

  // Clear errors dynamically on input
  descInput.addEventListener('input', () => {
    if (descInput.value.trim()) {
      descError.textContent = '';
      descInput.classList.remove('input-error');
    }
  });
  amountInput.addEventListener('input', () => {
    if (parseFloat(amountInput.value) > 0) {
      amountError.textContent = '';
      amountInput.classList.remove('input-error');
    }
  });
  dateInput.addEventListener('input', () => {
    if (dateInput.value) {
      dateError.textContent = '';
      dateInput.classList.remove('input-error');
    }
  });

  // Search input listeners
  searchInput.addEventListener('input', handleSearch);
  clearSearchBtn.addEventListener('click', clearSearch);

  // Export & Sample Data listeners
  if (exportBtn) exportBtn.addEventListener('click', exportCSV);
  if (sampleDataBtn) sampleDataBtn.addEventListener('click', loadSampleData);

  // Global keyboard shortcuts (Escape to cancel edit or clear search)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (editingId) {
        resetForm();
        render();
      } else if (searchQuery) {
        clearSearch();
      }
    }
  });

  // Initial render
  render();
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);


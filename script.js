/**
 * Personal Budget Planner
 * Pure Vanilla JavaScript Application (No frameworks, build tools, or external libraries)
 */

(function () {
  'use strict';

  // ==========================================
  // Constants & Configuration
  // ==========================================
  const STORAGE_KEY = 'budgetPlanner.v1';

  // Strict category lists per specification
  const EXPENSE_CATEGORIES = [
    'Food & Dining',
    'Housing & Rent',
    'Transport',
    'Utilities',
    'Health',
    'Entertainment',
    'Shopping',
    'Education',
    'Savings & Investments',
    'Other'
  ];

  const INCOME_CATEGORIES = [
    'Salary',
    'Freelance',
    'Investments',
    'Gift',
    'Other Income'
  ];

  // Currency configuration for Intl.NumberFormat
  const CURRENCY_CONFIG = {
    INR: { locale: 'en-IN', currency: 'INR', symbol: '₹' },
    USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
    EUR: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
    GBP: { locale: 'en-GB', currency: 'GBP', symbol: '£' }
  };

  // Category Icons for visual enhancement
  const CATEGORY_ICONS = {
    'Food & Dining': '🍔',
    'Housing & Rent': '🏠',
    'Transport': '🚗',
    'Utilities': '💡',
    'Health': '💊',
    'Entertainment': '🎬',
    'Shopping': '🛍️',
    'Education': '📚',
    'Savings & Investments': '📈',
    'Salary': '💼',
    'Freelance': '💻',
    'Investments': '📊',
    'Gift': '🎁',
    'Other Income': '💵',
    'Other': '📌'
  };

  // ==========================================
  // Application State
  // ==========================================
  let state = {
    budgets: {},       // { "YYYY-MM": number }
    transactions: [],  // [{ id, type, desc, amount, category, date }]
    currency: 'USD',   // 'INR' | 'USD' | 'EUR' | 'GBP'
    selectedMonth: getLocalMonthString(), // 'YYYY-MM'
    editingId: null,   // null or numeric id of transaction being edited
    filters: {
      type: 'all',
      category: 'all'
    }
  };

  // Tracking last generated ID for collision safety
  let lastUniqueId = 0;

  // Active confirmation callback
  let pendingConfirmationAction = null;

  // ==========================================
  // DOM Elements Cache
  // ==========================================
  const dom = {
    // Header controls
    monthPicker: document.getElementById('month-picker'),
    currencySelect: document.getElementById('currency-select'),
    btnClearMonth: document.getElementById('btn-clear-month'),
    btnResetAll: document.getElementById('btn-reset-all'),
    btnLogout: document.getElementById('btn-logout'),

    // Summary cards
    cardBudget: document.getElementById('card-budget'),
    cardIncome: document.getElementById('card-income'),
    cardExpenses: document.getElementById('card-expenses'),
    cardRemaining: document.getElementById('card-remaining'),
    cardBalance: document.getElementById('card-balance'),
    budgetStatusBadge: document.getElementById('budget-status-badge'),
    incomeCountText: document.getElementById('income-count-text'),
    expenseCountText: document.getElementById('expense-count-text'),
    remainingStatusText: document.getElementById('remaining-status-text'),
    balanceStatusText: document.getElementById('balance-status-text'),

    // Budget inline form
    budgetForm: document.getElementById('budget-form'),
    budgetInput: document.getElementById('budget-input'),
    errBudget: document.getElementById('err-budget'),

    // Progress bar section
    progressBadge: document.getElementById('progress-badge'),
    progressSpentText: document.getElementById('progress-spent-text'),
    progressPercentageText: document.getElementById('progress-percentage-text'),
    progressFill: document.getElementById('progress-fill'),
    progressTrack: document.getElementById('progress-track'),
    budgetAlert: document.getElementById('budget-alert'),
    alertIcon: document.getElementById('alert-icon'),
    alertMessage: document.getElementById('alert-message'),

    // Transaction form
    formHeading: document.getElementById('form-heading'),
    editIndicator: document.getElementById('edit-indicator'),
    txForm: document.getElementById('transaction-form'),
    typeExpense: document.getElementById('type-expense'),
    typeIncome: document.getElementById('type-income'),
    txDesc: document.getElementById('tx-desc'),
    descCharCount: document.getElementById('desc-char-count'),
    txAmount: document.getElementById('tx-amount'),
    formCurrencySymbol: document.getElementById('form-currency-symbol'),
    txDate: document.getElementById('tx-date'),
    txCategory: document.getElementById('tx-category'),
    btnSubmitTx: document.getElementById('btn-submit-tx'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    errDesc: document.getElementById('err-desc'),
    errAmount: document.getElementById('err-amount'),
    errDate: document.getElementById('err-date'),
    errCategory: document.getElementById('err-category'),

    // Category breakdown
    categoryBreakdownList: document.getElementById('category-breakdown-list'),
    breakdownMonthText: document.getElementById('breakdown-month-text'),

    // Transaction table & history
    txCountBadge: document.getElementById('tx-count-badge'),
    filterType: document.getElementById('filter-type'),
    filterCategory: document.getElementById('filter-category'),
    txTable: document.getElementById('tx-table'),
    txListBody: document.getElementById('tx-list-body'),
    txEmptyState: document.getElementById('tx-empty-state'),
    emptyStateMessage: document.getElementById('empty-state-message'),

    // Confirmation modal
    confirmModal: document.getElementById('confirm-modal'),
    confirmModalTitle: document.getElementById('confirm-modal-title'),
    confirmModalMsg: document.getElementById('confirm-modal-msg'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),
    btnModalConfirm: document.getElementById('btn-modal-confirm'),

    // Toast container
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================
  // Initialization
  // ==========================================
  function init() {
    loadFromLocalStorage();

    // Set initial controls values
    dom.monthPicker.value = state.selectedMonth;
    dom.currencySelect.value = state.currency;
    dom.txDate.value = getLocalDateString();
    updateFormCurrencySymbol();

    // Populate transaction categories for default expense type
    populateCategoryDropdown('expense');
    populateCategoryFilter();

    // Register event listeners
    setupEventListeners();

    // Render the initial UI
    renderApp();
  }

  // ==========================================
  // Persistence (localStorage with robust error handling)
  // ==========================================
  function getDefaultData() {
    const month = getLocalMonthString();
    return {
      currency: 'USD',
      budgets: { [month]: 3000 },
      transactions: [
        { id: 1, type: 'income', desc: 'Monthly Salary', amount: 4500, category: 'Salary', date: `${month}-01` },
        { id: 2, type: 'expense', desc: 'Apartment Rent', amount: 1200, category: 'Housing & Rent', date: `${month}-03` },
        { id: 3, type: 'expense', desc: 'Grocery Shopping', amount: 240, category: 'Food & Dining', date: `${month}-05` },
        { id: 4, type: 'expense', desc: 'High-Speed Internet', amount: 70, category: 'Utilities', date: `${month}-08` },
        { id: 5, type: 'income', desc: 'Freelance Project', amount: 600, category: 'Freelance', date: `${month}-12` },
        { id: 6, type: 'expense', desc: 'Dining & Coffee', amount: 85, category: 'Food & Dining', date: `${month}-15` },
        { id: 7, type: 'expense', desc: 'Emergency Savings', amount: 500, category: 'Savings & Investments', date: `${month}-20` }
      ]
    };
  }

  function loadFromLocalStorage() {
    let data = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {}

    if (!data || !Array.isArray(data.transactions) || data.transactions.length === 0) {
      data = getDefaultData();
      saveData(data);
    }

    state.budgets = (data.budgets && typeof data.budgets === 'object') ? data.budgets : {};
    state.transactions = Array.isArray(data.transactions) ? data.transactions : [];
    state.currency = ['INR', 'USD', 'EUR', 'GBP'].includes(data.currency) ? data.currency : 'USD';
  }

  function saveToLocalStorage() {
    saveData({
      budgets: state.budgets,
      transactions: state.transactions,
      currency: state.currency
    });
  }

  function saveData(payload) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  // ==========================================
  // Event Listeners
  // ==========================================
  function setupEventListeners() {
    // Month picker change
    dom.monthPicker.addEventListener('change', function (e) {
      if (e.target.value && /^\d{4}-\d{2}$/.test(e.target.value)) {
        state.selectedMonth = e.target.value;
        renderApp();
      }
    });



    // Currency selector change
    dom.currencySelect.addEventListener('change', function (e) {
      const newCurr = e.target.value;
      if (CURRENCY_CONFIG[newCurr]) {
        state.currency = newCurr;
        saveToLocalStorage();
        updateFormCurrencySymbol();
        renderApp();
        showToast(`Currency changed to ${newCurr}`, 'info');
      }
    });

    // Clear this month action
    dom.btnClearMonth.addEventListener('click', function () {
      openConfirmModal(
        'Clear This Month',
        `Are you sure you want to delete all transactions and the budget for ${formatMonthLabel(state.selectedMonth)}? This cannot be undone.`,
        handleClearThisMonth
      );
    });

    // Reset all data action
    dom.btnResetAll.addEventListener('click', function () {
      openConfirmModal(
        'Reset All Data',
        'Are you sure you want to reset ALL data? This will permanently wipe all transactions and budgets across all months.',
        handleResetAllData
      );
    });

    // Logout action
    if (dom.btnLogout) {
      dom.btnLogout.addEventListener('click', function () {
        sessionStorage.removeItem('budgetPlanner_auth');
        sessionStorage.removeItem('budgetPlanner_user');
        window.location.replace('login.html');
      });
    }

    // Inline Budget Form submit
    dom.budgetForm.addEventListener('submit', handleSetBudget);

    // Transaction Type radio change (Segmented Control)
    dom.typeExpense.addEventListener('change', handleTypeChange);
    dom.typeIncome.addEventListener('change', handleTypeChange);

    // Description char count live update
    dom.txDesc.addEventListener('input', function () {
      dom.descCharCount.textContent = `${this.value.length} / 60`;
      clearFieldError(dom.txDesc, dom.errDesc);
    });

    // Real-time error clearing on input
    dom.txAmount.addEventListener('input', () => clearFieldError(dom.txAmount, dom.errAmount));
    dom.txDate.addEventListener('change', () => clearFieldError(dom.txDate, dom.errDate));
    dom.txCategory.addEventListener('change', () => clearFieldError(dom.txCategory, dom.errCategory));
    dom.budgetInput.addEventListener('input', () => clearFieldError(dom.budgetInput, dom.errBudget));

    // Transaction form submit
    dom.txForm.addEventListener('submit', handleTransactionSubmit);

    // Cancel edit button
    dom.btnCancelEdit.addEventListener('click', resetTransactionForm);

    // Transaction filters
    dom.filterType.addEventListener('change', function (e) {
      state.filters.type = e.target.value;
      populateCategoryFilter();
      renderTransactionsList();
    });

    dom.filterCategory.addEventListener('change', function (e) {
      state.filters.category = e.target.value;
      renderTransactionsList();
    });

    // Event delegation on table body for Edit & Delete buttons
    dom.txListBody.addEventListener('click', function (e) {
      const editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn) {
        const id = Number(editBtn.getAttribute('data-id'));
        startEditTransaction(id);
        return;
      }

      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute('data-id'));
        promptDeleteTransaction(id);
        return;
      }
    });

    // Confirmation Modal actions
    dom.btnCloseModal.addEventListener('click', closeConfirmModal);
    dom.btnModalCancel.addEventListener('click', closeConfirmModal);
    dom.btnModalConfirm.addEventListener('click', function () {
      if (typeof pendingConfirmationAction === 'function') {
        const action = pendingConfirmationAction;
        closeConfirmModal();
        action();
      }
    });

    // Modal dismiss on backdrop click
    dom.confirmModal.addEventListener('click', function (e) {
      if (e.target === dom.confirmModal) closeConfirmModal();
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!dom.confirmModal.classList.contains('hidden')) closeConfirmModal();
      }
    });
  }

  // ==========================================
  // Form Logic: Segmented Control & Categories
  // ==========================================
  function handleTypeChange() {
    if (this === dom.typeExpense && dom.typeExpense.checked) {
      dom.typeIncome.checked = false;
    } else if (this === dom.typeIncome && dom.typeIncome.checked) {
      dom.typeExpense.checked = false;
    }
    const selectedType = getSelectedType();
    populateCategoryDropdown(selectedType);
  }

  function getSelectedType() {
    return dom.typeIncome.checked ? 'income' : 'expense';
  }

  function populateCategoryDropdown(type, selectedCategory = '') {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    dom.txCategory.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Select Category';
    defaultOpt.disabled = true;
    defaultOpt.selected = !selectedCategory;
    dom.txCategory.appendChild(defaultOpt);

    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      const icon = CATEGORY_ICONS[cat] || '📌';
      opt.textContent = `${icon} ${cat}`;
      if (selectedCategory === cat) {
        opt.selected = true;
      }
      dom.txCategory.appendChild(opt);
    });
  }

  function populateCategoryFilter() {
    const currentVal = dom.filterCategory.value;
    dom.filterCategory.innerHTML = '<option value="all">All Categories</option>';

    let availableCategories = [];
    if (state.filters.type === 'expense') {
      availableCategories = EXPENSE_CATEGORIES;
    } else if (state.filters.type === 'income') {
      availableCategories = INCOME_CATEGORIES;
    } else {
      // All categories grouped or combined
      availableCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    }

    availableCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      const icon = CATEGORY_ICONS[cat] || '📌';
      opt.textContent = `${icon} ${cat}`;
      if (cat === currentVal) {
        opt.selected = true;
      }
      dom.filterCategory.appendChild(opt);
    });

    // If the previous selection doesn't exist in current list, reset to 'all'
    if (!availableCategories.includes(currentVal)) {
      dom.filterCategory.value = 'all';
      state.filters.category = 'all';
    }
  }

  function updateFormCurrencySymbol() {
    const config = CURRENCY_CONFIG[state.currency] || CURRENCY_CONFIG.INR;
    dom.formCurrencySymbol.textContent = config.symbol;
  }

  // ==========================================
  // Budget Management
  // ==========================================
  function handleSetBudget(e) {
    e.preventDefault();
    clearFieldError(dom.budgetInput, dom.errBudget);

    const rawVal = dom.budgetInput.value.trim();
    if (rawVal === '') {
      showFieldError(dom.budgetInput, dom.errBudget, 'Please enter an amount.');
      return;
    }

    const num = Number(rawVal);
    if (isNaN(num) || num < 0) {
      showFieldError(dom.budgetInput, dom.errBudget, 'Enter a valid amount ≥ 0.');
      return;
    }

    const roundedBudget = roundToTwoDecimals(num);
    state.budgets[state.selectedMonth] = roundedBudget;
    saveToLocalStorage();

    dom.budgetInput.value = '';
    renderApp();
    showToast(`Budget for ${formatMonthLabel(state.selectedMonth)} set to ${formatCurrency(roundedBudget)}`, 'success');
  }

  // ==========================================
  // Transaction Form Handling (Add & Edit)
  // ==========================================
  function handleTransactionSubmit(e) {
    e.preventDefault();

    // 1. Validate Description: required, non-empty, max 60 chars
    const descRaw = dom.txDesc.value.trim();
    let hasError = false;

    if (!descRaw) {
      showFieldError(dom.txDesc, dom.errDesc, 'Description is required.');
      hasError = true;
    } else if (descRaw.length > 60) {
      showFieldError(dom.txDesc, dom.errDesc, 'Description cannot exceed 60 characters.');
      hasError = true;
    } else {
      clearFieldError(dom.txDesc, dom.errDesc);
    }

    // 2. Validate Amount: > 0, 2 decimals, reject empty, zero, negative or NaN
    const amountRaw = dom.txAmount.value.trim();
    const amountNum = Number(amountRaw);
    if (!amountRaw || isNaN(amountNum) || amountNum <= 0) {
      showFieldError(dom.txAmount, dom.errAmount, 'Amount must be greater than 0.');
      hasError = true;
    } else {
      clearFieldError(dom.txAmount, dom.errAmount);
    }

    // 3. Validate Date: required, YYYY-MM-DD
    const dateVal = dom.txDate.value.trim();
    if (!dateVal || !/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      showFieldError(dom.txDate, dom.errDate, 'Please choose a valid date.');
      hasError = true;
    } else {
      clearFieldError(dom.txDate, dom.errDate);
    }

    // 4. Validate Category: required, must be in appropriate list
    const typeVal = getSelectedType();
    const categoryVal = dom.txCategory.value;
    const validCategories = typeVal === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    if (!categoryVal || !validCategories.includes(categoryVal)) {
      showFieldError(dom.txCategory, dom.errCategory, 'Please select a valid category.');
      hasError = true;
    } else {
      clearFieldError(dom.txCategory, dom.errCategory);
    }

    if (hasError) return;

    const roundedAmount = roundToTwoDecimals(amountNum);
    const txMonth = dateVal.substring(0, 7);

    if (state.editingId !== null) {
      // Updating an existing transaction
      const targetIndex = state.transactions.findIndex(t => t.id === state.editingId);
      if (targetIndex !== -1) {
        state.transactions[targetIndex] = {
          id: state.editingId,
          type: typeVal,
          desc: descRaw,
          amount: roundedAmount,
          category: categoryVal,
          date: dateVal
        };
        showToast('Transaction updated successfully', 'success');
      }
    } else {
      // Adding a new transaction
      const newTx = {
        id: generateUniqueNumericId(),
        type: typeVal,
        desc: descRaw,
        amount: roundedAmount,
        category: categoryVal,
        date: dateVal
      };
      state.transactions.push(newTx);
      showToast('Transaction added successfully', 'success');
    }

    saveToLocalStorage();

    // Switch month picker to that transaction's month so it is visible
    state.selectedMonth = txMonth;
    dom.monthPicker.value = txMonth;

    // Reset form and editing mode
    resetTransactionForm();

    // Refresh UI
    renderApp();
  }

  function startEditTransaction(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;

    state.editingId = id;

    // Update form header & indicators
    dom.formHeading.textContent = 'Edit Transaction';
    dom.editIndicator.classList.remove('hidden');
    dom.btnSubmitTx.textContent = 'Update Transaction';
    dom.btnCancelEdit.classList.remove('hidden');

    // Set form fields
    if (tx.type === 'income') {
      dom.typeIncome.checked = true;
      dom.typeExpense.checked = false;
    } else {
      dom.typeExpense.checked = true;
      dom.typeIncome.checked = false;
    }

    populateCategoryDropdown(tx.type, tx.category);

    dom.txDesc.value = tx.desc;
    dom.descCharCount.textContent = `${tx.desc.length} / 60`;
    dom.txAmount.value = tx.amount;
    dom.txDate.value = tx.date;

    clearAllFormErrors();

    // Scroll form into view smoothly
    dom.txForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    dom.txDesc.focus();
  }

  function resetTransactionForm() {
    state.editingId = null;

    dom.txForm.reset();
    dom.typeExpense.checked = true;
    dom.typeIncome.checked = false;
    populateCategoryDropdown('expense');

    dom.txDate.value = getLocalDateString();
    dom.descCharCount.textContent = '0 / 60';

    dom.formHeading.textContent = 'Add Transaction';
    dom.editIndicator.classList.add('hidden');
    dom.btnSubmitTx.textContent = 'Add Transaction';
    dom.btnCancelEdit.classList.add('hidden');

    clearAllFormErrors();
  }

  function promptDeleteTransaction(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;

    openConfirmModal(
      'Delete Transaction',
      `Are you sure you want to delete "${escapeHTML(tx.desc)}" (${formatCurrency(tx.amount)})?`,
      function () {
        state.transactions = state.transactions.filter(t => t.id !== id);

        // If deleting the transaction currently being edited, reset form
        if (state.editingId === id) {
          resetTransactionForm();
        }

        saveToLocalStorage();
        renderApp();
        showToast('Transaction deleted', 'info');
      }
    );
  }

  function handleClearThisMonth() {
    // Delete all transactions for selected month
    state.transactions = state.transactions.filter(t => !t.date.startsWith(state.selectedMonth));

    // Delete budget for selected month
    delete state.budgets[state.selectedMonth];

    if (state.editingId) {
      resetTransactionForm();
    }

    saveToLocalStorage();
    renderApp();
    showToast(`Cleared all records for ${formatMonthLabel(state.selectedMonth)}`, 'info');
  }

  function handleResetAllData() {
    state.transactions = [];
    state.budgets = {};

    if (state.editingId) {
      resetTransactionForm();
    }

    saveToLocalStorage();
    renderApp();
    showToast('All budget and transaction data has been reset.', 'info');
  }

  // ==========================================
  // Core Rendering Logic
  // ==========================================
  function renderApp() {
    // Filter transactions by selected month using date.startsWith("YYYY-MM")
    const monthTransactions = state.transactions.filter(t =>
      typeof t.date === 'string' && t.date.startsWith(state.selectedMonth)
    );

    // Compute totals
    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    monthTransactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        incomeCount++;
      } else {
        totalExpenses += t.amount;
        expenseCount++;
      }
    });

    totalIncome = roundToTwoDecimals(totalIncome);
    totalExpenses = roundToTwoDecimals(totalExpenses);

    // Monthly budget
    const hasBudgetSet = Object.prototype.hasOwnProperty.call(state.budgets, state.selectedMonth);
    const monthlyBudget = hasBudgetSet ? state.budgets[state.selectedMonth] : 0;

    // Remaining budget: budget - expenses
    const budgetRemaining = roundToTwoDecimals(monthlyBudget - totalExpenses);

    // Balance: income - expenses
    const balance = roundToTwoDecimals(totalIncome - totalExpenses);

    // 1. Update 5 Summary Cards
    renderSummaryCards(monthlyBudget, hasBudgetSet, totalIncome, incomeCount, totalExpenses, expenseCount, budgetRemaining, balance);

    // 2. Update Progress Bar & Alert Section
    renderProgressBar(monthlyBudget, hasBudgetSet, totalExpenses, budgetRemaining);

    // 3. Update Spending by Category Breakdown
    renderCategoryBreakdown(monthTransactions, totalExpenses);

    // 4. Update Transactions History Table
    renderTransactionsList();
  }

  function renderSummaryCards(monthlyBudget, hasBudgetSet, totalIncome, incomeCount, totalExpenses, expenseCount, budgetRemaining, balance) {
    // Card 1: Monthly Budget
    dom.cardBudget.textContent = formatCurrency(monthlyBudget);
    dom.budgetStatusBadge.textContent = hasBudgetSet ? 'Target Set' : 'No Budget';

    // Card 2: Total Income
    dom.cardIncome.textContent = formatCurrency(totalIncome);
    dom.incomeCountText.textContent = `${incomeCount} record${incomeCount !== 1 ? 's' : ''}`;

    // Card 3: Total Expenses
    dom.cardExpenses.textContent = formatCurrency(totalExpenses);
    dom.expenseCountText.textContent = `${expenseCount} record${expenseCount !== 1 ? 's' : ''}`;

    // Card 4: Budget Remaining (budget - expenses)
    dom.cardRemaining.textContent = formatCurrency(budgetRemaining);
    if (budgetRemaining < 0) {
      dom.cardRemaining.classList.add('negative');
      dom.remainingStatusText.textContent = 'Exceeded budget limit';
      dom.remainingStatusText.style.color = 'var(--color-danger)';
    } else {
      dom.cardRemaining.classList.remove('negative');
      dom.remainingStatusText.textContent = hasBudgetSet ? 'Remaining allowance' : 'No budget configured';
      dom.remainingStatusText.style.color = 'var(--text-muted)';
    }

    // Card 5: Balance (income - expenses)
    dom.cardBalance.textContent = formatCurrency(balance);
    if (balance < 0) {
      dom.cardBalance.classList.add('negative');
      dom.balanceStatusText.textContent = 'Net monthly deficit';
      dom.balanceStatusText.style.color = 'var(--color-danger)';
    } else {
      dom.cardBalance.classList.remove('negative');
      dom.balanceStatusText.textContent = balance > 0 ? 'Net monthly surplus' : 'Balanced net flow';
      dom.balanceStatusText.style.color = 'var(--text-muted)';
    }
  }

  function renderProgressBar(monthlyBudget, hasBudgetSet, totalExpenses, budgetRemaining) {
    // If no budget is set, show "No budget set" and no division by zero
    if (!hasBudgetSet || monthlyBudget <= 0) {
      dom.progressBadge.textContent = 'No budget set';
      dom.progressBadge.className = 'progress-badge';
      dom.progressSpentText.textContent = `${formatCurrency(totalExpenses)} spent`;
      dom.progressPercentageText.textContent = 'No budget set';
      dom.progressFill.style.width = '0%';
      dom.progressFill.className = 'progress-fill';
      dom.progressTrack.setAttribute('aria-valuenow', '0');
      dom.budgetAlert.classList.add('hidden');
      return;
    }

    // Division by zero protected; budget > 0
    const rawPct = (totalExpenses / monthlyBudget) * 100;
    const clampedFillPct = Math.min(rawPct, 100);

    dom.progressSpentText.textContent = `${formatCurrency(totalExpenses)} spent of ${formatCurrency(monthlyBudget)}`;
    dom.progressPercentageText.textContent = `${rawPct.toFixed(0)}% used`;
    dom.progressFill.style.width = `${clampedFillPct}%`;
    dom.progressTrack.setAttribute('aria-valuenow', Math.min(Math.round(rawPct), 100).toString());

    // Progress bar coloring & warning messages
    // Green under 80%, amber at 80-99%, red at 100%+
    if (rawPct >= 100) {
      // Red at 100%+ with over-budget message
      dom.progressBadge.textContent = 'Over budget';
      dom.progressBadge.className = 'progress-badge badge-red';
      dom.progressFill.className = 'progress-fill fill-red';

      const overAmount = Math.abs(budgetRemaining);
      dom.alertIcon.textContent = '🚨';
      dom.alertMessage.textContent = `Over-budget: You have exceeded your monthly budget by ${formatCurrency(overAmount)} (${rawPct.toFixed(0)}% used).`;
      dom.budgetAlert.className = 'budget-alert alert-danger';
      dom.budgetAlert.classList.remove('hidden');
    } else if (rawPct >= 80) {
      // Amber at 80-99% with warning message
      dom.progressBadge.textContent = 'Near limit';
      dom.progressBadge.className = 'progress-badge badge-amber';
      dom.progressFill.className = 'progress-fill fill-amber';

      dom.alertIcon.textContent = '⚠️';
      dom.alertMessage.textContent = `Warning: You have used ${rawPct.toFixed(0)}% of your monthly budget (${formatCurrency(budgetRemaining)} remaining).`;
      dom.budgetAlert.className = 'budget-alert alert-warning';
      dom.budgetAlert.classList.remove('hidden');
    } else {
      // Green under 80%
      dom.progressBadge.textContent = 'On track';
      dom.progressBadge.className = 'progress-badge badge-green';
      dom.progressFill.className = 'progress-fill fill-green';
      dom.budgetAlert.classList.add('hidden');
    }
  }

  function renderCategoryBreakdown(monthTransactions, totalExpenses) {
    dom.breakdownMonthText.textContent = formatMonthLabel(state.selectedMonth);

    // Expenses only
    const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');

    if (expenseTransactions.length === 0) {
      dom.categoryBreakdownList.innerHTML = `
        <div class="empty-breakdown">
          No expense transactions recorded for this month.
        </div>
      `;
      return;
    }

    // Aggregate expense by category
    const categoryTotals = {};
    expenseTransactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    // Sort high to low
    const sortedCategories = Object.keys(categoryTotals).sort((a, b) => {
      return categoryTotals[b] - categoryTotals[a];
    });

    dom.categoryBreakdownList.innerHTML = '';

    sortedCategories.forEach(cat => {
      const catAmount = roundToTwoDecimals(categoryTotals[cat]);
      const catPct = totalExpenses > 0 ? (catAmount / totalExpenses) * 100 : 0;
      const icon = CATEGORY_ICONS[cat] || '📌';

      const itemEl = document.createElement('div');
      itemEl.className = 'cat-item';
      itemEl.innerHTML = `
        <div class="cat-item-header">
          <span class="cat-item-name">${icon} ${escapeHTML(cat)}</span>
          <span class="cat-item-value">
            <span>${formatCurrency(catAmount)}</span>
            <span class="cat-item-pct">(${catPct.toFixed(1)}%)</span>
          </span>
        </div>
        <div class="cat-track">
          <div class="cat-fill" style="width: ${Math.min(catPct, 100)}%;"></div>
        </div>
      `;
      dom.categoryBreakdownList.appendChild(itemEl);
    });
  }

  function renderTransactionsList() {
    // Filter by selected month: date.startsWith("YYYY-MM")
    let list = state.transactions.filter(t =>
      typeof t.date === 'string' && t.date.startsWith(state.selectedMonth)
    );

    // Filter by Type
    if (state.filters.type !== 'all') {
      list = list.filter(t => t.type === state.filters.type);
    }

    // Filter by Category
    if (state.filters.category !== 'all') {
      list = list.filter(t => t.category === state.filters.category);
    }

    // Sort newest first: by date descending, then id descending
    list.sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return b.id - a.id;
    });

    dom.txCountBadge.textContent = `${list.length} item${list.length !== 1 ? 's' : ''}`;
    dom.txListBody.innerHTML = '';

    if (list.length === 0) {
      dom.txTable.classList.add('hidden');
      dom.txEmptyState.classList.remove('hidden');

      if (state.filters.type !== 'all' || state.filters.category !== 'all') {
        dom.emptyStateMessage.textContent = 'No transactions match the selected filters.';
      } else {
        dom.emptyStateMessage.textContent = `No transactions recorded for ${formatMonthLabel(state.selectedMonth)}. Add an income or expense to get started.`;
      }
      return;
    }

    dom.txTable.classList.remove('hidden');
    dom.txEmptyState.classList.add('hidden');

    list.forEach(tx => {
      const tr = document.createElement('tr');
      const isIncome = tx.type === 'income';
      const amountPrefix = isIncome ? '+ ' : '− ';
      const amountClass = isIncome ? 'text-income' : 'text-expense';
      const icon = CATEGORY_ICONS[tx.category] || '📌';

      tr.innerHTML = `
        <td class="tx-desc-cell">${escapeHTML(tx.desc)}</td>
        <td>
          <span class="tx-category-badge">
            <span aria-hidden="true">${icon}</span> ${escapeHTML(tx.category)}
          </span>
        </td>
        <td class="tx-date-cell">${formatDateDisplay(tx.date)}</td>
        <td class="tx-amount-cell ${amountClass} text-right">${amountPrefix}${formatCurrency(tx.amount)}</td>
        <td class="text-center tx-actions-cell">
          <div class="tx-actions-wrapper">
            <button type="button" class="btn-action-icon btn-action-edit" data-action="edit" data-id="${tx.id}" title="Edit transaction" aria-label="Edit ${escapeHTML(tx.desc)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <button type="button" class="btn-action-icon btn-action-delete" data-action="delete" data-id="${tx.id}" title="Delete transaction" aria-label="Delete ${escapeHTML(tx.desc)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      `;
      dom.txListBody.appendChild(tr);
    });
  }

  // ==========================================
  // Confirmation Modal
  // ==========================================
  function openConfirmModal(title, message, onConfirm) {
    dom.confirmModalTitle.textContent = title;
    dom.confirmModalMsg.textContent = message;
    pendingConfirmationAction = onConfirm;
    dom.confirmModal.classList.remove('hidden');
    dom.btnModalConfirm.focus();
  }

  function closeConfirmModal() {
    pendingConfirmationAction = null;
    dom.confirmModal.classList.add('hidden');
  }

  // ==========================================
  // Toast Notifications
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconText = 'ℹ️';
    if (type === 'success') iconText = '✓';
    if (type === 'error') iconText = '✕';

    toast.innerHTML = `
      <span aria-hidden="true">${iconText}</span>
      <span>${escapeHTML(message)}</span>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    }, 2800);
  }

  // ==========================================
  // Form Field Validation Helpers
  // ==========================================
  function showFieldError(inputEl, errorEl, msg) {
    inputEl.classList.add('is-invalid');
    errorEl.textContent = msg;
  }

  function clearFieldError(inputEl, errorEl) {
    inputEl.classList.remove('is-invalid');
    errorEl.textContent = '';
  }

  function clearAllFormErrors() {
    clearFieldError(dom.txDesc, dom.errDesc);
    clearFieldError(dom.txAmount, dom.errAmount);
    clearFieldError(dom.txDate, dom.errDate);
    clearFieldError(dom.txCategory, dom.errCategory);
    clearFieldError(dom.budgetInput, dom.errBudget);
  }

  // ==========================================
  // Utilities: Dates, Currency, Escaping, Numbers
  // ==========================================

  /**
   * Generates unique numeric IDs using Date.now() with increment fallback
   */
  function generateUniqueNumericId() {
    const now = Date.now();
    if (now <= lastUniqueId) {
      lastUniqueId++;
      return lastUniqueId;
    }
    lastUniqueId = now;
    return now;
  }

  /**
   * Get local date string 'YYYY-MM-DD' without UTC off-by-one issues
   */
  function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get local month string 'YYYY-MM'
   */
  function getLocalMonthString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Parse "YYYY-MM-DD" string manually and format as "DD MMM YYYY"
   */
  function formatDateDisplay(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const mName = monthNames[month - 1] || '';
    return `${day} ${mName} ${year}`;
  }

  /**
   * Format "YYYY-MM" string as "Month YYYY"
   */
  function formatMonthLabel(yearMonthStr) {
    if (!yearMonthStr || typeof yearMonthStr !== 'string') return '';
    const parts = yearMonthStr.split('-');
    if (parts.length !== 2) return yearMonthStr;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (isNaN(year) || isNaN(month)) return yearMonthStr;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month - 1] || ''} ${year}`;
  }

  /**
   * Formats numeric amounts using Intl.NumberFormat based on selected currency
   */
  function formatCurrency(amount, currencyCode = state.currency) {
    const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.INR;
    const num = Number(amount) || 0;
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  /**
   * Rounds a number to exactly two decimal places
   */
  function roundToTwoDecimals(num) {
    const val = Number(num);
    if (isNaN(val)) return 0;
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * HTML escape to prevent XSS attacks
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // DOM Ready
  // ==========================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

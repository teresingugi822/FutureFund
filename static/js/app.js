// FutureFund - Personal Finance Tracker
class FinanceTracker {
    constructor() {
        this.transactions = [];
        this.balance = 0;
        this.totalIncome = 0;
        this.totalExpenses = 0;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        this.bindEventListeners();
        await this.loadTransactions();
        await this.updateBalance();
    }
    
    bindEventListeners() {
        const form = document.getElementById('transaction-form');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Real-time form validation
        const amountInput = document.getElementById('amount');
        amountInput.addEventListener('input', this.validateAmount);
        
        const descriptionInput = document.getElementById('description');
        descriptionInput.addEventListener('input', this.validateDescription);
    }
    
    validateAmount(e) {
        const amount = parseFloat(e.target.value);
        const isValid = amount > 0;
        
        e.target.classList.toggle('is-invalid', !isValid && e.target.value !== '');
        e.target.classList.toggle('is-valid', isValid);
    }
    
    validateDescription(e) {
        const description = e.target.value.trim();
        const isValid = description.length > 0;
        
        e.target.classList.toggle('is-invalid', !isValid && e.target.value !== '');
        e.target.classList.toggle('is-valid', isValid);
    }
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transactionData = {
            description: formData.get('description').trim(),
            amount: parseFloat(formData.get('amount')),
            transaction_type: formData.get('transaction_type')
        };
        
        // Validate form data
        if (!this.validateFormData(transactionData)) {
            return;
        }
        
        await this.addTransaction(transactionData);
    }
    
    validateFormData(data) {
        if (!data.description) {
            this.showAlert('Please enter a description', 'danger');
            return false;
        }
        
        if (!data.amount || data.amount <= 0) {
            this.showAlert('Please enter a valid amount greater than 0', 'danger');
            return false;
        }
        
        if (!data.transaction_type) {
            this.showAlert('Please select a transaction type', 'danger');
            return false;
        }
        
        return true;
    }
    
    async addTransaction(transactionData) {
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Transaction added successfully!', 'success');
                this.clearForm();
                await this.loadTransactions();
                await this.updateBalance();
            } else {
                this.showAlert(result.error || 'Failed to add transaction', 'danger');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            this.showAlert('Network error. Please try again.', 'danger');
        } finally {
            this.setLoading(false);
        }
    }
    
    async loadTransactions() {
        this.showLoadingSpinner(true);
        
        try {
            const response = await fetch('/api/transactions');
            const result = await response.json();
            
            if (result.success) {
                this.transactions = result.transactions;
                this.renderTransactions();
            } else {
                this.showAlert(result.error || 'Failed to load transactions', 'danger');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showAlert('Failed to load transactions', 'danger');
        } finally {
            this.showLoadingSpinner(false);
        }
    }
    
    async updateBalance() {
        try {
            const response = await fetch('/api/balance');
            const result = await response.json();
            
            if (result.success) {
                this.balance = result.balance;
                this.totalIncome = result.total_income;
                this.totalExpenses = result.total_expenses;
                this.renderBalance();
            } else {
                console.error('Failed to update balance:', result.error);
            }
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    }
    
    async deleteTransaction(transactionId) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Transaction deleted successfully!', 'success');
                await this.loadTransactions();
                await this.updateBalance();
            } else {
                this.showAlert(result.error || 'Failed to delete transaction', 'danger');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showAlert('Network error. Please try again.', 'danger');
        }
    }
    
    renderBalance() {
        const balanceElement = document.getElementById('balance-amount');
        const incomeElement = document.getElementById('total-income');
        const expensesElement = document.getElementById('total-expenses');
        
        balanceElement.textContent = this.formatCurrency(this.balance);
        incomeElement.textContent = this.formatAmount(this.totalIncome);
        expensesElement.textContent = this.formatAmount(this.totalExpenses);
        
        // Update balance color
        balanceElement.className = `display-4 fw-bold ${this.balance >= 0 ? 'balance-positive' : 'balance-negative'}`;
    }
    
    renderTransactions() {
        const container = document.getElementById('transactions-container');
        const countElement = document.getElementById('transaction-count');
        const emptyState = document.getElementById('empty-state');
        
        // Update transaction count
        countElement.textContent = `${this.transactions.length} transaction${this.transactions.length !== 1 ? 's' : ''}`;
        
        if (this.transactions.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const transactionsHTML = this.transactions.map(transaction => 
            this.createTransactionHTML(transaction)
        ).join('');
        
        container.innerHTML = transactionsHTML;
        
        // Bind delete button events
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const transactionId = parseInt(e.target.dataset.transactionId);
                this.deleteTransaction(transactionId);
            });
        });
    }
    
    createTransactionHTML(transaction) {
        const typeClass = transaction.transaction_type === 'income' ? 'transaction-income' : 'transaction-expense';
        const amountClass = transaction.transaction_type === 'income' ? 'transaction-amount-income' : 'transaction-amount-expense';
        const icon = transaction.transaction_type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down';
        const sign = transaction.transaction_type === 'income' ? '+' : '-';
        
        return `
            <div class="transaction-item ${typeClass} p-3 mb-2 border rounded fade-in">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <i class="fas ${icon} ${amountClass} me-2"></i>
                            <strong class="transaction-description">${this.escapeHtml(transaction.description)}</strong>
                        </div>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            ${this.formatDate(transaction.created_at)}
                        </small>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="transaction-amount ${amountClass} fs-5 fw-bold me-3">
                            ${sign}${this.formatCurrency(transaction.amount)}
                        </span>
                        <button class="btn btn-outline-danger btn-sm btn-delete" 
                                data-transaction-id="${transaction.id}"
                                title="Delete transaction">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    clearForm() {
        const form = document.getElementById('transaction-form');
        form.reset();
        
        // Remove validation classes
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });
    }
    
    setLoading(isLoading) {
        const submitBtn = document.getElementById('submit-btn');
        const form = document.getElementById('transaction-form');
        
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adding...';
            form.classList.add('loading-overlay');
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-plus me-2"></i>Add Transaction';
            form.classList.remove('loading-overlay');
        }
    }
    
    showLoadingSpinner(show) {
        const spinner = document.getElementById('loading-spinner');
        spinner.style.display = show ? 'block' : 'none';
    }
    
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        const alertId = `alert-${Date.now()}`;
        
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
    
    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(Math.abs(amount));
    }
    
    formatAmount(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FinanceTracker();
});

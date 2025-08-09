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
        await this.checkMpesaStatus();
    }
    
    bindEventListeners() {
        const form = document.getElementById('transaction-form');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // M-Pesa form listener
        const mpesaForm = document.getElementById('mpesa-form');
        if (mpesaForm) {
            mpesaForm.addEventListener('submit', (e) => this.handleMpesaSubmit(e));
        }
        
        // Real-time form validation
        const amountInput = document.getElementById('amount');
        amountInput.addEventListener('input', this.validateAmount);
        
        const descriptionInput = document.getElementById('description');
        descriptionInput.addEventListener('input', this.validateDescription);
        
        // M-Pesa form validation
        const mpesaPhoneInput = document.getElementById('mpesa-phone');
        if (mpesaPhoneInput) {
            mpesaPhoneInput.addEventListener('input', this.validateMpesaPhone);
        }
        
        const mpesaAmountInput = document.getElementById('mpesa-amount');
        if (mpesaAmountInput) {
            mpesaAmountInput.addEventListener('input', this.validateMpesaAmount);
        }
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
        
        // Payment method indicators
        const paymentMethodBadge = transaction.payment_method === 'mpesa' 
            ? '<span class="badge bg-success ms-2"><i class="fas fa-mobile-alt me-1"></i>M-Pesa</span>' 
            : '';
        
        const receiptInfo = transaction.mpesa_receipt_number 
            ? `<br><small class="text-info"><i class="fas fa-receipt me-1"></i>Receipt: ${transaction.mpesa_receipt_number}</small>` 
            : '';
        
        return `
            <div class="transaction-item ${typeClass} p-3 mb-2 border rounded fade-in">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <i class="fas ${icon} ${amountClass} me-2"></i>
                            <strong class="transaction-description">${this.escapeHtml(transaction.description)}</strong>
                            ${paymentMethodBadge}
                        </div>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            ${this.formatDate(transaction.created_at)}
                            ${receiptInfo}
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
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
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
    
    // M-Pesa Methods
    async checkMpesaStatus() {
        try {
            const response = await fetch('/api/mpesa/status');
            const result = await response.json();
            
            const statusContainer = document.getElementById('mpesa-status-container');
            const mpesaForm = document.getElementById('mpesa-form');
            const notConfiguredDiv = document.getElementById('mpesa-not-configured');
            
            if (result.success && result.configured) {
                statusContainer.style.display = 'none';
                mpesaForm.style.display = 'block';
                notConfiguredDiv.style.display = 'none';
            } else {
                statusContainer.style.display = 'none';
                mpesaForm.style.display = 'none';
                notConfiguredDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error checking M-Pesa status:', error);
            // Show not configured on error
            document.getElementById('mpesa-status-container').style.display = 'none';
            document.getElementById('mpesa-form').style.display = 'none';
            document.getElementById('mpesa-not-configured').style.display = 'block';
        }
    }
    
    async handleMpesaSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const paymentData = {
            phone_number: formData.get('phone_number').trim(),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description').trim()
        };
        
        // Validate form data
        if (!this.validateMpesaFormData(paymentData)) {
            return;
        }
        
        await this.initiateMpesaPayment(paymentData);
    }
    
    validateMpesaFormData(data) {
        if (!data.phone_number) {
            this.showAlert('Please enter a phone number', 'danger');
            return false;
        }
        
        // Validate phone number format
        const phoneRegex = /^254[0-9]{9}$/;
        if (!phoneRegex.test(data.phone_number.replace(/\s+/g, ''))) {
            this.showAlert('Please enter a valid phone number (format: 254XXXXXXXXX)', 'danger');
            return false;
        }
        
        if (!data.amount || data.amount <= 0) {
            this.showAlert('Please enter a valid amount greater than 0', 'danger');
            return false;
        }
        
        if (!data.description) {
            this.showAlert('Please enter a description', 'danger');
            return false;
        }
        
        return true;
    }
    
    async initiateMpesaPayment(paymentData) {
        this.setMpesaLoading(true);
        
        try {
            const response = await fetch('/api/mpesa/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert(result.message, 'success');
                this.clearMpesaForm();
                
                // Start polling for payment status
                this.pollPaymentStatus(result.payment_id);
                
            } else {
                this.showAlert(result.error || 'Failed to initiate M-Pesa payment', 'danger');
            }
        } catch (error) {
            console.error('Error initiating M-Pesa payment:', error);
            this.showAlert('Network error. Please try again.', 'danger');
        } finally {
            this.setMpesaLoading(false);
        }
    }
    
    async pollPaymentStatus(paymentId, maxAttempts = 12) {
        let attempts = 0;
        const pollInterval = 5000; // 5 seconds
        
        const poll = async () => {
            attempts++;
            
            try {
                const response = await fetch(`/api/mpesa/query/${paymentId}`);
                const result = await response.json();
                
                if (result.success) {
                    const payment = result.payment;
                    
                    if (payment.status === 'success') {
                        this.showAlert('Payment completed successfully!', 'success');
                        await this.loadTransactions();
                        await this.updateBalance();
                        return;
                    } else if (payment.status === 'failed' || payment.status === 'cancelled') {
                        this.showAlert(`Payment ${payment.status}: ${payment.result_desc || 'Unknown error'}`, 'danger');
                        return;
                    }
                }
                
                // Continue polling if still pending and not exceeded max attempts
                if (attempts < maxAttempts) {
                    setTimeout(poll, pollInterval);
                } else {
                    this.showAlert('Payment status check timed out. Please check your transaction history.', 'warning');
                }
                
            } catch (error) {
                console.error('Error polling payment status:', error);
            }
        };
        
        // Start polling after initial delay
        setTimeout(poll, pollInterval);
    }
    
    validateMpesaPhone(e) {
        const phone = e.target.value.replace(/\s+/g, '');
        const phoneRegex = /^254[0-9]{9}$/;
        const isValid = phoneRegex.test(phone) || phone === '';
        
        e.target.classList.toggle('is-invalid', !isValid && phone !== '');
        e.target.classList.toggle('is-valid', isValid && phone !== '');
    }
    
    validateMpesaAmount(e) {
        const amount = parseFloat(e.target.value);
        const isValid = amount > 0;
        
        e.target.classList.toggle('is-invalid', !isValid && e.target.value !== '');
        e.target.classList.toggle('is-valid', isValid);
    }
    
    clearMpesaForm() {
        const form = document.getElementById('mpesa-form');
        form.reset();
        
        // Remove validation classes
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });
    }
    
    setMpesaLoading(isLoading) {
        const submitBtn = document.getElementById('mpesa-submit-btn');
        const form = document.getElementById('mpesa-form');
        
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending Request...';
            form.classList.add('loading-overlay');
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-mobile-alt me-2"></i>Send M-Pesa Request';
            form.classList.remove('loading-overlay');
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FinanceTracker();
});

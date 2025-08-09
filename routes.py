from flask import render_template, request, jsonify, url_for
from app import app, db
from models import Transaction, MpesaPayment
from mpesa_service import mpesa_api
import logging

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions ordered by date (newest first)"""
    try:
        transactions = Transaction.query.order_by(Transaction.created_at.desc()).all()
        return jsonify({
            'success': True,
            'transactions': [t.to_dict() for t in transactions]
        })
    except Exception as e:
        logging.error(f"Error fetching transactions: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch transactions'
        }), 500

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(key in data for key in ['description', 'amount', 'transaction_type']):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: description, amount, transaction_type'
            }), 400
        
        # Validate transaction type
        if data['transaction_type'] not in ['income', 'expense']:
            return jsonify({
                'success': False,
                'error': 'Transaction type must be either "income" or "expense"'
            }), 400
        
        # Validate amount
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({
                    'success': False,
                    'error': 'Amount must be greater than 0'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid amount format'
            }), 400
        
        # Create new transaction
        transaction = Transaction(
            description=data['description'].strip(),
            amount=amount,
            transaction_type=data['transaction_type']
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'transaction': transaction.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error adding transaction: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to add transaction'
        }), 500

@app.route('/api/balance', methods=['GET'])
def get_balance():
    """Calculate and return current balance"""
    try:
        # Calculate total income
        total_income = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.transaction_type == 'income'
        ).scalar() or 0
        
        # Calculate total expenses
        total_expenses = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.transaction_type == 'expense'
        ).scalar() or 0
        
        # Calculate balance
        balance = total_income - total_expenses
        
        return jsonify({
            'success': True,
            'balance': balance,
            'total_income': total_income,
            'total_expenses': total_expenses
        })
        
    except Exception as e:
        logging.error(f"Error calculating balance: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to calculate balance'
        }), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a specific transaction"""
    try:
        transaction = Transaction.query.get_or_404(transaction_id)
        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Transaction deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error deleting transaction: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete transaction'
        }), 500

# M-Pesa Payment Routes

@app.route('/api/mpesa/status', methods=['GET'])
def mpesa_status():
    """Check if M-Pesa is configured and available"""
    return jsonify({
        'success': True,
        'configured': mpesa_api.is_configured(),
        'environment': mpesa_api.environment
    })

@app.route('/api/mpesa/initiate', methods=['POST'])
def initiate_mpesa_payment():
    """Initiate M-Pesa STK Push payment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['phone_number', 'amount', 'description']
        if not data or not all(key in data for key in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: phone_number, amount, description'
            }), 400
        
        # Validate amount
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({
                    'success': False,
                    'error': 'Amount must be greater than 0'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid amount format'
            }), 400
        
        # Generate account reference
        from datetime import datetime
        account_reference = f"FF{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Prepare callback URL
        callback_url = request.url_root.rstrip('/') + '/api/mpesa/callback'
        
        # Initiate STK push
        result = mpesa_api.initiate_stk_push(
            phone_number=data['phone_number'],
            amount=amount,
            account_reference=account_reference,
            transaction_desc=data['description'],
            callback_url=callback_url
        )
        
        if result['success']:
            # Save payment request to database
            payment = MpesaPayment(
                checkout_request_id=result['checkout_request_id'],
                phone_number=data['phone_number'],
                amount=amount,
                account_reference=account_reference,
                transaction_desc=data['description'],
                status='pending'
            )
            
            db.session.add(payment)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Payment request sent. Check your phone for M-Pesa prompt.',
                'checkout_request_id': result['checkout_request_id'],
                'payment_id': payment.id
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to initiate payment')
            }), 400
            
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error initiating M-Pesa payment: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to initiate payment'
        }), 500

@app.route('/api/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """Handle M-Pesa payment callback"""
    try:
        callback_data = request.get_json()
        logging.info(f"M-Pesa callback received: {callback_data}")
        
        # Extract callback information
        stk_callback = callback_data.get('Body', {}).get('stkCallback', {})
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        
        if not checkout_request_id:
            logging.error("No CheckoutRequestID in callback")
            return jsonify({"ResultCode": 1, "ResultDesc": "Invalid callback data"})
        
        # Find the payment request
        payment = MpesaPayment.query.filter_by(checkout_request_id=checkout_request_id).first()
        
        if not payment:
            logging.error(f"Payment not found for CheckoutRequestID: {checkout_request_id}")
            return jsonify({"ResultCode": 1, "ResultDesc": "Payment not found"})
        
        # Update payment status
        payment.result_desc = result_desc
        
        if result_code == 0:
            # Payment successful
            payment.status = 'success'
            
            # Extract M-Pesa receipt number from callback metadata
            callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            for item in callback_metadata:
                if item.get('Name') == 'MpesaReceiptNumber':
                    payment.mpesa_receipt_number = item.get('Value')
                    break
            
            # Create transaction record
            transaction = Transaction(
                description=f"M-Pesa Payment: {payment.transaction_desc}",
                amount=payment.amount,
                transaction_type='income',
                payment_method='mpesa',
                mpesa_receipt_number=payment.mpesa_receipt_number
            )
            
            db.session.add(transaction)
            db.session.flush()  # Flush to get transaction ID
            
            # Link payment to transaction
            payment.transaction_id = transaction.id
            
        else:
            # Payment failed or was cancelled
            payment.status = 'failed' if result_code == 1 else 'cancelled'
        
        db.session.commit()
        
        # Return success response to M-Pesa
        return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"})
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error processing M-Pesa callback: {str(e)}")
        return jsonify({"ResultCode": 1, "ResultDesc": "Server error"})

@app.route('/api/mpesa/payments', methods=['GET'])
def get_mpesa_payments():
    """Get M-Pesa payment history"""
    try:
        payments = MpesaPayment.query.order_by(MpesaPayment.created_at.desc()).all()
        return jsonify({
            'success': True,
            'payments': [p.to_dict() for p in payments]
        })
    except Exception as e:
        logging.error(f"Error fetching M-Pesa payments: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch payment history'
        }), 500

@app.route('/api/mpesa/query/<int:payment_id>', methods=['GET'])
def query_mpesa_payment(payment_id):
    """Query M-Pesa payment status"""
    try:
        payment = MpesaPayment.query.get_or_404(payment_id)
        
        # Query M-Pesa API for current status
        result = mpesa_api.query_stk_push(payment.checkout_request_id)
        
        return jsonify({
            'success': True,
            'payment': payment.to_dict(),
            'query_result': result
        })
        
    except Exception as e:
        logging.error(f"Error querying M-Pesa payment: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to query payment status'
        }), 500

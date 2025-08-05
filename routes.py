from flask import render_template, request, jsonify
from app import app, db
from models import Transaction
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

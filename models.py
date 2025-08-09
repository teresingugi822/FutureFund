
from app import db
from datetime import datetime
from sqlalchemy import func
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    """Model for user accounts"""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'is_verified': self.is_verified,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

    def __repr__(self):
        return f'<User {self.email}>'

class Transaction(db.Model):
    """Model for financial transactions"""
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # 'income' or 'expense'
    payment_method = db.Column(db.String(20), default='manual', nullable=False)  # 'manual', 'mpesa'
    mpesa_receipt_number = db.Column(db.String(50), nullable=True)  # M-Pesa receipt
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert transaction to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'transaction_type': self.transaction_type,
            'payment_method': self.payment_method,
            'mpesa_receipt_number': self.mpesa_receipt_number,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def __repr__(self):
        return f'<Transaction {self.description}: {self.amount}>'

class MpesaPayment(db.Model):
    """Model for M-Pesa payment requests"""
    id = db.Column(db.Integer, primary_key=True)
    checkout_request_id = db.Column(db.String(100), unique=True, nullable=False)
    phone_number = db.Column(db.String(15), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    account_reference = db.Column(db.String(50), nullable=False)
    transaction_desc = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False)  # 'pending', 'success', 'failed', 'cancelled'
    mpesa_receipt_number = db.Column(db.String(50), nullable=True)
    result_desc = db.Column(db.String(200), nullable=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transaction.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship
    transaction = db.relationship('Transaction', backref='mpesa_payment', uselist=False)
    
    def to_dict(self):
        """Convert payment to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'checkout_request_id': self.checkout_request_id,
            'phone_number': self.phone_number,
            'amount': self.amount,
            'account_reference': self.account_reference,
            'transaction_desc': self.transaction_desc,
            'status': self.status,
            'mpesa_receipt_number': self.mpesa_receipt_number,
            'result_desc': self.result_desc,
            'transaction_id': self.transaction_id,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def __repr__(self):
        return f'<MpesaPayment {self.checkout_request_id}: {self.amount}>'

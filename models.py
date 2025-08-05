from app import db
from datetime import datetime
from sqlalchemy import func

class Transaction(db.Model):
    """Model for financial transactions"""
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # 'income' or 'expense'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert transaction to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'transaction_type': self.transaction_type,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def __repr__(self):
        return f'<Transaction {self.description}: {self.amount}>'

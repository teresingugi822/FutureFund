# FutureFund - Personal Finance Tracker

A modern web application for tracking personal finances with integrated M-Pesa payment functionality.

## Features

- **💰 Balance Tracking**: Real-time balance calculations with income and expense totals
- **📱 M-Pesa Integration**: Direct mobile money payments via Safaricom's Daraja API
- **📊 Transaction Management**: Add, view, and delete financial transactions
- **🎨 Modern UI**: Dark-themed Bootstrap interface with responsive design
- **⚡ Real-time Updates**: Instant balance updates without page refresh
- **🔒 Secure**: Environment-based configuration for API credentials

## Technologies Used

### Backend
- **Python 3.11** - Core programming language
- **Flask** - Web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Database (production) / SQLite (development)
- **Gunicorn** - WSGI HTTP Server

### Frontend
- **HTML5** & **CSS3** - Structure and styling
- **Bootstrap 5** - CSS framework with dark theme
- **Vanilla JavaScript** - Client-side functionality
- **Font Awesome** - Icons

### Integrations
- **M-Pesa Daraja API** - Mobile money payments
- **Flask-CORS** - Cross-origin resource sharing

## Installation

### Prerequisites
- Python 3.11+
- PostgreSQL (for production) or SQLite (for development)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/futurefund.git
   cd futurefund
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables**
   Create a `.env` file or set the following environment variables:
   ```
   DATABASE_URL=your_database_url
   SESSION_SECRET=your_session_secret
   MPESA_CONSUMER_KEY=your_mpesa_consumer_key
   MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
   MPESA_SHORTCODE=174379  # Sandbox shortcode
   MPESA_PASSKEY=your_mpesa_passkey
   MPESA_ENVIRONMENT=sandbox  # or 'production'
   ```

4. **Run the application**
   ```bash
   python main.py
   ```
   
   Or with Gunicorn:
   ```bash
   gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
   ```

## M-Pesa Setup

To enable M-Pesa payments:

1. Visit [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Register and create a new app
3. Select "Lipa Na M-Pesa Sandbox" for testing
4. Get your Consumer Key and Consumer Secret
5. Set the environment variables as shown above

### Test Credentials (Sandbox)
- **Shortcode**: 174379
- **Passkey**: bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
- **Test Phone**: 254708374149

## Usage

### Manual Transaction Entry
1. Navigate to the "Manual Entry" tab
2. Enter description, amount, and select income/expense
3. Click "Add Transaction"

### M-Pesa Payments
1. Switch to the "M-Pesa Payment" tab
2. Enter your phone number (format: 254XXXXXXXXX)
3. Enter the amount to deposit
4. Add a description
5. Click "Send M-Pesa Request"
6. Complete payment on your phone when prompted

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add new transaction
- `DELETE /api/transactions/<id>` - Delete transaction
- `GET /api/balance` - Get current balance

### M-Pesa
- `GET /api/mpesa/status` - Check M-Pesa configuration
- `POST /api/mpesa/initiate` - Initiate STK Push
- `POST /api/mpesa/callback` - M-Pesa callback handler
- `GET /api/mpesa/payments` - Get M-Pesa payment history
- `GET /api/mpesa/query/<id>` - Query payment status

## Database Schema

### Transaction Table
- `id` - Primary key
- `description` - Transaction description
- `amount` - Transaction amount
- `transaction_type` - 'income' or 'expense'
- `payment_method` - 'manual' or 'mpesa'
- `mpesa_receipt_number` - M-Pesa receipt (if applicable)
- `created_at` - Timestamp

### M-Pesa Payment Table
- `id` - Primary key
- `checkout_request_id` - M-Pesa checkout request ID
- `phone_number` - Customer phone number
- `amount` - Payment amount
- `status` - 'pending', 'success', 'failed', 'cancelled'
- `mpesa_receipt_number` - M-Pesa receipt number
- `transaction_id` - Link to transaction record
- `created_at` / `updated_at` - Timestamps

## Development

### Project Structure
```
├── static/
│   ├── css/
│   │   └── style.css          # Custom styles
│   └── js/
│       └── app.js             # Frontend JavaScript
├── templates/
│   └── index.html             # Main HTML template
├── app.py                     # Flask application setup
├── models.py                  # Database models
├── routes.py                  # API routes
├── mpesa_service.py           # M-Pesa integration
├── main.py                    # Application entry point
└── requirements.txt           # Python dependencies
```

### Key Features

#### Real-time Balance Updates
The application calculates and displays the current balance based on all transactions, with separate totals for income and expenses.

#### M-Pesa Integration
- STK Push for initiating payments
- Callback handling for payment confirmations
- Payment status tracking and polling
- Automatic transaction creation on successful payments

#### Responsive Design
- Mobile-friendly interface
- Bootstrap-based dark theme
- Form validation and user feedback
- Loading states and error handling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email [your-email@example.com] or open an issue in the GitHub repository.

## Acknowledgments

- [Safaricom](https://safaricom.co.ke) for the M-Pesa Daraja API
- [Bootstrap](https://getbootstrap.com) for the UI framework
- [Font Awesome](https://fontawesome.com) for the icons
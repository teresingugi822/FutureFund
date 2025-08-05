# FutureFund - Personal Finance Tracker

## Overview

FutureFund is a personal finance tracking web application that allows users to manage their income and expenses. The application provides a clean, dark-themed interface for adding, viewing, and deleting financial transactions, with real-time balance calculations and visual summaries of income vs expenses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Flask-based Python web application with modular structure
- **Database Layer**: SQLAlchemy ORM with flexible database support (defaults to SQLite for development, configurable via DATABASE_URL environment variable)
- **Application Structure**: Separation of concerns with dedicated modules:
  - `app.py`: Application factory and configuration
  - `models.py`: Database models and schemas
  - `routes.py`: API endpoints and request handling
  - `main.py`: Application entry point

### Database Design
- **Transaction Model**: Simple schema with fields for description, amount, transaction type (income/expense), and timestamp
- **Data Persistence**: SQLAlchemy handles database operations with automatic table creation
- **Connection Management**: Pool recycling and pre-ping configuration for reliability

### Frontend Architecture
- **Template Engine**: Flask's Jinja2 templating for server-side rendering
- **Styling Framework**: Bootstrap with dark theme customization
- **JavaScript Architecture**: Class-based client-side application (`FinanceTracker` class) handling:
  - Form validation and submission
  - Real-time balance calculations
  - Transaction management
  - API communication

### API Design
- **RESTful Endpoints**: JSON-based API for transaction management
- **Error Handling**: Comprehensive validation and error responses
- **Data Format**: Standardized JSON responses with success/error indicators

### Security & Configuration
- **CORS Support**: Cross-origin resource sharing enabled
- **Proxy Handling**: ProxyFix middleware for deployment flexibility
- **Environment-based Configuration**: Database URLs and session secrets via environment variables
- **Input Validation**: Server-side validation for transaction data

## External Dependencies

### Python Libraries
- **Flask**: Core web framework
- **Flask-SQLAlchemy**: Database ORM and integration
- **Flask-CORS**: Cross-origin resource sharing
- **Werkzeug**: WSGI utilities and middleware

### Frontend Libraries
- **Bootstrap**: CSS framework with dark theme variant
- **Font Awesome**: Icon library for UI elements

### Database
- **SQLite**: Default development database (configurable to PostgreSQL or other databases via DATABASE_URL)

### Deployment & Infrastructure
- **Environment Variables**: DATABASE_URL for database configuration, SESSION_SECRET for session management
- **Logging**: Python's built-in logging for debugging and monitoring
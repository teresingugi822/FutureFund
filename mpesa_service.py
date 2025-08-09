import requests
import base64
import os
from datetime import datetime
from requests.auth import HTTPBasicAuth
import logging

class MpesaAPI:
    """M-Pesa Daraja API integration service"""
    
    def __init__(self):
        # Environment configuration
        self.environment = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
        self.consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        self.shortcode = os.getenv('MPESA_SHORTCODE', '174379')  # Default sandbox shortcode
        self.passkey = os.getenv('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919')  # Default sandbox passkey
        
        # API URLs based on environment
        if self.environment == 'production':
            self.base_url = "https://api.safaricom.co.ke"
        else:
            self.base_url = "https://sandbox.safaricom.co.ke"
        
        self.token_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        self.stk_push_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        self.query_url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        
        # Validate configuration
        if not self.consumer_key or not self.consumer_secret:
            logging.warning("M-Pesa credentials not configured. Please set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET environment variables.")
    
    def is_configured(self):
        """Check if M-Pesa is properly configured"""
        return bool(self.consumer_key and self.consumer_secret)
    
    def get_access_token(self):
        """Generate access token for M-Pesa API"""
        try:
            response = requests.get(
                self.token_url,
                auth=HTTPBasicAuth(self.consumer_key, self.consumer_secret),
                timeout=30
            )
            response.raise_for_status()
            return response.json().get('access_token')
        except requests.exceptions.RequestException as e:
            logging.error(f"Error getting M-Pesa access token: {str(e)}")
            raise Exception("Failed to authenticate with M-Pesa API")
    
    def generate_password(self):
        """Generate password and timestamp for STK push"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode('utf-8')
        return password, timestamp
    
    def format_phone_number(self, phone_number):
        """Format phone number to M-Pesa format (254XXXXXXXXX)"""
        # Remove any spaces, plus signs, or dashes
        phone = phone_number.replace(' ', '').replace('+', '').replace('-', '')
        
        # Convert local format (07XXXXXXXX) to international
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        
        # Ensure it starts with 254 for Kenya
        if not phone.startswith('254'):
            phone = '254' + phone
        
        # Validate length (should be 12 digits for 254XXXXXXXXX)
        if len(phone) != 12 or not phone.isdigit():
            raise ValueError("Invalid phone number format. Use format: 254XXXXXXXXX")
        
        return phone
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc, callback_url):
        """Initiate STK push request"""
        if not self.is_configured():
            raise Exception("M-Pesa is not configured. Please contact administrator.")
        
        try:
            # Get access token
            access_token = self.get_access_token()
            
            # Generate password and timestamp
            password, timestamp = self.generate_password()
            
            # Format phone number
            formatted_phone = self.format_phone_number(phone_number)
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            # Prepare payload
            payload = {
                "BusinessShortCode": self.shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),  # M-Pesa expects integer
                "PartyA": formatted_phone,
                "PartyB": self.shortcode,
                "PhoneNumber": formatted_phone,
                "CallBackURL": callback_url,
                "AccountReference": account_reference,
                "TransactionDesc": transaction_desc
            }
            
            # Make API call
            response = requests.post(
                self.stk_push_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            result = response.json()
            
            # Check for successful request
            if response.status_code == 200 and result.get('ResponseCode') == '0':
                return {
                    'success': True,
                    'checkout_request_id': result.get('CheckoutRequestID'),
                    'merchant_request_id': result.get('MerchantRequestID'),
                    'response_code': result.get('ResponseCode'),
                    'response_description': result.get('ResponseDescription'),
                    'customer_message': result.get('CustomerMessage')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('ResponseDescription', 'STK push failed'),
                    'response_code': result.get('ResponseCode', 'Unknown')
                }
                
        except requests.exceptions.RequestException as e:
            logging.error(f"Network error during STK push: {str(e)}")
            return {
                'success': False,
                'error': 'Network error occurred. Please try again.'
            }
        except Exception as e:
            logging.error(f"Error initiating STK push: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def query_stk_push(self, checkout_request_id):
        """Query the status of STK push transaction"""
        if not self.is_configured():
            raise Exception("M-Pesa is not configured")
        
        try:
            # Get access token
            access_token = self.get_access_token()
            
            # Generate password and timestamp
            password, timestamp = self.generate_password()
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            # Prepare payload
            payload = {
                "BusinessShortCode": self.shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id
            }
            
            # Make API call
            response = requests.post(
                self.query_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            return response.json()
            
        except Exception as e:
            logging.error(f"Error querying STK push status: {str(e)}")
            return {'error': str(e)}

# Initialize global M-Pesa API instance
mpesa_api = MpesaAPI()
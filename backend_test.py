#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class ProminenceBankAPITester:
    def __init__(self, base_url="https://corebanking-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.client_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        
        # Test credentials
        self.admin_email = "admin@prominencebank.com"
        self.admin_password = "admin123"
        self.client_email = "client@example.com"
        self.client_password = "client123"

    def log_test(self, name, success, details="", error=""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")
        if error:
            print(f"    Error: {error}")
            self.failed_tests.append({"test": name, "error": error})
        if success:
            self.tests_passed += 1
        print()

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response
            
        except Exception as e:
            return False, str(e)

    def test_seed_data(self):
        """Test seeding demo data"""
        print("🌱 Testing Demo Data Seeding...")
        success, response = self.make_request('POST', '/seed', expected_status=200)
        
        if success:
            try:
                data = response.json()
                self.log_test("Seed Data", True, f"Message: {data.get('message', 'Success')}")
            except:
                self.log_test("Seed Data", True, "Data seeded successfully")
        else:
            # If already seeded, that's also OK
            if hasattr(response, 'status_code') and response.status_code == 200:
                self.log_test("Seed Data", True, "Data already seeded")
            else:
                error_msg = response.text if hasattr(response, 'text') else str(response)
                self.log_test("Seed Data", False, error=error_msg)

    def get_latest_otp(self, email):
        """Get the latest OTP for an email from backend logs"""
        try:
            import subprocess
            result = subprocess.run(['grep', f'OTP for {email}:', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True)
            if result.stdout:
                lines = result.stdout.strip().split('\n')
                if lines:
                    # Get the last line and extract OTP
                    last_line = lines[-1]
                    otp = last_line.split(': ')[-1]
                    return otp
        except:
            pass
        return None

    def test_admin_login(self):
        """Test admin login flow"""
        print("🔐 Testing Admin Login...")
        
        # Step 1: Login request
        login_data = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        
        success, response = self.make_request('POST', '/auth/login', login_data)
        
        if success:
            try:
                data = response.json()
                if data.get('requires_otp'):
                    self.log_test("Admin Login Request", True, "OTP required as expected")
                    
                    # Get real OTP from logs
                    time.sleep(1)  # Wait for log to be written
                    otp_code = self.get_latest_otp(self.admin_email)
                    
                    if otp_code:
                        otp_data = {
                            "email": self.admin_email,
                            "otp": otp_code,
                            "purpose": "login"
                        }
                        
                        # Try OTP verification with real OTP
                        otp_success, otp_response = self.make_request('POST', '/auth/verify-otp', otp_data)
                        if otp_success:
                            otp_result = otp_response.json()
                            self.admin_token = otp_result.get('token')
                            self.log_test("Admin OTP Verification", True, f"Login successful with OTP: {otp_code}")
                        else:
                            error_msg = otp_response.text if hasattr(otp_response, 'text') else str(otp_response)
                            self.log_test("Admin OTP Verification", False, error=error_msg)
                    else:
                        self.log_test("Admin OTP Verification", False, error="Could not retrieve OTP from logs")
                else:
                    self.log_test("Admin Login Request", False, error="Expected OTP requirement")
            except Exception as e:
                self.log_test("Admin Login Request", False, error=str(e))
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Admin Login Request", False, error=error_msg)

    def test_client_login(self):
        """Test client login flow"""
        print("👤 Testing Client Login...")
        
        # Step 1: Login request
        login_data = {
            "email": self.client_email,
            "password": self.client_password
        }
        
        success, response = self.make_request('POST', '/auth/login', login_data)
        
        if success:
            try:
                data = response.json()
                if data.get('requires_otp'):
                    self.log_test("Client Login Request", True, "OTP required as expected")
                    
                    # Get real OTP from logs
                    time.sleep(1)  # Wait for log to be written
                    otp_code = self.get_latest_otp(self.client_email)
                    
                    if otp_code:
                        otp_data = {
                            "email": self.client_email,
                            "otp": otp_code,
                            "purpose": "login"
                        }
                        
                        # Try OTP verification with real OTP
                        otp_success, otp_response = self.make_request('POST', '/auth/verify-otp', otp_data)
                        if otp_success:
                            otp_result = otp_response.json()
                            self.client_token = otp_result.get('token')
                            self.log_test("Client OTP Verification", True, f"Login successful with OTP: {otp_code}")
                        else:
                            error_msg = otp_response.text if hasattr(otp_response, 'text') else str(otp_response)
                            self.log_test("Client OTP Verification", False, error=error_msg)
                    else:
                        self.log_test("Client OTP Verification", False, error="Could not retrieve OTP from logs")
                else:
                    self.log_test("Client Login Request", False, error="Expected OTP requirement")
            except Exception as e:
                self.log_test("Client Login Request", False, error=str(e))
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Client Login Request", False, error=error_msg)

    def test_client_endpoints(self):
        """Test client-specific endpoints"""
        print("📊 Testing Client Endpoints...")
        
        if not self.client_token:
            print("   Skipping client endpoint tests - no valid token")
            return
        
        # Test accounts endpoint
        success, response = self.make_request('GET', '/accounts', token=self.client_token)
        if success:
            try:
                data = response.json()
                self.log_test("Accounts Endpoint", True, f"Retrieved {len(data)} accounts")
            except:
                self.log_test("Accounts Endpoint", True, "Endpoint accessible")
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Accounts Endpoint", False, error=error_msg)
        
        # Test beneficiaries endpoint
        success, response = self.make_request('GET', '/beneficiaries', token=self.client_token)
        if success:
            try:
                data = response.json()
                self.log_test("Beneficiaries Endpoint", True, f"Retrieved {len(data)} beneficiaries")
            except:
                self.log_test("Beneficiaries Endpoint", True, "Endpoint accessible")
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Beneficiaries Endpoint", False, error=error_msg)
        
        # Test instruments endpoint
        success, response = self.make_request('GET', '/instruments', token=self.client_token)
        if success:
            try:
                data = response.json()
                self.log_test("Instruments Endpoint", True, f"Retrieved {len(data)} instruments")
            except:
                self.log_test("Instruments Endpoint", True, "Endpoint accessible")
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Instruments Endpoint", False, error=error_msg)
        
        # Test tickets endpoint
        success, response = self.make_request('GET', '/tickets', token=self.client_token)
        if success:
            try:
                data = response.json()
                self.log_test("Tickets Endpoint", True, f"Retrieved {len(data)} tickets")
            except:
                self.log_test("Tickets Endpoint", True, "Endpoint accessible")
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Tickets Endpoint", False, error=error_msg)

    def test_admin_endpoints(self):
        """Test admin-specific endpoints"""
        print("⚙️ Testing Admin Endpoints...")
        
        if not self.admin_token:
            print("   Skipping admin endpoint tests - no valid token")
            return
        
        # Test admin dashboard
        success, response = self.make_request('GET', '/admin/dashboard', token=self.admin_token)
        if success:
            try:
                data = response.json()
                self.log_test("Admin Dashboard", True, f"Stats: {data.get('total_customers', 0)} customers, {data.get('total_accounts', 0)} accounts")
            except:
                self.log_test("Admin Dashboard", True, "Endpoint accessible")
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Admin Dashboard", False, error=error_msg)
        
        # Test admin customers
        success, response = self.make_request('GET', '/admin/customers', token=self.admin_token)
        if success:
            try:
                data = response.json()
                self.log_test("Admin Customers", True, f"Retrieved {len(data)} customers")
            except:
                self.log_test("Admin Customers", True, "Endpoint accessible")
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Admin Customers", False, error=error_msg)
        
        # Test admin transfers
        success, response = self.make_request('GET', '/admin/transfers', token=self.admin_token)
        if success:
            try:
                data = response.json()
                self.log_test("Admin Transfers", True, f"Retrieved {len(data)} transfers")
            except:
                self.log_test("Admin Transfers", True, "Endpoint accessible")
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Admin Transfers", False, error=error_msg)
        
        # Test admin instruments
        success, response = self.make_request('GET', '/admin/instruments', token=self.admin_token)
        if success:
            try:
                data = response.json()
                self.log_test("Admin Instruments", True, f"Retrieved {len(data)} instruments")
            except:
                self.log_test("Admin Instruments", True, "Endpoint accessible")
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Admin Instruments", False, error=error_msg)

    def test_public_endpoints(self):
        """Test publicly accessible endpoints"""
        print("🌐 Testing Public Endpoints...")
        
        # Test funding instructions
        success, response = self.make_request('GET', '/content/funding-instructions')
        if success:
            try:
                data = response.json()
                self.log_test("Funding Instructions", True, f"Content available: {len(data.get('content', ''))} chars")
            except:
                self.log_test("Funding Instructions", True, "Endpoint accessible")
        else:
            error_msg = response.text if hasattr(response, 'text') else str(response)
            self.log_test("Funding Instructions", False, error=error_msg)

    def run_all_tests(self):
        """Run all test suites"""
        print("🏦 Starting Prominence Bank API Tests")
        print("=" * 50)
        
        # Test in logical order
        self.test_seed_data()
        self.test_public_endpoints()
        self.test_admin_login()
        self.test_client_login()
        self.test_client_endpoints()
        self.test_admin_endpoints()
        
        # Print summary
        print("=" * 50)
        print(f"📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {len(self.failed_tests)}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test['test']}: {test['error']}")
        
        print("\n💡 Note: OTP verification tests are expected to fail without real OTP codes from backend logs")
        print("   To complete login testing, check /var/log/supervisor/backend.out.log for OTP codes")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ProminenceBankAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class MyProBuddyAPITester:
    def __init__(self, base_url="https://probuildergrants.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_api_health(self):
        """Test API health endpoint"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        return self.run_test("Stats Endpoint", "GET", "stats", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        result = self.run_test("User Registration", "POST", "auth/register", 200, test_user)
        if result:
            self.test_email = test_user["email"]
            self.test_password = test_user["password"]
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        if not hasattr(self, 'test_email'):
            self.log_test("User Login", False, "No test user created")
            return False
            
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        result = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if result and 'token' in result:
            self.token = result['token']
            self.user_data = result.get('user', {})
            return True
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
        
        result = self.run_test("Invalid Login", "POST", "auth/login", 401, invalid_data)
        return result is None  # Should fail

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.token:
            self.log_test("Get User Profile", False, "No auth token")
            return False
            
        return self.run_test("Get User Profile", "GET", "auth/me", 200)

    def test_screening_form_submission(self):
        """Test screening form submission"""
        if not self.token:
            self.log_test("Screening Form Submission", False, "No auth token")
            return False

        # Match the frontend payload format - combined data
        screening_data = {
            "startup_name": "Test Startup Inc",
            "founder_name": "John Doe", 
            "entity_type": "For-profit",
            "location": "Bangalore, India",
            "industry": "Technology",
            "company_size": 5,
            "description": "A test startup working on innovative technology solutions",
            "contact_email": self.test_email,
            "contact_phone": "+91 9876543210",
            "stage": "Start-up",
            "revenue": 50000.0,
            "stability": "Good",
            "demographic": "General",
            "track_record": 2,
            "past_grant_experience": "No",
            "past_grant_description": ""
        }
        
        result = self.run_test("Screening Form Submission", "POST", "screening/submit", 200, screening_data)
        if result:
            print(f"   Matches found: {result.get('matches_found', 0)}")
            return True
        return False

    def test_get_grant_matches(self):
        """Test getting grant matches"""
        if not self.token:
            self.log_test("Get Grant Matches", False, "No auth token")
            return False
            
        result = self.run_test("Get Grant Matches", "GET", "grants/matches", 200)
        if result:
            grants = result.get('grants', [])
            tier = result.get('tier', 'unknown')
            print(f"   Found {len(grants)} grants for {tier} tier")
            
            # Validate grant structure
            if grants:
                grant = grants[0]
                required_fields = ['grant_id', 'name', 'relevance_score', 'funding_amount', 'soft_approval']
                missing_fields = [field for field in required_fields if field not in grant]
                if missing_fields:
                    self.log_test("Grant Structure Validation", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Grant Structure Validation", True, "All required fields present")
            
            return True
        return False

    def test_coupon_validation_valid(self):
        """Test valid coupon validation"""
        if not self.token:
            self.log_test("Valid Coupon Validation", False, "No auth token")
            return False
            
        coupon_data = {"code": "GRANT199"}
        result = self.run_test("Valid Coupon Validation", "POST", "coupon/validate", 200, coupon_data)
        if result:
            print(f"   Upgraded to: {result.get('tier', 'unknown')}")
            return True
        return False

    def test_coupon_validation_invalid(self):
        """Test invalid coupon validation"""
        if not self.token:
            self.log_test("Invalid Coupon Validation", False, "No auth token")
            return False
            
        coupon_data = {"code": "INVALID123"}
        result = self.run_test("Invalid Coupon Validation", "POST", "coupon/validate", 404, coupon_data)
        return result is None  # Should fail

    def test_all_grants_endpoint(self):
        """Test all grants endpoint"""
        if not self.token:
            self.log_test("All Grants Endpoint", False, "No auth token")
            return False
            
        result = self.run_test("All Grants Endpoint", "GET", "grants/all", 200)
        if result:
            grants = result.get('grants', [])
            print(f"   Total grants available: {len(grants)}")
            return True
        return False

    def test_unauthorized_access(self):
        """Test unauthorized access"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        result = self.run_test("Unauthorized Access", "GET", "auth/me", 401)
        success = result is None  # Should fail
        
        # Restore token
        self.token = temp_token
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting MyProBuddy API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Basic API tests
        self.test_api_health()
        self.test_stats_endpoint()
        
        # Authentication tests
        if self.test_user_registration():
            self.test_user_login()
            self.test_invalid_login()
            
            if self.token:
                # Authenticated tests
                self.test_get_user_profile()
                self.test_unauthorized_access()
                
                # Screening and matching tests
                self.test_screening_form_submission()
                
                # Wait a moment for AI processing
                print("⏳ Waiting for AI grant matching to complete...")
                time.sleep(3)
                
                self.test_get_grant_matches()
                self.test_all_grants_endpoint()
                
                # Coupon tests
                self.test_coupon_validation_valid()
                self.test_coupon_validation_invalid()

        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

    def get_test_summary(self):
        """Get test summary for reporting"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = MyProBuddyAPITester()
    exit_code = tester.run_all_tests()
    
    # Save detailed results
    summary = tester.get_test_summary()
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())
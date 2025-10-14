import requests
import sys
import json
from datetime import datetime, timedelta

class nQCrmAPITester:
    def __init__(self, base_url="https://nextcrm-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_result(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                details = f"Expected {expected_status}, got {response.status_code}"
                if response.text:
                    details += f" - {response.text[:200]}"
                self.log_result(name, False, details)
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test login with correct credentials
        success, response = self.run_test(
            "Login with correct credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@nqcrm.com", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            
            # Test get current user
            self.run_test(
                "Get current user info",
                "GET",
                "auth/me",
                200
            )
        else:
            print("❌ Failed to get authentication token - stopping tests")
            return False
            
        # Test login with wrong credentials
        self.run_test(
            "Login with wrong credentials",
            "POST",
            "auth/login",
            401,
            data={"email": "admin@nqcrm.com", "password": "wrongpassword"}
        )
        
        return True

    def test_metrics(self):
        """Test metrics endpoint"""
        print("\n" + "="*50)
        print("TESTING METRICS")
        print("="*50)
        
        success, response = self.run_test(
            "Get dashboard metrics",
            "GET",
            "metrics",
            200
        )
        
        if success:
            required_fields = ['total_revenue', 'active_projects', 'total_clients', 'mrr']
            for field in required_fields:
                if field in response:
                    print(f"   ✓ {field}: {response[field]}")
                else:
                    self.log_result(f"Metrics missing {field}", False, f"Field {field} not found in response")

    def test_clients(self):
        """Test clients CRUD operations"""
        print("\n" + "="*50)
        print("TESTING CLIENTS")
        print("="*50)
        
        # Get all clients
        success, clients_response = self.run_test(
            "Get all clients",
            "GET",
            "clients",
            200
        )
        
        if success:
            print(f"   Found {len(clients_response)} clients")
        
        # Create new client
        test_client_data = {
            "name": "Test Client",
            "email": "test@example.com",
            "company": "Test Company",
            "phone": "+1-555-0123"
        }
        
        success, create_response = self.run_test(
            "Create new client",
            "POST",
            "clients",
            200,
            data=test_client_data
        )
        
        client_id = None
        if success and 'id' in create_response:
            client_id = create_response['id']
            print(f"   Created client with ID: {client_id}")
            
            # Get specific client
            self.run_test(
                "Get specific client",
                "GET",
                f"clients/{client_id}",
                200
            )
            
            # Update client
            update_data = {"name": "Updated Test Client"}
            self.run_test(
                "Update client",
                "PATCH",
                f"clients/{client_id}",
                200,
                data=update_data
            )
            
            # Delete client
            self.run_test(
                "Delete client",
                "DELETE",
                f"clients/{client_id}",
                200
            )
        
        return client_id

    def test_projects(self):
        """Test projects CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PROJECTS")
        print("="*50)
        
        # Get all projects
        success, projects_response = self.run_test(
            "Get all projects",
            "GET",
            "projects",
            200
        )
        
        if success:
            print(f"   Found {len(projects_response)} projects")
            
        # Get clients first for project creation
        success, clients_response = self.run_test(
            "Get clients for project creation",
            "GET",
            "clients",
            200
        )
        
        if success and len(clients_response) > 0:
            client_id = clients_response[0]['id']
            
            # Create new project
            test_project_data = {
                "title": "Test Project",
                "client_id": client_id,
                "status": "active",
                "total_value": 5000.0,
                "deadline": (datetime.now() + timedelta(days=30)).isoformat()
            }
            
            success, create_response = self.run_test(
                "Create new project",
                "POST",
                "projects",
                200,
                data=test_project_data
            )
            
            if success and 'id' in create_response:
                project_id = create_response['id']
                print(f"   Created project with ID: {project_id}")
                
                # Get specific project
                self.run_test(
                    "Get specific project",
                    "GET",
                    f"projects/{project_id}",
                    200
                )
                
                # Update project
                update_data = {"status": "completed"}
                self.run_test(
                    "Update project",
                    "PATCH",
                    f"projects/{project_id}",
                    200,
                    data=update_data
                )
                
                return project_id
        
        return None

    def test_invoices(self):
        """Test invoices CRUD operations"""
        print("\n" + "="*50)
        print("TESTING INVOICES")
        print("="*50)
        
        # Get all invoices
        success, invoices_response = self.run_test(
            "Get all invoices",
            "GET",
            "invoices",
            200
        )
        
        if success:
            print(f"   Found {len(invoices_response)} invoices")
            
        # Get clients for invoice creation
        success, clients_response = self.run_test(
            "Get clients for invoice creation",
            "GET",
            "clients",
            200
        )
        
        if success and len(clients_response) > 0:
            client_id = clients_response[0]['id']
            
            # Create new invoice
            test_invoice_data = {
                "client_id": client_id,
                "amount": 1500.0,
                "due_date": (datetime.now() + timedelta(days=30)).isoformat()
            }
            
            success, create_response = self.run_test(
                "Create new invoice",
                "POST",
                "invoices",
                200,
                data=test_invoice_data
            )
            
            if success and 'id' in create_response:
                invoice_id = create_response['id']
                print(f"   Created invoice with ID: {invoice_id}")
                
                # Get specific invoice
                self.run_test(
                    "Get specific invoice",
                    "GET",
                    f"invoices/{invoice_id}",
                    200
                )
                
                # Update invoice status
                update_data = {"status": "paid"}
                self.run_test(
                    "Update invoice status",
                    "PATCH",
                    f"invoices/{invoice_id}",
                    200,
                    data=update_data
                )
                
                return invoice_id
        
        return None

    def test_payments(self):
        """Test payments endpoints"""
        print("\n" + "="*50)
        print("TESTING PAYMENTS")
        print("="*50)
        
        # Get all payments
        success, payments_response = self.run_test(
            "Get all payments",
            "GET",
            "payments",
            200
        )
        
        if success:
            print(f"   Found {len(payments_response)} payments")
            
        # Get payment transactions
        self.run_test(
            "Get payment transactions",
            "GET",
            "payments/transactions",
            200
        )

    def test_activity(self):
        """Test activity endpoint"""
        print("\n" + "="*50)
        print("TESTING ACTIVITY")
        print("="*50)
        
        success, activity_response = self.run_test(
            "Get recent activity",
            "GET",
            "activity?limit=10",
            200
        )
        
        if success:
            print(f"   Found {len(activity_response)} activities")

    def test_charts(self):
        """Test chart data endpoints"""
        print("\n" + "="*50)
        print("TESTING CHART DATA")
        print("="*50)
        
        # Test revenue chart data
        success, revenue_data = self.run_test(
            "Get revenue chart data",
            "GET",
            "charts/revenue",
            200
        )
        
        if success:
            print(f"   Revenue data points: {len(revenue_data)}")
            
        # Test payments chart data
        success, payments_data = self.run_test(
            "Get payments chart data",
            "GET",
            "charts/payments",
            200
        )
        
        if success:
            print(f"   Payments data points: {len(payments_data)}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting nQCrm API Tests")
        print(f"Base URL: {self.base_url}")
        
        # Test authentication first
        if not self.test_authentication():
            return False
            
        # Test all other endpoints
        self.test_metrics()
        self.test_clients()
        self.test_projects()
        self.test_invoices()
        self.test_payments()
        self.test_activity()
        self.test_charts()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = nQCrmAPITester()
    
    try:
        tester.run_all_tests()
        success = tester.print_summary()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
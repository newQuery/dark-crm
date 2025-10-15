import requests
import sys
import json
from datetime import datetime, timedelta

class nQCrmAPITester:
    def __init__(self, base_url="https://darkcrm-app.preview.emergentagent.com"):
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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
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
            "POST /api/auth/login (valid credentials)",
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
                "GET /api/auth/me (with token)",
                "GET",
                "auth/me",
                200
            )
        else:
            print("❌ Failed to get authentication token - stopping tests")
            return False
            
        return True

    def test_dashboard_endpoints(self):
        """Test dashboard related endpoints"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD ENDPOINTS")
        print("="*50)
        
        # Test metrics
        success, response = self.run_test(
            "GET /api/metrics",
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

        # Test revenue chart
        self.run_test(
            "GET /api/charts/revenue",
            "GET",
            "charts/revenue",
            200
        )
        
        # Test payments chart
        self.run_test(
            "GET /api/charts/payments",
            "GET",
            "charts/payments",
            200
        )
        
        # Test activity
        self.run_test(
            "GET /api/activity?limit=10",
            "GET",
            "activity?limit=10",
            200
        )

    def test_clients_crud(self):
        """Test clients CRUD operations"""
        print("\n" + "="*50)
        print("TESTING CLIENTS CRUD")
        print("="*50)
        
        # Get all clients with pagination
        success, clients_response = self.run_test(
            "GET /api/clients?page=1&page_size=10",
            "GET",
            "clients?page=1&page_size=10",
            200
        )
        
        if success:
            items = clients_response.get('items', [])
            meta = clients_response.get('meta', {})
            print(f"   Found {len(items)} clients (total: {meta.get('total', 0)})")
            
            # Validate pagination structure
            if 'meta' in clients_response:
                required_meta_fields = ['total', 'page', 'page_size', 'total_pages']
                for field in required_meta_fields:
                    if field not in meta:
                        self.log_result(f"Clients pagination missing {field}", False, f"Meta field {field} not found")
        
        # Create new client
        test_client_data = {
            "name": "Test Client API",
            "email": "testapi@example.com",
            "company": "Test API Company",
            "phone": "+1-555-0199"
        }
        
        success, create_response = self.run_test(
            "POST /api/clients (create)",
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
                "GET /api/clients/{id}",
                "GET",
                f"clients/{client_id}",
                200
            )
            
            # Update client
            update_data = {"name": "Updated Test Client API"}
            self.run_test(
                "PUT /api/clients/{id}",
                "PATCH",
                f"clients/{client_id}",
                200,
                data=update_data
            )
            
            # Delete client
            self.run_test(
                "DELETE /api/clients/{id}",
                "DELETE",
                f"clients/{client_id}",
                200
            )
        
        return client_id

    def test_projects_crud(self):
        """Test projects CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PROJECTS CRUD")
        print("="*50)
        
        # Get all projects with pagination
        success, projects_response = self.run_test(
            "GET /api/projects?page=1&page_size=10",
            "GET",
            "projects?page=1&page_size=10",
            200
        )
        
        if success:
            items = projects_response.get('items', [])
            meta = projects_response.get('meta', {})
            print(f"   Found {len(items)} projects (total: {meta.get('total', 0)})")
            
        # Get clients first for project creation
        success, clients_response = self.run_test(
            "GET /api/clients (for project creation)",
            "GET",
            "clients",
            200
        )
        
        if success and len(clients_response.get('items', [])) > 0:
            client_id = clients_response['items'][0]['id']
            
            # Create new project
            test_project_data = {
                "title": "Test API Project",
                "client_id": client_id,
                "status": "active",
                "total_value": 5000.0,
                "deadline": (datetime.now() + timedelta(days=30)).isoformat()
            }
            
            success, create_response = self.run_test(
                "POST /api/projects (create)",
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
                    "GET /api/projects/{id}",
                    "GET",
                    f"projects/{project_id}",
                    200
                )
                
                # Update project
                update_data = {"status": "completed"}
                self.run_test(
                    "PUT /api/projects/{id}",
                    "PATCH",
                    f"projects/{project_id}",
                    200,
                    data=update_data
                )
                
                # Delete project
                self.run_test(
                    "DELETE /api/projects/{id}",
                    "DELETE",
                    f"projects/{project_id}",
                    200
                )
                
                return project_id
        
        return None

    def test_invoices_crud(self):
        """Test invoices CRUD operations"""
        print("\n" + "="*50)
        print("TESTING INVOICES CRUD")
        print("="*50)
        
        # Get all invoices with pagination
        success, invoices_response = self.run_test(
            "GET /api/invoices?page=1&page_size=10",
            "GET",
            "invoices?page=1&page_size=10",
            200
        )
        
        if success:
            items = invoices_response.get('items', [])
            meta = invoices_response.get('meta', {})
            print(f"   Found {len(items)} invoices (total: {meta.get('total', 0)})")
            
            # Test getting specific invoice if any exist
            if len(items) > 0:
                invoice_id = items[0]['id']
                self.run_test(
                    "GET /api/invoices/{id}",
                    "GET",
                    f"invoices/{invoice_id}",
                    200
                )

    def test_payments_crud(self):
        """Test payments CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PAYMENTS CRUD")
        print("="*50)
        
        # Get all payments with pagination
        success, payments_response = self.run_test(
            "GET /api/payments?page=1&page_size=10",
            "GET",
            "payments?page=1&page_size=10",
            200
        )
        
        if success:
            items = payments_response.get('items', [])
            meta = payments_response.get('meta', {})
            print(f"   Found {len(items)} payments (total: {meta.get('total', 0)})")
            
            # Test getting specific payment if any exist
            if len(items) > 0:
                payment_id = items[0]['id']
                self.run_test(
                    "GET /api/payments/{id}",
                    "GET",
                    f"payments/{payment_id}",
                    200
                )

    def test_users_crud(self):
        """Test users CRUD operations"""
        print("\n" + "="*50)
        print("TESTING USERS CRUD")
        print("="*50)
        
        # Get all users with pagination
        success, users_response = self.run_test(
            "GET /api/users?page=1&page_size=10",
            "GET",
            "users?page=1&page_size=10",
            200
        )
        
        if success:
            items = users_response.get('items', [])
            meta = users_response.get('meta', {})
            print(f"   Found {len(items)} users (total: {meta.get('total', 0)})")
            
            # Test getting specific user if any exist
            if len(items) > 0:
                user_id = items[0]['id']
                self.run_test(
                    "GET /api/users/{id}",
                    "GET",
                    f"users/{user_id}",
                    200
                )

    def run_all_tests(self):
        """Run all API tests as specified in the review request"""
        print("🚀 Starting nQCrm Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("Testing all endpoints to ensure UI/UX changes didn't break backend functionality")
        
        # Test authentication first
        if not self.test_authentication():
            return False
            
        # Test all other endpoints as specified in review request
        self.test_dashboard_endpoints()
        self.test_clients_crud()
        self.test_projects_crud()
        self.test_invoices_crud()
        self.test_payments_crud()
        self.test_users_crud()
        
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
        else:
            print(f"\n✅ ALL TESTS PASSED!")
        
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
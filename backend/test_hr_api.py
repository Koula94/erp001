from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from hr.models import Employee, PayrollRecord, LeaveRequest, PerformanceReview

User = get_user_model()


class HRAPITestCase(APITestCase):
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@sofixe.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        
        self.manager_user = User.objects.create_user(
            username='manager',
            email='manager@sofixe.com',
            password='managerpass123',
            first_name='Manager',
            last_name='User',
            position='HR Manager',
            department='HR'
        )
        
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@sofixe.com',
            password='employeepass123',
            first_name='John',
            last_name='Doe',
            position='Developer',
            department='Engineering'
        )
        
        # Create employee records
        self.employee = Employee.objects.create(
            user=self.employee_user,
            employee_id='EMP001',
            hire_date='2023-01-15',
            salary=50000.00,
            status='active',
            skills=['Python', 'Django', 'React']
        )
        
        self.manager_employee = Employee.objects.create(
            user=self.manager_user,
            employee_id='EMP002',
            hire_date='2022-06-01',
            salary=75000.00,
            status='active',
            skills=['Management', 'HR', 'Leadership']
        )
        
        # Create payroll record
        self.payroll = PayrollRecord.objects.create(
            month='January 2025',
            total_payroll=125000.00,
            employee_count=2,
            status='processed',
            processed_date='2025-01-31'
        )
        
        # Create leave request
        self.leave_request = LeaveRequest.objects.create(
            employee=self.employee,
            type='vacation',
            start_date='2025-02-01',
            end_date='2025-02-05',
            days=5,
            status='pending',
            reason='Annual vacation'
        )
        
        # Create performance review
        self.performance_review = PerformanceReview.objects.create(
            employee=self.employee,
            review_date='2024-12-15',
            reviewer=self.manager_user,
            rating=4.5,
            strengths='Excellent technical skills and team collaboration',
            improvements='Could improve documentation skills',
            goals='Lead a major project in Q1 2025'
        )


class EmployeeAPITests(HRAPITestCase):
    def test_list_employees(self):
        """Test listing all employees"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('employee-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_create_employee(self):
        """Test creating a new employee"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('employee-list')
        
        # Create a new user first
        new_user = User.objects.create_user(
            username='newemployee',
            email='newemployee@sofixe.com',
            password='newpass123',
            first_name='Jane',
            last_name='Smith',
            position='Designer',
            department='Design'
        )
        
        data = {
            'user': new_user.id,
            'employee_id': 'EMP003',
            'hire_date': '2024-03-01',
            'salary': '45000.00',
            'status': 'active',
            'skills': ['UI/UX', 'Figma', 'Adobe Creative Suite']
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Employee.objects.count(), 3)

    def test_retrieve_employee(self):
        """Test retrieving a specific employee"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('employee-detail', args=[self.employee.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['employee_id'], 'EMP001')

    def test_update_employee(self):
        """Test updating an employee"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('employee-detail', args=[self.employee.id])
        data = {
            'salary': '55000.00',
            'status': 'active'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertEqual(str(self.employee.salary), '55000.00')

    def test_delete_employee(self):
        """Test deleting an employee"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('employee-detail', args=[self.employee.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Employee.objects.count(), 1)


class PayrollAPITests(HRAPITestCase):
    def test_list_payroll_records(self):
        """Test listing all payroll records"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('payrollrecord-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_payroll_record(self):
        """Test creating a new payroll record"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('payrollrecord-list')
        data = {
            'month': 'February 2025',
            'total_payroll': '130000.00',
            'employee_count': 2,
            'status': 'pending'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PayrollRecord.objects.count(), 2)

    def test_retrieve_payroll_record(self):
        """Test retrieving a specific payroll record"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('payrollrecord-detail', args=[self.payroll.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['month'], 'January 2025')

    def test_update_payroll_record(self):
        """Test updating a payroll record"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('payrollrecord-detail', args=[self.payroll.id])
        data = {
            'status': 'processed',
            'processed_date': '2025-01-31'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.payroll.refresh_from_db()
        self.assertEqual(self.payroll.status, 'processed')


class LeaveRequestAPITests(HRAPITestCase):
    def test_list_leave_requests(self):
        """Test listing all leave requests"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('leaverequest-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_leave_request(self):
        """Test creating a new leave request"""
        self.client.force_authenticate(user=self.manager_user)
        url = reverse('leaverequest-list')
        data = {
            'employee': self.manager_employee.id,
            'type': 'sick',
            'start_date': '2025-02-10',
            'end_date': '2025-02-11',
            'days': 2,
            'reason': 'Medical appointment',
            'status': 'pending'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LeaveRequest.objects.count(), 2)

    def test_approve_leave_request(self):
        """Test approving a leave request"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('leaverequest-detail', args=[self.leave_request.id])
        data = {'status': 'approved'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.leave_request.refresh_from_db()
        self.assertEqual(self.leave_request.status, 'approved')

    def test_reject_leave_request(self):
        """Test rejecting a leave request"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('leaverequest-detail', args=[self.leave_request.id])
        data = {'status': 'rejected'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.leave_request.refresh_from_db()
        self.assertEqual(self.leave_request.status, 'rejected')


class PerformanceReviewAPITests(HRAPITestCase):
    def test_list_performance_reviews(self):
        """Test listing all performance reviews"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('performancereview-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_performance_review(self):
        """Test creating a new performance review"""
        self.client.force_authenticate(user=self.manager_user)
        url = reverse('performancereview-list')
        data = {
            'employee': self.manager_employee.id,
            'review_date': '2025-01-20',
            'reviewer': self.admin_user.id,
            'rating': '4.8',
            'strengths': 'Excellent leadership and strategic thinking',
            'improvements': 'Could delegate more tasks',
            'goals': 'Expand team and take on more strategic projects'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PerformanceReview.objects.count(), 2)

    def test_retrieve_performance_review(self):
        """Test retrieving a specific performance review"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('performancereview-detail', args=[self.performance_review.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['rating']), 4.5)

    def test_update_performance_review(self):
        """Test updating a performance review"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('performancereview-detail', args=[self.performance_review.id])
        data = {
            'rating': '4.7',
            'goals': 'Lead two major projects and mentor junior developers'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.performance_review.refresh_from_db()
        self.assertEqual(str(self.performance_review.rating), '4.7')


class HRAPIFilterTests(HRAPITestCase):
    def test_filter_employees_by_status(self):
        """Test filtering employees by status"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('employee-list') + '?status=active'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_search_employees(self):
        """Test searching employees"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('employee-list') + '?search=EMP001'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['employee_id'], 'EMP001')

    def test_filter_leave_requests_by_type(self):
        """Test filtering leave requests by type"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('leaverequest-list') + '?type=vacation'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['type'], 'vacation')

    def test_filter_payroll_by_status(self):
        """Test filtering payroll records by status"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('payrollrecord-list') + '?status=processed'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], 'processed')

# HR Module API Documentation

## Overview
The HR module provides comprehensive employee management functionality including employee records, payroll processing, leave management, and performance reviews.

## Base URL
```
http://localhost:8000/api/hr/
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### Employees

#### List Employees
- **URL**: `/employees/`
- **Method**: `GET`
- **Description**: Retrieve a list of all employees
- **Query Parameters**:
  - `search`: Search by employee ID or name
  - `status`: Filter by status (active, on-leave, inactive)
  - `ordering`: Order by fields (hire_date, salary)

**Response**:
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 1,
      "employee_id": "EMP001",
      "hire_date": "2023-01-15",
      "salary": "50000.00",
      "status": "active",
      "skills": ["Python", "Django", "React"],
      "performance_rating": "4.5",
      "user_details": {
        "id": 1,
        "email": "john.doe@sofixe.com",
        "first_name": "John",
        "last_name": "Doe",
        "position": "Developer",
        "department": "Engineering",
        "phone": "+1234567890"
      },
      "name": "John Doe",
      "email": "john.doe@sofixe.com",
      "phone": "+1234567890",
      "position": "Developer",
      "department": "Engineering"
    }
  ]
}
```

#### Create Employee
- **URL**: `/employees/`
- **Method**: `POST`
- **Description**: Create a new employee record
- **Body**:
```json
{
  "user": 1,
  "employee_id": "EMP003",
  "hire_date": "2024-03-01",
  "salary": "45000.00",
  "status": "active",
  "skills": ["UI/UX", "Figma"]
}
```

#### Retrieve Employee
- **URL**: `/employees/{id}/`
- **Method**: `GET`
- **Description**: Retrieve a specific employee

#### Update Employee
- **URL**: `/employees/{id}/`
- **Method**: `PUT` or `PATCH`
- **Description**: Update an employee record
- **Body** (PATCH example):
```json
{
  "salary": "55000.00",
  "status": "active"
}
```

#### Delete Employee
- **URL**: `/employees/{id}/`
- **Method**: `DELETE`
- **Description**: Delete an employee record

### Payroll Records

#### List Payroll Records
- **URL**: `/payroll/`
- **Method**: `GET`
- **Description**: Retrieve all payroll records
- **Query Parameters**:
  - `status`: Filter by status (pending, processed)
  - `ordering`: Order by created_at

**Response**:
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "month": "January 2025",
      "total_payroll": "125000.00",
      "employee_count": 2,
      "status": "processed",
      "processed_date": "2025-01-31",
      "created_at": "2025-01-31T10:00:00Z"
    }
  ]
}
```

#### Create Payroll Record
- **URL**: `/payroll/`
- **Method**: `POST`
- **Description**: Create a new payroll record
- **Body**:
```json
{
  "month": "February 2025",
  "total_payroll": "130000.00",
  "employee_count": 2,
  "status": "pending"
}
```

#### Update Payroll Record
- **URL**: `/payroll/{id}/`
- **Method**: `PUT` or `PATCH`
- **Description**: Update a payroll record
- **Body** (PATCH example):
```json
{
  "status": "processed",
  "processed_date": "2025-02-28"
}
```

### Leave Requests

#### List Leave Requests
- **URL**: `/leave-requests/`
- **Method**: `GET`
- **Description**: Retrieve all leave requests
- **Query Parameters**:
  - `status`: Filter by status (pending, approved, rejected)
  - `type`: Filter by type (vacation, sick, personal)
  - `employee`: Filter by employee ID
  - `ordering`: Order by created_at, start_date

**Response**:
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "employee": 1,
      "employee_name": "John Doe",
      "type": "vacation",
      "start_date": "2025-02-01",
      "end_date": "2025-02-05",
      "days": 5,
      "status": "pending",
      "reason": "Annual vacation",
      "created_at": "2025-01-15T14:30:00Z"
    }
  ]
}
```

#### Create Leave Request
- **URL**: `/leave-requests/`
- **Method**: `POST`
- **Description**: Create a new leave request
- **Body**:
```json
{
  "employee": 1,
  "type": "sick",
  "start_date": "2025-02-10",
  "end_date": "2025-02-11",
  "days": 2,
  "reason": "Medical appointment",
  "status": "pending"
}
```

#### Approve/Reject Leave Request
- **URL**: `/leave-requests/{id}/`
- **Method**: `PATCH`
- **Description**: Update leave request status
- **Body**:
```json
{
  "status": "approved"
}
```

### Performance Reviews

#### List Performance Reviews
- **URL**: `/performance-reviews/`
- **Method**: `GET`
- **Description**: Retrieve all performance reviews
- **Query Parameters**:
  - `employee`: Filter by employee ID
  - `ordering`: Order by review_date

**Response**:
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "employee": 1,
      "employee_name": "John Doe",
      "review_date": "2024-12-15",
      "reviewer": 2,
      "reviewer_name": "Manager User",
      "rating": "4.5",
      "strengths": "Excellent technical skills and team collaboration",
      "improvements": "Could improve documentation skills",
      "goals": "Lead a major project in Q1 2025"
    }
  ]
}
```

#### Create Performance Review
- **URL**: `/performance-reviews/`
- **Method**: `POST`
- **Description**: Create a new performance review
- **Body**:
```json
{
  "employee": 1,
  "review_date": "2025-01-20",
  "reviewer": 2,
  "rating": "4.8",
  "strengths": "Excellent leadership and strategic thinking",
  "improvements": "Could delegate more tasks",
  "goals": "Expand team and take on more strategic projects"
}
```

#### Update Performance Review
- **URL**: `/performance-reviews/{id}/`
- **Method**: `PUT` or `PATCH`
- **Description**: Update a performance review
- **Body** (PATCH example):
```json
{
  "rating": "4.7",
  "goals": "Lead two major projects and mentor junior developers"
}
```

## Data Models

### Employee
```python
{
    "id": "integer",
    "user": "integer (User ID)",
    "employee_id": "string",
    "hire_date": "date",
    "salary": "decimal",
    "status": "string (active, on-leave, inactive)",
    "skills": "array of strings",
    "performance_rating": "decimal (nullable)"
}
```

### PayrollRecord
```python
{
    "id": "integer",
    "month": "string",
    "total_payroll": "decimal",
    "employee_count": "integer",
    "status": "string (pending, processed)",
    "processed_date": "date (nullable)",
    "created_at": "datetime"
}
```

### LeaveRequest
```python
{
    "id": "integer",
    "employee": "integer (Employee ID)",
    "type": "string (vacation, sick, personal)",
    "start_date": "date",
    "end_date": "date",
    "days": "integer",
    "status": "string (pending, approved, rejected)",
    "reason": "text",
    "created_at": "datetime"
}
```

### PerformanceReview
```python
{
    "id": "integer",
    "employee": "integer (Employee ID)",
    "review_date": "date",
    "reviewer": "integer (User ID)",
    "rating": "decimal",
    "strengths": "text",
    "improvements": "text",
    "goals": "text"
}
```

## Error Responses

### Common HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": "Error message description",
  "details": {
    "field_name": ["Error description for specific field"]
  }
}
```

## Examples

### Create Employee with User
1. First create a User:
```bash
POST /api/users/register/
{
  "email": "new.employee@sofixe.com",
  "password": "password123",
  "first_name": "Jane",
  "last_name": "Smith",
  "position": "Designer",
  "department": "Design"
}
```

2. Then create Employee record:
```bash
POST /api/hr/employees/
{
  "user": 3,
  "employee_id": "EMP003",
  "hire_date": "2024-03-01",
  "salary": "45000.00",
  "status": "active",
  "skills": ["UI/UX", "Figma"]
}
```

### Process Monthly Payroll
```bash
POST /api/hr/payroll/
{
  "month": "March 2025",
  "total_payroll": "135000.00",
  "employee_count": 3,
  "status": "pending"
}
```

### Submit Leave Request
```bash
POST /api/hr/leave-requests/
{
  "employee": 1,
  "type": "vacation",
  "start_date": "2025-03-15",
  "end_date": "2025-03-22",
  "days": 6,
  "reason": "Family vacation",
  "status": "pending"
}
```

## Testing
Run the HR API tests:
```bash
cd backend
python manage.py test test_hr_api
```

## Permissions
- **Admin Users**: Full access to all HR endpoints
- **HR Managers**: Can manage employees, leave requests, and performance reviews
- **Regular Employees**: Limited access (view own records, submit leave requests)

# Finance API Documentation

## Overview
The Finance module provides comprehensive financial management capabilities including invoicing, expense tracking, and budget management.

## Base URL
```
/api/finance/
```

## Authentication
All endpoints require authentication using JWT tokens.

## Endpoints

### Invoices

#### List Invoices
- **URL**: `/api/finance/invoices/`
- **Method**: `GET`
- **Query Parameters**:
  - `search`: Search by invoice number or client name
  - `status`: Filter by status (draft, sent, paid, overdue)
  - `client`: Filter by client ID
  - `project`: Filter by project ID
  - `ordering`: Order by issue_date, amount, due_date

#### Create Invoice
- **URL**: `/api/finance/invoices/`
- **Method**: `POST`
- **Body**:
```json
{
  "client": 1,
  "project": 1,
  "invoice_number": "INV-001",
  "amount": 1000.00,
  "status": "draft",
  "issue_date": "2024-01-01",
  "due_date": "2024-02-01",
  "items": [
    {
      "description": "Service 1",
      "quantity": 2,
      "unit_price": 500.00
    }
  ]
}
```

#### Retrieve Invoice
- **URL**: `/api/finance/invoices/{id}/`
- **Method**: `GET`

#### Update Invoice
- **URL**: `/api/finance/invoices/{id}/`
- **Method**: `PUT` or `PATCH`

#### Delete Invoice
- **URL**: `/api/finance/invoices/{id}/`
- **Method**: `DELETE`

#### Custom Invoice Actions

##### Mark as Paid
- **URL**: `/api/finance/invoices/{id}/mark_as_paid/`
- **Method**: `POST`
- **Body**:
```json
{
  "paid_date": "2024-01-15"
}
```

##### Get Overdue Invoices
- **URL**: `/api/finance/invoices/overdue/`
- **Method**: `GET`

##### Get Invoice Summary
- **URL**: `/api/finance/invoices/summary/`
- **Method**: `GET`
- **Response**:
```json
{
  "total_invoices": 25,
  "total_amount": 50000.00,
  "paid_amount": 35000.00,
  "overdue_count": 3,
  "outstanding_amount": 15000.00
}
```

### Expenses

#### List Expenses
- **URL**: `/api/finance/expenses/`
- **Method**: `GET`
- **Query Parameters**:
  - `search`: Search by description
  - `status`: Filter by status (pending, approved, rejected)
  - `category`: Filter by category
  - `project`: Filter by project ID
  - `ordering`: Order by date, amount

#### Create Expense
- **URL**: `/api/finance/expenses/`
- **Method**: `POST`
- **Body**:
```json
{
  "project": 1,
  "category": "materials",
  "amount": 250.00,
  "description": "Office supplies",
  "date": "2024-01-15",
  "submitted_by": 1
}
```

#### Custom Expense Actions

##### Approve Expense
- **URL**: `/api/finance/expenses/{id}/approve/`
- **Method**: `POST`

##### Reject Expense
- **URL**: `/api/finance/expenses/{id}/reject/`
- **Method**: `POST`

##### Expenses by Category
- **URL**: `/api/finance/expenses/by_category/`
- **Method**: `GET`
- **Response**:
```json
[
  {
    "category": "materials",
    "total_amount": 1250.00,
    "count": 5
  }
]
```

### Budgets

#### List Budgets
- **URL**: `/api/finance/budgets/`
- **Method**: `GET`
- **Query Parameters**:
  - `project`: Filter by project ID
  - `department`: Filter by department
  - `ordering`: Order by period_start

#### Create Budget
- **URL**: `/api/finance/budgets/`
- **Method**: `POST`
- **Body**:
```json
{
  "project": 1,
  "category": "Development",
  "planned_amount": 5000.00,
  "spent_amount": 1250.00,
  "period_start": "2024-01-01",
  "period_end": "2024-12-31"
}
```

#### Custom Budget Actions

##### Budget Overview
- **URL**: `/api/finance/budgets/overview/`
- **Method**: `GET`
- **Response**:
```json
{
  "total_planned": 100000.00,
  "total_spent": 65000.00,
  "total_remaining": 35000.00,
  "utilization_rate": 65.0
}
```

##### Budgets by Project
- **URL**: `/api/finance/budgets/by_project/`
- **Method**: `GET`
- **Response**:
```json
[
  {
    "project__id": 1,
    "project__name": "Project Alpha",
    "total_planned": 50000.00,
    "total_spent": 35000.00,
    "budget_count": 3
  }
]
```

## Models

### Invoice
- `client`: ForeignKey to Client
- `project`: ForeignKey to Project (optional)
- `invoice_number`: CharField (unique)
- `amount`: DecimalField
- `status`: Choices (draft, sent, paid, overdue)
- `issue_date`: DateField
- `due_date`: DateField
- `paid_date`: DateField (optional)
- `notes`: TextField (optional)
- `created_at`: DateTimeField (auto)

### InvoiceItem
- `invoice`: ForeignKey to Invoice
- `description`: CharField
- `quantity`: IntegerField
- `unit_price`: DecimalField
- `total`: DecimalField (auto-calculated)

### Expense
- `project`: ForeignKey to Project (optional)
- `category`: Choices (materials, labor, equipment, transport, utilities, other)
- `amount`: DecimalField
- `description`: TextField
- `date`: DateField
- `status`: Choices (pending, approved, rejected)
- `submitted_by`: ForeignKey to User
- `approved_by`: ForeignKey to User (optional)
- `receipt`: FileField (optional)
- `created_at`: DateTimeField (auto)

### Budget
- `project`: ForeignKey to Project (optional)
- `department`: CharField (optional)
- `category`: CharField
- `planned_amount`: DecimalField
- `spent_amount`: DecimalField
- `period_start`: DateField
- `period_end`: DateField
- `remaining`: Property (calculated)

## Testing

Run the finance API tests:
```bash
cd backend
python manage.py test test_finance_api
```

## Examples

### Create an invoice with items
```bash
curl -X POST \
  http://localhost:8000/api/finance/invoices/ \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "client": 1,
    "project": 1,
    "invoice_number": "INV-2024-001",
    "amount": 1500.00,
    "status": "draft",
    "issue_date": "2024-01-01",
    "due_date": "2024-02-01",
    "items": [
      {
        "description": "Web Development",
        "quantity": 10,
        "unit_price": 150.00
      }
    ]
  }'
```

### Get invoice summary
```bash
curl -X GET \
  http://localhost:8000/api/finance/invoices/summary/ \
  -H 'Authorization: Bearer <token>'
```

### Approve an expense
```bash
curl -X POST \
  http://localhost:8000/api/finance/expenses/1/approve/ \
  -H 'Authorization: Bearer <token>'

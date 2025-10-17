# CRM API Documentation

## Base URL
```
http://127.0.0.1:8000/api/crm/
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Clients Endpoints

### Get All Clients
**GET** `/clients/`

**Query Parameters:**
- `search`: Search in name, email, contact_person
- `status`: Filter by status (active, inactive, prospect)
- `ordering`: Order by name, created_at

**Response:**
```json
[
  {
    "id": 1,
    "name": "Company Name",
    "email": "contact@company.com",
    "phone": "+33 1 23 45 67 89",
    "address": "123 Street, City, Country",
    "status": "active",
    "contact_person": "John Doe",
    "total_projects": 0,
    "total_revenue": "0.00",
    "created_at": "2025-01-15T12:00:00Z",
    "updated_at": "2025-01-15T12:00:00Z"
  }
]
```

### Get Single Client
**GET** `/clients/{id}/`

### Create Client
**POST** `/clients/`

**Request Body:**
```json
{
  "name": "Company Name",
  "email": "contact@company.com",
  "phone": "+33 1 23 45 67 89",
  "address": "123 Street, City, Country",
  "status": "prospect",
  "contact_person": "John Doe"
}
```

### Update Client
**PUT** `/clients/{id}/`

**Request Body:** Same as create

### Delete Client
**DELETE** `/clients/{id}/`

## Quotes Endpoints

### Get All Quotes
**GET** `/quotes/`

**Query Parameters:**
- `search`: Search in project_name, client__name
- `status`: Filter by status (pending, approved, rejected)
- `client`: Filter by client ID
- `ordering`: Order by created_at, amount

**Response:**
```json
[
  {
    "id": 1,
    "client": 1,
    "client_name": "Company Name",
    "project_name": "Project Name",
    "amount": "5000.00",
    "status": "pending",
    "valid_until": "2025-02-15",
    "created_at": "2025-01-15T12:00:00Z",
    "created_by": 1,
    "items": [
      {
        "id": 1,
        "description": "Service Description",
        "quantity": 1,
        "unit_price": "5000.00",
        "total": "5000.00"
      }
    ]
  }
]
```

### Create Quote
**POST** `/quotes/`

**Request Body:**
```json
{
  "client": 1,
  "project_name": "Project Name",
  "amount": "5000.00",
  "status": "pending",
  "valid_until": "2025-02-15",
  "created_by": 1,
  "items": [
    {
      "description": "Service Description",
      "quantity": 1,
      "unit_price": "5000.00"
    }
  ]
}
```

## Communications Endpoints

### Get All Communications
**GET** `/communications/`

**Query Parameters:**
- `search`: Search in subject, content
- `type`: Filter by type (email, call, meeting)
- `client`: Filter by client ID
- `ordering`: Order by date

**Response:**
```json
[
  {
    "id": 1,
    "client": 1,
    "client_name": "Company Name",
    "type": "email",
    "subject": "Meeting Follow-up",
    "content": "Discussion about project requirements...",
    "date": "2025-01-15T12:00:00Z",
    "user": 1,
    "user_name": "John Doe"
  }
]
```

### Create Communication
**POST** `/communications/`

**Request Body:**
```json
{
  "client": 1,
  "type": "email",
  "subject": "Meeting Follow-up",
  "content": "Discussion about project requirements...",
  "user": 1
}
```

## Features

### Search and Filtering
All list endpoints support:
- **Search**: Full-text search on relevant fields
- **Filtering**: By status, type, client, etc.
- **Ordering**: By various fields
- **Pagination**: Built-in Django REST Framework pagination

### Data Validation
- Email validation for client emails
- Status choices validation
- Required field validation
- Foreign key validation

### Automatic Fields
- `created_at`: Auto-set on creation
- `updated_at`: Auto-updated on modification
- `total_projects`: Calculated field (read-only)
- `total_revenue`: Calculated field (read-only)

## Example Usage

### Create a new client:
```bash
curl -X POST http://127.0.0.1:8000/api/crm/clients/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Client SA",
    "email": "info@newclient.com",
    "phone": "+33 1 23 45 67 89",
    "address": "123 Rue de Paris, 75001 Paris",
    "status": "prospect",
    "contact_person": "Marie Dupont"
  }'
```

### Search for clients:
```bash
curl "http://127.0.0.1:8000/api/crm/clients/?search=Paris&status=active" \
  -H "Authorization: Bearer <token>"
```

The CRM API provides complete CRUD operations for managing clients, quotes, and communications with robust filtering, search, and authentication capabilities.

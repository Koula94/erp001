# Stock Module API Documentation

This document provides comprehensive documentation for the Stock module API endpoints.

## Base URL
All endpoints are prefixed with `/api/stock/`

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### Materials

#### List Materials
- **URL**: `/api/stock/materials/`
- **Method**: `GET`
- **Query Parameters**:
  - `search`: Search by name or category
  - `status`: Filter by status (in-stock, low-stock, out-of-stock)
  - `category`: Filter by category
  - `location`: Filter by location
  - `ordering`: Order by fields (name, quantity)

#### Create Material
- **URL**: `/api/stock/materials/`
- **Method**: `POST`
- **Body**:
```json
{
  "name": "Concrete",
  "category": "Building Materials",
  "quantity": 100,
  "unit": "kg",
  "min_stock": 50,
  "max_stock": 500,
  "unit_price": 10.50,
  "location": "A1",
  "supplier": "Concrete Co.",
  "last_restocked": "2024-01-15",
  "status": "in-stock"
}
```

#### Retrieve Material
- **URL**: `/api/stock/materials/{id}/`
- **Method**: `GET`

#### Update Material
- **URL**: `/api/stock/materials/{id}/`
- **Method**: `PUT` or `PATCH`

#### Delete Material
- **URL**: `/api/stock/materials/{id}/`
- **Method**: `DELETE`

### Equipment

#### List Equipment
- **URL**: `/api/stock/equipment/`
- **Method**: `GET`
- **Query Parameters**:
  - `search`: Search by name or category
  - `status`: Filter by status (available, in-use, maintenance)
  - `condition`: Filter by condition (excellent, good, fair, poor)
  - `category`: Filter by category
  - `ordering`: Order by fields (name, purchase_date)

#### Create Equipment
- **URL**: `/api/stock/equipment/`
- **Method**: `POST`
- **Body**:
```json
{
  "name": "Excavator",
  "category": "Heavy Machinery",
  "status": "available",
  "condition": "good",
  "location": "Yard",
  "assigned_to": null,
  "purchase_date": "2023-05-10",
  "last_maintenance": "2024-01-10",
  "next_maintenance": "2024-04-10",
  "value": 50000.00
}
```

#### Retrieve Equipment
- **URL**: `/api/stock/equipment/{id}/`
- **Method**: `GET`

#### Update Equipment
- **URL**: `/api/stock/equipment/{id}/`
- **Method**: `PUT` or `PATCH`

#### Delete Equipment
- **URL**: `/api/stock/equipment/{id}/`
- **Method**: `DELETE`

### Stock Transactions

#### List Transactions
- **URL**: `/api/stock/transactions/`
- **Method**: `GET`
- **Query Parameters**:
  - `type`: Filter by type (in, out, transfer, adjustment)
  - `material`: Filter by material ID
  - `ordering`: Order by fields (date)

#### Create Transaction
- **URL**: `/api/stock/transactions/`
- **Method**: `POST`
- **Body**:
```json
{
  "type": "in",
  "material": 1,
  "quantity": 50,
  "reference": "PO-2024-001",
  "notes": "Initial stock"
}
```

#### Retrieve Transaction
- **URL**: `/api/stock/transactions/{id}/`
- **Method**: `GET`

#### Update Transaction
- **URL**: `/api/stock/transactions/{id}/`
- **Method**: `PUT` or `PATCH`

#### Delete Transaction
- **URL**: `/api/stock/transactions/{id}/`
- **Method**: `DELETE`

### Warehouses

#### List Warehouses
- **URL**: `/api/stock/warehouses/`
- **Method**: `GET`
- **Query Parameters**:
  - `search`: Search by name or location

#### Create Warehouse
- **URL**: `/api/stock/warehouses/`
- **Method**: `POST`
- **Body**:
```json
{
  "name": "Main Warehouse",
  "location": "123 Main St, City",
  "capacity": 1000,
  "occupied": 200,
  "manager": "John Doe",
  "categories": ["Building Materials", "Electrical"]
}
```

#### Retrieve Warehouse
- **URL**: `/api/stock/warehouses/{id}/`
- **Method**: `GET`

#### Update Warehouse
- **URL**: `/api/stock/warehouses/{id}/`
- **Method**: `PUT` or `PATCH`

#### Delete Warehouse
- **URL**: `/api/stock/warehouses/{id}/`
- **Method**: `DELETE`

## Data Models

### Material
- `id`: Integer (Auto-generated)
- `name`: String (Required)
- `category`: String (Required)
- `quantity`: Integer (Required)
- `unit`: String (Required)
- `min_stock`: Integer (Required)
- `max_stock`: Integer (Required)
- `unit_price`: Decimal (Required)
- `location`: String (Required)
- `supplier`: String (Required)
- `last_restocked`: Date (Required)
- `status`: String (Choices: in-stock, low-stock, out-of-stock)
- `total_value`: Decimal (Read-only, calculated field)

### Equipment
- `id`: Integer (Auto-generated)
- `name`: String (Required)
- `category`: String (Required)
- `status`: String (Choices: available, in-use, maintenance)
- `condition`: String (Choices: excellent, good, fair, poor)
- `location`: String (Required)
- `assigned_to`: ForeignKey to Project (Optional)
- `purchase_date`: Date (Required)
- `last_maintenance`: Date (Required)
- `next_maintenance`: Date (Required)
- `value`: Decimal (Required)
- `assigned_project`: String (Read-only, from assigned_to.name)

### StockTransaction
- `id`: Integer (Auto-generated)
- `type`: String (Choices: in, out, transfer, adjustment)
- `material`: ForeignKey to Material (Required)
- `quantity`: Integer (Required)
- `date`: DateTime (Auto-generated)
- `reference`: String (Required)
- `notes`: Text (Optional)
- `material_name`: String (Read-only, from material.name)

### Warehouse
- `id`: Integer (Auto-generated)
- `name`: String (Required)
- `location`: String (Required)
- `capacity`: Integer (Required)
- `occupied`: Integer (Required)
- `manager`: String (Required)
- `categories`: JSON (List of categories)

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Resource deleted successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Examples

### Get all materials
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/stock/materials/"
```

### Create new equipment
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Crane",
    "category": "Heavy Machinery",
    "status": "available",
    "condition": "excellent",
    "location": "Yard",
    "purchase_date": "2023-08-15",
    "last_maintenance": "2024-01-15",
    "next_maintenance": "2024-04-15",
    "value": 75000.00
  }' \
  "http://localhost:8000/api/stock/equipment/"
```

### Search materials
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/stock/materials/?search=concrete&status=in-stock"
```

## Notes

- All date fields should be in ISO format: `YYYY-MM-DD`
- Decimal fields should use string representation to avoid floating point precision issues
- The API uses pagination with a default page size of 100
- Search and filtering are case-insensitive
- All endpoints support CORS for cross-origin requests

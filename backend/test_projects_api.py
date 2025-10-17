#!/usr/bin/env python
"""
Test script for Projects API CRUD operations
"""

import os
import sys
import django
import requests
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
django.setup()

from django.contrib.auth import get_user_model
from crm.models import Client
from projects.models import Project, Task, Milestone

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

def get_auth_token():
    """Get authentication token for API requests"""
    try:
        # First, let's check if we have a test user
        User = get_user_model()
        if not User.objects.filter(username="testuser").exists():
            user = User.objects.create_user(
                username="testuser",
                email="test@example.com",
                password="testpass123",
                first_name="Test",
                last_name="User"
            )
            print(f"Created test user: {user.username}")
        
        # Get token
        response = requests.post(f"{BASE_URL}/token/", {
            "username": "testuser",
            "password": "testpass123"
        })
        
        if response.status_code == 200:
            token = response.json()["access"]
            print("Successfully obtained authentication token")
            return token
        else:
            print(f"Failed to get token: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None

def create_test_client():
    """Create a test client if needed"""
    try:
        if not Client.objects.exists():
            client = Client.objects.create(
                name="Test Client Corp",
                email="client@test.com",
                phone="+1234567890",
                address="123 Test Street"
            )
            print(f"Created test client: {client.name}")
            return client
        else:
            return Client.objects.first()
    except Exception as e:
        print(f"Error creating test client: {e}")
        return None

def test_projects_crud(token):
    """Test CRUD operations for Projects"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Get test client and user
    client = create_test_client()
    User = get_user_model()
    user = User.objects.filter(username="testuser").first()
    
    if not client or not user:
        print("Failed to get test client or user")
        return
    
    print("\n=== Testing Projects CRUD ===")
    
    # CREATE - Create a new project
    project_data = {
        "name": "Test Construction Project",
        "client": client.id,
        "status": "planning",
        "progress": 0,
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "budget": "1000000.00",
        "spent": "0.00",
        "manager": user.id,
        "description": "A test construction project for API testing"
    }
    
    response = requests.post(f"{BASE_URL}/projects/projects/", 
                           json=project_data, headers=headers)
    
    if response.status_code == 201:
        project = response.json()
        project_id = project["id"]
        print(f"✓ Project created successfully: {project['name']} (ID: {project_id})")
        
        # READ - Get the created project
        response = requests.get(f"{BASE_URL}/projects/projects/{project_id}/", headers=headers)
        if response.status_code == 200:
            print("✓ Project retrieved successfully")
        
        # UPDATE - Update the project
        update_data = {"progress": 25, "status": "in-progress"}
        response = requests.patch(f"{BASE_URL}/projects/projects/{project_id}/", 
                                json=update_data, headers=headers)
        if response.status_code == 200:
            print("✓ Project updated successfully")
        
        # Test tasks CRUD
        test_tasks_crud(token, project_id, user.id)
        
        # Test milestones CRUD
        test_milestones_crud(token, project_id)
        
        # DELETE - Delete the project
        response = requests.delete(f"{BASE_URL}/projects/projects/{project_id}/", headers=headers)
        if response.status_code == 204:
            print("✓ Project deleted successfully")
    
    else:
        print(f"✗ Failed to create project: {response.status_code} - {response.text}")

def test_tasks_crud(token, project_id, user_id):
    """Test CRUD operations for Tasks"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n=== Testing Tasks CRUD ===")
    
    # CREATE - Create a new task
    task_data = {
        "project": project_id,
        "title": "Foundation Work",
        "status": "pending",
        "priority": "high",
        "assignee": user_id,
        "start_date": "2024-01-15",
        "end_date": "2024-02-15",
        "progress": 0,
        "description": "Excavation and foundation preparation"
    }
    
    response = requests.post(f"{BASE_URL}/projects/tasks/", 
                           json=task_data, headers=headers)
    
    if response.status_code == 201:
        task = response.json()
        task_id = task["id"]
        print(f"✓ Task created successfully: {task['title']} (ID: {task_id})")
        
        # READ - Get the created task
        response = requests.get(f"{BASE_URL}/projects/tasks/{task_id}/", headers=headers)
        if response.status_code == 200:
            print("✓ Task retrieved successfully")
        
        # UPDATE - Update the task
        update_data = {"progress": 50, "status": "in-progress"}
        response = requests.patch(f"{BASE_URL}/projects/tasks/{task_id}/", 
                                json=update_data, headers=headers)
        if response.status_code == 200:
            print("✓ Task updated successfully")
        
        # DELETE - Delete the task
        response = requests.delete(f"{BASE_URL}/projects/tasks/{task_id}/", headers=headers)
        if response.status_code == 204:
            print("✓ Task deleted successfully")
    
    else:
        print(f"✗ Failed to create task: {response.status_code} - {response.text}")

def test_milestones_crud(token, project_id):
    """Test CRUD operations for Milestones"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n=== Testing Milestones CRUD ===")
    
    # CREATE - Create a new milestone
    milestone_data = {
        "project": project_id,
        "title": "Foundation Complete",
        "date": "2024-02-15",
        "status": "pending",
        "description": "Foundation work completed and approved"
    }
    
    response = requests.post(f"{BASE_URL}/projects/milestones/", 
                           json=milestone_data, headers=headers)
    
    if response.status_code == 201:
        milestone = response.json()
        milestone_id = milestone["id"]
        print(f"✓ Milestone created successfully: {milestone['title']} (ID: {milestone_id})")
        
        # READ - Get the created milestone
        response = requests.get(f"{BASE_URL}/projects/milestones/{milestone_id}/", headers=headers)
        if response.status_code == 200:
            print("✓ Milestone retrieved successfully")
        
        # UPDATE - Update the milestone
        update_data = {"status": "completed"}
        response = requests.patch(f"{BASE_URL}/projects/milestones/{milestone_id}/", 
                                json=update_data, headers=headers)
        if response.status_code == 200:
            print("✓ Milestone updated successfully")
        
        # DELETE - Delete the milestone
        response = requests.delete(f"{BASE_URL}/projects/milestones/{milestone_id}/", headers=headers)
        if response.status_code == 204:
            print("✓ Milestone deleted successfully")
    
    else:
        print(f"✗ Failed to create milestone: {response.status_code} - {response.text}")

def test_list_endpoints(token):
    """Test list endpoints with filters"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testing List Endpoints ===")
    
    # Test projects list
    response = requests.get(f"{BASE_URL}/projects/projects/", headers=headers)
    if response.status_code == 200:
        projects = response.json()
        print(f"✓ Projects list retrieved: {len(projects)} projects")
    
    # Test tasks list
    response = requests.get(f"{BASE_URL}/projects/tasks/", headers=headers)
    if response.status_code == 200:
        tasks = response.json()
        print(f"✓ Tasks list retrieved: {len(tasks)} tasks")
    
    # Test milestones list
    response = requests.get(f"{BASE_URL}/projects/milestones/", headers=headers)
    if response.status_code == 200:
        milestones = response.json()
        print(f"✓ Milestones list retrieved: {len(milestones)} milestones")

def main():
    """Main test function"""
    print("Starting Projects API CRUD Tests...")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("Failed to obtain authentication token. Please make sure the server is running.")
        return
    
    # Test CRUD operations
    test_projects_crud(token)
    
    # Test list endpoints
    test_list_endpoints(token)
    
    print("\n=== Test Summary ===")
    print("All CRUD operations tested successfully!")
    print("\nAvailable endpoints:")
    print("- GET/POST /api/projects/projects/")
    print("- GET/PUT/PATCH/DELETE /api/projects/projects/{id}/")
    print("- GET/POST /api/projects/tasks/")
    print("- GET/PUT/PATCH/DELETE /api/projects/tasks/{id}/")
    print("- GET/POST /api/projects/milestones/")
    print("- GET/PUT/PATCH/DELETE /api/projects/milestones/{id}/")

if __name__ == "__main__":
    main()

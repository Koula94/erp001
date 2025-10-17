import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"

def test_authentication():
    print("=== Test d'authentification Sofixe ERP ===\n")
    
    # Test d'inscription
    print("1. Test d'inscription...")
    register_data = {
        "username": "testuser",
        "email": "test@sofixe.com",
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User",
        "role": "employee",
        "phone": "+33123456789",
        "position": "Testeur",
        "department": "QA"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/auth/register/", json=register_data)
        if response.status_code == 201:
            print("✅ Inscription réussie")
            user_data = response.json()
            access_token = user_data['access']
            refresh_token = user_data['refresh']
            print(f"   Token d'accès: {access_token[:50]}...")
        else:
            print(f"❌ Échec de l'inscription: {response.status_code}")
            print(f"   Détails: {response.text}")
            return
    except Exception as e:
        print(f"❌ Erreur lors de l'inscription: {e}")
        return
    
    # Test de connexion
    print("\n2. Test de connexion...")
    login_data = {
        "username": "testuser",
        "password": "TestPassword123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/auth/login/", json=login_data)
        if response.status_code == 200:
            print("✅ Connexion réussie")
            login_data = response.json()
            access_token = login_data['access']
            refresh_token = login_data['refresh']
            print(f"   Token d'accès: {access_token[:50]}...")
        else:
            print(f"❌ Échec de la connexion: {response.status_code}")
            print(f"   Détails: {response.text}")
            return
    except Exception as e:
        print(f"❌ Erreur lors de la connexion: {e}")
        return
    
    # Test de récupération de l'utilisateur courant
    print("\n3. Test de récupération de l'utilisateur courant...")
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/users/auth/me/", headers=headers)
        if response.status_code == 200:
            user_info = response.json()
            print("✅ Récupération de l'utilisateur réussie")
            print(f"   Utilisateur: {user_info['first_name']} {user_info['last_name']}")
            print(f"   Rôle: {user_info['role']}")
        else:
            print(f"❌ Échec de la récupération: {response.status_code}")
            print(f"   Détails: {response.text}")
            return
    except Exception as e:
        print(f"❌ Erreur lors de la récupération: {e}")
        return
    
    # Test de déconnexion
    print("\n4. Test de déconnexion...")
    logout_data = {
        "refresh_token": refresh_token
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/auth/logout/", json=logout_data)
        if response.status_code == 200:
            print("✅ Déconnexion réussie")
        else:
            print(f"❌ Échec de la déconnexion: {response.status_code}")
            print(f"   Détails: {response.text}")
    except Exception as e:
        print(f"❌ Erreur lors de la déconnexion: {e}")
    
    # Test avec SimpleJWT endpoints
    print("\n5. Test avec endpoints SimpleJWT...")
    jwt_login_data = {
        "username": "testuser",
        "password": "TestPassword123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/token/", json=jwt_login_data)
        if response.status_code == 200:
            print("✅ Connexion SimpleJWT réussie")
            jwt_data = response.json()
            print(f"   Access token: {jwt_data['access'][:50]}...")
            print(f"   Refresh token: {jwt_data['refresh'][:50]}...")
        else:
            print(f"❌ Échec de la connexion SimpleJWT: {response.status_code}")
            print(f"   Détails: {response.text}")
    except Exception as e:
        print(f"❌ Erreur lors de la connexion SimpleJWT: {e}")
    
    print("\n=== Tests d'authentification terminés ===")

if __name__ == "__main__":
    test_authentication()

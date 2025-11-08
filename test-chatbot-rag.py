"""
Quick Test Script for HeartWise AI Chatbot with RAG
Tests all major chatbot functionalities
"""

import requests
import json
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:5001"
ML_SERVICE_URL = "http://localhost:5002"

# Test credentials
TEST_USER = {
    "email": "test@example.com",
    "password": "password123"
}

def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def test_rag_service():
    """Test RAG service directly"""
    print_header("Testing RAG Service")
    
    try:
        # Test RAG stats
        response = requests.get(f"{ML_SERVICE_URL}/api/ml/rag/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ RAG Stats:")
            print(f"   Medical Knowledge: {stats.get('medical_knowledge', 0)} documents")
            print(f"   ECG Analyses: {stats.get('ecg_analyses', 0)} documents")
            print(f"   Patient Data: {stats.get('patient_data', 0)} documents")
            print(f"   Total: {stats.get('total_documents', 0)} documents")
        else:
            print(f"❌ RAG Stats failed: {response.status_code}")
        
        # Test context retrieval
        response = requests.post(
            f"{ML_SERVICE_URL}/api/ml/chat/context",
            json={
                "query": "What is atrial fibrillation?",
                "user_id": None
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Context Retrieval Test:")
            print(f"   Query: 'What is atrial fibrillation?'")
            print(f"   Retrieved {len(data.get('context', ''))} characters of context")
            print(f"   Medical Knowledge Results: {len(data.get('results', {}).get('medical_knowledge', []))}")
            print(f"\n   Sample Context:")
            context_preview = data.get('context', '')[:200]
            print(f"   {context_preview}...")
        else:
            print(f"❌ Context retrieval failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ RAG Service Error: {str(e)}")

def test_chatbot():
    """Test chatbot API"""
    print_header("Testing Chatbot API")
    
    try:
        # Login first
        print("🔐 Logging in...")
        login_response = requests.post(
            f"{BACKEND_URL}/api/auth/login",
            json=TEST_USER
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            return
        
        token = login_response.json()['token']
        print(f"✅ Login successful")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: Medical question
        print("\n📝 Test 1: Medical Question")
        chat_response = requests.post(
            f"{BACKEND_URL}/api/chat",
            headers=headers,
            json={
                "message": "What should I know about atrial fibrillation?"
            }
        )
        
        if chat_response.status_code == 200:
            data = chat_response.json()
            print(f"✅ Chatbot Response:")
            print(f"   {data['message'][:200]}...")
            print(f"   Conversation ID: {data.get('conversation_id', 'N/A')}")
        else:
            print(f"❌ Chat failed: {chat_response.status_code}")
            print(f"   Response: {chat_response.text}")
        
        # Test 2: Function calling (simulated)
        print("\n📝 Test 2: Function Calling Test")
        chat_response = requests.post(
            f"{BACKEND_URL}/api/chat",
            headers=headers,
            json={
                "message": "Can you show me my latest ECG results?"
            }
        )
        
        if chat_response.status_code == 200:
            data = chat_response.json()
            print(f"✅ Chatbot Response:")
            if data.get('function_called'):
                print(f"   Function Called: {data['function_called']}")
                print(f"   Function Result: {data.get('function_result', {}).get('message', 'N/A')}")
            print(f"   Response: {data['message'][:200]}...")
        else:
            print(f"❌ Chat failed: {chat_response.status_code}")
            
    except Exception as e:
        print(f"❌ Chatbot Error: {str(e)}")

def test_backend_health():
    """Test backend health"""
    print_header("Testing Backend Health")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/health-check")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend Status: {data.get('status', 'unknown')}")
            print(f"   Database: {'✓' if data.get('database') == 'connected' else '✗'}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend Error: {str(e)}")

def test_ml_service_health():
    """Test ML service health"""
    print_header("Testing ML Service Health")
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ ML Service: {data.get('service', 'unknown')}")
            print(f"   ECG Analysis: {'✓' if data.get('ecg_analysis_available') else '✗'}")
            print(f"   AI Diet: {'✓' if data.get('ai_diet_available') else '✗'}")
        else:
            print(f"❌ ML Service check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ ML Service Error: {str(e)}")

if __name__ == "__main__":
    print("\n")
    print("🧪 " + "=" * 58)
    print("   HeartWise AI Chatbot with RAG - Comprehensive Test Suite")
    print("=" * 61)
    print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 61)
    
    # Run all tests
    test_backend_health()
    test_ml_service_health()
    test_rag_service()
    test_chatbot()
    
    print("\n" + "=" * 60)
    print("  ✅ Test Suite Complete!")
    print("=" * 60)
    print("\n💡 To test in browser, visit:")
    print("   http://localhost:3000/chat")
    print("\n📝 Try these queries:")
    print("   1. 'What is atrial fibrillation?'")
    print("   2. 'Show me my latest ECG results'")
    print("   3. 'Start a new ECG recording'")
    print("   4. 'What medications should I take?'")
    print("=" * 60 + "\n")

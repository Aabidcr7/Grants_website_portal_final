#!/usr/bin/env python3
"""
Test script to verify PDF download functionality
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api"
TEST_EMAIL = "test_ai_reasons@example.com"
TEST_PASSWORD = "testpassword123"

def test_pdf_download():
    """Test PDF download functionality"""
    
    print("📄 Testing PDF Download Functionality")
    print("=" * 40)
    
    # Step 1: Login
    print("1. Logging in...")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        token = response.json()["token"]
        print("✅ Login successful")
    else:
        print(f"❌ Login failed: {response.text}")
        return
    
    # Step 2: Download PDF
    print("\n2. Downloading PDF...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/grants/download-pdf", headers=headers)
        
        if response.status_code == 200:
            print("✅ PDF download successful")
            
            # Save the PDF file
            with open("test_grant_matches.pdf", "wb") as f:
                f.write(response.content)
            print("✅ PDF saved as 'test_grant_matches.pdf'")
            
            # Check file size
            file_size = len(response.content)
            print(f"   File size: {file_size} bytes")
            
        else:
            print(f"❌ PDF download failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error downloading PDF: {e}")

if __name__ == "__main__":
    test_pdf_download()


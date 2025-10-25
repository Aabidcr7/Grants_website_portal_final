#!/usr/bin/env python3
"""
Debug script to test startup data saving functionality
"""

import pandas as pd
import sys
import os
from pathlib import Path
from datetime import datetime, timezone

# Add backend to path
sys.path.append('backend')

# Import the functions from server.py
from server import load_startups_df, save_startups_df

def test_startup_save():
    """Test startup data saving functionality"""
    
    print("🔍 Testing Startup Data Saving")
    print("=" * 40)
    
    # Test data
    test_startup = {
        'ID': 'test-id-123',
        'Email': 'test@example.com',
        'Password Hash': '',
        'Name': 'Test Startup',
        'Founder Name': 'Test Founder',
        'Entity Type': 'For-profit',
        'Location': 'Test City',
        'Industry': 'Technology',
        'Company Size': 10,
        'Description': 'Test description',
        'Contact Email': 'test@example.com',
        'Contact Phone': '+1234567890',
        'Stage': 'Start-up',
        'Revenue': 10000.0,
        'Stability': 'Good',
        'Demographic': 'General',
        'Track Record': 2,
        'Past Grant Experience': 'No',
        'Tier': 'free',
        'Created At': datetime.now(timezone.utc).isoformat()
    }
    
    try:
        # Load existing data
        print("1. Loading existing startups data...")
        startups_df = load_startups_df()
        print(f"   Current startups count: {len(startups_df)}")
        
        # Add new startup
        print("2. Adding new startup...")
        new_startup_df = pd.DataFrame([test_startup])
        startups_df = pd.concat([startups_df, new_startup_df], ignore_index=True)
        print(f"   After adding: {len(startups_df)}")
        
        # Save data
        print("3. Saving startups data...")
        save_startups_df(startups_df)
        print("   ✅ Data saved successfully")
        
        # Verify save
        print("4. Verifying save...")
        verify_df = load_startups_df()
        print(f"   Verified count: {len(verify_df)}")
        
        if len(verify_df) > 0:
            print("   ✅ Data verified successfully")
            print(f"   First startup: {verify_df.iloc[0]['Name']}")
        else:
            print("   ❌ Data not found after save")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_startup_save()


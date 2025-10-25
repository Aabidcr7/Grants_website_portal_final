#!/usr/bin/env python3
"""
Test script to verify AI matching with proper reasons
"""

import sys
import os
import asyncio
from pathlib import Path

# Add backend to path
sys.path.append('backend')

from server import ai_match_grants

async def test_ai_matching():
    """Test AI matching function with detailed reasons"""
    
    print("🤖 Testing AI Matching with Detailed Reasons")
    print("=" * 50)
    
    # Test profile
    test_profile = {
        'startup_name': 'AI Innovation Labs',
        'founder_name': 'John Doe',
        'entity_type': 'For-profit',
        'location': 'Bangalore, India',
        'industry': 'Technology',
        'company_size': 15,
        'description': 'We develop AI-powered solutions for healthcare and education',
        'contact_email': 'test@example.com',
        'contact_phone': '+91 9876543210',
        'stage': 'Start-up',
        'revenue': 50000.0,
        'stability': 'Good',
        'demographic': 'General',
        'track_record': 3,
        'past_grant_experience': 'No',
        'past_grant_description': ''
    }
    
    print("Startup Profile:")
    for key, value in test_profile.items():
        print(f"  {key}: {value}")
    
    print("\nRunning AI matching...")
    
    try:
        matches = await ai_match_grants(test_profile)
        
        print(f"\n✅ AI Matches found: {len(matches)}")
        
        for i, match in enumerate(matches[:5], 1):
            print(f"\n{i}. {match['name']}")
            print(f"   Grant ID: {match['grant_id']}")
            print(f"   Relevance Score: {match['relevance_score']}")
            print(f"   Funding Amount: {match['funding_amount']}")
            print(f"   Reason: {match['reason']}")
            print(f"   Sector: {match['sector']}")
            print(f"   Stage: {match['stage']}")
            print(f"   Deadline: {match['deadline']}")
            
    except Exception as e:
        print(f"❌ Error in AI matching: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ai_matching())


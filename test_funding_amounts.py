#!/usr/bin/env python3
"""
Test script to verify funding amounts are correct
"""

import pandas as pd
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append('backend')

def test_funding_amounts():
    """Test funding amounts from grants.csv"""
    
    print("💰 Testing Funding Amounts")
    print("=" * 40)
    
    # Load grants data using the server function
    from server import load_grants_df
    grants_df = load_grants_df()
    
    print(f"Total grants: {len(grants_df)}")
    print("\nFunding amounts:")
    
    for idx, grant in grants_df.iterrows():
        print(f"{grant['Grant ID']}: {grant['Name']}")
        print(f"  Funding Amount: {grant['Funding Amount']}")
        print(f"  Type: {type(grant['Funding Amount'])}")
        print()
    
    # Test the AI matching function
    print("Testing AI matching function...")
    from server import ai_match_grants
    
    # Test profile
    test_profile = {
        'startup_name': 'Test Startup',
        'industry': 'Technology',
        'stage': 'Start-up',
        'revenue': 50000,
        'entity_type': 'For-profit',
        'location': 'Bangalore',
        'demographic': 'General',
        'stability': 'Good',
        'track_record': 2,
        'past_grant_experience': 'No'
    }
    
    import asyncio
    matches = asyncio.run(ai_match_grants(test_profile))
    
    print(f"\nAI Matches found: {len(matches)}")
    for i, match in enumerate(matches[:3], 1):
        print(f"{i}. {match['name']}")
        print(f"   Funding: {match['funding_amount']}")
        print(f"   Score: {match['relevance_score']}")
        print()

if __name__ == "__main__":
    test_funding_amounts()

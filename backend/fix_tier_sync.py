"""
One-time script to fix tier sync between users.csv and startups.csv
Run this once to fix all existing mismatches
"""

import pandas as pd
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).parent / 'data'
USERS_CSV = DATA_DIR / 'users.csv'
STARTUPS_CSV = DATA_DIR / 'startups.csv'

def fix_tier_sync():
    """Sync all user tiers from users.csv to startups.csv"""
    
    print("=" * 60)
    print("TIER SYNC FIX SCRIPT")
    print("=" * 60)
    
    # Load both CSVs
    users_df = pd.read_csv(USERS_CSV)
    startups_df = pd.read_csv(STARTUPS_CSV)
    
    print(f"\n📊 Loaded {len(users_df)} users and {len(startups_df)} startups")
    
    # Track changes
    updated_count = 0
    mismatches = []
    
    # For each user, sync their tier to startups.csv
    for _, user in users_df.iterrows():
        email = user['email']
        user_tier = user['tier']
        
        # Find matching startup
        startup_idx = startups_df[startups_df['Email'].str.lower() == email.lower()].index
        
        if not startup_idx.empty:
            current_startup_tier = startups_df.at[startup_idx[0], 'Tier']
            
            # Check for mismatch
            if current_startup_tier != user_tier:
                mismatches.append({
                    'email': email,
                    'users_tier': user_tier,
                    'startups_tier': current_startup_tier
                })
                
                # Fix the tier
                startups_df.at[startup_idx[0], 'Tier'] = user_tier
                updated_count += 1
                print(f"✅ Fixed: {email}")
                print(f"   users.csv: {user_tier} → startups.csv: {current_startup_tier} → {user_tier}")
    
    # Save updated startups.csv
    if updated_count > 0:
        startups_df.to_csv(STARTUPS_CSV, index=False)
        print(f"\n✅ Successfully updated {updated_count} tier(s) in startups.csv")
        
        print("\n📋 MISMATCHES FIXED:")
        for mismatch in mismatches:
            print(f"   • {mismatch['email']}: {mismatch['startups_tier']} → {mismatch['users_tier']}")
    else:
        print("\n✅ No mismatches found! All tiers are already in sync.")
    
    print("\n" + "=" * 60)
    print("SYNC COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    fix_tier_sync()

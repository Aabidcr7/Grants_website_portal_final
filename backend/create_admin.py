import bcrypt
import uuid
from datetime import datetime, timezone
import pandas as pd
from pathlib import Path

# Generate admin password hash
password = "admin123"
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

print("=" * 60)
print("ADMIN ACCOUNT CREATION")
print("=" * 60)
print(f"\nGenerated Password Hash: {password_hash}")
print(f"\nAdmin Login Credentials:")
print(f"Email: admin@myprobuddy.com")
print(f"Password: {password}")
print("\n" + "=" * 60)

# Create admin user data
admin_user = {
    'id': 'admin-001',
    'name': 'System Admin',
    'email': 'admin@myprobuddy.com',
    'password': '',
    'tier': 'admin',
    'has_completed_screening': True,
    'created_at': datetime.now(timezone.utc).isoformat(),
    'profile': '',
    'screening_completed_at': datetime.now(timezone.utc).isoformat(),
    'upgraded_at': '',
    'coupon_used': '',
    'password_hash': password_hash,
    'photo_url': '',
    'calendly_link': ''
}

# Check if users.csv exists and update it
users_csv = Path(__file__).parent / 'data' / 'users.csv'

if users_csv.exists():
    # Load existing users
    users_df = pd.read_csv(users_csv)
    
    # Check if admin already exists
    if 'admin-001' in users_df['id'].values:
        print("\n⚠️  Admin account already exists. Updating password hash...")
        users_df.loc[users_df['id'] == 'admin-001', 'password_hash'] = password_hash
    else:
        print("\n✅ Creating new admin account...")
        users_df = pd.concat([users_df, pd.DataFrame([admin_user])], ignore_index=True)
    
    # Save updated users
    users_df.to_csv(users_csv, index=False)
    print(f"✅ Users file updated: {users_csv}")
else:
    print("\n❌ users.csv not found at expected location")

print("\n" + "=" * 60)
print("SETUP COMPLETE!")
print("=" * 60)
print("\nYou can now login with:")
print("  Email: admin@myprobuddy.com")
print("  Password: admin123")
print("\n" + "=" * 60)

import pandas as pd
import bcrypt

# Load users
df = pd.read_csv('data/users.csv')
user = df[df['email'] == 'testuser@example.com']

if len(user) > 0:
    pwd_hash = user['password'].iloc[0]
    print(f'New user hash: {repr(pwd_hash)}')
    print(f'Hash length: {len(pwd_hash)}')
    
    # Test the password we used during registration
    try:
        result = bcrypt.checkpw(b'password123', pwd_hash.encode())
        print(f'password123: {result}')
    except Exception as e:
        print(f'password123: ERROR - {e}')
else:
    print('New user not found')

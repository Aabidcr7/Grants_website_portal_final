from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from typing import Any
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import pandas as pd
import openai
import json
import shutil
from contextlib import asynccontextmanager
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import io
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Data paths
DATA_DIR = ROOT_DIR / 'data'
GRANTS_CSV = DATA_DIR / 'grants.csv'
SOFT_APPROVAL_CSV = DATA_DIR / 'soft_approval.csv'
COUPONS_CSV = DATA_DIR / 'coupons.csv'
STARTUPS_CSV = DATA_DIR / 'startups.csv'
GRANT_TRACKING_CSV = DATA_DIR / 'grant_tracking.csv'

# CSV Storage Configuration
USERS_CSV = DATA_DIR / 'users.csv'
GRANT_MATCHES_CSV = DATA_DIR / 'grant_matches.csv'

# OpenAI setup
openai.api_key = os.environ.get('OPENAI_API_KEY', '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')

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'myprobuddy_secret_key_2025')
JWT_ALGORITHM = 'HS256'

# CSV Utility Functions
def load_users_df():
    """Load users from CSV file"""
    if USERS_CSV.exists():
        return pd.read_csv(USERS_CSV)
    return pd.DataFrame(columns=['id', 'name', 'email', 'password', 'tier', 'has_completed_screening', 'created_at', 'profile', 'screening_completed_at', 'upgraded_at', 'coupon_used'])

def save_users_df(df):
    """Save users to CSV file"""
    df.to_csv(USERS_CSV, index=False)

def load_grant_matches_df():
    """Load grant matches from CSV file"""
    if GRANT_MATCHES_CSV.exists():
        df = pd.read_csv(GRANT_MATCHES_CSV)
        # Handle different column structures
        if 'id' in df.columns and 'match_score' in df.columns:
            # Old format with id and match_score columns
            return df[['user_id', 'grant_id', 'match_data', 'created_at']]
        return df
    return pd.DataFrame(columns=['user_id', 'grant_id', 'match_data', 'reason', 'created_at'])

def save_grant_matches_df(df):
    """Save grant matches to CSV file"""
    df.to_csv(GRANT_MATCHES_CSV, index=False)

def load_startups_df():
    """Load startups from CSV file"""
    if STARTUPS_CSV.exists():
        return pd.read_csv(STARTUPS_CSV)
    return pd.DataFrame(columns=['ID', 'Email', 'Password Hash', 'Name', 'Founder Name', 'Entity Type', 'Location', 'Industry', 'Company Size', 'Description', 'Contact Email', 'Contact Phone', 'Stage', 'Revenue', 'Stability', 'Demographic', 'Track Record', 'Past Grant Experience', 'Tier', 'Created At'])

def save_startups_df(df):
    """Save startups to CSV file"""
    df.to_csv(STARTUPS_CSV, index=False)

def load_grant_tracking_df():
    """Load grant tracking from CSV file"""
    if GRANT_TRACKING_CSV.exists():
        return pd.read_csv(GRANT_TRACKING_CSV)
    return pd.DataFrame(columns=['id', 'user_id', 'startup_id', 'grant_id', 'status', 'progress', 'applied_date', 'approved_date', 'disbursed_date', 'rejected_date', 'disbursed_amount', 'screenshot_path', 'notes', 'created_at', 'updated_at'])

def save_grant_tracking_df(df):
    """Save grant tracking to CSV file"""
    df.to_csv(GRANT_TRACKING_CSV, index=False)

def sync_user_tier_to_startup(user_email: str, new_tier: str):
    """Sync user tier from users.csv to startups.csv - ensures both files stay in sync"""
    try:
        startups_df = load_startups_df()
        if not startups_df.empty:
            # Update tier in startups.csv for matching email (case-insensitive)
            startup_idx = startups_df[startups_df['Email'].str.lower() == user_email.lower()].index
            if not startup_idx.empty:
                # Use the exact column name from the CSV
                for idx in startup_idx:
                    startups_df.at[idx, 'Tier'] = new_tier
                    print(f"✅ Syncing tier '{new_tier}' for {user_email} in startups.csv (row {idx})")
                save_startups_df(startups_df)
                print(f"✅ Successfully synced tier '{new_tier}' for {user_email} in startups.csv")
            else:
                print(f"⚠️ No startup found with email {user_email} in startups.csv")
        else:
            print(f"⚠️ Startups CSV is empty")
    except Exception as e:
        print(f"❌ Error syncing tier to startup: {e}")
        import traceback
        traceback.print_exc()

def sync_startup_tier_to_user(user_email: str, new_tier: str):
    """Sync startup tier from startups.csv to users.csv"""
    try:
        users_df = load_users_df()
        if not users_df.empty:
            # Update tier in users.csv for matching email
            user_idx = users_df[users_df['email'] == user_email].index
            if not user_idx.empty:
                users_df.at[user_idx[0], 'tier'] = new_tier
                save_users_df(users_df)
                print(f"✅ Synced tier '{new_tier}' for {user_email} in users.csv")
    except Exception as e:
        print(f"❌ Error syncing tier to user: {e}")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure CORS origins
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]

# Add additional origins from environment variable if provided
if os.environ.get('CORS_ORIGINS'):
    cors_origins.extend(os.environ.get('CORS_ORIGINS', '').split(','))

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount static files directory for serving uploaded screenshots
uploads_dir = ROOT_DIR / "uploads"
uploads_dir.mkdir(exist_ok=True)  # Ensure directory exists
app.mount("/backend/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GrantScreeningPage1(BaseModel):
    startup_name: str
    founder_name: str
    entity_type: str
    location: str
    industry: str
    company_size: int
    description: str
    contact_email: EmailStr
    contact_phone: str

class GrantScreeningPage2(BaseModel):
    stage: str
    revenue: float
    stability: str
    demographic: str
    track_record: int
    past_grant_experience: str
    past_grant_description: Optional[str] = None

class GrantScreeningCombined(BaseModel):
    # Page 1 fields
    startup_name: str
    founder_name: str
    entity_type: str
    location: str
    industry: str
    company_size: int
    description: str
    contact_email: EmailStr
    contact_phone: str
    # Page 2 fields
    stage: str
    revenue: float
    stability: str
    demographic: str
    track_record: int
    past_grant_experience: str
    past_grant_description: Optional[str] = None

class CouponValidate(BaseModel):
    code: str

class GrantMatch(BaseModel):
    grant_id: str
    name: str
    relevance_score: float
    funding_amount: str
    soft_approval: str
    deadline: str
    reason: str
    sector: str
    eligibility: str
    application_link: str
    stage: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    tier: str
    has_completed_screening: bool
    created_at: str

class GrantTrackingCreate(BaseModel):
    startup_id: str
    grant_id: str
    status: str  # Draft, Applied, Approved, Disbursed, Rejected
    progress: str
    notes: Optional[str] = ""

class GrantTrackingUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[str] = None
    applied_date: Optional[str] = None
    approved_date: Optional[str] = None
    disbursed_date: Optional[str] = None
    rejected_date: Optional[str] = None
    disbursed_amount: Optional[float] = None
    screenshot_path: Optional[str] = None
    notes: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    
    # Load users from CSV
    users_df = load_users_df()
    user_row = users_df[users_df['id'] == payload['user_id']]
    
    if user_row.empty:
        raise HTTPException(status_code=401, detail="User not found")
    
    user = user_row.iloc[0]
    return {
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "tier": user['tier'],
        "has_completed_screening": bool(user.get('has_completed_screening', False))
    }

def load_grants_df():
    if GRANTS_CSV.exists():
        # Read CSV with proper encoding and preserve all columns as strings initially
        # Use quoting to handle commas in funding amounts
        df = pd.read_csv(GRANTS_CSV, dtype=str, encoding='utf-8', quoting=1)
        return df
    return pd.DataFrame()

def load_soft_approvals():
    if SOFT_APPROVAL_CSV.exists():
        df = pd.read_csv(SOFT_APPROVAL_CSV)
        return df[df['Soft Approval Status'] == 'Yes']['Grant ID'].tolist()
    return []

async def ai_match_grants(profile: dict) -> List[Dict]:
    """Use OpenAI to match and rank grants"""
    grants_df = load_grants_df()
    soft_approval_ids = load_soft_approvals()
    
    if grants_df.empty:
        return []
    
    # Convert grants to list for AI
    grants_list = grants_df.to_dict('records')
    
    # Prepare prompt for OpenAI
    prompt = f"""
You are an AI grant matching expert. Given a startup profile and a list of grants, 
rank the top 10 most relevant grants for this startup and provide detailed reasons for each match.

Startup Profile:
- Name: {profile.get('startup_name', 'N/A')}
- Industry: {profile.get('industry', 'N/A')}
- Stage: {profile.get('stage', 'N/A')}
- Revenue: ${profile.get('revenue', 0)}
- Entity Type: {profile.get('entity_type', 'N/A')}
- Location: {profile.get('location', 'N/A')}
- Demographic: {profile.get('demographic', 'N/A')}
- Stability: {profile.get('stability', 'N/A')}
- Track Record: {profile.get('track_record', 0)} previous projects
- Past Grant Experience: {profile.get('past_grant_experience', 'No')}
- Company Size: {profile.get('company_size', 'N/A')} employees
- Description: {profile.get('description', 'N/A')}

Grants Database:
{json.dumps(grants_list[:12], indent=2)}

Please analyze and return a JSON array of the top 10 matching grants with the following structure:
[
  {{
    "grant_id": "001",
    "name": "Grant Name",
    "relevance_score": 95,
    "reason": "Detailed explanation of why this grant matches, including specific eligibility criteria, sector alignment, stage compatibility, and how the startup's profile aligns with the grant requirements. Be specific about funding amount suitability and any special considerations like demographic focus or location requirements."
  }}
]

Consider these factors for matching:
1. Sector alignment (industry match) - How well does the startup's industry match the grant's sector focus?
2. Stage of startup - Does the startup's stage align with the grant's target stage?
3. Eligibility criteria - Does the startup meet the specific eligibility requirements?
4. Demographic focus - Does the startup match any demographic requirements (woman-owned, etc.)?
5. Funding amount suitability - Is the funding amount appropriate for the startup's size and needs?
6. Location/region - Does the startup's location align with the grant's regional focus?
7. Entity type - Does the startup's entity type match the grant's requirements?
8. Track record - Does the startup's experience level match the grant's expectations?

Provide detailed, specific reasons for each match that explain the alignment between the startup and the grant.

Return ONLY the JSON array, no other text.
"""
    
    try:
        if not openai.api_key or openai.api_key == '':
            # Fallback: return top grants without AI
            matches = []
            for idx, grant in grants_df.head(10).iterrows():
                matches.append({
                    "grant_id": str(grant['Grant ID']),
                    "name": str(grant['Name']),
                    "relevance_score": 85.0,
                    "funding_amount": str(grant['Funding Amount']),
                    "soft_approval": "Yes" if grant['Grant ID'] in soft_approval_ids else "No",
                    "deadline": str(grant['Due Date']),
                    "reason": f"Match based on {profile.get('industry', 'sector')} and {profile.get('stage', 'stage')}",
                    "sector": str(grant['Sector(s)']),
                    "eligibility": str(grant['Eligibility Criteria']),
                    "application_link": str(grant['Application Link']),
                    "stage": str(grant['Stage of Startup'])
                })
            return matches
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a grant matching AI expert. Analyze startup profiles and match them with relevant grants. Return only valid JSON array."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=3000
        )
        
        content = response.choices[0].message.content.strip()
        # Extract JSON if wrapped in markdown
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        ai_matches = json.loads(content)
        
        # Enrich with full grant data
        enriched_matches = []
        for match in ai_matches[:10]:
            grant_id = match['grant_id']
            grant = grants_df[grants_df['Grant ID'] == grant_id]
            if not grant.empty:
                grant = grant.iloc[0]
                enriched_matches.append({
                    "grant_id": str(grant_id),
                    "name": str(match['name']),
                    "relevance_score": float(match['relevance_score']),
                    "funding_amount": str(grant['Funding Amount']),
                    "soft_approval": "Yes" if grant_id in soft_approval_ids else "No",
                    "deadline": str(grant['Due Date']),
                    "reason": str(match['reason']),
                    "sector": str(grant['Sector(s)']),
                    "eligibility": str(grant['Eligibility Criteria']),
                    "application_link": str(grant['Application Link']),
                    "stage": str(grant['Stage of Startup'])
                })
        
        return enriched_matches
        
    except Exception as e:
        logging.error(f"AI matching error: {e}")
        # Fallback to simple matching
        matches = []
        for idx, grant in grants_df.head(10).iterrows():
            matches.append({
                "grant_id": str(grant['Grant ID']),
                "name": str(grant['Name']),
                "relevance_score": 80.0,
                "funding_amount": str(grant['Funding Amount']),
                "soft_approval": "Yes" if grant['Grant ID'] in soft_approval_ids else "No",
                "deadline": str(grant['Due Date']),
                "reason": f"Relevant for {profile.get('industry', 'your sector')}",
                "sector": str(grant['Sector(s)']),
                "eligibility": str(grant['Eligibility Criteria']),
                "application_link": str(grant['Application Link']),
                "stage": str(grant['Stage of Startup'])
            })
        return matches

# Routes
@api_router.get("/")
async def root():
    return {"message": "MyProBuddy API v1.0", "status": "active"}

@api_router.post("/auth/register")
async def register(user: UserRegister):
    # Load existing users
    users_df = load_users_df()
    
    # Check if user exists
    if not users_df.empty and user.email in users_df['email'].values:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "tier": "free",
        "has_completed_screening": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "profile": "",
        "screening_completed_at": "",
        "upgraded_at": "",
        "coupon_used": ""
    }
    
    # Add new user to dataframe
    new_user_df = pd.DataFrame([new_user])
    users_df = pd.concat([users_df, new_user_df], ignore_index=True)
    
    # Save to CSV
    save_users_df(users_df)
    
    return {
        "message": "Registration successful",
        "user_id": user_id
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Load users from CSV
    users_df = load_users_df()
    user_row = users_df[users_df['email'] == credentials.email]
    
    if user_row.empty:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = user_row.iloc[0]
    
    if not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # CRITICAL: Sync tier between users.csv and startups.csv on every login
    # This ensures both files stay in sync even if previous syncs failed
    current_tier = user['tier']
    sync_user_tier_to_startup(user['email'], current_tier)
    
    token = create_token(user['id'], user['email'])
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "tier": user['tier'],
            "has_completed_screening": bool(user.get('has_completed_screening', False))
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "tier": user['tier'],
        "has_completed_screening": bool(user.get('has_completed_screening', False))
    }

@api_router.post("/screening/submit")
async def submit_screening(screening_data: GrantScreeningCombined, user: dict = Depends(get_current_user)):
    # Get profile data
    profile = screening_data.model_dump()
    
    # Update user profile in CSV
    users_df = load_users_df()
    user_idx = users_df[users_df['id'] == user['id']].index[0]
    users_df.at[user_idx, 'profile'] = json.dumps(profile)
    users_df.at[user_idx, 'has_completed_screening'] = True
    users_df.at[user_idx, 'screening_completed_at'] = datetime.now(timezone.utc).isoformat()
    save_users_df(users_df)
    
    # Store startup data in startups.csv
    try:
        startups_df = load_startups_df()
        
        # Check if startup already exists for this user
        existing_startup = startups_df[startups_df['Email'] == user['email']]
        
        if not existing_startup.empty:
            # Update existing startup
            startup_idx = existing_startup.index[0]
            startups_df.at[startup_idx, 'Name'] = profile['startup_name']
            startups_df.at[startup_idx, 'Founder Name'] = profile['founder_name']
            startups_df.at[startup_idx, 'Entity Type'] = profile['entity_type']
            startups_df.at[startup_idx, 'Location'] = profile['location']
            startups_df.at[startup_idx, 'Industry'] = profile['industry']
            startups_df.at[startup_idx, 'Company Size'] = profile['company_size']
            startups_df.at[startup_idx, 'Description'] = profile['description']
            startups_df.at[startup_idx, 'Contact Email'] = profile['contact_email']
            startups_df.at[startup_idx, 'Contact Phone'] = profile['contact_phone']
            startups_df.at[startup_idx, 'Stage'] = profile['stage']
            startups_df.at[startup_idx, 'Revenue'] = profile['revenue']
            startups_df.at[startup_idx, 'Stability'] = profile['stability']
            startups_df.at[startup_idx, 'Demographic'] = profile['demographic']
            startups_df.at[startup_idx, 'Track Record'] = profile['track_record']
            startups_df.at[startup_idx, 'Past Grant Experience'] = profile['past_grant_experience']
            startups_df.at[startup_idx, 'Tier'] = user['tier']
        else:
            # Create new startup entry
            new_startup = {
                'ID': user['id'],
                'Email': user['email'],
                'Password Hash': '',  # Not storing password in startups table
                'Name': profile['startup_name'],
                'Founder Name': profile['founder_name'],
                'Entity Type': profile['entity_type'],
                'Location': profile['location'],
                'Industry': profile['industry'],
                'Company Size': profile['company_size'],
                'Description': profile['description'],
                'Contact Email': profile['contact_email'],
                'Contact Phone': profile['contact_phone'],
                'Stage': profile['stage'],
                'Revenue': profile['revenue'],
                'Stability': profile['stability'],
                'Demographic': profile['demographic'],
                'Track Record': profile['track_record'],
                'Past Grant Experience': profile['past_grant_experience'],
                'Tier': user['tier'],
                'Created At': datetime.now(timezone.utc).isoformat()
            }
            
            new_startup_df = pd.DataFrame([new_startup])
            startups_df = pd.concat([startups_df, new_startup_df], ignore_index=True)
        
        save_startups_df(startups_df)
        logging.info(f"Startup data saved for user {user['email']}")
    except Exception as e:
        logging.error(f"Error saving startup data: {e}")
        # Continue with the rest of the function even if startup saving fails
    
    # Run AI matching
    matches = await ai_match_grants(profile)
    
    # Save matches to CSV
    grant_matches_df = load_grant_matches_df()
    # Remove existing matches for this user
    grant_matches_df = grant_matches_df[grant_matches_df['user_id'] != user['id']]
    
    if matches:
        new_matches = []
        for match in matches:
            new_matches.append({
                "user_id": user['id'],
                "grant_id": match['grant_id'],
                "match_data": json.dumps(match),
                "reason": match.get('reason', 'AI-generated match based on startup profile'),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        new_matches_df = pd.DataFrame(new_matches)
        grant_matches_df = pd.concat([grant_matches_df, new_matches_df], ignore_index=True)
        save_grant_matches_df(grant_matches_df)
    
    return {
        "message": "Screening completed and startup data saved",
        "matches_found": len(matches)
    }

@api_router.get("/grants/matches")
async def get_matches(user: dict = Depends(get_current_user)):
    # Load grant matches from CSV
    grant_matches_df = load_grant_matches_df()
    user_matches = grant_matches_df[grant_matches_df['user_id'] == user['id']]
    
    grant_list = []
    for _, match_row in user_matches.iterrows():
        try:
            match_data = json.loads(match_row['match_data'])
            grant_list.append(match_data)
        except (json.JSONDecodeError, KeyError):
            continue
    
    # If no matches found, return sample grants
    if not grant_list:
        grants_df = load_grants_df()
        if not grants_df.empty:
            # Create sample matches
            sample_grants = grants_df.head(10).to_dict('records')
            for grant in sample_grants:
                grant_list.append({
                    "grant_id": str(grant['Grant ID']),
                    "name": str(grant['Name']),
                    "relevance_score": 85.0,
                    "funding_amount": str(grant['Funding Amount']),
                    "soft_approval": "Yes" if grant['Grant ID'] in load_soft_approvals() else "No",
                    "deadline": str(grant['Due Date']),
                    "reason": f"Sample match for {grant.get('Sector(s)', 'your sector')}",
                    "sector": str(grant['Sector(s)']),
                    "eligibility": str(grant['Eligibility Criteria']),
                    "application_link": str(grant['Application Link']),
                    "stage": str(grant['Stage of Startup'])
                })
    
    # Apply tier-based filtering
    tier = user.get('tier', 'free')
    
    if tier == 'free':
        # Only top 3, soft approval tags for some
        grant_list = grant_list[:3]
    elif tier == 'premium':
        # Top 10
        grant_list = grant_list[:10]
    # expert tier gets all
    
    return {
        "tier": tier,
        "grants": grant_list,
        "total": len(grant_list)
    }

@api_router.post("/coupon/validate")
async def validate_coupon(coupon: CouponValidate, user: dict = Depends(get_current_user)):
    if not COUPONS_CSV.exists():
        raise HTTPException(status_code=404, detail="Coupons not available")
    
    coupons_df = pd.read_csv(COUPONS_CSV)
    coupon_data = coupons_df[coupons_df['Code'] == coupon.code.upper()]
    
    if coupon_data.empty:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    coupon_info = coupon_data.iloc[0]
    
    if not coupon_info['Active']:
        raise HTTPException(status_code=400, detail="Coupon is no longer active")
    
    # Update user tier in CSV
    new_tier = coupon_info['Tier']
    users_df = load_users_df()
    user_idx = users_df[users_df['id'] == user['id']].index[0]
    users_df.at[user_idx, 'tier'] = new_tier
    users_df.at[user_idx, 'upgraded_at'] = datetime.now(timezone.utc).isoformat()
    users_df.at[user_idx, 'coupon_used'] = coupon.code.upper()
    save_users_df(users_df)
    
    # Sync tier to startups.csv - CRITICAL: Keep both files in sync
    print(f"🔄 Starting tier sync for {user['email']} to tier: {new_tier}")
    sync_user_tier_to_startup(user['email'], new_tier)
    print(f"✅ Tier sync completed for {user['email']}")
    
    return {
        "message": f"Tier upgraded to {new_tier}",
        "tier": new_tier,
        "description": coupon_info['Description']
    }

@api_router.get("/stats")
async def get_stats():
    grants_df = load_grants_df()
    users_df = load_users_df()
    grant_matches_df = load_grant_matches_df()
    
    return {
        "total_startups": len(users_df),
        "total_grants": len(grants_df) if not grants_df.empty else 0,
        "active_matches": len(grant_matches_df),
        "success_rate": 87.5
    }

@api_router.get("/grants/all")
async def get_all_grants(user: dict = Depends(get_current_user)):
    """Admin/Expert endpoint to view all grants"""
    grants_df = load_grants_df()
    if grants_df.empty:
        return {"grants": []}
    
    # Clean the data to avoid JSON serialization issues
    grants_df = grants_df.fillna("")  # Replace NaN with empty strings
    grants_list = grants_df.to_dict('records')
    return {"grants": grants_list[:20]}  # Limit to 20 for performance

@api_router.get("/startups/my")
async def get_my_startup(user: dict = Depends(get_current_user)):
    """Get current user's startup data"""
    startups_df = load_startups_df()
    user_startup = startups_df[startups_df['Email'] == user['email']]
    
    if user_startup.empty:
        return None
    
    # Convert to dict and replace NaN values with empty strings or appropriate defaults
    startup_data = user_startup.iloc[0].to_dict()
    
    # Replace NaN values with empty strings for JSON serialization
    for key, value in startup_data.items():
        if pd.isna(value):
            startup_data[key] = ""
    
    return startup_data

@api_router.get("/startups/all")
async def get_all_startups(user: dict = Depends(get_current_user)):
    """Admin endpoint to view all startups"""
    if user.get('tier') not in ['expert', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    startups_df = load_startups_df()
    if startups_df.empty:
        return {"startups": []}
    
    # Clean the data to avoid JSON serialization issues
    startups_df = startups_df.fillna("")  # Replace NaN with empty strings
    startups_list = startups_df.to_dict('records')
    return {"startups": startups_list}

# Grant Tracking Endpoints
@api_router.get("/tracking/startups")
async def get_startups_for_tracking(user: dict = Depends(get_current_user)):
    """Get startups for venture analysts to track - based on user tier from users.csv"""
    if user.get('tier') not in ['venture_analyst', 'expert', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    startups_df = load_startups_df()
    users_df = load_users_df()
    
    if startups_df.empty or users_df.empty:
        return {"startups": []}
    
    # Filter to show only Expert/Premium tier startups for venture analysts
    if user.get('tier') == 'venture_analyst':
        # Get users with expert or premium tier
        expert_premium_users = users_df[users_df['tier'].isin(['expert', 'premium'])]
        expert_premium_emails = expert_premium_users['email'].tolist()
        
        # Filter startups based on user tier
        filtered_startups = startups_df[startups_df['Email'].isin(expert_premium_emails)]
    else:
        filtered_startups = startups_df  # Admin/expert can see all
    
    # Return simplified startup data for dropdown
    startups_list = []
    for _, startup in filtered_startups.iterrows():
        # Get user tier from users.csv
        user_info = users_df[users_df['email'] == startup['Email']]
        user_tier = user_info['tier'].iloc[0] if not user_info.empty else 'free'
        
        startups_list.append({
            "id": startup['ID'],
            "name": startup['Name'],
            "email": startup['Email'],
            "industry": startup['Industry'],
            "location": startup['Location'],
            "tier": user_tier  # Use tier from users.csv
        })
    
    return {"startups": startups_list}

@api_router.get("/tracking/grants/{startup_id}")
async def get_startup_grant_tracking(startup_id: str, user: dict = Depends(get_current_user)):
    """Get grant tracking data for a specific startup"""
    if user.get('tier') not in ['venture_analyst', 'expert', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tracking_df = load_grant_tracking_df()
    startup_tracking = tracking_df[tracking_df['startup_id'] == startup_id]
    
    # Filter by user for venture analysts - they only see their own tracking entries
    if user.get('tier') == 'venture_analyst':
        startup_tracking = startup_tracking[startup_tracking['user_id'] == user['id']]
    
    if startup_tracking.empty:
        return {"tracking": []}
    
    # Get grant details for each tracking entry
    grants_df = load_grants_df()
    tracking_list = []
    
    for _, track in startup_tracking.iterrows():
        # Try to match grant ID with different formats
        grant_id = str(track['grant_id'])
        grant_info = grants_df[grants_df['Grant ID'] == grant_id]
        
        # If not found, try with leading zeros (e.g., "9" -> "009")
        if grant_info.empty and grant_id.isdigit():
            padded_id = grant_id.zfill(3)
            grant_info = grants_df[grants_df['Grant ID'] == padded_id]
        
        # If still not found, try without leading zeros (e.g., "003" -> "3")
        if grant_info.empty:
            grant_info = grants_df[grants_df['Grant ID'].str.lstrip('0') == grant_id]
        
        grant_name = grant_info['Name'].iloc[0] if not grant_info.empty else f"Grant {grant_id}"
        
        tracking_list.append({
            "id": str(track['id']) if pd.notna(track['id']) else "",
            "grant_id": str(track['grant_id']) if pd.notna(track['grant_id']) else "",
            "grant_name": grant_name,
            "status": str(track['status']) if pd.notna(track['status']) else "Draft",
            "progress": str(track['progress']) if pd.notna(track['progress']) else "",
            "applied_date": str(track['applied_date']) if pd.notna(track['applied_date']) else "",
            "approved_date": str(track['approved_date']) if pd.notna(track['approved_date']) else "",
            "disbursed_date": str(track['disbursed_date']) if pd.notna(track['disbursed_date']) else "",
            "rejected_date": str(track['rejected_date']) if pd.notna(track['rejected_date']) else "",
            "disbursed_amount": str(track['disbursed_amount']) if pd.notna(track['disbursed_amount']) else "",
            "screenshot_path": str(track['screenshot_path']) if pd.notna(track['screenshot_path']) else "",
            "notes": str(track['notes']) if pd.notna(track['notes']) else "",
            "created_at": str(track['created_at']) if pd.notna(track['created_at']) else "",
            "updated_at": str(track['updated_at']) if pd.notna(track['updated_at']) else ""
        })
    
    return {"tracking": tracking_list}

@api_router.get("/tracking/all")
async def get_all_venture_analyst_tracking(user: dict = Depends(get_current_user)):
    """Get all tracking entries created by the venture analyst across all startups"""
    if user.get('tier') not in ['venture_analyst', 'expert', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tracking_df = load_grant_tracking_df()
    
    # For venture analysts, filter by their user_id
    if user.get('tier') == 'venture_analyst':
        analyst_tracking = tracking_df[tracking_df['user_id'] == user['id']]
    else:
        # For experts and admins, show all tracking
        analyst_tracking = tracking_df
    
    if analyst_tracking.empty:
        return {"tracking": [], "count": 0}
    
    # Get grant details and startup info for each tracking entry
    grants_df = load_grants_df()
    startups_df = load_startups_df()
    tracking_list = []
    
    for _, track in analyst_tracking.iterrows():
        # Try to match grant ID with different formats
        grant_id = str(track['grant_id'])
        grant_info = grants_df[grants_df['Grant ID'] == grant_id]
        
        # If not found, try with leading zeros (e.g., "9" -> "009")
        if grant_info.empty and grant_id.isdigit():
            padded_id = grant_id.zfill(3)
            grant_info = grants_df[grants_df['Grant ID'] == padded_id]
        
        # If still not found, try without leading zeros (e.g., "003" -> "3")
        if grant_info.empty:
            grant_info = grants_df[grants_df['Grant ID'].str.lstrip('0') == grant_id]
        
        grant_name = grant_info['Name'].iloc[0] if not grant_info.empty else f"Grant {grant_id}"
        
        # Get startup info
        startup_info = startups_df[startups_df['ID'] == track['startup_id']]
        startup_name = startup_info['Name'].iloc[0] if not startup_info.empty else "Unknown Startup"
        
        tracking_list.append({
            "id": str(track['id']) if pd.notna(track['id']) else "",
            "startup_id": str(track['startup_id']) if pd.notna(track['startup_id']) else "",
            "startup_name": startup_name,
            "grant_id": str(track['grant_id']) if pd.notna(track['grant_id']) else "",
            "grant_name": grant_name,
            "status": str(track['status']) if pd.notna(track['status']) else "Draft",
            "progress": str(track['progress']) if pd.notna(track['progress']) else "",
            "applied_date": str(track['applied_date']) if pd.notna(track['applied_date']) else "",
            "approved_date": str(track['approved_date']) if pd.notna(track['approved_date']) else "",
            "disbursed_date": str(track['disbursed_date']) if pd.notna(track['disbursed_date']) else "",
            "rejected_date": str(track['rejected_date']) if pd.notna(track['rejected_date']) else "",
            "disbursed_amount": str(track['disbursed_amount']) if pd.notna(track['disbursed_amount']) else "",
            "screenshot_path": str(track['screenshot_path']) if pd.notna(track['screenshot_path']) else "",
            "notes": str(track['notes']) if pd.notna(track['notes']) else "",
            "created_at": str(track['created_at']) if pd.notna(track['created_at']) else "",
            "updated_at": str(track['updated_at']) if pd.notna(track['updated_at']) else ""
        })
    
    return {"tracking": tracking_list, "count": len(tracking_list)}

@api_router.post("/tracking/create")
async def create_grant_tracking(tracking_data: GrantTrackingCreate, user: dict = Depends(get_current_user)):
    """Create new grant tracking entry"""
    if user.get('tier') not in ['venture_analyst', 'expert', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tracking_df = load_grant_tracking_df()
    
    # Check if tracking already exists
    existing = tracking_df[(tracking_df['startup_id'] == tracking_data.startup_id) & 
                          (tracking_df['grant_id'] == tracking_data.grant_id)]
    if not existing.empty:
        raise HTTPException(status_code=400, detail="Grant tracking already exists for this startup")
    
    # Create new tracking entry
    tracking_id = str(uuid.uuid4())
    new_tracking = {
        "id": tracking_id,
        "user_id": user['id'],
        "startup_id": tracking_data.startup_id,
        "grant_id": tracking_data.grant_id,
        "status": tracking_data.status,
        "progress": tracking_data.progress,
        "applied_date": "",
        "approved_date": "",
        "disbursed_date": "",
        "rejected_date": "",
        "disbursed_amount": "",
        "screenshot_path": "",
        "notes": tracking_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    new_tracking_df = pd.DataFrame([new_tracking])
    tracking_df = pd.concat([tracking_df, new_tracking_df], ignore_index=True)
    save_grant_tracking_df(tracking_df)
    
    return {"message": "Grant tracking created successfully", "tracking_id": tracking_id}

@api_router.put("/tracking/{tracking_id}")
async def update_grant_tracking(tracking_id: str, update_data: GrantTrackingUpdate, user: dict = Depends(get_current_user)):
    """Update grant tracking entry"""
    if user.get('tier') not in ['venture_analyst', 'expert', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tracking_df = load_grant_tracking_df()
    tracking_idx = tracking_df[tracking_df['id'] == tracking_id].index
    
    if tracking_idx.empty:
        raise HTTPException(status_code=404, detail="Grant tracking not found")
    
    # Update fields
    for field, value in update_data.model_dump(exclude_unset=True).items():
        if value is not None:
            tracking_df.at[tracking_idx[0], field] = value
    
    # Set updated timestamp
    tracking_df.at[tracking_idx[0], 'updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Set status-specific dates (check for NaN or empty values properly)
    if update_data.status == "Applied":
        current_date = tracking_df.at[tracking_idx[0], 'applied_date']
        if pd.isna(current_date) or str(current_date).strip() == '':
            tracking_df.at[tracking_idx[0], 'applied_date'] = datetime.now(timezone.utc).isoformat()
    elif update_data.status == "Approved":
        current_date = tracking_df.at[tracking_idx[0], 'approved_date']
        if pd.isna(current_date) or str(current_date).strip() == '':
            tracking_df.at[tracking_idx[0], 'approved_date'] = datetime.now(timezone.utc).isoformat()
    elif update_data.status == "Disbursed":
        current_date = tracking_df.at[tracking_idx[0], 'disbursed_date']
        if pd.isna(current_date) or str(current_date).strip() == '':
            tracking_df.at[tracking_idx[0], 'disbursed_date'] = datetime.now(timezone.utc).isoformat()
    elif update_data.status == "Rejected":
        current_date = tracking_df.at[tracking_idx[0], 'rejected_date']
        if pd.isna(current_date) or str(current_date).strip() == '':
            tracking_df.at[tracking_idx[0], 'rejected_date'] = datetime.now(timezone.utc).isoformat()
    
    save_grant_tracking_df(tracking_df)
    
    return {"message": "Grant tracking updated successfully"}

@api_router.delete("/tracking/{tracking_id}")
async def delete_grant_tracking(tracking_id: str, user: dict = Depends(get_current_user)):
    """Delete grant tracking entry"""
    if user.get('tier') not in ['venture_analyst', 'expert', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tracking_df = load_grant_tracking_df()
    tracking_idx = tracking_df[tracking_df['id'] == tracking_id].index
    
    if tracking_idx.empty:
        raise HTTPException(status_code=404, detail="Grant tracking not found")
    
    tracking_df = tracking_df.drop(tracking_idx[0])
    save_grant_tracking_df(tracking_df)
    
    return {"message": "Grant tracking deleted successfully"}

@api_router.get("/tracking/expert/{startup_id}")
async def get_expert_startup_tracking(startup_id: str, user: dict = Depends(get_current_user)):
    """Get all tracking entries for a startup (for all tier dashboards)"""
    # Allow all tiers to view their own startup's tracking
    if user.get('tier') not in ['free', 'premium', 'expert', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify the startup belongs to this user
    startups_df = load_startups_df()
    startup = startups_df[startups_df['ID'] == startup_id]
    
    if startup.empty:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    # Users can only see tracking for their own startup (except admins)
    if user.get('tier') != 'admin' and startup.iloc[0]['Email'] != user.get('email'):
        raise HTTPException(status_code=403, detail="Access denied - not your startup")
    
    tracking_df = load_grant_tracking_df()
    startup_tracking = tracking_df[tracking_df['startup_id'] == startup_id]
    
    if startup_tracking.empty:
        return {"tracking": []}
    
    # Get grant details and venture analyst info for each tracking entry
    grants_df = load_grants_df()
    users_df = load_users_df()
    tracking_list = []
    
    for _, track in startup_tracking.iterrows():
        # Try to match grant ID with different formats
        grant_id = str(track['grant_id'])
        grant_info = grants_df[grants_df['Grant ID'] == grant_id]
        
        # If not found, try with leading zeros (e.g., "9" -> "009")
        if grant_info.empty and grant_id.isdigit():
            padded_id = grant_id.zfill(3)
            grant_info = grants_df[grants_df['Grant ID'] == padded_id]
        
        # If still not found, try without leading zeros (e.g., "003" -> "3")
        if grant_info.empty:
            grant_info = grants_df[grants_df['Grant ID'].str.lstrip('0') == grant_id]
        
        grant_name = grant_info['Name'].iloc[0] if not grant_info.empty else f"Grant {grant_id}"
        
        # Get venture analyst info
        analyst_info = users_df[users_df['id'] == track['user_id']]
        analyst_name = analyst_info['name'].iloc[0] if not analyst_info.empty else "Unknown Analyst"
        
        tracking_list.append({
            "id": str(track['id']) if pd.notna(track['id']) else "",
            "grant_id": str(track['grant_id']) if pd.notna(track['grant_id']) else "",
            "grant_name": grant_name,
            "status": str(track['status']) if pd.notna(track['status']) else "Draft",
            "progress": str(track['progress']) if pd.notna(track['progress']) else "",
            "applied_date": str(track['applied_date']) if pd.notna(track['applied_date']) else "",
            "approved_date": str(track['approved_date']) if pd.notna(track['approved_date']) else "",
            "disbursed_date": str(track['disbursed_date']) if pd.notna(track['disbursed_date']) else "",
            "rejected_date": str(track['rejected_date']) if pd.notna(track['rejected_date']) else "",
            "disbursed_amount": str(track['disbursed_amount']) if pd.notna(track['disbursed_amount']) else "",
            "screenshot_path": str(track['screenshot_path']) if pd.notna(track['screenshot_path']) else "",
            "notes": str(track['notes']) if pd.notna(track['notes']) else "",
            "created_at": str(track['created_at']) if pd.notna(track['created_at']) else "",
            "updated_at": str(track['updated_at']) if pd.notna(track['updated_at']) else "",
            "analyst_name": analyst_name,
            "analyst_id": str(track['user_id']) if pd.notna(track['user_id']) else ""
        })
    
    return {"tracking": tracking_list}

@api_router.put("/users/{user_id}/tier")
async def update_user_tier(user_id: str, tier_data: dict, user: dict = Depends(get_current_user)):
    """Update user tier and sync with startups.csv"""
    if user.get('tier') not in ['admin', 'venture_analyst']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    new_tier = tier_data.get('tier')
    if not new_tier or new_tier not in ['free', 'premium', 'expert']:
        raise HTTPException(status_code=400, detail="Invalid tier. Must be 'free', 'premium', or 'expert'")
    
    try:
        users_df = load_users_df()
        user_idx = users_df[users_df['id'] == user_id].index
        
        if user_idx.empty:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = users_df.at[user_idx[0], 'email']
        old_tier = users_df.at[user_idx[0], 'tier']
        
        # Update tier in users.csv
        users_df.at[user_idx[0], 'tier'] = new_tier
        users_df.at[user_idx[0], 'upgraded_at'] = datetime.now(timezone.utc).isoformat()
        save_users_df(users_df)
        
        # Sync tier to startups.csv
        sync_user_tier_to_startup(user_email, new_tier)
        
        return {
            "message": f"User tier updated from {old_tier} to {new_tier}",
            "user_id": user_id,
            "email": user_email,
            "old_tier": old_tier,
            "new_tier": new_tier
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user tier: {str(e)}")

@api_router.post("/tracking/{tracking_id}/screenshot")
async def upload_screenshot(tracking_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload screenshot for a tracking entry"""
    if user.get('tier') not in ['venture_analyst', 'expert', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify tracking entry exists and user has access
    tracking_df = load_grant_tracking_df()
    tracking_idx = tracking_df[tracking_df['id'] == tracking_id].index
    
    if tracking_idx.empty:
        raise HTTPException(status_code=404, detail="Grant tracking not found")
    
    # Check if user has access to this tracking entry
    tracking_entry = tracking_df.iloc[tracking_idx[0]]
    if user.get('tier') == 'venture_analyst' and tracking_entry['user_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create uploads directory if it doesn't exist
    upload_dir = "backend/uploads/screenshots"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png'
    filename = f"{tracking_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update tracking entry with screenshot path
        tracking_df.at[tracking_idx[0], 'screenshot_path'] = file_path
        tracking_df.at[tracking_idx[0], 'updated_at'] = datetime.now(timezone.utc).isoformat()
        save_grant_tracking_df(tracking_df)
        
        return {"message": "Screenshot uploaded successfully", "file_path": file_path}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload screenshot: {str(e)}")

def generate_grants_pdf(grants_data, user_name="User"):
    """Generate PDF with grants data in professional card-based layout"""
    
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_file.close()
    
    # Create PDF document in portrait orientation for better readability
    from reportlab.lib.pagesizes import A4
    doc = SimpleDocTemplate(temp_file.name, pagesize=A4, 
                          rightMargin=40, leftMargin=40, 
                          topMargin=60, bottomMargin=40,
                          encoding='utf-8')
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Header style
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading1'],
        fontSize=28,
        spaceAfter=15,
        alignment=1,  # Center alignment
        textColor=colors.HexColor('#5d248f'),
        fontName='Helvetica-Bold'
    )
    
    # Subtitle style
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=14,
        spaceAfter=25,
        alignment=1,  # Center alignment
        textColor=colors.HexColor('#666666'),
        fontName='Helvetica'
    )
    
    # Add header with company branding
    header = Paragraph("MyProBuddy Premium", header_style)
    elements.append(header)
    
    # Add subtitle
    subtitle = Paragraph(f"Grant Matches Report for {user_name}", subtitle_style)
    elements.append(subtitle)
    
    # Add generation date
    from datetime import datetime
    date_style = ParagraphStyle(
        'DateStyle',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=30,
        alignment=1,
        textColor=colors.HexColor('#888888'),
        fontName='Helvetica-Oblique'
    )
    date_text = Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", date_style)
    elements.append(date_text)
    
    elements.append(Spacer(1, 20))
    
    # Create individual grant cards instead of a table
    for i, grant in enumerate(grants_data):
        # Create a card-style layout for each grant
        card_data = []
        
        # Grant header with ID and name - ensure proper display
        grant_id = grant.get('grant_id', 'N/A')
        grant_name = grant.get('name', 'Unknown Grant')
        
        # Create separate header elements for better control
        grant_id_style = ParagraphStyle(
            'GrantID',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.white,
            fontName='Helvetica-Bold',
            alignment=0,  # Left align
            spaceAfter=0
        )
        
        grant_name_style = ParagraphStyle(
            'GrantName',
            parent=styles['Normal'],
            fontSize=16,
            textColor=colors.white,
            fontName='Helvetica-Bold',
            alignment=0,  # Left align
            spaceAfter=0
        )
        
        # Create header content
        header_content = f"<para align='left'><font name='Helvetica-Bold' size='12' color='white'>Grant #{grant_id}</font><br/><font name='Helvetica-Bold' size='16' color='white'>{grant_name}</font></para>"
        card_data.append([Paragraph(header_content, grant_id_style)])
        
        # Grant details in a 2-column layout
        details_data = []
        
        # Left column details
        left_details = []
        left_details.append(f"<b>Sector:</b> {grant.get('sector', 'N/A')}")
        left_details.append(f"<b>Stage:</b> {grant.get('stage', 'N/A')}")
        left_details.append(f"<b>Deadline:</b> {grant.get('deadline', 'N/A')}")
        
        # Right column details - fix rupee symbol display
        right_details = []
        funding_amount = grant.get('funding_amount', 'N/A')
        
        # Fix rupee symbol display - use "Rs." for rupee symbol
        if funding_amount != 'N/A':
            # Remove any existing rupee symbols and format properly
            clean_amount = str(funding_amount).replace('₹', '').replace('Rs.', '').replace('&#x20b9;', '').strip()
            # Use "Rs." for rupee symbol
            funding_display = f"Rs. {clean_amount}"
        else:
            funding_display = 'N/A'
        
        right_details.append(f"<b>Funding Amount:</b> {funding_display}")
        right_details.append(f"<b>Match Score:</b> {grant.get('relevance_score', 'N/A')}%")
        
        # Create detail paragraphs with better styling
        detail_style = ParagraphStyle(
            'GrantDetail',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.black,
            fontName='Helvetica',
            spaceAfter=6,
            leftIndent=0,
            leading=14
        )
        
        left_para = Paragraph("<br/>".join(left_details), detail_style)
        right_para = Paragraph("<br/>".join(right_details), detail_style)
        
        details_data.append([left_para, right_para])
        
        # Match reason section with better formatting
        reason_text = grant.get('reason', 'No reason provided')
        
        # Fix rupee symbols in match reasons - replace with Rs.
        reason_text = str(reason_text).replace('₹', 'Rs.').replace('&#x20b9;', 'Rs.')
        
        reason_style = ParagraphStyle(
            'MatchReason',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.black,
            fontName='Helvetica',
            spaceAfter=8,
            leftIndent=0,
            rightIndent=0,
            leading=14
        )
        reason_para = Paragraph(f"<b>Why This Matches:</b> {reason_text}", reason_style)
        card_data.append([reason_para])
        
        # Create the card table with better styling
        card_table = Table(card_data, colWidths=[7*inch])
        
        # Enhanced card styling
        card_table.setStyle(TableStyle([
            # Card background and border
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f9fa')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#dee2e6')),
            ('ROUNDEDCORNERS', (0, 0), (-1, -1), 8),
            
            # Padding
            ('LEFTPADDING', (0, 0), (-1, -1), 20),
            ('RIGHTPADDING', (0, 0), (-1, -1), 20),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            
            # Header styling - ensure proper background
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#5d248f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 16),
            ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
            
            # Content styling
            ('VALIGN', (0, 1), (-1, -1), 'TOP'),
        ]))
        
        # Create details table with better spacing
        details_table = Table(details_data, colWidths=[3.5*inch, 3.5*inch])
        details_table.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        # Add the card to elements
        elements.append(card_table)
        elements.append(Spacer(1, 20))
        
        # Add details table
        elements.append(details_table)
        elements.append(Spacer(1, 25))
        
        # Add page break after every 2 grants for better spacing
        if (i + 1) % 2 == 0 and i < len(grants_data) - 1:
            elements.append(PageBreak())
    
    # Add footer
    elements.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=9,
        alignment=1,
        textColor=colors.HexColor('#6c757d'),
        fontName='Helvetica-Oblique'
    )
    footer = Paragraph("This report was generated by MyProBuddy Premium Grant Matching System", footer_style)
    elements.append(footer)
    
    # Build PDF
    doc.build(elements)
    
    return temp_file.name

@api_router.get("/grants/download-pdf")
async def download_grants_pdf(user: dict = Depends(get_current_user)):
    """Download grants as PDF with processing delay"""
    try:
        # Add a realistic delay to simulate PDF generation time
        import asyncio
        await asyncio.sleep(3)  # Wait 3 seconds to simulate processing
        
        # Get user's grant matches
        grant_matches_df = load_grant_matches_df()
        user_matches = grant_matches_df[grant_matches_df['user_id'] == user['id']]
        
        grants_data = []
        for _, match_row in user_matches.iterrows():
            try:
                match_data = json.loads(match_row['match_data'])
                grants_data.append(match_data)
            except (json.JSONDecodeError, KeyError):
                continue
        
        # If no matches found, get sample grants
        if not grants_data:
            grants_df = load_grants_df()
            if not grants_df.empty:
                sample_grants = grants_df.head(10).to_dict('records')
                for grant in sample_grants:
                    grants_data.append({
                        "grant_id": str(grant['Grant ID']),
                        "name": str(grant['Name']),
                        "relevance_score": 85.0,
                        "funding_amount": str(grant['Funding Amount']),
                        "soft_approval": "Yes" if grant['Grant ID'] in load_soft_approvals() else "No",
                        "deadline": str(grant['Due Date']),
                        "reason": f"Sample match for {grant.get('Sector(s)', 'your sector')}",
                        "sector": str(grant['Sector(s)']),
                        "eligibility": str(grant['Eligibility Criteria']),
                        "application_link": str(grant['Application Link']),
                        "stage": str(grant['Stage of Startup'])
                    })
        
        # Add another delay for PDF generation
        await asyncio.sleep(2)  # Wait 2 more seconds for PDF generation
        
        # Generate PDF
        pdf_path = generate_grants_pdf(grants_data, user['name'])
        
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"grant_matches_{user['name'].replace(' ', '_')}.pdf",
            headers={"Content-Disposition": f"attachment; filename=grant_matches_{user['name'].replace(' ', '_')}.pdf"}
        )
        
    except Exception as e:
        logging.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")

app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
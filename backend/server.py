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
import math
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
NOTIFICATIONS_CSV = DATA_DIR / 'notifications.csv'

# CSV Storage Configuration
USERS_CSV = DATA_DIR / 'users.csv'
GRANT_MATCHES_CSV = DATA_DIR / 'grant_matches.csv'
STARTUP_ASSIGNMENTS_CSV = DATA_DIR / 'startup_assignments.csv'

# OpenAI setup
openai.api_key = os.environ.get('OPENAI_API_KEY')
if not openai.api_key:
    print("⚠️  WARNING: OPENAI_API_KEY environment variable not set. AI matching will not work.")
    print("   Set the environment variable: export OPENAI_API_KEY='your-api-key-here'")

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

def load_startup_assignments_df():
    """Load startup assignments from CSV file"""
    if STARTUP_ASSIGNMENTS_CSV.exists():
        return pd.read_csv(STARTUP_ASSIGNMENTS_CSV)
    return pd.DataFrame(columns=['id', 'startup_id', 'assigned_to_id', 'assigned_to_type', 'assigned_by', 'assigned_at'])

def save_startup_assignments_df(df):
    """Save startup assignments to CSV file"""
    df.to_csv(STARTUP_ASSIGNMENTS_CSV, index=False)

def load_notifications_df():
    """Load notifications from CSV file"""
    if NOTIFICATIONS_CSV.exists():
        return pd.read_csv(NOTIFICATIONS_CSV)
    return pd.DataFrame(columns=[
        'id', 'to_user_id', 'from_user_id', 'type', 'title', 'message', 'data', 'created_at', 'read'
    ])

def save_notifications_df(df):
    """Save notifications to CSV file"""
    df.to_csv(NOTIFICATIONS_CSV, index=False)

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

# Incubation Registration Link Management
def load_incubation_links_df():
    """Load incubation registration links from CSV"""
    try:
        file_path = ROOT_DIR / "data" / "incubation_links.csv"
        if file_path.exists():
            return pd.read_csv(file_path)
        else:
            # Create empty dataframe with required columns
            return pd.DataFrame(columns=[
                'id', 'incubation_admin_id', 'incubation_admin_name', 'link_code', 
                'created_at', 'is_active', 'usage_count'
            ])
    except Exception as e:
        print(f"Error loading incubation links: {e}")
        return pd.DataFrame(columns=[
            'id', 'incubation_admin_id', 'incubation_admin_name', 'link_code', 
            'created_at', 'is_active', 'usage_count'
        ])

def save_incubation_links_df(df):
    """Save incubation registration links to CSV"""
    try:
        file_path = ROOT_DIR / "data" / "incubation_links.csv"
        df.to_csv(file_path, index=False)
    except Exception as e:
        print(f"Error saving incubation links: {e}")

def generate_link_code():
    """Generate a unique 8-character link code"""
    import secrets
    import string
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

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
    year_of_incorporation: int
    industry: str
    industry_other: Optional[str] = None
    company_size: int
    description: str
    contact_email: EmailStr
    contact_phone: str
    ownership_type: str  # Single selection field
    funding_need: float
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

class VentureAnalystProfileUpdate(BaseModel):
    name: Optional[str] = None
    photo_url: Optional[str] = None
    calendly_link: Optional[str] = None

class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    tier: str  # venture_analyst, incubation_admin, admin

class AssignStartupsRequest(BaseModel):
    user_id: str
    startup_ids: List[str]
    assigned_to_type: str  # venture_analyst or incubation_admin

class CreateGrantRequest(BaseModel):
    # Required fields
    name: str
    sector: str
    
    # Optional fields - matching all CSV columns
    sector_other: Optional[str] = None
    eligibility: Optional[str] = ""
    funding_amount: Optional[str] = ""
    funding_type: Optional[str] = ""
    funding_ratio: Optional[str] = ""
    application_link: Optional[str] = ""
    documents_required: Optional[str] = ""
    deadline: Optional[str] = ""
    region_focus: Optional[str] = ""
    contact_info: Optional[str] = ""
    place: Optional[str] = ""
    soft_approval: Optional[str] = "No"
    stage: Optional[str] = ""
    sector_focus: Optional[str] = ""
    gender_focus: Optional[str] = ""
    innovation_type: Optional[str] = ""
    trl: Optional[str] = ""
    impact_criteria: Optional[str] = ""
    co_investment_requirement: Optional[str] = ""
    matching_investment: Optional[str] = ""
    repayment_terms: Optional[str] = ""
    disbursement_schedule: Optional[str] = ""
    mentorship_training: Optional[str] = ""
    program_duration: Optional[str] = ""
    success_metrics: Optional[str] = ""

class IncubationRegistrationLink(BaseModel):
    incubation_admin_id: str
    incubation_admin_name: str
    link_code: str
    created_at: str
    is_active: bool = True
    usage_count: int = 0

class IncubationUserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    link_code: str

# Custom JSON encoder to handle NaN values
class SafeJSONEncoder(json.JSONEncoder):
    def encode(self, obj):
        return super().encode(self._clean_for_json(obj))
    
    def _clean_for_json(self, obj):
        if obj is None:
            return None
        elif isinstance(obj, (str, int, bool)):
            return obj
        elif isinstance(obj, float):
            if pd.isna(obj) or obj != obj or math.isnan(obj):  # Check for NaN
                return None
            return obj
        elif isinstance(obj, dict):
            return {key: self._clean_for_json(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._clean_for_json(item) for item in obj]
        elif hasattr(obj, 'item'):  # numpy scalar
            result = obj.item()
            return self._clean_for_json(result)
        elif hasattr(obj, 'tolist'):  # numpy array
            return self._clean_for_json(obj.tolist())
        else:
            return str(obj)

# Helper functions
def convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if hasattr(obj, 'item'):  # numpy scalar
        result = obj.item()
        if isinstance(result, float) and (pd.isna(result) or result != result):  # Check for NaN
            return None
        return result
    elif hasattr(obj, 'tolist'):  # numpy array
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, float) and (pd.isna(obj) or obj != obj):  # Check for NaN
        return None
    elif pd.isna(obj):  # Handle pandas NaN
        return None
    return obj

def clean_for_json(obj):
    """Recursively clean data for JSON serialization"""
    if obj is None:
        return None
    elif isinstance(obj, (str, int, bool)):
        return obj
    elif isinstance(obj, float):
        if pd.isna(obj) or obj != obj:  # Check for NaN
            return None
        return obj
    elif isinstance(obj, dict):
        return {key: clean_for_json(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    elif hasattr(obj, 'item'):  # numpy scalar
        result = obj.item()
        return clean_for_json(result)
    elif hasattr(obj, 'tolist'):  # numpy array
        return clean_for_json(obj.tolist())
    else:
        # Convert to string as fallback
        return str(obj)

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

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user and verify they are admin"""
    user = await get_current_user(credentials)
    if user['tier'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_incubation_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user and verify they are incubation admin"""
    user = await get_current_user(credentials)
    if user['tier'] != 'incubation_admin':
        raise HTTPException(status_code=403, detail="Incubation admin access required")
    return user

def load_grants_df():
    if GRANTS_CSV.exists():
        # Read CSV with proper encoding and preserve all columns as strings initially
        # Use quoting to handle commas in funding amounts
        df = pd.read_csv(GRANTS_CSV, dtype=str, encoding='utf-8', quoting=1)
        return df
    return pd.DataFrame()

def save_grants_df(df):
    """Save grants to CSV file"""
    df.to_csv(GRANTS_CSV, index=False, encoding='utf-8', quoting=1)

def load_soft_approvals():
    """Load soft approved grant IDs - returns normalized IDs for comparison"""
    soft_ids = []
    
    # Load from soft_approval.csv if exists
    if SOFT_APPROVAL_CSV.exists():
        try:
            df = pd.read_csv(SOFT_APPROVAL_CSV)
            # Try to find the soft approval column with different possible names
            if 'Soft Approval Status' in df.columns:
                soft_ids = df[df['Soft Approval Status'] == 'Yes']['Grant ID'].tolist()
            elif 'Soft Approval' in df.columns:
                soft_ids = df[df['Soft Approval'] == 'Yes']['Grant ID'].tolist()
            elif 'grant_id' in df.columns:
                soft_ids = df['grant_id'].tolist()
        except Exception as e:
            logging.warning(f"Could not load soft approvals from CSV: {e}")
    
    # Normalize IDs - convert to string and remove leading zeros for comparison
    # Store both formats: "1" and "001" so both will match
    normalized_ids = set()
    for id in soft_ids:
        id_str = str(id).strip()
        normalized_ids.add(id_str)
        # Also add zero-padded version
        if id_str.isdigit():
            normalized_ids.add(id_str.zfill(3))  # "1" -> "001"
    
    return list(normalized_ids)

def is_soft_approved(grant_id, soft_approval_ids):
    """Check if a grant ID is in the soft approval list, handling format differences"""
    grant_id_str = str(grant_id).strip()
    return grant_id_str in soft_approval_ids

async def ai_match_grants(profile: dict) -> List[Dict]:
    """Use OpenAI to match and rank grants"""
    grants_df = load_grants_df()
    soft_approval_ids = load_soft_approvals()
    
    if grants_df.empty:
        return []
    
    # Convert grants to list for AI
    grants_list = grants_df.to_dict('records')
    
    # Prepare prompt for OpenAI
    # Handle both string and array formats for backward compatibility
    ownership_type = profile.get('ownership_type', 'N/A')
    if isinstance(ownership_type, list):
        ownership_types = ', '.join(ownership_type) if ownership_type else 'N/A'
    else:
        ownership_types = ownership_type
    industry_display = profile.get('industry', 'N/A')
    if profile.get('industry') == 'Other' and profile.get('industry_other'):
        industry_display = profile.get('industry_other')
    
    prompt = f"""
You are an AI grant matching expert. Given a startup profile and a list of grants, 
rank the top 10 most relevant grants for this startup and provide detailed reasons for each match.

Startup Profile:
- Name: {profile.get('startup_name', 'N/A')}
- Industry: {industry_display}
- Stage: {profile.get('stage', 'N/A')}
- Revenue: ${profile.get('revenue', 0)}
- Entity Type: {profile.get('entity_type', 'N/A')}
- Location: {profile.get('location', 'N/A')}
- Demographic: {profile.get('demographic', 'N/A')}
- Stability: {profile.get('stability', 'N/A')}
- Track Record: {profile.get('track_record', 0)} previous projects
- Past Grant Experience: {profile.get('past_grant_experience', 'No')}
- Company Size: {profile.get('company_size', 'N/A')} employees
- Ownership Type: {ownership_types}
- Funding Need: ${profile.get('funding_need', 0)}
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
4. Demographic focus - Does the startup match any demographic requirements (woman-owned, minority-owned, youth-owned, veteran-owned)?
5. Funding amount suitability - Is the funding amount appropriate for the startup's funding needs (${profile.get('funding_need', 0)})?
6. Location/region - Does the startup's location align with the grant's regional focus?
7. Entity type - Does the startup's entity type match the grant's requirements?
8. Ownership type - Does the startup's ownership structure ({ownership_types}) align with grant preferences?
9. Track record - Does the startup's experience level match the grant's expectations?

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
                    "soft_approval": "Yes" if is_soft_approved(grant['Grant ID'], soft_approval_ids) else "No",
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
                    "soft_approval": "Yes" if is_soft_approved(grant_id, soft_approval_ids) else "No",
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
                "soft_approval": "Yes" if is_soft_approved(grant['Grant ID'], soft_approval_ids) else "No",
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
    
    # Check if password_hash exists (for admin and newer users), otherwise use password field
    password_to_verify = user.get('password_hash', '')
    if pd.isna(password_to_verify) or password_to_verify == '':
        password_to_verify = user.get('password', '')
    
    # Handle NaN values
    if pd.isna(password_to_verify) or password_to_verify == '':
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, password_to_verify):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # CRITICAL: Sync tier between users.csv and startups.csv on every login
    # This ensures both files stay in sync even if previous syncs failed
    # Skip sync for admin tiers (admin, incubation_admin, venture_analyst)
    current_tier = user['tier']
    if current_tier not in ['admin', 'incubation_admin', 'venture_analyst']:
        sync_user_tier_to_startup(user['email'], current_tier)
    
    token = create_token(user['id'], user['email'])
    
    # Helper function to handle NaN values
    def safe_get(field, default=''):
        value = user.get(field, default)
        if pd.isna(value):
            return default
        return value
    
    return {
        "token": token,
        "user": {
            "id": safe_get('id'),
            "name": safe_get('name'),
            "email": safe_get('email'),
            "tier": safe_get('tier'),
            "has_completed_screening": bool(safe_get('has_completed_screening', False)),
            "photo_url": safe_get('photo_url', ''),
            "calendly_link": safe_get('calendly_link', '')
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "tier": user['tier'],
        "has_completed_screening": bool(user.get('has_completed_screening', False)),
        "photo_url": user.get('photo_url', ''),
        "calendly_link": user.get('calendly_link', '')
    }

@api_router.put("/auth/profile")
async def update_profile(profile_data: VentureAnalystProfileUpdate, user: dict = Depends(get_current_user)):
    """Update user profile (name, photo_url, calendly_link)"""
    try:
        users_df = load_users_df()
        user_idx = users_df[users_df['id'] == user['id']].index[0]
        
        # Update fields if provided
        if profile_data.name is not None:
            users_df.at[user_idx, 'name'] = profile_data.name
        if profile_data.photo_url is not None:
            users_df.at[user_idx, 'photo_url'] = profile_data.photo_url
        if profile_data.calendly_link is not None:
            users_df.at[user_idx, 'calendly_link'] = profile_data.calendly_link
        
        save_users_df(users_df)
        
        # Return updated user data
        updated_user = users_df.loc[user_idx]
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": updated_user['id'],
                "name": updated_user['name'],
                "email": updated_user['email'],
                "tier": updated_user['tier'],
                "has_completed_screening": bool(updated_user.get('has_completed_screening', False)),
                "photo_url": updated_user.get('photo_url', ''),
                "calendly_link": updated_user.get('calendly_link', '')
            }
        }
    except Exception as e:
        logging.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@api_router.post("/auth/upload-photo")
async def upload_profile_photo(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload profile photo for user"""
    try:
        # Create uploads directory for profile photos
        upload_dir = "backend/uploads/profile_photos"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Validate file type
        allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")
        
        # Generate unique filename
        filename = f"{user['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate URL path for frontend
        photo_url = f"/backend/uploads/profile_photos/{filename}"
        
        # Update user's photo_url in database
        users_df = load_users_df()
        user_idx = users_df[users_df['id'] == user['id']].index[0]
        users_df.at[user_idx, 'photo_url'] = photo_url
        save_users_df(users_df)
        
        return {
            "message": "Photo uploaded successfully",
            "photo_url": photo_url
        }
    
    except Exception as e:
        logging.error(f"Error uploading photo: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")

@api_router.get("/auth/profile-simple")
async def get_simple_profile(user: dict = Depends(get_current_user)):
    """Simple profile endpoint for testing"""
    try:
        return {
            "user": {
                "id": str(user['id']),
                "name": str(user['name']),
                "email": str(user['email']),
                "tier": str(user['tier'])
            },
            "message": "Profile loaded successfully"
        }
    except Exception as e:
        logging.error(f"Error in simple profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to get profile data")

@api_router.get("/auth/profile-complete")
async def get_complete_profile(user: dict = Depends(get_current_user)):
    """Get complete user profile including screening data, tier, and assignments"""
    try:
        users_df = load_users_df()
        startups_df = load_startups_df()
        assignments_df = load_startup_assignments_df()
        
        # Get user data
        user_row = users_df[users_df['id'] == user['id']]
        if user_row.empty:
            raise HTTPException(status_code=404, detail="User not found")
        user_data = user_row.iloc[0]
        
        # Parse profile data from JSON string
        profile_data = {}
        if pd.notna(user_data.get('profile')) and user_data['profile']:
            try:
                profile_data = json.loads(user_data['profile'])
                # Ensure profile_data is a dict
                if not isinstance(profile_data, dict):
                    profile_data = {}
            except (json.JSONDecodeError, TypeError):
                profile_data = {}
        
        # Get startup data - simplified approach
        startup_data = None
        if not startups_df.empty:
            user_startup = startups_df[startups_df['Email'] == user['email']]
            if not user_startup.empty:
                startup_row = user_startup.iloc[0]
                startup_data = {
                    'ID': str(startup_row.get('ID', '')),
                    'Name': str(startup_row.get('Name', '')),
                    'Founder Name': str(startup_row.get('Founder Name', '')),
                    'Entity Type': str(startup_row.get('Entity Type', '')),
                    'Location': str(startup_row.get('Location', '')),
                    'Industry': str(startup_row.get('Industry', '')),
                    'Company Size': str(startup_row.get('Company Size', '')),
                    'Description': str(startup_row.get('Description', '')),
                    'Contact Email': str(startup_row.get('Contact Email', '')),
                    'Contact Phone': str(startup_row.get('Contact Phone', '')),
                    'Stage': str(startup_row.get('Stage', '')),
                    'Revenue': str(startup_row.get('Revenue', '')),
                    'Stability': str(startup_row.get('Stability', '')),
                    'Demographic': str(startup_row.get('Demographic', '')),
                    'Track Record': str(startup_row.get('Track Record', '')),
                    'Past Grant Experience': str(startup_row.get('Past Grant Experience', '')),
                    'Tier': str(startup_row.get('Tier', ''))
                }
        
        # Get assignments - simplified approach
        assignments = []
        if not assignments_df.empty and startup_data:
            startup_id = startup_data.get('ID')
            if startup_id:
                user_assignments = assignments_df[assignments_df['startup_id'] == startup_id]
                for _, assignment in user_assignments.iterrows():
                    assigned_to_id = str(assignment['assigned_to_id'])
                    assigned_to_type = str(assignment['assigned_to_type'])
                    
                    # Get assigned person's details
                    assigned_person = users_df[users_df['id'] == assigned_to_id]
                    if not assigned_person.empty:
                        person_data = assigned_person.iloc[0]
                        assignments.append({
                            'id': str(assignment['id']),
                            'assigned_to_id': assigned_to_id,
                            'assigned_to_type': assigned_to_type,
                            'assigned_to_name': str(person_data['name']),
                            'assigned_to_email': str(person_data['email']),
                            'assigned_to_photo_url': str(person_data.get('photo_url', '')),
                            'assigned_to_calendly_link': str(person_data.get('calendly_link', '')),
                            'assigned_at': str(assignment['assigned_at']),
                            'assigned_by': str(assignment['assigned_by'])
                        })
        
        # Simple response data
        response_data = {
            "user": {
                "id": str(user_data['id']),
                "name": str(user_data['name']),
                "email": str(user_data['email']),
                "tier": str(user_data['tier']),
                "has_completed_screening": bool(user_data.get('has_completed_screening', False)),
                "photo_url": str(user_data.get('photo_url', '')),
                "calendly_link": str(user_data.get('calendly_link', '')),
                "created_at": str(user_data.get('created_at', '')),
                "screening_completed_at": str(user_data.get('screening_completed_at', '')),
                "upgraded_at": str(user_data.get('upgraded_at', '')),
                "coupon_used": str(user_data.get('coupon_used', ''))
            },
            "screening_data": profile_data,
            "startup_data": startup_data,
            "assignments": assignments
        }
        
        return response_data
    
    except Exception as e:
        logging.error(f"Error getting complete profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to get profile data")

@api_router.post("/notifications/send")
async def send_notification(notification_data: dict, user: dict = Depends(get_current_user)):
    """Send notification to another user and persist it"""
    try:
        required_fields = ['to_user_id', 'type', 'title', 'message']
        for field in required_fields:
            if field not in notification_data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")

        notifications_df = load_notifications_df()
        notif_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()

        new_row = {
            'id': notif_id,
            'to_user_id': str(notification_data['to_user_id']),
            'from_user_id': str(user['id']),
            'type': str(notification_data.get('type', 'generic')),
            'title': str(notification_data.get('title', '')),
            'message': str(notification_data.get('message', '')),
            'data': json.dumps(notification_data.get('data', {})),
            'created_at': created_at,
            'read': False,
        }

        notifications_df = pd.concat([notifications_df, pd.DataFrame([new_row])], ignore_index=True)
        save_notifications_df(notifications_df)

        logging.info(f"Notification saved: {notif_id} -> {new_row['to_user_id']}")

        return {
            "message": "Notification sent successfully",
            "notification": new_row
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error sending notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to send notification")

@api_router.get("/notifications/my")
async def list_my_notifications(user: dict = Depends(get_current_user)):
    """List notifications for the current user"""
    try:
        notifications_df = load_notifications_df()
        if notifications_df.empty:
            return {"notifications": []}

        my_notifs = notifications_df[notifications_df['to_user_id'] == str(user['id'])]
        notifs = []
        for _, row in my_notifs.sort_values(by='created_at', ascending=False).iterrows():
            notifs.append({
                'id': str(row['id']),
                'type': str(row['type']),
                'title': str(row['title']),
                'message': str(row['message']),
                'data': json.loads(row['data']) if pd.notna(row['data']) and str(row['data']).strip() else {},
                'created_at': str(row['created_at']),
                'read': bool(row['read']) if pd.notna(row['read']) else False,
            })
        return {"notifications": notifs}
    except Exception as e:
        logging.error(f"Error listing notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to list notifications")

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    try:
        notifications_df = load_notifications_df()
        if notifications_df.empty:
            raise HTTPException(status_code=404, detail="Notification not found")

        idx = notifications_df[notifications_df['id'] == notification_id].index
        if idx.empty:
            raise HTTPException(status_code=404, detail="Notification not found")

        # Ensure user owns this notification
        if str(notifications_df.at[idx[0], 'to_user_id']) != str(user['id']):
            raise HTTPException(status_code=403, detail="Not authorized to modify this notification")

        notifications_df.at[idx[0], 'read'] = True
        save_notifications_df(notifications_df)

        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error marking notification read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")

@api_router.post("/screening/submit")
async def submit_screening(screening_data: GrantScreeningCombined, user: dict = Depends(get_current_user)):
    # Get profile data
    profile = screening_data.model_dump()
    
    # Update user profile in CSV
    users_df = load_users_df()
    user_idx = users_df[users_df['id'] == user['id']].index[0]
    
    # Preserve existing profile data (like registration_source for incubation admin links)
    existing_profile = {}
    if pd.notna(users_df.at[user_idx, 'profile']) and users_df.at[user_idx, 'profile']:
        try:
            existing_profile = json.loads(users_df.at[user_idx, 'profile'])
        except:
            pass
    
    # Merge screening data with existing profile data, preserving incubation admin info
    merged_profile = {**existing_profile, **profile}
    
    users_df.at[user_idx, 'profile'] = json.dumps(merged_profile)
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
            startups_df.at[startup_idx, 'Year of Incorporation'] = profile['year_of_incorporation']
            startups_df.at[startup_idx, 'Industry'] = profile['industry']
            startups_df.at[startup_idx, 'Company Size'] = profile['company_size']
            startups_df.at[startup_idx, 'Description'] = profile['description']
            startups_df.at[startup_idx, 'Contact Email'] = profile['contact_email']
            startups_df.at[startup_idx, 'Contact Phone'] = profile['contact_phone']
            # Handle both string and array formats for backward compatibility
            ownership_type = profile['ownership_type']
            if isinstance(ownership_type, list):
                startups_df.at[startup_idx, 'Ownership Type'] = ', '.join(ownership_type)
            else:
                startups_df.at[startup_idx, 'Ownership Type'] = ownership_type
            startups_df.at[startup_idx, 'Funding Need'] = profile['funding_need']
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
                'Year of Incorporation': profile['year_of_incorporation'],
                'Industry': profile['industry'],
                'Company Size': profile['company_size'],
                'Description': profile['description'],
                'Contact Email': profile['contact_email'],
                'Contact Phone': profile['contact_phone'],
                'Ownership Type': ', '.join(profile['ownership_type']) if isinstance(profile['ownership_type'], list) else profile['ownership_type'],
                'Funding Need': profile['funding_need'],
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
    matches = await ai_match_grants(merged_profile)
    
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
    soft_approval_ids = load_soft_approvals()
    
    grant_list = []
    for _, match_row in user_matches.iterrows():
        try:
            match_data = json.loads(match_row['match_data'])
            # Update soft_approval status dynamically from current soft_approval.csv
            if 'grant_id' in match_data:
                match_data['soft_approval'] = "Yes" if is_soft_approved(match_data['grant_id'], soft_approval_ids) else "No"
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
                    "soft_approval": "Yes" if is_soft_approved(grant['Grant ID'], soft_approval_ids) else "No",
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
    
    soft_approvals = load_soft_approvals()
    
    # Transform to consistent format with all CSV fields
    grants_list = []
    for _, grant in grants_df.iterrows():
        grants_list.append({
            'grant_id': str(grant.get('Grant ID', '')),
            'name': str(grant.get('Name', '')),
            'sector': str(grant.get('Sector(s)', '')),
            'eligibility': str(grant.get('Eligibility Criteria', '')),
            'funding_amount': str(grant.get('Funding Amount', '')),
            'funding_type': str(grant.get('Funding Type', '')),
            'funding_ratio': str(grant.get('Funding Ratio', '')),
            'application_link': str(grant.get('Application Link', '')),
            'documents_required': str(grant.get('Documents Required', '')),
            'deadline': str(grant.get('Due Date', '')),
            'region_focus': str(grant.get('Region/Focus', '')),
            'contact_info': str(grant.get('Contact Info', '')),
            'place': str(grant.get('Place', '')),
            'created_at': str(grant.get('Created At', '')),
            'soft_approval': str(grant.get('Soft Approval', 'No')),
            'stage': str(grant.get('Stage of Startup', '')),
            'sector_focus': str(grant.get('Sector Focus', '')),
            'gender_focus': str(grant.get('Gender Focus', '')),
            'innovation_type': str(grant.get('Innovation Type', '')),
            'trl': str(grant.get('TRL', '')),
            'impact_criteria': str(grant.get('Impact Criteria', '')),
            'co_investment_requirement': str(grant.get('Co-investment Requirement', '')),
            'matching_investment': str(grant.get('Matching Investment', '')),
            'repayment_terms': str(grant.get('Repayment Terms', '')),
            'disbursement_schedule': str(grant.get('Disbursement Schedule', '')),
            'mentorship_training': str(grant.get('Mentorship/Training', '')),
            'program_duration': str(grant.get('Program Duration', '')),
            'success_metrics': str(grant.get('Success Metrics', ''))
        })
    
    return {"grants": convert_numpy_types(grants_list[:20])}  # Limit to 20 for performance

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
    startups_list = convert_numpy_types(startups_list)
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
            "founder_name": startup['Founder Name'],
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
        
        # Add application link
        app_link = grant.get('application_link', 'N/A')
        link_style = ParagraphStyle(
            'LinkStyle',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#5d248f'),
            fontName='Helvetica',
            spaceAfter=0,
            leftIndent=0,
            leading=14
        )
        if app_link != 'N/A' and app_link:
            link_para = Paragraph(f"<b>Application Link:</b> <link href='{app_link}' color='#5d248f'>{app_link}</link>", link_style)
        else:
            link_para = Paragraph(f"<b>Application Link:</b> Not Available", link_style)
        card_data.append([link_para])
        
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

# ============= ADMIN ENDPOINTS =============

@api_router.post("/admin/create-user")
async def admin_create_user(request: CreateUserRequest, admin: dict = Depends(get_admin_user)):
    """Admin endpoint to create venture analysts and incubation admins"""
    try:
        users_df = load_users_df()
        
        # Check if email already exists
        if not users_df.empty and (users_df['email'].str.lower() == request.email.lower()).any():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = hash_password(request.password)
        
        new_user = {
            'id': user_id,
            'name': request.name,
            'email': request.email,
            'password': '',
            'tier': request.tier,
            'has_completed_screening': True if request.tier in ['venture_analyst', 'incubation_admin'] else False,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'profile': '',
            'screening_completed_at': datetime.now(timezone.utc).isoformat() if request.tier in ['venture_analyst', 'incubation_admin'] else '',
            'upgraded_at': '',
            'coupon_used': '',
            'password_hash': hashed_password,
            'photo_url': '',
            'calendly_link': ''
        }
        
        users_df = pd.concat([users_df, pd.DataFrame([new_user])], ignore_index=True)
        save_users_df(users_df)
        
        return {"message": "User created successfully", "user_id": user_id}
        
    except Exception as e:
        logging.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/assign-startups")
async def admin_assign_startups(request: AssignStartupsRequest, admin: dict = Depends(get_admin_user)):
    """Admin endpoint to assign startups to venture analysts or incubation admins"""
    try:
        assignments_df = load_startup_assignments_df()
        
        # Remove existing assignments for these startups to this user
        assignments_df = assignments_df[~((assignments_df['startup_id'].isin(request.startup_ids)) & 
                                         (assignments_df['assigned_to_id'] == request.user_id))]
        
        # Create new assignments
        new_assignments = []
        for startup_id in request.startup_ids:
            new_assignments.append({
                'id': str(uuid.uuid4()),
                'startup_id': startup_id,
                'assigned_to_id': request.user_id,
                'assigned_to_type': request.assigned_to_type,
                'assigned_by': admin['id'],
                'assigned_at': datetime.now(timezone.utc).isoformat()
            })
        
        if new_assignments:
            assignments_df = pd.concat([assignments_df, pd.DataFrame(new_assignments)], ignore_index=True)
            save_startup_assignments_df(assignments_df)
        
        return {"message": "Startups assigned successfully", "count": len(request.startup_ids)}
        
    except Exception as e:
        logging.error(f"Error assigning startups: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/all-startups")
async def admin_get_all_startups(admin: dict = Depends(get_admin_user)):
    """Get all startups with their information, tier, matched grants, and assigned analysts"""
    try:
        users_df = load_users_df()
        startups_df = load_startups_df()
        grant_matches_df = load_grant_matches_df()
        assignments_df = load_startup_assignments_df()
        tracking_df = load_grant_tracking_df()
        grants_df = load_grants_df()
        
        # Helper function to handle NaN values and numpy types
        def safe_value(value, default=''):
            if pd.isna(value):
                return default
            # Convert numpy types to Python native types for JSON serialization
            if hasattr(value, 'item'):  # numpy scalar
                return value.item()
            return value
        
        # Filter for startup users (not admin/venture_analyst/incubation_admin)
        startup_users = users_df[~users_df['tier'].isin(['admin', 'venture_analyst', 'incubation_admin'])]
        
        startups_data = []
        for _, user in startup_users.iterrows():
            # Get startup details from startups.csv
            startup_info = startups_df[startups_df['Email'].str.lower() == user['email'].lower()]
            
            profile = None
            if not startup_info.empty:
                startup = startup_info.iloc[0]
                profile = {
                    'startup_name': safe_value(startup.get('Name', '')),
                    'founder_name': safe_value(startup.get('Founder Name', '')),
                    'entity_type': safe_value(startup.get('Entity Type', '')),
                    'location': safe_value(startup.get('Location', '')),
                    'year_of_incorporation': safe_value(startup.get('Year of Incorporation', '')),
                    'industry': safe_value(startup.get('Industry', '')),
                    'company_size': safe_value(startup.get('Company Size', '')),
                    'description': safe_value(startup.get('Description', '')),
                    'contact_email': safe_value(startup.get('Contact Email', '')),
                    'contact_phone': safe_value(startup.get('Contact Phone', '')),
                    'ownership_type': safe_value(startup.get('Ownership Type', '')),
                    'funding_need': safe_value(startup.get('Funding Need', 0)),
                    'stage': safe_value(startup.get('Stage', '')),
                    'revenue': safe_value(startup.get('Revenue', 0)),
                    'stability': safe_value(startup.get('Stability', '')),
                    'demographic': safe_value(startup.get('Demographic', '')),
                    'track_record': safe_value(startup.get('Track Record', '')),
                    'past_grant_experience': safe_value(startup.get('Past Grant Experience', ''))
                }
            
            # Get matched grants
            user_matches = grant_matches_df[grant_matches_df['user_id'] == user['id']]
            matched_grants = []
            for _, match in user_matches.iterrows():
                try:
                    match_data = json.loads(match['match_data']) if isinstance(match['match_data'], str) else match['match_data']
                    matched_grants.append({
                        'grant_id': match_data.get('grant_id', ''),
                        'name': match_data.get('name', ''),
                        'funding_amount': match_data.get('funding_amount', '')
                    })
                except:
                    pass
            
            # Get assigned analyst (get the latest assignment)
            assignment = assignments_df[assignments_df['startup_id'] == user['id']]
            assigned_analyst = None
            if not assignment.empty:
                # Sort by assigned_at to get the latest assignment
                assignment = assignment.sort_values('assigned_at', ascending=False)
                analyst_id = assignment.iloc[0]['assigned_to_id']
                analyst = users_df[users_df['id'] == analyst_id]
                if not analyst.empty:
                    assigned_analyst = {
                        'id': analyst.iloc[0]['id'],
                        'name': analyst.iloc[0]['name'],
                        'type': assignment.iloc[0]['assigned_to_type']
                    }
            
            # Get registration source (incubation admin who created registration link)
            registration_source_info = None
            if pd.notna(user.get('profile')) and user['profile']:
                try:
                    user_profile = json.loads(user['profile'])
                    registration_source = user_profile.get('registration_source', '')
                    if registration_source:
                        # Find the incubation admin who owns this link
                        links_df = load_incubation_links_df()
                        link_row = links_df[links_df['link_code'] == registration_source]
                        if not link_row.empty:
                            incubation_admin_id = link_row.iloc[0]['incubation_admin_id']
                            incubation_admin = users_df[users_df['id'] == incubation_admin_id]
                            if not incubation_admin.empty:
                                registration_source_info = {
                                    'id': incubation_admin.iloc[0]['id'],
                                    'name': incubation_admin.iloc[0]['name'],
                                    'link_code': registration_source
                                }
                except:
                    pass
            
            # Get tracking data for expert tier
            tracking_data = []
            if user['tier'] == 'expert':
                user_tracking = tracking_df[tracking_df['startup_id'] == user['id']]
                for _, track in user_tracking.iterrows():
                    analyst_name = "Unknown"
                    if pd.notna(track.get('user_id')):
                        analyst = users_df[users_df['id'] == track['user_id']]
                        if not analyst.empty:
                            analyst_name = analyst.iloc[0]['name']
                    
                    # Get grant name from grants_df
                    grant_name = "Unknown Grant"
                    grant_id = track.get('grant_id', '')
                    if not grants_df.empty and grant_id:
                        grant_row = grants_df[grants_df['Grant ID'] == str(grant_id)]
                        if not grant_row.empty:
                            grant_name = grant_row.iloc[0].get('Name', 'Unknown Grant')
                    
                    tracking_data.append({
                        'grant_id': track.get('grant_id', ''),
                        'grant_name': grant_name,
                        'status': track.get('status', ''),
                        'progress': track.get('progress', ''),
                        'applied_by': analyst_name
                    })
            
            startups_data.append({
                'id': safe_value(user['id']),
                'name': safe_value(user['name']),
                'email': safe_value(user['email']),
                'tier': safe_value(user['tier']),
                'created_at': safe_value(user.get('created_at', '')),
                'password_hash': safe_value(user.get('password_hash', '')),
                'has_completed_screening': bool(user.get('has_completed_screening', False)),
                'profile': profile,
                'matched_grants': matched_grants,
                'assigned_analyst': assigned_analyst,
                'registration_source_info': registration_source_info,
                'tracking': tracking_data
            })
        
        return {"startups": convert_numpy_types(startups_data)}
        
    except Exception as e:
        logging.error(f"Error fetching startups: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/kpis")
async def admin_get_kpis(admin: dict = Depends(get_admin_user)):
    """Get admin KPIs"""
    try:
        users_df = load_users_df()
        tracking_df = load_grant_tracking_df()
        assignments_df = load_startup_assignments_df()
        
        total_startups = len(users_df[~users_df['tier'].isin(['admin', 'venture_analyst', 'incubation_admin'])])
        total_analysts = len(users_df[users_df['tier'] == 'venture_analyst'])
        total_incubation_admins = len(users_df[users_df['tier'] == 'incubation_admin'])
        
        # Tier distribution
        tier_counts = users_df[~users_df['tier'].isin(['admin', 'venture_analyst', 'incubation_admin'])]['tier'].value_counts().to_dict()
        
        # Tracking stats
        total_applications = len(tracking_df)
        status_counts = tracking_df['status'].value_counts().to_dict() if not tracking_df.empty else {}
        
        # Assignment stats
        total_assignments = len(assignments_df)
        
        return {
            "total_startups": int(total_startups),
            "total_analysts": int(total_analysts),
            "total_incubation_admins": int(total_incubation_admins),
            "tier_distribution": tier_counts,
            "total_applications": int(total_applications),
            "application_status": status_counts,
            "total_assignments": int(total_assignments)
        }
        
    except Exception as e:
        logging.error(f"Error fetching KPIs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/grants")
async def admin_create_grant(request: CreateGrantRequest, admin: dict = Depends(get_admin_user)):
    """Admin endpoint to add new grants"""
    try:
        grants_df = load_grants_df()
        
        # Generate new grant ID by finding the highest numeric ID and incrementing
        max_id = 0
        if not grants_df.empty and 'Grant ID' in grants_df.columns:
            # Filter only numeric IDs and find max
            numeric_ids = pd.to_numeric(grants_df['Grant ID'], errors='coerce').dropna()
            if not numeric_ids.empty:
                max_id = int(numeric_ids.max())
        new_grant_id = str(max_id + 1)
        
        # Create new grant entry with all CSV fields
        sector_value = request.sector
        if request.sector == 'Other' and request.sector_other:
            sector_value = request.sector_other
        
        new_grant = {
            'Grant ID': new_grant_id,
            'Name': request.name,
            'Sector(s)': sector_value,
            'Eligibility Criteria': request.eligibility,
            'Funding Amount': request.funding_amount,
            'Funding Type': request.funding_type,
            'Funding Ratio': request.funding_ratio,
            'Application Link': request.application_link,
            'Documents Required': request.documents_required,
            'Due Date': request.deadline,
            'Region/Focus': request.region_focus,
            'Contact Info': request.contact_info,
            'Place': request.place,
            'Created At': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            'Soft Approval': request.soft_approval,
            'Stage of Startup': request.stage,
            'Sector Focus': request.sector_focus,
            'Gender Focus': request.gender_focus,
            'Innovation Type': request.innovation_type,
            'TRL': request.trl,
            'Impact Criteria': request.impact_criteria,
            'Co-investment Requirement': request.co_investment_requirement,
            'Matching Investment': request.matching_investment,
            'Repayment Terms': request.repayment_terms,
            'Disbursement Schedule': request.disbursement_schedule,
            'Mentorship/Training': request.mentorship_training,
            'Program Duration': request.program_duration,
            'Success Metrics': request.success_metrics
        }
        
        grants_df = pd.concat([grants_df, pd.DataFrame([new_grant])], ignore_index=True)
        save_grants_df(grants_df)
        
        # Add to soft approval if needed
        if request.soft_approval == "Yes":
            soft_approvals = load_soft_approvals()
            soft_approvals_df = pd.DataFrame(soft_approvals, columns=['grant_id'])
            soft_approvals_df = pd.concat([soft_approvals_df, pd.DataFrame([{'grant_id': new_grant_id}])], ignore_index=True)
            soft_approvals_df.to_csv(SOFT_APPROVAL_CSV, index=False)
        
        return {"message": "Grant created successfully", "grant_id": new_grant_id}
        
    except Exception as e:
        logging.error(f"Error creating grant: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/grants")
async def admin_get_all_grants(admin: dict = Depends(get_admin_user)):
    """Get all grants in the database"""
    try:
        grants_df = load_grants_df()
        soft_approvals = load_soft_approvals()
        
        grants_list = []
        for _, grant in grants_df.iterrows():
            grants_list.append({
                'grant_id': str(grant.get('Grant ID', '')),
                'name': str(grant.get('Name', '')),
                'sector': str(grant.get('Sector(s)', '')),
                'eligibility': str(grant.get('Eligibility Criteria', '')),
                'funding_amount': str(grant.get('Funding Amount', '')),
                'funding_type': str(grant.get('Funding Type', '')),
                'funding_ratio': str(grant.get('Funding Ratio', '')),
                'application_link': str(grant.get('Application Link', '')),
                'documents_required': str(grant.get('Documents Required', '')),
                'deadline': str(grant.get('Due Date', '')),
                'region_focus': str(grant.get('Region/Focus', '')),
                'contact_info': str(grant.get('Contact Info', '')),
                'place': str(grant.get('Place', '')),
                'created_at': str(grant.get('Created At', '')),
                'soft_approval': str(grant.get('Soft Approval', 'No')),
                'stage': str(grant.get('Stage of Startup', '')),
                'sector_focus': str(grant.get('Sector Focus', '')),
                'gender_focus': str(grant.get('Gender Focus', '')),
                'innovation_type': str(grant.get('Innovation Type', '')),
                'trl': str(grant.get('TRL', '')),
                'impact_criteria': str(grant.get('Impact Criteria', '')),
                'co_investment_requirement': str(grant.get('Co-investment Requirement', '')),
                'matching_investment': str(grant.get('Matching Investment', '')),
                'repayment_terms': str(grant.get('Repayment Terms', '')),
                'disbursement_schedule': str(grant.get('Disbursement Schedule', '')),
                'mentorship_training': str(grant.get('Mentorship/Training', '')),
                'program_duration': str(grant.get('Program Duration', '')),
                'success_metrics': str(grant.get('Success Metrics', ''))
            })
        
        return {"grants": convert_numpy_types(grants_list)}
        
    except Exception as e:
        logging.error(f"Error fetching grants: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/users")
async def admin_get_users(admin: dict = Depends(get_admin_user)):
    """Get all venture analysts and incubation admins"""
    try:
        users_df = load_users_df()
        
        # Helper function to handle NaN values and numpy types
        def safe_value(value, default=''):
            if pd.isna(value):
                return default
            # Convert numpy types to Python native types for JSON serialization
            if hasattr(value, 'item'):  # numpy scalar
                return value.item()
            return value
        
        analysts = users_df[users_df['tier'] == 'venture_analyst']
        incubation_admins = users_df[users_df['tier'] == 'incubation_admin']
        
        analysts_list = []
        for _, analyst in analysts.iterrows():
            analysts_list.append({
                'id': safe_value(analyst['id']),
                'name': safe_value(analyst['name']),
                'email': safe_value(analyst['email']),
                'created_at': safe_value(analyst.get('created_at', '')),
                'photo_url': safe_value(analyst.get('photo_url', '')),
                'calendly_link': safe_value(analyst.get('calendly_link', ''))
            })
        
        incubation_list = []
        for _, admin_user in incubation_admins.iterrows():
            incubation_list.append({
                'id': safe_value(admin_user['id']),
                'name': safe_value(admin_user['name']),
                'email': safe_value(admin_user['email']),
                'created_at': safe_value(admin_user.get('created_at', ''))
            })
        
        return {
            "venture_analysts": convert_numpy_types(analysts_list),
            "incubation_admins": convert_numpy_types(incubation_list)
        }
        
    except Exception as e:
        logging.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= INCUBATION ADMIN ENDPOINTS =============

@api_router.get("/incubation-admin/startups")
async def incubation_get_startups(incubation_admin: dict = Depends(get_incubation_admin_user)):
    """Get assigned and added startups for incubation admin"""
    try:
        users_df = load_users_df()
        assignments_df = load_startup_assignments_df()
        grant_matches_df = load_grant_matches_df()
        tracking_df = load_grant_tracking_df()
        grants_df = load_grants_df()
        
        # Get assigned startups
        assigned_startups = assignments_df[assignments_df['assigned_to_id'] == incubation_admin['id']]['startup_id'].tolist()
        
        # Filter startups
        startups = users_df[users_df['id'].isin(assigned_startups)]
        
        startups_data = []
        for _, user in startups.iterrows():
            # Parse profile data
            profile_data = {}
            if pd.notna(user.get('profile')) and user['profile']:
                try:
                    profile_data = json.loads(user['profile'])
                except:
                    pass
            
            # Get matched grants
            user_matches = grant_matches_df[grant_matches_df['user_id'] == user['id']]
            matched_grants = []
            for _, match in user_matches.iterrows():
                try:
                    match_data = json.loads(match['match_data']) if isinstance(match['match_data'], str) else match['match_data']
                    matched_grants.append({
                        'grant_id': match_data.get('grant_id', ''),
                        'name': match_data.get('name', ''),
                        'funding_amount': match_data.get('funding_amount', '')
                    })
                except:
                    pass
            
            # Get tracking data for expert tier
            tracking_data = []
            if user['tier'] == 'expert':
                user_tracking = tracking_df[tracking_df['startup_id'] == user['id']]
                for _, track in user_tracking.iterrows():
                    analyst_name = "Unknown"
                    if pd.notna(track.get('user_id')):
                        analyst = users_df[users_df['id'] == track['user_id']]
                        if not analyst.empty:
                            analyst_name = analyst.iloc[0]['name']
                    
                    # Get grant name from grants_df
                    grant_name = "Unknown Grant"
                    grant_id = track.get('grant_id', '')
                    if not grants_df.empty and grant_id:
                        grant_row = grants_df[grants_df['Grant ID'] == str(grant_id)]
                        if not grant_row.empty:
                            grant_name = grant_row.iloc[0].get('Name', 'Unknown Grant')
                    
                    tracking_data.append({
                        'grant_id': track.get('grant_id', ''),
                        'grant_name': grant_name,
                        'status': track.get('status', ''),
                        'progress': track.get('progress', ''),
                        'applied_by': analyst_name
                    })
            
            startups_data.append({
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'tier': user['tier'],
                'created_at': user.get('created_at', ''),
                'has_completed_screening': bool(user.get('has_completed_screening', False)),
                'profile': profile_data,
                'matched_grants': matched_grants,
                'tracking': tracking_data
            })
        
        return {"startups": convert_numpy_types(startups_data)}
        
    except Exception as e:
        logging.error(f"Error fetching startups: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/incubation-admin/grants")
async def incubation_create_grant(request: CreateGrantRequest, incubation_admin: dict = Depends(get_incubation_admin_user)):
    """Incubation admin endpoint to add new grants"""
    try:
        grants_df = load_grants_df()
        
        # Generate new grant ID by finding the highest numeric ID and incrementing
        max_id = 0
        if not grants_df.empty and 'Grant ID' in grants_df.columns:
            # Filter only numeric IDs and find max
            numeric_ids = pd.to_numeric(grants_df['Grant ID'], errors='coerce').dropna()
            if not numeric_ids.empty:
                max_id = int(numeric_ids.max())
        new_grant_id = str(max_id + 1)
        
        # Create new grant entry with all CSV fields
        sector_value = request.sector
        if request.sector == 'Other' and request.sector_other:
            sector_value = request.sector_other
        
        new_grant = {
            'Grant ID': new_grant_id,
            'Name': request.name,
            'Sector(s)': sector_value,
            'Eligibility Criteria': request.eligibility,
            'Funding Amount': request.funding_amount,
            'Funding Type': request.funding_type,
            'Funding Ratio': request.funding_ratio,
            'Application Link': request.application_link,
            'Documents Required': request.documents_required,
            'Due Date': request.deadline,
            'Region/Focus': request.region_focus,
            'Contact Info': request.contact_info,
            'Place': request.place,
            'Created At': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            'Soft Approval': request.soft_approval,
            'Stage of Startup': request.stage,
            'Sector Focus': request.sector_focus,
            'Gender Focus': request.gender_focus,
            'Innovation Type': request.innovation_type,
            'TRL': request.trl,
            'Impact Criteria': request.impact_criteria,
            'Co-investment Requirement': request.co_investment_requirement,
            'Matching Investment': request.matching_investment,
            'Repayment Terms': request.repayment_terms,
            'Disbursement Schedule': request.disbursement_schedule,
            'Mentorship/Training': request.mentorship_training,
            'Program Duration': request.program_duration,
            'Success Metrics': request.success_metrics
        }
        
        grants_df = pd.concat([grants_df, pd.DataFrame([new_grant])], ignore_index=True)
        save_grants_df(grants_df)
        
        if request.soft_approval == "Yes":
            soft_approvals = load_soft_approvals()
            soft_approvals_df = pd.DataFrame(soft_approvals, columns=['grant_id'])
            soft_approvals_df = pd.concat([soft_approvals_df, pd.DataFrame([{'grant_id': new_grant_id}])], ignore_index=True)
            soft_approvals_df.to_csv(SOFT_APPROVAL_CSV, index=False)
        
        return {"message": "Grant created successfully", "grant_id": new_grant_id}
        
    except Exception as e:
        logging.error(f"Error creating grant: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/incubation-admin/grants")
async def incubation_get_grants(incubation_admin: dict = Depends(get_incubation_admin_user)):
    """Get all grants for incubation admin"""
    try:
        grants_df = load_grants_df()
        soft_approvals = load_soft_approvals()
        
        grants_list = []
        for _, grant in grants_df.iterrows():
            grants_list.append({
                'grant_id': str(grant.get('Grant ID', '')),
                'name': str(grant.get('Name', '')),
                'sector': str(grant.get('Sector(s)', '')),
                'eligibility': str(grant.get('Eligibility Criteria', '')),
                'funding_amount': str(grant.get('Funding Amount', '')),
                'funding_type': str(grant.get('Funding Type', '')),
                'funding_ratio': str(grant.get('Funding Ratio', '')),
                'application_link': str(grant.get('Application Link', '')),
                'documents_required': str(grant.get('Documents Required', '')),
                'deadline': str(grant.get('Due Date', '')),
                'region_focus': str(grant.get('Region/Focus', '')),
                'contact_info': str(grant.get('Contact Info', '')),
                'place': str(grant.get('Place', '')),
                'created_at': str(grant.get('Created At', '')),
                'soft_approval': str(grant.get('Soft Approval', 'No')),
                'stage': str(grant.get('Stage of Startup', '')),
                'sector_focus': str(grant.get('Sector Focus', '')),
                'gender_focus': str(grant.get('Gender Focus', '')),
                'innovation_type': str(grant.get('Innovation Type', '')),
                'trl': str(grant.get('TRL', '')),
                'impact_criteria': str(grant.get('Impact Criteria', '')),
                'co_investment_requirement': str(grant.get('Co-investment Requirement', '')),
                'matching_investment': str(grant.get('Matching Investment', '')),
                'repayment_terms': str(grant.get('Repayment Terms', '')),
                'disbursement_schedule': str(grant.get('Disbursement Schedule', '')),
                'mentorship_training': str(grant.get('Mentorship/Training', '')),
                'program_duration': str(grant.get('Program Duration', '')),
                'success_metrics': str(grant.get('Success Metrics', ''))
            })
        
        return {"grants": convert_numpy_types(grants_list)}
        
    except Exception as e:
        logging.error(f"Error fetching grants: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= INCUBATION ADMIN REGISTRATION LINKS =============

@api_router.post("/incubation-admin/generate-link")
async def generate_incubation_registration_link(incubation_admin: dict = Depends(get_incubation_admin_user)):
    """Generate a unique registration link for the incubation admin"""
    try:
        links_df = load_incubation_links_df()
        
        # Generate unique link code
        link_code = generate_link_code()
        while not links_df.empty and link_code in links_df['link_code'].values:
            link_code = generate_link_code()
        
        # Create new link
        link_id = str(uuid.uuid4())
        new_link = {
            'id': link_id,
            'incubation_admin_id': incubation_admin['id'],
            'incubation_admin_name': incubation_admin['name'],
            'link_code': link_code,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'is_active': True,
            'usage_count': 0
        }
        
        # Add to dataframe
        new_link_df = pd.DataFrame([new_link])
        links_df = pd.concat([links_df, new_link_df], ignore_index=True)
        save_incubation_links_df(links_df)
        
        # Generate the full registration URL
        base_url = "http://localhost:3000"  # Frontend URL
        registration_url = f"{base_url}/register/incubation/{link_code}"
        
        return {
            "message": "Registration link generated successfully",
            "link_code": link_code,
            "registration_url": registration_url,
            "link_id": link_id
        }
        
    except Exception as e:
        logging.error(f"Error generating registration link: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/incubation-admin/links")
async def get_incubation_registration_links(incubation_admin: dict = Depends(get_incubation_admin_user)):
    """Get all registration links for the incubation admin"""
    try:
        links_df = load_incubation_links_df()
        
        # Filter links for this incubation admin
        admin_links = links_df[links_df['incubation_admin_id'] == incubation_admin['id']]
        
        links_list = []
        for _, link in admin_links.iterrows():
            base_url = "http://localhost:3000"
            registration_url = f"{base_url}/register/incubation/{link['link_code']}"
            
            links_list.append({
                'id': link['id'],
                'link_code': link['link_code'],
                'registration_url': registration_url,
                'created_at': link['created_at'],
                'is_active': bool(link['is_active']),
                'usage_count': int(link['usage_count'])
            })
        
        return {"links": convert_numpy_types(links_list)}
        
    except Exception as e:
        logging.error(f"Error fetching registration links: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/incubation-admin/links/{link_id}/toggle")
async def toggle_incubation_registration_link(link_id: str, incubation_admin: dict = Depends(get_incubation_admin_user)):
    """Toggle the active status of a registration link"""
    try:
        links_df = load_incubation_links_df()
        
        # Find the link
        link_idx = links_df[(links_df['id'] == link_id) & (links_df['incubation_admin_id'] == incubation_admin['id'])].index
        
        if link_idx.empty:
            raise HTTPException(status_code=404, detail="Link not found")
        
        # Toggle the active status
        current_status = links_df.at[link_idx[0], 'is_active']
        links_df.at[link_idx[0], 'is_active'] = not current_status
        
        save_incubation_links_df(links_df)
        
        return {
            "message": f"Link {'activated' if not current_status else 'deactivated'} successfully",
            "is_active": not current_status
        }
        
    except Exception as e:
        logging.error(f"Error toggling registration link: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/incubation-admin/startups-via-links")
async def get_startups_via_registration_links(incubation_admin: dict = Depends(get_incubation_admin_user)):
    """Get startups that registered via this incubation admin's registration links"""
    try:
        users_df = load_users_df()
        links_df = load_incubation_links_df()
        grant_matches_df = load_grant_matches_df()
        tracking_df = load_grant_tracking_df()
        grants_df = load_grants_df()
        
        # Get all link codes for this incubation admin
        admin_links = links_df[links_df['incubation_admin_id'] == incubation_admin['id']]
        link_codes = admin_links['link_code'].tolist()
        
        # Find users who registered via these links (stored in profile as registration_source)
        startups_data = []
        for _, user in users_df.iterrows():
            # Check if user has registration source indicating they came from this incubation admin
            profile_data = {}
            if pd.notna(user.get('profile')) and user['profile']:
                try:
                    profile_data = json.loads(user['profile'])
                except:
                    pass
            
            # Check if this user was registered via one of our links
            registration_source = profile_data.get('registration_source', '')
            logging.info(f"Checking user {user['email']}: registration_source='{registration_source}', link_codes={link_codes}")
            
            if registration_source in link_codes:
                # Get matched grants
                user_matches = grant_matches_df[grant_matches_df['user_id'] == user['id']]
                matched_grants = []
                for _, match in user_matches.iterrows():
                    try:
                        match_data = json.loads(match['match_data']) if isinstance(match['match_data'], str) else match['match_data']
                        matched_grants.append({
                            'grant_id': match_data.get('grant_id', ''),
                            'name': match_data.get('name', ''),
                            'funding_amount': match_data.get('funding_amount', '')
                        })
                    except:
                        pass
                
                # Get tracking data for expert tier
                tracking_data = []
                if user['tier'] == 'expert':
                    user_tracking = tracking_df[tracking_df['startup_id'] == user['id']]
                    for _, track in user_tracking.iterrows():
                        analyst_name = "Unknown"
                        if pd.notna(track.get('user_id')):
                            analyst = users_df[users_df['id'] == track['user_id']]
                            if not analyst.empty:
                                analyst_name = analyst.iloc[0]['name']
                        
                        # Get grant name from grants_df
                        grant_name = "Unknown Grant"
                        grant_id = track.get('grant_id', '')
                        if not grants_df.empty and grant_id:
                            grant_row = grants_df[grants_df['Grant ID'] == str(grant_id)]
                            if not grant_row.empty:
                                grant_name = grant_row.iloc[0].get('Name', 'Unknown Grant')
                        
                        tracking_data.append({
                            'grant_id': track.get('grant_id', ''),
                            'grant_name': grant_name,
                            'status': track.get('status', ''),
                            'progress': track.get('progress', ''),
                            'applied_by': analyst_name
                        })
                
                startups_data.append({
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'tier': user['tier'],
                    'created_at': user.get('created_at', ''),
                    'has_completed_screening': bool(user.get('has_completed_screening', False)),
                    'registration_source': registration_source,
                    'profile': profile_data,
                    'matched_grants': matched_grants,
                    'tracking': tracking_data
                })
        
        return {"startups": convert_numpy_types(startups_data)}
        
    except Exception as e:
        logging.error(f"Error fetching startups via registration links: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= INCUBATION REGISTRATION ENDPOINT =============

@api_router.post("/auth/register/incubation")
async def register_via_incubation_link(user: IncubationUserRegister):
    """Register a new user via incubation admin registration link"""
    try:
        # Validate the link code
        links_df = load_incubation_links_df()
        link_row = links_df[(links_df['link_code'] == user.link_code) & (links_df['is_active'] == True)]
        
        if link_row.empty:
            raise HTTPException(status_code=400, detail="Invalid or inactive registration link")
        
        link_info = link_row.iloc[0]
        
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
            "profile": json.dumps({
                "registration_source": user.link_code,
                "incubation_admin_id": link_info['incubation_admin_id'],
                "incubation_admin_name": link_info['incubation_admin_name']
            }),
            "screening_completed_at": "",
            "upgraded_at": "",
            "coupon_used": ""
        }
        
        # Add new user to dataframe
        new_user_df = pd.DataFrame([new_user])
        users_df = pd.concat([users_df, new_user_df], ignore_index=True)
        save_users_df(users_df)
        
        # Update usage count for the link
        link_idx = links_df[links_df['link_code'] == user.link_code].index
        if not link_idx.empty:
            links_df.at[link_idx[0], 'usage_count'] = links_df.at[link_idx[0], 'usage_count'] + 1
            save_incubation_links_df(links_df)
        
        return {
            "message": "Registration successful",
            "user_id": user_id,
            "incubation_admin": link_info['incubation_admin_name']
        }
        
    except Exception as e:
        logging.error(f"Error in incubation registration: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= VENTURE ANALYST ENDPOINTS (MODIFIED) =============

@api_router.get("/venture-analyst/assigned-startups")
async def venture_analyst_get_assigned_startups(analyst: dict = Depends(get_current_user)):
    """Get startups assigned to the venture analyst"""
    try:
        if analyst['tier'] != 'venture_analyst':
            raise HTTPException(status_code=403, detail="Venture analyst access required")
        
        users_df = load_users_df()
        assignments_df = load_startup_assignments_df()
        
        # Get assigned startup IDs
        assigned_startup_ids = assignments_df[assignments_df['assigned_to_id'] == analyst['id']]['startup_id'].tolist()
        
        # Get startup details
        assigned_startups = users_df[users_df['id'].isin(assigned_startup_ids)]
        
        startups_list = []
        for _, startup in assigned_startups.iterrows():
            profile_data = {}
            if pd.notna(startup.get('profile')) and startup['profile']:
                try:
                    profile_data = json.loads(startup['profile'])
                except:
                    pass
            
            startups_list.append({
                'id': startup['id'],
                'name': profile_data.get('startup_name', startup['name']),
                'founder_name': profile_data.get('founder_name', ''),
                'industry': profile_data.get('industry', ''),
                'location': profile_data.get('location', ''),
                'email': startup['email'],
                'tier': startup['tier']
            })
        
        return {"startups": convert_numpy_types(startups_list)}
        
    except Exception as e:
        logging.error(f"Error fetching assigned startups: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/venture-analyst/grants")
async def venture_analyst_get_grants(analyst: dict = Depends(get_current_user)):
    """Get all grants for venture analyst to view and manage"""
    try:
        if analyst['tier'] != 'venture_analyst':
            raise HTTPException(status_code=403, detail="Venture analyst access required")
        
        grants_df = load_grants_df()
        soft_approvals = load_soft_approvals()
        
        grants_list = []
        for _, grant in grants_df.iterrows():
            grants_list.append({
                'grant_id': str(grant.get('Grant ID', '')),
                'name': str(grant.get('Name', '')),
                'sector': str(grant.get('Sector(s)', '')),
                'eligibility': str(grant.get('Eligibility Criteria', '')),
                'funding_amount': str(grant.get('Funding Amount', '')),
                'funding_type': str(grant.get('Funding Type', '')),
                'funding_ratio': str(grant.get('Funding Ratio', '')),
                'application_link': str(grant.get('Application Link', '')),
                'documents_required': str(grant.get('Documents Required', '')),
                'deadline': str(grant.get('Due Date', '')),
                'region_focus': str(grant.get('Region/Focus', '')),
                'contact_info': str(grant.get('Contact Info', '')),
                'place': str(grant.get('Place', '')),
                'created_at': str(grant.get('Created At', '')),
                'soft_approval': str(grant.get('Soft Approval', 'No')),
                'stage': str(grant.get('Stage of Startup', '')),
                'sector_focus': str(grant.get('Sector Focus', '')),
                'gender_focus': str(grant.get('Gender Focus', '')),
                'innovation_type': str(grant.get('Innovation Type', '')),
                'trl': str(grant.get('TRL', '')),
                'impact_criteria': str(grant.get('Impact Criteria', '')),
                'co_investment_requirement': str(grant.get('Co-investment Requirement', '')),
                'matching_investment': str(grant.get('Matching Investment', '')),
                'repayment_terms': str(grant.get('Repayment Terms', '')),
                'disbursement_schedule': str(grant.get('Disbursement Schedule', '')),
                'mentorship_training': str(grant.get('Mentorship/Training', '')),
                'program_duration': str(grant.get('Program Duration', '')),
                'success_metrics': str(grant.get('Success Metrics', ''))
            })
        
        return {"grants": convert_numpy_types(grants_list)}
        
    except Exception as e:
        logging.error(f"Error fetching grants: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/venture-analyst/grants")
async def venture_analyst_create_grant(request: CreateGrantRequest, analyst: dict = Depends(get_current_user)):
    """Venture analyst endpoint to add new grants"""
    try:
        if analyst['tier'] != 'venture_analyst':
            raise HTTPException(status_code=403, detail="Venture analyst access required")
        
        grants_df = load_grants_df()
        
        # Generate new grant ID by finding the highest numeric ID and incrementing
        max_id = 0
        if not grants_df.empty and 'Grant ID' in grants_df.columns:
            # Filter only numeric IDs and find max
            numeric_ids = pd.to_numeric(grants_df['Grant ID'], errors='coerce').dropna()
            if not numeric_ids.empty:
                max_id = int(numeric_ids.max())
        new_grant_id = str(max_id + 1)
        
        # Create new grant entry with all CSV fields
        sector_value = request.sector
        if request.sector == 'Other' and request.sector_other:
            sector_value = request.sector_other
        
        new_grant = {
            'Grant ID': new_grant_id,
            'Name': request.name,
            'Sector(s)': sector_value,
            'Eligibility Criteria': request.eligibility,
            'Funding Amount': request.funding_amount,
            'Funding Type': request.funding_type,
            'Funding Ratio': request.funding_ratio,
            'Application Link': request.application_link,
            'Documents Required': request.documents_required,
            'Due Date': request.deadline,
            'Region/Focus': request.region_focus,
            'Contact Info': request.contact_info,
            'Place': request.place,
            'Created At': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            'Soft Approval': request.soft_approval,
            'Stage of Startup': request.stage,
            'Sector Focus': request.sector_focus,
            'Gender Focus': request.gender_focus,
            'Innovation Type': request.innovation_type,
            'TRL': request.trl,
            'Impact Criteria': request.impact_criteria,
            'Co-investment Requirement': request.co_investment_requirement,
            'Matching Investment': request.matching_investment,
            'Repayment Terms': request.repayment_terms,
            'Disbursement Schedule': request.disbursement_schedule,
            'Mentorship/Training': request.mentorship_training,
            'Program Duration': request.program_duration,
            'Success Metrics': request.success_metrics
        }
        
        # Add to dataframe
        new_grant_df = pd.DataFrame([new_grant])
        grants_df = pd.concat([grants_df, new_grant_df], ignore_index=True)
        save_grants_df(grants_df)
        
        return {
            "message": "Grant created successfully",
            "grant_id": new_grant_id
        }
        
    except Exception as e:
        logging.error(f"Error creating grant: {e}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
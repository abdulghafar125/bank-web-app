from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import jwt
from passlib.context import CryptContext
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'prominence-bank-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Prominence Bank API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Currency list
SUPPORTED_CURRENCIES = [
    "USD", "EUR", "GBP", "CHF", "JPY", "AUD", "CAD", "NZD", "SGD", "HKD",
    "CNY", "INR", "BRL", "MXN", "ZAR", "AED", "SAR", "KWD", "QAR", "BHD"
]

# User Models
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    user_type: str = "personal"  # personal, business
    
class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    user_type: str
    role: str
    status: str
    created_at: str
    kyc_status: str = "pending"

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str
    purpose: str  # login, beneficiary, transfer

class OTPRequest(BaseModel):
    email: EmailStr
    purpose: str

# Account Models
class AccountBase(BaseModel):
    account_type: str = "checking"  # checking, savings, ktt
    currency: str = "USD"
    
class AccountCreate(AccountBase):
    user_id: str
    initial_balance: float = 0.0

class AccountResponse(BaseModel):
    id: str
    user_id: str
    account_number: str
    account_type: str
    currency: str
    available_balance: float
    transit_balance: float
    held_balance: float
    blocked_balance: float
    status: str
    created_at: str

# Transaction Models
class TransactionBase(BaseModel):
    amount: float
    currency: str
    description: Optional[str] = None

class InternalTransfer(TransactionBase):
    from_account_id: str
    to_account_id: str
    otp: Optional[str] = None

class ExternalTransfer(TransactionBase):
    from_account_id: str
    beneficiary_id: str
    otp: str

class TransactionResponse(BaseModel):
    id: str
    account_id: str
    transaction_type: str
    amount: float
    currency: str
    description: Optional[str] = None
    status: str
    reference: str
    counterparty: Optional[str] = None
    created_at: str
    is_redacted: bool = False

# Beneficiary Models
class BeneficiaryBase(BaseModel):
    name: str
    bank_name: Optional[str] = None
    account_number: str
    routing_number: Optional[str] = None
    swift_code: Optional[str] = None
    beneficiary_type: str = "external"  # internal, external
    
class BeneficiaryCreate(BeneficiaryBase):
    otp: str

class BeneficiaryResponse(BaseModel):
    id: str
    user_id: str
    name: str
    bank_name: Optional[str] = None
    account_number: str
    routing_number: Optional[str] = None
    swift_code: Optional[str] = None
    beneficiary_type: str
    status: str
    created_at: str

# Instrument Models
class InstrumentBase(BaseModel):
    title: str
    instrument_type: str  # KTT, CD, endorsement
    content: str
    amount: Optional[float] = None
    currency: Optional[str] = None
    
class InstrumentCreate(InstrumentBase):
    recipient_id: Optional[str] = None
    visibility: str = "all"  # all, specific

class InstrumentResponse(BaseModel):
    id: str
    title: str
    instrument_type: str
    content: str
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: str
    created_by: str
    created_at: str

# Ticket Models
class TicketBase(BaseModel):
    subject: str
    message: str
    category: str = "general"

class TicketCreate(TicketBase):
    pass

class TicketResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    message: str
    category: str
    status: str
    created_at: str
    responses: List[Dict] = []

# Admin Models
class AdminCustomerUpdate(BaseModel):
    status: Optional[str] = None
    kyc_status: Optional[str] = None
    notes: Optional[str] = None

class AdminTransferUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class AdminSettings(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    otp_expiry_minutes: Optional[int] = 5
    max_otp_attempts: Optional[int] = 3

class FundingInstructions(BaseModel):
    content: str
    version: Optional[int] = None

# ==================== HELPER FUNCTIONS ====================

def generate_account_number():
    return ''.join(random.choices(string.digits, k=12))

def generate_reference():
    return f"PB{datetime.now(timezone.utc).strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}"

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def log_audit(user_id: str, action: str, details: dict, before: dict = None, after: dict = None):
    audit = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "details": details,
        "before": before,
        "after": after,
        "ip_address": None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit)

async def send_otp_email(email: str, otp: str, purpose: str):
    """Send OTP via configured SMTP"""
    settings = await db.settings.find_one({"type": "smtp"}, {"_id": 0})
    
    if not settings or not settings.get("smtp_host"):
        # For development/testing: Use demo OTP
        logger.info(f"[DEMO MODE] Using demo OTP 123456 for {email} ({purpose})")
        return True  # For development, allow without SMTP
    
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.get('smtp_from_email', 'noreply@prominencebank.com')
        msg['To'] = email
        msg['Subject'] = f"Prominence Bank - Your OTP for {purpose}"
        
        body = f"""
        Dear Customer,
        
        Your One-Time Password (OTP) for {purpose} is: {otp}
        
        This OTP is valid for {settings.get('otp_expiry_minutes', 5)} minutes.
        
        If you did not request this OTP, please contact us immediately.
        
        Best regards,
        Prominence Bank
        """
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(settings['smtp_host'], settings.get('smtp_port', 587))
        server.starttls()
        if settings.get('smtp_user') and settings.get('smtp_password'):
            server.login(settings['smtp_user'], settings['smtp_password'])
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email: {e}")
        return False

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=dict)
async def register_user(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password_hash"] = pwd_context.hash(user_dict.pop("password"))
    user_dict["role"] = "client"
    user_dict["status"] = "active"
    user_dict["kyc_status"] = "pending"
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.insert_one(user_dict)
    await log_audit(user_dict["id"], "user_registered", {"email": user.email})
    
    return {"message": "Registration successful", "user_id": user_dict["id"]}

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["status"] != "active":
        raise HTTPException(status_code=403, detail="Account is not active")
    
    # Generate OTP for login
    otp = generate_otp()
    otp_record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "email": credentials.email,
        "otp_hash": hash_otp(otp),
        "purpose": "login",
        "attempts": 0,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    }
    await db.otps.insert_one(otp_record)
    
    # Send OTP email
    await send_otp_email(credentials.email, otp, "login")
    
    await log_audit(user["id"], "login_otp_requested", {"email": credentials.email})
    
    return {"message": "OTP sent to your email", "requires_otp": True}

@api_router.post("/auth/verify-otp", response_model=dict)
async def verify_otp(data: OTPVerify):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    otp_record = await db.otps.find_one({
        "email": data.email,
        "purpose": data.purpose,
        "used": False
    }, {"_id": 0}, sort=[("created_at", -1)])
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP found")
    
    # Check expiry
    if datetime.fromisoformat(otp_record["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Check attempts
    if otp_record["attempts"] >= 3:
        raise HTTPException(status_code=400, detail="Too many attempts")
    
    # Verify OTP
    if hash_otp(data.otp) != otp_record["otp_hash"]:
        await db.otps.update_one(
            {"id": otp_record["id"]},
            {"$inc": {"attempts": 1}}
        )
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Mark OTP as used
    await db.otps.update_one({"id": otp_record["id"]}, {"$set": {"used": True}})
    
    # Generate token
    token = create_token(user["id"], user["role"])
    
    await log_audit(user["id"], "login_successful", {"email": data.email})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"]
        }
    }

@api_router.post("/auth/request-otp", response_model=dict)
async def request_otp(data: OTPRequest, user: dict = Depends(get_current_user)):
    otp = generate_otp()
    otp_record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "email": data.email,
        "otp_hash": hash_otp(otp),
        "purpose": data.purpose,
        "attempts": 0,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    }
    await db.otps.insert_one(otp_record)
    await send_otp_email(data.email, otp, data.purpose)
    
    return {"message": "OTP sent successfully"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ==================== ACCOUNT ENDPOINTS ====================

@api_router.get("/accounts", response_model=List[AccountResponse])
async def get_accounts(user: dict = Depends(get_current_user)):
    accounts = await db.accounts.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return [AccountResponse(**acc) for acc in accounts]

@api_router.get("/accounts/{account_id}", response_model=AccountResponse)
async def get_account(account_id: str, user: dict = Depends(get_current_user)):
    account = await db.accounts.find_one(
        {"id": account_id, "user_id": user["id"]},
        {"_id": 0}
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return AccountResponse(**account)

@api_router.get("/accounts/{account_id}/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    account_id: str,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    # Verify account ownership
    account = await db.accounts.find_one({"id": account_id, "user_id": user["id"]})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    query = {"account_id": account_id, "is_redacted": {"$ne": True}}
    if status:
        query["status"] = status
    if from_date:
        query["created_at"] = {"$gte": from_date}
    if to_date:
        query["created_at"] = {**query.get("created_at", {}), "$lte": to_date}
    
    transactions = await db.transactions.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [TransactionResponse(**tx) for tx in transactions]

# ==================== TRANSFER ENDPOINTS ====================

@api_router.post("/transfers/internal", response_model=TransactionResponse)
async def internal_transfer(transfer: InternalTransfer, user: dict = Depends(get_current_user)):
    # Verify from account ownership
    from_account = await db.accounts.find_one(
        {"id": transfer.from_account_id, "user_id": user["id"]},
        {"_id": 0}
    )
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")
    
    # Verify to account exists
    to_account = await db.accounts.find_one({"id": transfer.to_account_id}, {"_id": 0})
    if not to_account:
        raise HTTPException(status_code=404, detail="Destination account not found")
    
    # Check balance
    if from_account["available_balance"] < transfer.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Create transaction
    tx_id = str(uuid.uuid4())
    reference = generate_reference()
    now = datetime.now(timezone.utc).isoformat()
    
    # Debit transaction
    debit_tx = {
        "id": tx_id,
        "account_id": transfer.from_account_id,
        "transaction_type": "transfer_out",
        "amount": -transfer.amount,
        "currency": transfer.currency,
        "description": transfer.description or "Internal transfer",
        "status": "completed",
        "reference": reference,
        "counterparty": to_account.get("account_number"),
        "created_at": now,
        "is_redacted": False
    }
    
    # Credit transaction
    credit_tx = {
        "id": str(uuid.uuid4()),
        "account_id": transfer.to_account_id,
        "transaction_type": "transfer_in",
        "amount": transfer.amount,
        "currency": transfer.currency,
        "description": transfer.description or "Internal transfer received",
        "status": "completed",
        "reference": reference,
        "counterparty": from_account.get("account_number"),
        "created_at": now,
        "is_redacted": False
    }
    
    # Update balances
    await db.accounts.update_one(
        {"id": transfer.from_account_id},
        {"$inc": {"available_balance": -transfer.amount}}
    )
    await db.accounts.update_one(
        {"id": transfer.to_account_id},
        {"$inc": {"available_balance": transfer.amount}}
    )
    
    await db.transactions.insert_many([debit_tx, credit_tx])
    await log_audit(user["id"], "internal_transfer", {
        "from_account": transfer.from_account_id,
        "to_account": transfer.to_account_id,
        "amount": transfer.amount,
        "reference": reference
    })
    
    return TransactionResponse(**debit_tx)

@api_router.post("/transfers/external", response_model=TransactionResponse)
async def external_transfer(transfer: ExternalTransfer, user: dict = Depends(get_current_user)):
    # Verify OTP
    otp_record = await db.otps.find_one({
        "email": user["email"],
        "purpose": "transfer",
        "used": False
    }, {"_id": 0}, sort=[("created_at", -1)])
    
    if not otp_record or hash_otp(transfer.otp) != otp_record["otp_hash"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.fromisoformat(otp_record["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Mark OTP as used
    await db.otps.update_one({"id": otp_record["id"]}, {"$set": {"used": True}})
    
    # Verify account ownership
    from_account = await db.accounts.find_one(
        {"id": transfer.from_account_id, "user_id": user["id"]},
        {"_id": 0}
    )
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")
    
    # Verify beneficiary
    beneficiary = await db.beneficiaries.find_one(
        {"id": transfer.beneficiary_id, "user_id": user["id"]},
        {"_id": 0}
    )
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    
    # Check balance
    if from_account["available_balance"] < transfer.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Create pending transaction
    tx_id = str(uuid.uuid4())
    reference = generate_reference()
    now = datetime.now(timezone.utc).isoformat()
    
    tx = {
        "id": tx_id,
        "account_id": transfer.from_account_id,
        "transaction_type": "wire_out",
        "amount": -transfer.amount,
        "currency": transfer.currency,
        "description": transfer.description or f"Wire to {beneficiary['name']}",
        "status": "pending",
        "reference": reference,
        "counterparty": beneficiary["name"],
        "beneficiary_id": transfer.beneficiary_id,
        "created_at": now,
        "is_redacted": False
    }
    
    # Move to transit balance
    await db.accounts.update_one(
        {"id": transfer.from_account_id},
        {
            "$inc": {
                "available_balance": -transfer.amount,
                "transit_balance": transfer.amount
            }
        }
    )
    
    await db.transactions.insert_one(tx)
    await log_audit(user["id"], "external_transfer_initiated", {
        "account": transfer.from_account_id,
        "beneficiary": transfer.beneficiary_id,
        "amount": transfer.amount,
        "reference": reference
    })
    
    return TransactionResponse(**tx)

# ==================== BENEFICIARY ENDPOINTS ====================

@api_router.get("/beneficiaries", response_model=List[BeneficiaryResponse])
async def get_beneficiaries(user: dict = Depends(get_current_user)):
    beneficiaries = await db.beneficiaries.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    return [BeneficiaryResponse(**b) for b in beneficiaries]

@api_router.post("/beneficiaries", response_model=BeneficiaryResponse)
async def create_beneficiary(beneficiary: BeneficiaryCreate, user: dict = Depends(get_current_user)):
    # Verify OTP
    otp_record = await db.otps.find_one({
        "email": user["email"],
        "purpose": "beneficiary",
        "used": False
    }, {"_id": 0}, sort=[("created_at", -1)])
    
    if not otp_record or hash_otp(beneficiary.otp) != otp_record["otp_hash"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.fromisoformat(otp_record["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Mark OTP as used
    await db.otps.update_one({"id": otp_record["id"]}, {"$set": {"used": True}})
    
    ben_dict = beneficiary.model_dump()
    del ben_dict["otp"]
    ben_dict["id"] = str(uuid.uuid4())
    ben_dict["user_id"] = user["id"]
    ben_dict["status"] = "active"
    ben_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.beneficiaries.insert_one(ben_dict)
    await log_audit(user["id"], "beneficiary_created", {"beneficiary_id": ben_dict["id"]})
    
    return BeneficiaryResponse(**ben_dict)

@api_router.delete("/beneficiaries/{beneficiary_id}")
async def delete_beneficiary(beneficiary_id: str, user: dict = Depends(get_current_user)):
    result = await db.beneficiaries.delete_one(
        {"id": beneficiary_id, "user_id": user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    
    await log_audit(user["id"], "beneficiary_deleted", {"beneficiary_id": beneficiary_id})
    return {"message": "Beneficiary deleted"}

# ==================== INSTRUMENT ENDPOINTS ====================

@api_router.get("/instruments", response_model=List[InstrumentResponse])
async def get_instruments(user: dict = Depends(get_current_user)):
    query = {
        "$or": [
            {"visibility": "all"},
            {"recipient_id": user["id"]}
        ],
        "status": "active"
    }
    instruments = await db.instruments.find(query, {"_id": 0}).to_list(100)
    return [InstrumentResponse(**i) for i in instruments]

@api_router.get("/instruments/{instrument_id}", response_model=InstrumentResponse)
async def get_instrument(instrument_id: str, user: dict = Depends(get_current_user)):
    instrument = await db.instruments.find_one(
        {"id": instrument_id},
        {"_id": 0}
    )
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return InstrumentResponse(**instrument)

# ==================== TICKET ENDPOINTS ====================

@api_router.get("/tickets", response_model=List[TicketResponse])
async def get_tickets(user: dict = Depends(get_current_user)):
    tickets = await db.tickets.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return [TicketResponse(**t) for t in tickets]

@api_router.post("/tickets", response_model=TicketResponse)
async def create_ticket(ticket: TicketCreate, user: dict = Depends(get_current_user)):
    ticket_dict = ticket.model_dump()
    ticket_dict["id"] = str(uuid.uuid4())
    ticket_dict["user_id"] = user["id"]
    ticket_dict["status"] = "open"
    ticket_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    ticket_dict["responses"] = []
    
    await db.tickets.insert_one(ticket_dict)
    return TicketResponse(**ticket_dict)

# ==================== CONTENT ENDPOINTS ====================

@api_router.get("/content/funding-instructions")
async def get_funding_instructions():
    content = await db.content.find_one({"type": "funding_instructions"}, {"_id": 0})
    if not content:
        return {"content": "Please contact us for funding instructions.", "version": 1}
    return content

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/dashboard")
async def admin_dashboard(admin: dict = Depends(get_admin_user)):
    total_customers = await db.users.count_documents({"role": "client"})
    active_customers = await db.users.count_documents({"role": "client", "status": "active"})
    pending_transfers = await db.transactions.count_documents({"status": "pending"})
    total_accounts = await db.accounts.count_documents({})
    
    # Calculate total balances
    pipeline = [
        {"$group": {
            "_id": "$currency",
            "total": {"$sum": "$available_balance"}
        }}
    ]
    balance_by_currency = await db.accounts.aggregate(pipeline).to_list(100)
    
    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "pending_transfers": pending_transfers,
        "total_accounts": total_accounts,
        "balance_by_currency": balance_by_currency
    }

@api_router.get("/admin/customers", response_model=List[UserResponse])
async def admin_get_customers(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    query = {"role": "client"}
    if status:
        query["status"] = status
    
    customers = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    return [UserResponse(**c) for c in customers]

@api_router.get("/admin/customers/{customer_id}", response_model=UserResponse)
async def admin_get_customer(customer_id: str, admin: dict = Depends(get_admin_user)):
    customer = await db.users.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return UserResponse(**customer)

@api_router.put("/admin/customers/{customer_id}")
async def admin_update_customer(
    customer_id: str,
    update: AdminCustomerUpdate,
    admin: dict = Depends(get_admin_user)
):
    before = await db.users.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    if not before:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": customer_id}, {"$set": update_dict})
    
    after = await db.users.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    await log_audit(admin["id"], "customer_updated", {"customer_id": customer_id}, before, after)
    
    return {"message": "Customer updated"}

@api_router.post("/admin/customers", response_model=dict)
async def admin_create_customer(user: UserCreate, admin: dict = Depends(get_admin_user)):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password_hash"] = pwd_context.hash(user_dict.pop("password"))
    user_dict["role"] = "client"
    user_dict["status"] = "active"
    user_dict["kyc_status"] = "pending"
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.insert_one(user_dict)
    await log_audit(admin["id"], "customer_created_by_admin", {"customer_id": user_dict["id"]})
    
    return {"message": "Customer created", "user_id": user_dict["id"]}

@api_router.get("/admin/accounts")
async def admin_get_accounts(
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    accounts = await db.accounts.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return accounts

@api_router.post("/admin/accounts", response_model=AccountResponse)
async def admin_create_account(account: AccountCreate, admin: dict = Depends(get_admin_user)):
    # Verify user exists
    user = await db.users.find_one({"id": account.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    account_dict = account.model_dump()
    account_dict["id"] = str(uuid.uuid4())
    account_dict["account_number"] = generate_account_number()
    account_dict["available_balance"] = account.initial_balance
    account_dict["transit_balance"] = 0.0
    account_dict["held_balance"] = 0.0
    account_dict["blocked_balance"] = 0.0
    account_dict["status"] = "active"
    account_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    del account_dict["initial_balance"]
    
    await db.accounts.insert_one(account_dict)
    await log_audit(admin["id"], "account_created", {"account_id": account_dict["id"], "user_id": account.user_id})
    
    return AccountResponse(**account_dict)

@api_router.get("/admin/transfers")
async def admin_get_transfers(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    query = {}
    if status:
        query["status"] = status
    
    transfers = await db.transactions.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return transfers

@api_router.put("/admin/transfers/{transfer_id}")
async def admin_update_transfer(
    transfer_id: str,
    update: AdminTransferUpdate,
    admin: dict = Depends(get_admin_user)
):
    before = await db.transactions.find_one({"id": transfer_id}, {"_id": 0})
    if not before:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    # Handle status changes for wire transfers
    if before["status"] == "pending" and update.status in ["completed", "approved"]:
        # Move from transit to available (for completed incoming) or remove transit (for outgoing)
        if before["transaction_type"] == "wire_out":
            await db.accounts.update_one(
                {"id": before["account_id"]},
                {"$inc": {"transit_balance": abs(before["amount"])}}
            )
    elif before["status"] == "pending" and update.status in ["rejected", "cancelled"]:
        # Return funds to available balance
        if before["transaction_type"] == "wire_out":
            await db.accounts.update_one(
                {"id": before["account_id"]},
                {
                    "$inc": {
                        "available_balance": abs(before["amount"]),
                        "transit_balance": -abs(before["amount"])
                    }
                }
            )
    
    await db.transactions.update_one(
        {"id": transfer_id},
        {"$set": {"status": update.status, "notes": update.notes}}
    )
    
    after = await db.transactions.find_one({"id": transfer_id}, {"_id": 0})
    await log_audit(admin["id"], "transfer_status_updated", {
        "transfer_id": transfer_id,
        "old_status": before["status"],
        "new_status": update.status
    }, before, after)
    
    return {"message": "Transfer updated"}

@api_router.post("/admin/instruments", response_model=InstrumentResponse)
async def admin_create_instrument(instrument: InstrumentCreate, admin: dict = Depends(get_admin_user)):
    inst_dict = instrument.model_dump()
    inst_dict["id"] = str(uuid.uuid4())
    inst_dict["status"] = "active"
    inst_dict["created_by"] = admin["id"]
    inst_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.instruments.insert_one(inst_dict)
    await log_audit(admin["id"], "instrument_created", {"instrument_id": inst_dict["id"]})
    
    return InstrumentResponse(**inst_dict)

@api_router.get("/admin/instruments")
async def admin_get_instruments(admin: dict = Depends(get_admin_user)):
    instruments = await db.instruments.find({}, {"_id": 0}).to_list(100)
    return instruments

@api_router.delete("/admin/instruments/{instrument_id}")
async def admin_delete_instrument(instrument_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.instruments.delete_one({"id": instrument_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Instrument not found")
    
    await log_audit(admin["id"], "instrument_deleted", {"instrument_id": instrument_id})
    return {"message": "Instrument deleted"}

@api_router.post("/admin/transactions/{transaction_id}/redact")
async def admin_redact_transaction(
    transaction_id: str,
    admin: dict = Depends(get_admin_user)
):
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Recalculate balance
    if transaction["status"] == "completed":
        await db.accounts.update_one(
            {"id": transaction["account_id"]},
            {"$inc": {"available_balance": -transaction["amount"]}}
        )
    
    # Mark as redacted
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": {"is_redacted": True, "redacted_by": admin["id"], "redacted_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await log_audit(admin["id"], "transaction_redacted", {
        "transaction_id": transaction_id,
        "original_amount": transaction["amount"]
    }, transaction, {"is_redacted": True})
    
    return {"message": "Transaction redacted"}

@api_router.get("/admin/settings")
async def admin_get_settings(admin: dict = Depends(get_admin_user)):
    settings = await db.settings.find({}, {"_id": 0}).to_list(100)
    return {s["type"]: s for s in settings}

@api_router.put("/admin/settings")
async def admin_update_settings(settings: AdminSettings, admin: dict = Depends(get_admin_user)):
    settings_dict = settings.model_dump()
    settings_dict["type"] = "smtp"
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one(
        {"type": "smtp"},
        {"$set": settings_dict},
        upsert=True
    )
    
    await log_audit(admin["id"], "settings_updated", {"type": "smtp"})
    return {"message": "Settings updated"}

@api_router.post("/admin/settings/test-email")
async def admin_test_email(admin: dict = Depends(get_admin_user)):
    success = await send_otp_email(admin["email"], "123456", "test")
    if success:
        return {"message": "Test email sent successfully"}
    raise HTTPException(status_code=500, detail="Failed to send test email")

@api_router.put("/admin/content/funding-instructions")
async def admin_update_funding_instructions(
    content: FundingInstructions,
    admin: dict = Depends(get_admin_user)
):
    existing = await db.content.find_one({"type": "funding_instructions"}, {"_id": 0})
    version = (existing.get("version", 0) if existing else 0) + 1
    
    # Save version history
    if existing:
        history = {
            "type": "funding_instructions_history",
            "version": existing.get("version", 1),
            "content": existing.get("content"),
            "updated_by": admin["id"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.content_history.insert_one(history)
    
    await db.content.update_one(
        {"type": "funding_instructions"},
        {"$set": {
            "content": content.content,
            "version": version,
            "updated_by": admin["id"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await log_audit(admin["id"], "funding_instructions_updated", {"version": version})
    return {"message": "Funding instructions updated", "version": version}

@api_router.get("/admin/audit-logs")
async def admin_get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    query = {}
    if action:
        query["action"] = action
    if user_id:
        query["user_id"] = user_id
    
    logs = await db.audit_logs.find(
        query, {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    return logs

# ==================== SEED DATA ENDPOINT ====================

@api_router.post("/seed")
async def seed_data():
    """Seed demo data for testing"""
    
    # Check if already seeded
    admin_exists = await db.users.find_one({"email": "admin@prominencebank.com"})
    if admin_exists:
        return {"message": "Data already seeded"}
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create admin user
    admin = {
        "id": str(uuid.uuid4()),
        "email": "admin@prominencebank.com",
        "first_name": "System",
        "last_name": "Administrator",
        "phone": "+1234567890",
        "password_hash": pwd_context.hash("admin123"),
        "role": "super_admin",
        "status": "active",
        "kyc_status": "verified",
        "user_type": "personal",
        "created_at": now,
        "updated_at": now
    }
    await db.users.insert_one(admin)
    
    # Create demo client
    client = {
        "id": str(uuid.uuid4()),
        "email": "client@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1987654321",
        "address": "123 Main Street, New York, NY 10001",
        "country": "United States",
        "password_hash": pwd_context.hash("client123"),
        "role": "client",
        "status": "active",
        "kyc_status": "verified",
        "user_type": "personal",
        "created_at": now,
        "updated_at": now
    }
    await db.users.insert_one(client)
    
    # Create accounts for client
    accounts = [
        {
            "id": str(uuid.uuid4()),
            "user_id": client["id"],
            "account_number": "100000000001",
            "account_type": "checking",
            "currency": "USD",
            "available_balance": 125000.00,
            "transit_balance": 5000.00,
            "held_balance": 0.00,
            "blocked_balance": 0.00,
            "status": "active",
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": client["id"],
            "account_number": "100000000002",
            "account_type": "savings",
            "currency": "EUR",
            "available_balance": 50000.00,
            "transit_balance": 0.00,
            "held_balance": 0.00,
            "blocked_balance": 0.00,
            "status": "active",
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": client["id"],
            "account_number": "100000000003",
            "account_type": "ktt",
            "currency": "GBP",
            "available_balance": 75000.00,
            "transit_balance": 0.00,
            "held_balance": 0.00,
            "blocked_balance": 0.00,
            "status": "active",
            "created_at": now
        }
    ]
    await db.accounts.insert_many(accounts)
    
    # Create sample transactions
    transactions = [
        {
            "id": str(uuid.uuid4()),
            "account_id": accounts[0]["id"],
            "transaction_type": "deposit",
            "amount": 50000.00,
            "currency": "USD",
            "description": "Initial deposit",
            "status": "completed",
            "reference": generate_reference(),
            "counterparty": "Wire Transfer",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
            "is_redacted": False
        },
        {
            "id": str(uuid.uuid4()),
            "account_id": accounts[0]["id"],
            "transaction_type": "transfer_out",
            "amount": -10000.00,
            "currency": "USD",
            "description": "Transfer to savings",
            "status": "completed",
            "reference": generate_reference(),
            "counterparty": "Internal Transfer",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat(),
            "is_redacted": False
        },
        {
            "id": str(uuid.uuid4()),
            "account_id": accounts[0]["id"],
            "transaction_type": "wire_out",
            "amount": -5000.00,
            "currency": "USD",
            "description": "Wire transfer to ABC Corp",
            "status": "pending",
            "reference": generate_reference(),
            "counterparty": "ABC Corporation",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "is_redacted": False
        }
    ]
    await db.transactions.insert_many(transactions)
    
    # Create sample beneficiary
    beneficiary = {
        "id": str(uuid.uuid4()),
        "user_id": client["id"],
        "name": "ABC Corporation",
        "bank_name": "Chase Bank",
        "account_number": "987654321",
        "routing_number": "021000021",
        "swift_code": "CHASUS33",
        "beneficiary_type": "external",
        "status": "active",
        "created_at": now
    }
    await db.beneficiaries.insert_one(beneficiary)
    
    # Create sample instrument (KTT)
    instrument = {
        "id": str(uuid.uuid4()),
        "title": "Key Tested Telex - Trade Finance",
        "instrument_type": "KTT",
        "content": """
PROMINENCE BANK
SWIFT: PROMGB2L

KEY TESTED TELEX

TO: BENEFICIARY BANK
DATE: {current_date}
REFERENCE: KTT-2024-001

THIS IS TO CONFIRM THAT WE HOLD ON ACCOUNT OF OUR CLIENT:

ACCOUNT HOLDER: [Client Name]
ACCOUNT NUMBER: [Account Number]
BALANCE: USD 125,000.00

THIS CONFIRMATION IS ISSUED AT THE REQUEST OF OUR ABOVE-MENTIONED CLIENT 
FOR YOUR REFERENCE PURPOSES ONLY.

THIS KEY TESTED TELEX IS SUBJECT TO OUR STANDARD TERMS AND CONDITIONS.

AUTHORIZED SIGNATURES:
_____________________    _____________________
BANK OFFICER             COMPLIANCE OFFICER

PROMINENCE BANK - SMART BANKING
        """.strip(),
        "amount": 125000.00,
        "currency": "USD",
        "status": "active",
        "visibility": "all",
        "created_by": admin["id"],
        "created_at": now
    }
    await db.instruments.insert_one(instrument)
    
    # Create funding instructions content
    funding_content = {
        "type": "funding_instructions",
        "content": """
# How to Fund Your Account

## Wire Transfer Instructions

### For USD Transfers:
- Bank Name: Prominence Bank
- SWIFT Code: PROMGB2L
- Account Name: Your Full Name
- Account Number: Your 12-digit account number
- Reference: Your client ID

### For EUR Transfers:
- Bank Name: Prominence Bank
- SWIFT Code: PROMGB2L
- IBAN: Contact us for your IBAN
- Reference: Your client ID

### For GBP Transfers:
- Bank Name: Prominence Bank
- Sort Code: 00-00-00
- Account Number: Your 8-digit account number
- Reference: Your client ID

## Processing Times
- Domestic transfers: 1-2 business days
- International transfers: 3-5 business days

## Important Notes
- Ensure the reference includes your client ID
- Contact support for large transfers over $100,000
- All transfers are subject to compliance review

For assistance, contact: support@prominencebank.com
        """.strip(),
        "version": 1,
        "updated_by": admin["id"],
        "updated_at": now
    }
    await db.content.insert_one(funding_content)
    
    return {
        "message": "Demo data seeded successfully",
        "admin_email": "admin@prominencebank.com",
        "admin_password": "admin123",
        "client_email": "client@example.com",
        "client_password": "client123"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

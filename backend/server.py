from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    picture: str
    role: str = "user"  # user, mentor, admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DrugTest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    test_date: datetime
    test_type: str  # urinalysis, breathalyzer, blood, hair
    result: str  # negative, positive, dilute, invalid
    administered_by: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DrugTestCreate(BaseModel):
    user_id: str
    test_date: str
    test_type: str
    result: str
    administered_by: str
    notes: Optional[str] = None

class Meeting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    meeting_date: datetime
    meeting_type: str
    attended: bool
    notes: Optional[str] = None
    recorded_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MeetingCreate(BaseModel):
    user_id: str
    meeting_date: str
    meeting_type: str
    attended: bool
    notes: Optional[str] = None
    recorded_by: str

class RentPayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    payment_date: datetime
    amount: float
    confirmed: bool
    confirmed_by: Optional[str] = None
    confirmation_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RentPaymentCreate(BaseModel):
    user_id: str
    payment_date: str
    amount: float
    notes: Optional[str] = None

class RentPaymentConfirm(BaseModel):
    confirmed: bool
    confirmed_by: str

class Devotion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    scripture_reference: Optional[str] = None
    author_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DevotionCreate(BaseModel):
    title: str
    content: str
    scripture_reference: Optional[str] = None

class ReadingMaterial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    author: str
    description: Optional[str] = None
    category: str
    link: Optional[str] = None
    added_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReadingMaterialCreate(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    category: str
    link: Optional[str] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    recipient_id: Optional[str] = None  # None for broadcast
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False

class MessageCreate(BaseModel):
    recipient_id: Optional[str] = None
    content: str

class CalendarEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    event_date: datetime
    event_type: str
    location: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: str
    event_type: str
    location: Optional[str] = None

# Auth helper
async def get_current_user(session_token: Optional[str] = None, authorization: Optional[str] = None) -> Optional[User]:
    token = session_token or (authorization.replace('Bearer ', '') if authorization else None)
    if not token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": token})
    if not session or datetime.fromisoformat(session['expires_at']) < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"id": session["user_id"]})
    if not user_doc:
        return None
    
    return User(**user_doc)

# Auth endpoints
@api_router.post("/auth/session")
async def create_session(response: Response, x_session_id: Optional[str] = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Get session data from Emergent
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id}
        )
        resp.raise_for_status()
        session_data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid session: {str(e)}")
    
    # Check if user exists
    user = await db.users.find_one({"email": session_data["email"]})
    
    if not user:
        # Create new user
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data["picture"],
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    else:
        user_id = user["id"]
    
    # Create session
    session_token = session_data["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {"session_token": session_token, "user_id": user_id}

@api_router.get("/auth/me")
async def get_me(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    token = session_token or (authorization.replace('Bearer ', '') if authorization else None)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# User management
@api_router.get("/users", response_model=List[User])
async def get_users(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user or user.role not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    return {"message": "Role updated"}

# Drug tests
@api_router.post("/drug-tests", response_model=DrugTest)
async def create_drug_test(
    data: DrugTestCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user or user.role not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    test_dict = data.model_dump()
    test_dict["test_date"] = datetime.fromisoformat(test_dict["test_date"]).isoformat()
    test_obj = DrugTest(**test_dict)
    doc = test_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.drug_tests.insert_one(doc)
    return test_obj

@api_router.get("/drug-tests", response_model=List[DrugTest])
async def get_drug_tests(
    user_id: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if user.role == "user":
        query["user_id"] = user.id
    elif user_id:
        query["user_id"] = user_id
    
    tests = await db.drug_tests.find(query, {"_id": 0}).sort("test_date", -1).to_list(1000)
    return tests

# Meetings
@api_router.post("/meetings", response_model=Meeting)
async def create_meeting(
    data: MeetingCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user or user.role not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    meeting_dict = data.model_dump()
    meeting_dict["meeting_date"] = datetime.fromisoformat(meeting_dict["meeting_date"]).isoformat()
    meeting_obj = Meeting(**meeting_dict)
    doc = meeting_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.meetings.insert_one(doc)
    return meeting_obj

@api_router.get("/meetings", response_model=List[Meeting])
async def get_meetings(
    user_id: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if user.role == "user":
        query["user_id"] = user.id
    elif user_id:
        query["user_id"] = user_id
    
    meetings = await db.meetings.find(query, {"_id": 0}).sort("meeting_date", -1).to_list(1000)
    return meetings

# Rent payments
@api_router.post("/rent-payments", response_model=RentPayment)
async def create_rent_payment(
    data: RentPaymentCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payment_dict = data.model_dump()
    payment_dict["payment_date"] = datetime.fromisoformat(payment_dict["payment_date"]).isoformat()
    payment_dict["confirmed"] = False
    payment_obj = RentPayment(**payment_dict)
    doc = payment_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["payment_date"] = doc["payment_date"]
    
    await db.rent_payments.insert_one(doc)
    return payment_obj

@api_router.get("/rent-payments", response_model=List[RentPayment])
async def get_rent_payments(
    user_id: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if user.role == "user":
        query["user_id"] = user.id
    elif user_id:
        query["user_id"] = user_id
    
    payments = await db.rent_payments.find(query, {"_id": 0}).sort("payment_date", -1).to_list(1000)
    return payments

@api_router.patch("/rent-payments/{payment_id}/confirm")
async def confirm_rent_payment(
    payment_id: str,
    data: RentPaymentConfirm,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user or user.role not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {
        "confirmed": data.confirmed,
        "confirmed_by": data.confirmed_by,
        "confirmation_date": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rent_payments.update_one({"id": payment_id}, {"$set": update_data})
    return {"message": "Payment confirmed"}

# Devotions
@api_router.post("/devotions", response_model=Devotion)
async def create_devotion(
    data: DevotionCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    devotion_dict = data.model_dump()
    devotion_dict["author_id"] = user.id
    devotion_obj = Devotion(**devotion_dict)
    doc = devotion_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.devotions.insert_one(doc)
    return devotion_obj

@api_router.get("/devotions", response_model=List[Devotion])
async def get_devotions(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    devotions = await db.devotions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return devotions

# Reading materials
@api_router.post("/reading-materials", response_model=ReadingMaterial)
async def create_reading_material(
    data: ReadingMaterialCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user or user.role not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    material_dict = data.model_dump()
    material_dict["added_by"] = user.id
    material_obj = ReadingMaterial(**material_dict)
    doc = material_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.reading_materials.insert_one(doc)
    return material_obj

@api_router.get("/reading-materials", response_model=List[ReadingMaterial])
async def get_reading_materials(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    materials = await db.reading_materials.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return materials

# Messages
@api_router.post("/messages", response_model=Message)
async def create_message(
    data: MessageCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    message_dict = data.model_dump()
    message_dict["sender_id"] = user.id
    message_obj = Message(**message_dict)
    doc = message_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.messages.insert_one(doc)
    return message_obj

@api_router.get("/messages", response_model=List[Message])
async def get_messages(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get messages where user is sender or recipient (or broadcast)
    messages = await db.messages.find({
        "$or": [
            {"sender_id": user.id},
            {"recipient_id": user.id},
            {"recipient_id": None}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    return messages

@api_router.patch("/messages/{message_id}/read")
async def mark_message_read(
    message_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.messages.update_one({"id": message_id}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

# Calendar events
@api_router.post("/calendar-events", response_model=CalendarEvent)
async def create_calendar_event(
    data: CalendarEventCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user or user.role not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    event_dict = data.model_dump()
    event_dict["event_date"] = datetime.fromisoformat(event_dict["event_date"]).isoformat()
    event_dict["created_by"] = user.id
    event_obj = CalendarEvent(**event_dict)
    doc = event_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.calendar_events.insert_one(doc)
    return event_obj

@api_router.get("/calendar-events", response_model=List[CalendarEvent])
async def get_calendar_events(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    events = await db.calendar_events.find({}, {"_id": 0}).sort("event_date", 1).to_list(1000)
    return events

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import logging
import uuid
import stripe
from pathlib import Path
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Stripe Configuration
stripe.api_key = os.environ['STRIPE_SECRET_KEY']

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str = "admin"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None

class GeneratePasswordResponse(BaseModel):
    password: str
    message: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None
    project_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    phone: Optional[str] = None

class Deliverable(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    filename: str
    file_path: str
    file_size: int
    file_type: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    client_id: str
    client_name: Optional[str] = None
    status: str = "active"  # active, completed, on-hold
    deadline: Optional[datetime] = None
    total_value: float = 0.0
    deliverables: List[Deliverable] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    client_id: str
    status: str = "active"
    deadline: Optional[datetime] = None
    total_value: float = 0.0

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    client_id: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    total_value: Optional[float] = None

class InvoiceLineItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    unit_price: float
    quantity: float
    total: float

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: str
    client_id: str
    client_name: Optional[str] = None
    project_id: Optional[str] = None
    project_title: Optional[str] = None
    line_items: List[InvoiceLineItem] = []
    subtotal: float = 0.0
    tva_rate: float = 0.0  # TVA rate as percentage (0, 2.1, 5.5, 10, 20)
    tva_amount: float = 0.0
    total: float = 0.0
    currency: str = "eur"
    status: str = "pending"  # paid, pending, overdue
    due_date: datetime
    issued_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = None
    stripe_payment_intent_id: Optional[str] = None
    stripe_checkout_session_id: Optional[str] = None
    payment_link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceLineItemCreate(BaseModel):
    description: str
    unit_price: float
    quantity: float

class InvoiceCreate(BaseModel):
    client_id: str
    project_id: Optional[str] = None
    line_items: List[InvoiceLineItemCreate]
    tva_rate: float = 0.0
    currency: str = "eur"
    due_date: datetime

class InvoiceUpdate(BaseModel):
    line_items: Optional[List[InvoiceLineItemCreate]] = None
    tva_rate: Optional[float] = None
    status: Optional[str] = None
    paid_at: Optional[datetime] = None
    stripe_payment_intent_id: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_id: Optional[str] = None
    client_id: str
    client_name: Optional[str] = None
    amount: float
    currency: str = "usd"
    status: str  # succeeded, pending, failed
    stripe_charge_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentIntentRequest(BaseModel):
    invoice_id: str

class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str

class Activity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # client_added, project_created, invoice_paid, etc.
    entity_type: str  # client, project, invoice, payment
    entity_id: str
    message: str
    actor: str = "System"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Metrics(BaseModel):
    total_revenue: float
    active_projects: int
    total_clients: int
    mrr: float


# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)


# ==================== SEED DATA ====================

async def seed_default_user():
    """Create default admin user if not exists"""
    existing_user = await db.users.find_one({"email": "admin@nqcrm.com"})
    if not existing_user:
        user = User(
            email="admin@nqcrm.com",
            name="Admin User",
            role="admin"
        )
        user_dict = user.model_dump()
        user_dict['password_hash'] = hash_password("admin123")
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        logging.info("Default admin user created")

async def seed_sample_data():
    """Seed sample clients, projects, invoices, and activities"""
    # Check if data already exists
    existing_clients = await db.clients.count_documents({})
    if existing_clients > 0:
        return
    
    # Sample Clients
    clients_data = [
        {"name": "Acme Corporation", "email": "contact@acmecorp.com", "company": "Acme Corp", "phone": "+1-555-0100"},
        {"name": "TechStart Inc", "email": "hello@techstart.io", "company": "TechStart", "phone": "+1-555-0200"},
        {"name": "Global Solutions", "email": "info@globalsolutions.com", "company": "Global Solutions Ltd", "phone": "+1-555-0300"},
    ]
    
    clients = []
    for c_data in clients_data:
        client = Client(**c_data)
        client_dict = client.model_dump()
        client_dict['created_at'] = client_dict['created_at'].isoformat()
        client_dict['updated_at'] = client_dict['updated_at'].isoformat()
        await db.clients.insert_one(client_dict)
        clients.append(client)
    
    # Sample Projects
    projects_data = [
        {"title": "Website Redesign", "client_id": clients[0].id, "status": "active", "total_value": 15000.0, "deadline": datetime.now(timezone.utc) + timedelta(days=30)},
        {"title": "Mobile App Development", "client_id": clients[1].id, "status": "active", "total_value": 45000.0, "deadline": datetime.now(timezone.utc) + timedelta(days=60)},
        {"title": "SEO Optimization", "client_id": clients[0].id, "status": "completed", "total_value": 8000.0, "deadline": datetime.now(timezone.utc) - timedelta(days=10)},
        {"title": "CRM Integration", "client_id": clients[2].id, "status": "active", "total_value": 25000.0, "deadline": datetime.now(timezone.utc) + timedelta(days=45)},
    ]
    
    projects = []
    for p_data in projects_data:
        project = Project(**p_data)
        project_dict = project.model_dump()
        project_dict['created_at'] = project_dict['created_at'].isoformat()
        project_dict['updated_at'] = project_dict['updated_at'].isoformat()
        if project_dict['deadline']:
            project_dict['deadline'] = project_dict['deadline'].isoformat()
        await db.projects.insert_one(project_dict)
        projects.append(project)
    
    # Sample Invoices
    invoices_data = [
        {"client_id": clients[0].id, "project_id": projects[0].id, "amount": 7500.0, "status": "paid", "due_date": datetime.now(timezone.utc) - timedelta(days=5), "paid_at": datetime.now(timezone.utc) - timedelta(days=3)},
        {"client_id": clients[1].id, "project_id": projects[1].id, "amount": 15000.0, "status": "pending", "due_date": datetime.now(timezone.utc) + timedelta(days=15)},
        {"client_id": clients[0].id, "project_id": projects[2].id, "amount": 8000.0, "status": "paid", "due_date": datetime.now(timezone.utc) - timedelta(days=20), "paid_at": datetime.now(timezone.utc) - timedelta(days=15)},
        {"client_id": clients[2].id, "project_id": projects[3].id, "amount": 12500.0, "status": "overdue", "due_date": datetime.now(timezone.utc) - timedelta(days=2)},
    ]
    
    invoice_counter = 1001
    for i_data in invoices_data:
        invoice = Invoice(**i_data, number=f"INV-{invoice_counter}")
        invoice_dict = invoice.model_dump()
        invoice_dict['created_at'] = invoice_dict['created_at'].isoformat()
        invoice_dict['updated_at'] = invoice_dict['updated_at'].isoformat()
        invoice_dict['issued_date'] = invoice_dict['issued_date'].isoformat()
        invoice_dict['due_date'] = invoice_dict['due_date'].isoformat()
        if invoice_dict['paid_at']:
            invoice_dict['paid_at'] = invoice_dict['paid_at'].isoformat()
        await db.invoices.insert_one(invoice_dict)
        invoice_counter += 1
        
        # Create payment records for paid invoices
        if i_data['status'] == 'paid':
            payment = Payment(
                invoice_id=invoice.id,
                client_id=i_data['client_id'],
                amount=i_data['amount'],
                status="succeeded",
                stripe_payment_intent_id=f"pi_test_{uuid.uuid4().hex[:16]}"
            )
            payment_dict = payment.model_dump()
            payment_dict['created_at'] = payment_dict['created_at'].isoformat()
            await db.payments.insert_one(payment_dict)
    
    # Sample Activities
    activities = [
        Activity(type="client_added", entity_type="client", entity_id=clients[0].id, message=f"New client '{clients[0].name}' added"),
        Activity(type="project_created", entity_type="project", entity_id=projects[0].id, message=f"Project '{projects[0].title}' created"),
        Activity(type="invoice_paid", entity_type="invoice", entity_id="inv-1", message=f"Invoice INV-1001 paid by {clients[0].name}"),
    ]
    
    for activity in activities:
        activity_dict = activity.model_dump()
        activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
        await db.activity.insert_one(activity_dict)
    
    logging.info("Sample data seeded successfully")


@app.on_event("startup")
async def startup_event():
    await seed_default_user()
    await seed_sample_data()


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not verify_password(request.password, user_doc['password_hash']):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password_hash'})
    access_token = create_access_token({"sub": user.id})
    
    return LoginResponse(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ==================== CLIENTS ROUTES ====================

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    for client in clients:
        if isinstance(client['created_at'], str):
            client['created_at'] = datetime.fromisoformat(client['created_at'])
        if isinstance(client['updated_at'], str):
            client['updated_at'] = datetime.fromisoformat(client['updated_at'])
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: User = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if isinstance(client['created_at'], str):
        client['created_at'] = datetime.fromisoformat(client['created_at'])
    if isinstance(client['updated_at'], str):
        client['updated_at'] = datetime.fromisoformat(client['updated_at'])
    return Client(**client)

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    client = Client(**client_data.model_dump())
    client_dict = client.model_dump()
    client_dict['created_at'] = client_dict['created_at'].isoformat()
    client_dict['updated_at'] = client_dict['updated_at'].isoformat()
    await db.clients.insert_one(client_dict)
    
    # Log activity
    activity = Activity(
        type="client_added",
        entity_type="client",
        entity_id=client.id,
        message=f"New client '{client.name}' added",
        actor=current_user.name
    )
    activity_dict = activity.model_dump()
    activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
    await db.activity.insert_one(activity_dict)
    
    return client

@api_router.patch("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, update_data: ClientUpdate, current_user: User = Depends(get_current_user)):
    existing = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.clients.update_one({"id": client_id}, {"$set": update_dict})
    
    updated_client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if isinstance(updated_client['created_at'], str):
        updated_client['created_at'] = datetime.fromisoformat(updated_client['created_at'])
    if isinstance(updated_client['updated_at'], str):
        updated_client['updated_at'] = datetime.fromisoformat(updated_client['updated_at'])
    return Client(**updated_client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted successfully"}


# ==================== PROJECTS ROUTES ====================

@api_router.get("/projects", response_model=List[Project])
async def get_projects(current_user: User = Depends(get_current_user)):
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    for project in projects:
        if isinstance(project['created_at'], str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project['updated_at'], str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
        if project.get('deadline') and isinstance(project['deadline'], str):
            project['deadline'] = datetime.fromisoformat(project['deadline'])
        
        # Populate client name
        if project.get('client_id'):
            client = await db.clients.find_one({"id": project['client_id']}, {"_id": 0, "name": 1})
            if client:
                project['client_name'] = client['name']
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if isinstance(project['created_at'], str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    if isinstance(project['updated_at'], str):
        project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    if project.get('deadline') and isinstance(project['deadline'], str):
        project['deadline'] = datetime.fromisoformat(project['deadline'])
    
    # Populate client name
    if project.get('client_id'):
        client = await db.clients.find_one({"id": project['client_id']}, {"_id": 0, "name": 1})
        if client:
            project['client_name'] = client['name']
    
    return Project(**project)

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, current_user: User = Depends(get_current_user)):
    project = Project(**project_data.model_dump())
    project_dict = project.model_dump()
    project_dict['created_at'] = project_dict['created_at'].isoformat()
    project_dict['updated_at'] = project_dict['updated_at'].isoformat()
    if project_dict['deadline']:
        project_dict['deadline'] = project_dict['deadline'].isoformat()
    await db.projects.insert_one(project_dict)
    
    # Log activity
    activity = Activity(
        type="project_created",
        entity_type="project",
        entity_id=project.id,
        message=f"Project '{project.title}' created",
        actor=current_user.name
    )
    activity_dict = activity.model_dump()
    activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
    await db.activity.insert_one(activity_dict)
    
    # Populate client name
    client = await db.clients.find_one({"id": project.client_id}, {"_id": 0, "name": 1})
    if client:
        project.client_name = client['name']
    
    return project

@api_router.patch("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, update_data: ProjectUpdate, current_user: User = Depends(get_current_user)):
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        if 'deadline' in update_dict and update_dict['deadline']:
            update_dict['deadline'] = update_dict['deadline'].isoformat()
        await db.projects.update_one({"id": project_id}, {"$set": update_dict})
    
    updated_project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if isinstance(updated_project['created_at'], str):
        updated_project['created_at'] = datetime.fromisoformat(updated_project['created_at'])
    if isinstance(updated_project['updated_at'], str):
        updated_project['updated_at'] = datetime.fromisoformat(updated_project['updated_at'])
    if updated_project.get('deadline') and isinstance(updated_project['deadline'], str):
        updated_project['deadline'] = datetime.fromisoformat(updated_project['deadline'])
    
    # Populate client name
    if updated_project.get('client_id'):
        client = await db.clients.find_one({"id": updated_project['client_id']}, {"_id": 0, "name": 1})
        if client:
            updated_project['client_name'] = client['name']
    
    return Project(**updated_project)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: User = Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}


# ==================== PROJECT DELIVERABLES ROUTES ====================

# Create uploads directory
UPLOADS_DIR = Path("/app/uploads/deliverables")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
    '.zip', '.rar', '.tar', '.gz', '.txt', '.md'
}

@api_router.post("/projects/{project_id}/deliverables", response_model=Deliverable)
async def add_deliverable(
    project_id: str,
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Add a deliverable to a project with file upload"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())
    safe_filename = f"{unique_id}_{file.filename}"
    file_path = UPLOADS_DIR / safe_filename
    
    # Save file
    content = await file.read()
    file_size = len(content)
    
    # Check file size (max 10MB)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create deliverable
    deliverable = Deliverable(
        name=name,
        filename=file.filename,
        file_path=str(file_path),
        file_size=file_size,
        file_type=file.content_type or "application/octet-stream"
    )
    deliverable_dict = deliverable.model_dump()
    deliverable_dict['uploaded_at'] = deliverable_dict['uploaded_at'].isoformat()
    
    # Add to project's deliverables array
    await db.projects.update_one(
        {"id": project_id},
        {
            "$push": {"deliverables": deliverable_dict},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Log activity
    activity = Activity(
        type="deliverable_added",
        entity_type="project",
        entity_id=project_id,
        message=f"Deliverable '{deliverable.name}' ({file.filename}) added to project",
        actor=current_user.name
    )
    activity_dict = activity.model_dump()
    activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
    await db.activity.insert_one(activity_dict)
    
    return deliverable

@api_router.get("/projects/{project_id}/deliverables", response_model=List[Deliverable])
async def get_deliverables(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all deliverables for a project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    deliverables = project.get('deliverables', [])
    for d in deliverables:
        if isinstance(d['uploaded_at'], str):
            d['uploaded_at'] = datetime.fromisoformat(d['uploaded_at'])
    
    return deliverables

@api_router.get("/deliverables/download/{deliverable_id}")
async def download_deliverable(
    deliverable_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download a deliverable file"""
    # Find the deliverable in any project
    project = await db.projects.find_one(
        {"deliverables.id": deliverable_id},
        {"_id": 0, "deliverables.$": 1}
    )
    
    if not project or not project.get('deliverables'):
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    deliverable = project['deliverables'][0]
    file_path = Path(deliverable['file_path'])
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=file_path,
        filename=deliverable['filename'],
        media_type=deliverable.get('file_type', 'application/octet-stream')
    )

@api_router.delete("/projects/{project_id}/deliverables/{deliverable_id}")
async def delete_deliverable(
    project_id: str,
    deliverable_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove a deliverable from a project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Find and remove the deliverable
    deliverables = project.get('deliverables', [])
    deliverable_to_remove = None
    for d in deliverables:
        if d['id'] == deliverable_id:
            deliverable_to_remove = d
            break
    
    if not deliverable_to_remove:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    # Delete the file from disk
    file_path = Path(deliverable_to_remove['file_path'])
    if file_path.exists():
        file_path.unlink()
    
    await db.projects.update_one(
        {"id": project_id},
        {
            "$pull": {"deliverables": {"id": deliverable_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Log activity
    activity = Activity(
        type="deliverable_removed",
        entity_type="project",
        entity_id=project_id,
        message=f"Deliverable '{deliverable_to_remove['name']}' removed from project",
        actor=current_user.name
    )
    activity_dict = activity.model_dump()
    activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
    await db.activity.insert_one(activity_dict)
    
    return {"message": "Deliverable deleted successfully"}


# ==================== INVOICES ROUTES ====================

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(current_user: User = Depends(get_current_user)):
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    for invoice in invoices:
        if isinstance(invoice['created_at'], str):
            invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
        if isinstance(invoice['updated_at'], str):
            invoice['updated_at'] = datetime.fromisoformat(invoice['updated_at'])
        if isinstance(invoice['issued_date'], str):
            invoice['issued_date'] = datetime.fromisoformat(invoice['issued_date'])
        if isinstance(invoice['due_date'], str):
            invoice['due_date'] = datetime.fromisoformat(invoice['due_date'])
        if invoice.get('paid_at') and isinstance(invoice['paid_at'], str):
            invoice['paid_at'] = datetime.fromisoformat(invoice['paid_at'])
        
        # Populate client and project names
        if invoice.get('client_id'):
            client = await db.clients.find_one({"id": invoice['client_id']}, {"_id": 0, "name": 1})
            if client:
                invoice['client_name'] = client['name']
        
        if invoice.get('project_id'):
            project = await db.projects.find_one({"id": invoice['project_id']}, {"_id": 0, "title": 1})
            if project:
                invoice['project_title'] = project['title']
    
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, current_user: User = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if isinstance(invoice['created_at'], str):
        invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    if isinstance(invoice['updated_at'], str):
        invoice['updated_at'] = datetime.fromisoformat(invoice['updated_at'])
    if isinstance(invoice['issued_date'], str):
        invoice['issued_date'] = datetime.fromisoformat(invoice['issued_date'])
    if isinstance(invoice['due_date'], str):
        invoice['due_date'] = datetime.fromisoformat(invoice['due_date'])
    if invoice.get('paid_at') and isinstance(invoice['paid_at'], str):
        invoice['paid_at'] = datetime.fromisoformat(invoice['paid_at'])
    
    # Populate client and project names
    if invoice.get('client_id'):
        client = await db.clients.find_one({"id": invoice['client_id']}, {"_id": 0, "name": 1})
        if client:
            invoice['client_name'] = client['name']
    
    if invoice.get('project_id'):
        project = await db.projects.find_one({"id": invoice['project_id']}, {"_id": 0, "title": 1})
        if project:
            invoice['project_title'] = project['title']
    
    return Invoice(**invoice)

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, current_user: User = Depends(get_current_user)):
    # Generate invoice number
    last_invoice = await db.invoices.find_one({}, {"_id": 0, "number": 1}, sort=[("created_at", -1)])
    if last_invoice and last_invoice.get('number'):
        try:
            last_num = int(last_invoice['number'].split('-')[1])
            invoice_number = f"INV-{last_num + 1}"
        except:
            invoice_number = f"INV-{1001}"
    else:
        invoice_number = "INV-1001"
    
    # Calculate line items totals
    line_items_with_totals = []
    subtotal = 0.0
    for item_data in invoice_data.line_items:
        item_total = item_data.unit_price * item_data.quantity
        line_item = InvoiceLineItem(
            **item_data.model_dump(),
            total=item_total
        )
        line_items_with_totals.append(line_item)
        subtotal += item_total
    
    # Calculate TVA and total
    tva_amount = subtotal * (invoice_data.tva_rate / 100)
    total = subtotal + tva_amount
    
    invoice = Invoice(
        **invoice_data.model_dump(exclude={'line_items'}),
        number=invoice_number,
        line_items=line_items_with_totals,
        subtotal=subtotal,
        tva_amount=tva_amount,
        total=total
    )
    
    invoice_dict = invoice.model_dump()
    invoice_dict['created_at'] = invoice_dict['created_at'].isoformat()
    invoice_dict['updated_at'] = invoice_dict['updated_at'].isoformat()
    invoice_dict['issued_date'] = invoice_dict['issued_date'].isoformat()
    invoice_dict['due_date'] = invoice_dict['due_date'].isoformat()
    if invoice_dict['paid_at']:
        invoice_dict['paid_at'] = invoice_dict['paid_at'].isoformat()
    await db.invoices.insert_one(invoice_dict)
    
    # Log activity
    activity = Activity(
        type="invoice_created",
        entity_type="invoice",
        entity_id=invoice.id,
        message=f"Invoice {invoice.number} created (Total: €{total:.2f})",
        actor=current_user.name
    )
    activity_dict = activity.model_dump()
    activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
    await db.activity.insert_one(activity_dict)
    
    # Populate client and project names
    client = await db.clients.find_one({"id": invoice.client_id}, {"_id": 0, "name": 1})
    if client:
        invoice.client_name = client['name']
    
    if invoice.project_id:
        project = await db.projects.find_one({"id": invoice.project_id}, {"_id": 0, "title": 1})
        if project:
            invoice.project_title = project['title']
    
    return invoice

@api_router.patch("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, update_data: InvoiceUpdate, current_user: User = Depends(get_current_user)):
    existing = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_dict = {}
    
    # Handle line items update if provided
    if update_data.line_items is not None:
        line_items_with_totals = []
        subtotal = 0.0
        for item_data in update_data.line_items:
            item_total = item_data.unit_price * item_data.quantity
            line_item = InvoiceLineItem(
                **item_data.model_dump(),
                total=item_total
            )
            line_items_with_totals.append(line_item.model_dump())
            subtotal += item_total
        
        # Use updated or existing TVA rate
        tva_rate = update_data.tva_rate if update_data.tva_rate is not None else existing.get('tva_rate', 0.0)
        tva_amount = subtotal * (tva_rate / 100)
        total = subtotal + tva_amount
        
        update_dict['line_items'] = line_items_with_totals
        update_dict['subtotal'] = subtotal
        update_dict['tva_rate'] = tva_rate
        update_dict['tva_amount'] = tva_amount
        update_dict['total'] = total
    elif update_data.tva_rate is not None:
        # Only TVA rate changed, recalculate
        subtotal = existing.get('subtotal', 0.0)
        tva_amount = subtotal * (update_data.tva_rate / 100)
        total = subtotal + tva_amount
        
        update_dict['tva_rate'] = update_data.tva_rate
        update_dict['tva_amount'] = tva_amount
        update_dict['total'] = total
    
    # Add other updates
    if update_data.status is not None:
        update_dict['status'] = update_data.status
    if update_data.paid_at is not None:
        update_dict['paid_at'] = update_data.paid_at.isoformat()
    if update_data.stripe_payment_intent_id is not None:
        update_dict['stripe_payment_intent_id'] = update_data.stripe_payment_intent_id
    
    if update_dict:
        update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.invoices.update_one({"id": invoice_id}, {"$set": update_dict})
    
    updated_invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if isinstance(updated_invoice['created_at'], str):
        updated_invoice['created_at'] = datetime.fromisoformat(updated_invoice['created_at'])
    if isinstance(updated_invoice['updated_at'], str):
        updated_invoice['updated_at'] = datetime.fromisoformat(updated_invoice['updated_at'])
    if isinstance(updated_invoice['issued_date'], str):
        updated_invoice['issued_date'] = datetime.fromisoformat(updated_invoice['issued_date'])
    if isinstance(updated_invoice['due_date'], str):
        updated_invoice['due_date'] = datetime.fromisoformat(updated_invoice['due_date'])
    if updated_invoice.get('paid_at') and isinstance(updated_invoice['paid_at'], str):
        updated_invoice['paid_at'] = datetime.fromisoformat(updated_invoice['paid_at'])
    
    # Populate client and project names
    if updated_invoice.get('client_id'):
        client = await db.clients.find_one({"id": updated_invoice['client_id']}, {"_id": 0, "name": 1})
        if client:
            updated_invoice['client_name'] = client['name']
    
    if updated_invoice.get('project_id'):
        project = await db.projects.find_one({"id": updated_invoice['project_id']}, {"_id": 0, "title": 1})
        if project:
            updated_invoice['project_title'] = project['title']
    
    return Invoice(**updated_invoice)

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, current_user: User = Depends(get_current_user)):
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted successfully"}


# ==================== INVOICE PAYMENT LINK ====================

class PaymentLinkResponse(BaseModel):
    payment_link: str
    checkout_session_id: str

@api_router.post("/invoices/{invoice_id}/payment-link", response_model=PaymentLinkResponse)
async def create_payment_link(invoice_id: str, current_user: User = Depends(get_current_user)):
    """Generate a Stripe Checkout Session for invoice payment"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice['status'] == 'paid':
        raise HTTPException(status_code=400, detail="Invoice is already paid")
    
    # Check if invoice has line items
    if not invoice.get('line_items') or len(invoice['line_items']) == 0:
        raise HTTPException(status_code=400, detail="Invoice must have at least one line item to generate payment link")
    
    # Get client for email
    client = await db.clients.find_one({"id": invoice['client_id']}, {"_id": 0})
    
    # Get frontend URL from env or use default
    frontend_url = os.environ.get('FRONTEND_URL', 'https://nqcrm-app.preview.emergentagent.com')
    
    # Create line items for Stripe
    stripe_line_items = []
    for item in invoice.get('line_items', []):
        stripe_line_items.append({
            'price_data': {
                'currency': 'eur',
                'product_data': {
                    'name': item['description'],
                },
                'unit_amount': int(item['unit_price'] * 100),  # Convert to cents
            },
            'quantity': int(item['quantity']),
        })
    
    # Add TVA as a separate line item if applicable
    if invoice.get('tva_amount', 0) > 0:
        stripe_line_items.append({
            'price_data': {
                'currency': 'eur',
                'product_data': {
                    'name': f"TVA ({invoice['tva_rate']}%)",
                },
                'unit_amount': int(invoice['tva_amount'] * 100),
            },
            'quantity': 1,
        })
    
    try:
        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=stripe_line_items,
            mode='payment',
            success_url=f"{frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&invoice_id={invoice_id}",
            cancel_url=f"{frontend_url}/payment/cancel?invoice_id={invoice_id}",
            client_reference_id=invoice_id,
            customer_email=client['email'] if client else None,
            metadata={
                'invoice_id': invoice_id,
                'invoice_number': invoice['number']
            }
        )
        
        # Update invoice with payment link and session ID
        await db.invoices.update_one(
            {"id": invoice_id},
            {
                "$set": {
                    "payment_link": session.url,
                    "stripe_checkout_session_id": session.id,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return PaymentLinkResponse(
            payment_link=session.url,
            checkout_session_id=session.id
        )
    
    except Exception as e:
        logger.error(f"Failed to create Stripe Checkout Session: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to create payment link: {str(e)}")

@api_router.get("/invoices/{invoice_id}/public", response_model=Invoice)
async def get_public_invoice(invoice_id: str):
    """Get invoice details for public payment page (no auth required)"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Convert datetime strings
    for field in ['created_at', 'updated_at', 'issued_date', 'due_date']:
        if isinstance(invoice.get(field), str):
            invoice[field] = datetime.fromisoformat(invoice[field])
    if invoice.get('paid_at') and isinstance(invoice['paid_at'], str):
        invoice['paid_at'] = datetime.fromisoformat(invoice['paid_at'])
    
    # Populate client and project names
    client = await db.clients.find_one({"id": invoice['client_id']}, {"_id": 0, "name": 1})
    if client:
        invoice['client_name'] = client['name']
    
    if invoice.get('project_id'):
        project = await db.projects.find_one({"id": invoice['project_id']}, {"_id": 0, "title": 1})
        if project:
            invoice['project_title'] = project['title']
    
    return Invoice(**invoice)

@api_router.post("/invoices/{invoice_id}/verify-payment")
async def verify_payment(invoice_id: str, session_id: str = None):
    """Verify payment status from Stripe and update invoice (no auth required for client convenience)"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # If already paid, return current status
    if invoice['status'] == 'paid':
        return {"status": "paid", "message": "Invoice already paid"}
    
    # Check with Stripe if we have a session ID
    if session_id:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            
            # If payment was successful, update invoice
            if session.payment_status == 'paid':
                now = datetime.now(timezone.utc)
                await db.invoices.update_one(
                    {"id": invoice_id},
                    {
                        "$set": {
                            "status": "paid",
                            "paid_at": now.isoformat(),
                            "stripe_payment_intent_id": session.payment_intent,
                            "updated_at": now.isoformat()
                        }
                    }
                )
                
                # Create payment record
                payment = Payment(
                    invoice_id=invoice_id,
                    client_id=invoice['client_id'],
                    amount=session.amount_total / 100,
                    currency=session.currency,
                    status="succeeded",
                    stripe_payment_intent_id=session.payment_intent
                )
                payment_dict = payment.model_dump()
                payment_dict['created_at'] = payment_dict['created_at'].isoformat()
                await db.payments.insert_one(payment_dict)
                
                # Log activity
                client = await db.clients.find_one({"id": invoice['client_id']}, {"_id": 0, "name": 1})
                activity = Activity(
                    type="invoice_paid",
                    entity_type="invoice",
                    entity_id=invoice_id,
                    message=f"Invoice {invoice['number']} paid via Stripe Checkout - €{session.amount_total / 100:.2f}",
                    actor=client['name'] if client else "Client"
                )
                activity_dict = activity.model_dump()
                activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
                await db.activity.insert_one(activity_dict)
                
                return {"status": "paid", "message": "Payment verified and invoice updated"}
        except Exception as e:
            logger.error(f"Stripe API error: {e}")
            raise HTTPException(status_code=400, detail="Failed to verify payment with Stripe")
    
    return {"status": invoice['status'], "message": "No payment verification available"}


# ==================== PDF INVOICE GENERATION ====================

@api_router.get("/invoices/{invoice_id}/pdf")
async def generate_invoice_pdf(invoice_id: str, current_user: User = Depends(get_current_user)):
    """Generate a professional PDF invoice with line items and TVA"""
    # Get invoice
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get client
    client = await db.clients.find_one({"id": invoice['client_id']}, {"_id": 0})
    
    # Get project if available
    project = None
    if invoice.get('project_id'):
        project = await db.projects.find_one({"id": invoice['project_id']}, {"_id": 0})
    
    # Create PDF buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=30)
    
    # Container for elements
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles with modern typography
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=32,
        textColor=colors.HexColor('#00C676'),
        spaceAfter=20,
        fontName='Helvetica-Bold',
        letterHeight=1.2
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=colors.HexColor('#6B7280'),
        spaceAfter=6,
        fontName='Helvetica-Bold',
        letterSpacing=0.5
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#374151'),
        leading=14
    )
    
    # Add logo (use local dark version)
    try:
        logo_path = ROOT_DIR / 'logo-dark.png'
        if logo_path.exists():
            logo = Image(str(logo_path), width=2.2*inch, height=0.55*inch)
            elements.append(logo)
            elements.append(Spacer(1, 30))
    except Exception as e:
        print(f"Logo error: {e}")
        pass
    
    # Invoice title and number
    elements.append(Paragraph(f"INVOICE", title_style))
    elements.append(Paragraph(f"<font size=14 color='#6B7280'>{invoice['number']}</font>", normal_style))
    elements.append(Spacer(1, 25))
    
    # Two-column layout for invoice info and bill to
    info_data = [
        [
            Paragraph("<b>INVOICE DATE</b><br/><font color='#6B7280'>" + datetime.fromisoformat(invoice['issued_date']).strftime('%B %d, %Y') + "</font>", normal_style),
            Paragraph("<b>BILL TO</b><br/><font color='#111827'><b>" + (client['name'] if client else 'N/A') + "</b></font><br/><font color='#6B7280'>" + (client.get('company', '') if client else '') + "</font>", normal_style)
        ],
        [
            Paragraph("<b>DUE DATE</b><br/><font color='#6B7280'>" + datetime.fromisoformat(invoice['due_date']).strftime('%B %d, %Y') + "</font>", normal_style),
            Paragraph("<font color='#6B7280'>" + (client['email'] if client else '') + "<br/>" + (client.get('phone', '') if client else '') + "</font>", normal_style)
        ]
    ]
    
    info_table = Table(info_data, colWidths=[2.5*inch, 3.5*inch])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 25))
    
    # Project info if available
    if project:
        elements.append(Paragraph(f"<b>PROJECT:</b> <font color='#6B7280'>{project['title']}</font>", normal_style))
        elements.append(Spacer(1, 20))
    
    # Line items table
    items_data = [
        [
            Paragraph("<b>DESCRIPTION</b>", normal_style),
            Paragraph("<b>PRICE</b>", normal_style),
            Paragraph("<b>QTY</b>", normal_style),
            Paragraph("<b>TOTAL</b>", normal_style)
        ]
    ]
    
    # Add line items
    for item in invoice.get('line_items', []):
        items_data.append([
            Paragraph(f"<font color='#111827'>{item['description']}</font>", normal_style),
            Paragraph(f"<font color='#6B7280'>€{item['unit_price']:.2f}</font>", normal_style),
            Paragraph(f"<font color='#6B7280'>{item['quantity']}</font>", normal_style),
            Paragraph(f"<font color='#111827'><b>€{item['total']:.2f}</b></font>", normal_style)
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1.2*inch, 0.8*inch, 1.2*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F9FAFB')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#111827')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.HexColor('#E5E7EB')),
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.HexColor('#E5E7EB')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 20))
    
    # Totals section
    totals_data = []
    
    # Subtotal
    totals_data.append([
        Paragraph("<font color='#6B7280'>Subtotal</font>", normal_style),
        Paragraph(f"<font color='#111827'>€{invoice.get('subtotal', 0):.2f}</font>", normal_style)
    ])
    
    # TVA if applicable
    if invoice.get('tva_rate', 0) > 0:
        totals_data.append([
            Paragraph(f"<font color='#6B7280'>TVA ({invoice['tva_rate']}%)</font>", normal_style),
            Paragraph(f"<font color='#111827'>€{invoice.get('tva_amount', 0):.2f}</font>", normal_style)
        ])
    
    # Total
    totals_data.append([
        Paragraph("<b>TOTAL DUE</b>", title_style),
        Paragraph(f"<b><font size=18 color='#00C676'>€{invoice.get('total', 0):.2f}</font></b>", title_style)
    ])
    
    totals_table = Table(totals_data, colWidths=[4.8*inch, 1.4*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -2), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -2), 6),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#E5E7EB')),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 40))
    
    # Payment info / footer
    footer_text = """
    <font color='#6B7280' size=9>
    <b>Payment Terms:</b> Payment is due within 30 days of invoice date.<br/>
    <b>Thank you for your business!</b>
    </font>
    """
    elements.append(Paragraph(footer_text, normal_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{invoice['number']}.pdf"}
    )


# ==================== PAYMENTS ROUTES ====================

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(current_user: User = Depends(get_current_user)):
    payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    for payment in payments:
        if isinstance(payment['created_at'], str):
            payment['created_at'] = datetime.fromisoformat(payment['created_at'])
        
        # Populate client name
        if payment.get('client_id'):
            client = await db.clients.find_one({"id": payment['client_id']}, {"_id": 0, "name": 1})
            if client:
                payment['client_name'] = client['name']
    
    return payments

@api_router.post("/payments/intent", response_model=PaymentIntentResponse)
async def create_payment_intent(request: PaymentIntentRequest, current_user: User = Depends(get_current_user)):
    # Get invoice
    invoice = await db.invoices.find_one({"id": request.invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice['status'] == 'paid':
        raise HTTPException(status_code=400, detail="Invoice already paid")
    
    # Create Stripe payment intent
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(invoice['amount'] * 100),  # Stripe uses cents
            currency=invoice['currency'],
            metadata={
                "invoice_id": invoice['id'],
                "invoice_number": invoice['number']
            }
        )
        
        # Update invoice with payment intent ID
        await db.invoices.update_one(
            {"id": request.invoice_id},
            {"$set": {"stripe_payment_intent_id": intent.id}}
        )
        
        return PaymentIntentResponse(
            client_secret=intent.client_secret,
            payment_intent_id=intent.id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment intent: {str(e)}")

@api_router.get("/payments/transactions")
async def get_stripe_transactions(current_user: User = Depends(get_current_user), limit: int = 50):
    """Get recent Stripe payment intents"""
    try:
        payment_intents = stripe.PaymentIntent.list(limit=limit)
        
        transactions = []
        for intent in payment_intents.data:
            # Try to find matching invoice
            invoice_id = intent.metadata.get('invoice_id') if intent.metadata else None
            invoice_number = intent.metadata.get('invoice_number') if intent.metadata else None
            
            transactions.append({
                "id": intent.id,
                "amount": intent.amount / 100,  # Convert from cents
                "currency": intent.currency,
                "status": intent.status,
                "created": datetime.fromtimestamp(intent.created, tz=timezone.utc),
                "invoice_id": invoice_id,
                "invoice_number": invoice_number,
            })
        
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {str(e)}")


# ==================== STRIPE WEBHOOK ====================

@api_router.post("/stripe/webhook")
async def stripe_webhook(request: dict):
    """Handle Stripe webhook events"""
    from fastapi import Request
    
    # Get webhook secret from environment
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
    
    # For testing without webhook secret (development mode)
    if not webhook_secret:
        logger.warning("STRIPE_WEBHOOK_SECRET not set - skipping signature verification")
        event = request
    else:
        # Verify webhook signature
        try:
            raw_body = await request.body()
            sig_header = request.headers.get('stripe-signature')
            
            event = stripe.Webhook.construct_event(
                raw_body, sig_header, webhook_secret
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle payment_intent.succeeded event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # Get invoice from metadata
        invoice_id = payment_intent.get('metadata', {}).get('invoice_id')
        
        if invoice_id:
            # Update invoice status
            now = datetime.now(timezone.utc)
            await db.invoices.update_one(
                {"id": invoice_id},
                {
                    "$set": {
                        "status": "paid",
                        "paid_at": now.isoformat(),
                        "updated_at": now.isoformat()
                    }
                }
            )
            
            # Get invoice details
            invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
            
            if invoice:
                # Create payment record
                payment = Payment(
                    invoice_id=invoice_id,
                    client_id=invoice['client_id'],
                    amount=payment_intent['amount'] / 100,
                    currency=payment_intent['currency'],
                    status="succeeded",
                    stripe_payment_intent_id=payment_intent['id']
                )
                payment_dict = payment.model_dump()
                payment_dict['created_at'] = payment_dict['created_at'].isoformat()
                await db.payments.insert_one(payment_dict)
                
                # Get client name
                client = await db.clients.find_one({"id": invoice['client_id']}, {"_id": 0, "name": 1})
                client_name = client['name'] if client else 'Unknown Client'
                
                # Log activity
                activity = Activity(
                    type="invoice_paid",
                    entity_type="invoice",
                    entity_id=invoice_id,
                    message=f"Invoice {invoice['number']} paid by {client_name} - ${payment_intent['amount'] / 100:,.2f}",
                    actor="Stripe Webhook"
                )
                activity_dict = activity.model_dump()
                activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
                await db.activity.insert_one(activity_dict)
                
                # Broadcast WebSocket update
                await broadcast_update("invoice_paid", {
                    "invoice_id": invoice_id,
                    "invoice_number": invoice['number'],
                    "amount": payment_intent['amount'] / 100,
                    "client_name": client_name
                })
                
                logger.info(f"Payment processed for invoice {invoice['number']}")
    
    # Handle checkout.session.completed event
    elif event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        invoice_id = session.get('client_reference_id') or session.get('metadata', {}).get('invoice_id')
        
        if invoice_id:
            # Update invoice status
            now = datetime.now(timezone.utc)
            await db.invoices.update_one(
                {"id": invoice_id},
                {
                    "$set": {
                        "status": "paid",
                        "paid_at": now.isoformat(),
                        "stripe_payment_intent_id": session.get('payment_intent'),
                        "updated_at": now.isoformat()
                    }
                }
            )
            
            # Get invoice details
            invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
            
            if invoice:
                # Create payment record
                payment = Payment(
                    invoice_id=invoice_id,
                    client_id=invoice['client_id'],
                    amount=session['amount_total'] / 100,
                    currency=session['currency'],
                    status="succeeded",
                    stripe_payment_intent_id=session.get('payment_intent'),
                    stripe_charge_id=session.get('payment_intent')
                )
                payment_dict = payment.model_dump()
                payment_dict['created_at'] = payment_dict['created_at'].isoformat()
                await db.payments.insert_one(payment_dict)
                
                # Get client name
                client = await db.clients.find_one({"id": invoice['client_id']}, {"_id": 0, "name": 1})
                client_name = client['name'] if client else 'Unknown Client'
                
                # Log activity
                activity = Activity(
                    type="invoice_paid",
                    entity_type="invoice",
                    entity_id=invoice_id,
                    message=f"Invoice {invoice['number']} paid by {client_name} via Stripe Checkout - €{session['amount_total'] / 100:,.2f}",
                    actor="Stripe Checkout"
                )
                activity_dict = activity.model_dump()
                activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
                await db.activity.insert_one(activity_dict)
                
                logger.info(f"Checkout session completed for invoice {invoice['number']}")
    
    return {"status": "success"}


# ==================== METRICS ROUTES ====================

@api_router.get("/metrics", response_model=Metrics)
async def get_metrics(current_user: User = Depends(get_current_user)):
    # Total revenue (sum of paid invoices) - handle both old (amount) and new (total) field names
    paid_invoices = await db.invoices.find({"status": "paid"}, {"_id": 0, "amount": 1, "total": 1}).to_list(1000)
    total_revenue = sum(inv.get('total', inv.get('amount', 0)) for inv in paid_invoices)
    
    # Active projects
    active_projects = await db.projects.count_documents({"status": "active"})
    
    # Total clients
    total_clients = await db.clients.count_documents({})
    
    # MRR (simplified: total revenue / 12)
    mrr = total_revenue / 12 if total_revenue > 0 else 0
    
    return Metrics(
        total_revenue=total_revenue,
        active_projects=active_projects,
        total_clients=total_clients,
        mrr=mrr
    )


# ==================== ACTIVITY ROUTES ====================

@api_router.get("/activity", response_model=List[Activity])
async def get_activity(current_user: User = Depends(get_current_user), limit: int = 20):
    activities = await db.activity.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    for activity in activities:
        if isinstance(activity['timestamp'], str):
            activity['timestamp'] = datetime.fromisoformat(activity['timestamp'])
    return activities


# ==================== CHART DATA ROUTES ====================

@api_router.get("/charts/revenue")
async def get_revenue_chart_data(current_user: User = Depends(get_current_user)):
    """Get monthly revenue data for bar chart"""
    # Simplified: return last 6 months with mock data
    # In production, aggregate from database
    now = datetime.now(timezone.utc)
    months = []
    for i in range(5, -1, -1):
        month_date = now - timedelta(days=30 * i)
        month_name = month_date.strftime("%b")
        
        # Get revenue for this month (simplified query)
        start_date = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            end_date = now
        else:
            end_date = start_date + timedelta(days=32)
            end_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        invoices = await db.invoices.find({
            "status": "paid",
            "paid_at": {
                "$gte": start_date.isoformat(),
                "$lt": end_date.isoformat()
            }
        }, {"_id": 0, "amount": 1}).to_list(1000)
        
        revenue = sum(inv['amount'] for inv in invoices) if invoices else 0
        
        months.append({
            "month": month_name,
            "revenue": revenue
        })
    
    return months

@api_router.get("/charts/payments")
async def get_payments_chart_data(current_user: User = Depends(get_current_user)):
    """Get monthly payment data for line chart"""
    # Similar to revenue chart
    now = datetime.now(timezone.utc)
    months = []
    for i in range(5, -1, -1):
        month_date = now - timedelta(days=30 * i)
        month_name = month_date.strftime("%b")
        
        start_date = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            end_date = now
        else:
            end_date = start_date + timedelta(days=32)
            end_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        payments = await db.payments.find({
            "status": "succeeded",
            "created_at": {
                "$gte": start_date.isoformat(),
                "$lt": end_date.isoformat()
            }
        }, {"_id": 0, "amount": 1}).to_list(1000)
        
        amount = sum(p['amount'] for p in payments) if payments else 0
        
        months.append({
            "month": month_name,
            "amount": amount
        })
    
    return months


# ==================== WEBSOCKET FOR REAL-TIME UPDATES ====================

from fastapi import WebSocket, WebSocketDisconnect
from typing import Set
import json

# Store active WebSocket connections
active_connections: Set[WebSocket] = set()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    active_connections.add(websocket)
    
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            
            # Echo back for heartbeat
            await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("WebSocket client disconnected")

async def broadcast_update(update_type: str, data: dict):
    """Broadcast updates to all connected WebSocket clients"""
    if not active_connections:
        return
    
    message = json.dumps({
        "type": update_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Send to all connected clients
    disconnected = set()
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except:
            disconnected.add(connection)
    
    # Remove disconnected clients
    for conn in disconnected:
        active_connections.discard(conn)


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
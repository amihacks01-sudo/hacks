import uvicorn
from fastapi import FastAPI, HTTPException, Header, Response, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

app = FastAPI(
    title="Sentinel X Sandbox Target API",
    description="Authorized local sandbox target API harboring controlled BOLA and Data Exposure vulnerabilities for hackathon demonstration.",
    version="1.0.0"
)

# ==========================================
# DEMO DATASTORE
# ==========================================
USERS_DB: Dict[str, Dict[str, Any]] = {
    "1": {
        "id": "1",
        "name": "Alice Smith",
        "email": "alice@sentinelx.local",
        "phone": "+1-555-0199",
        "password_hash": "$2b$12$eImiTXuWVxfM37uY4JANjO5E/MockHashForAlice123",
        "internal_notes": "VIP Client. High net worth account. Credit limit extended.",
        "role": "customer"
    },
    "2": {
        "id": "2",
        "name": "Bob Jones",
        "email": "bob@sentinelx.local",
        "phone": "+1-555-0288",
        "password_hash": "$2b$12$eImiTXuWVxfM37uY4JANjO5E/MockHashForBob123",
        "internal_notes": "Standard customer. Pending identity verification.",
        "role": "customer"
    }
}

# User tokens mapping
TOKENS = {
    "bearer_token_alice_1": "1",
    "bearer_token_bob_2": "2"
}

ORDERS_DB: Dict[str, Dict[str, Any]] = {
    "101": {"order_id": "101", "owner_id": "1", "item": "Quantum Crypto Hardware Wallet", "amount": 499.99, "status": "shipped"},
    "102": {"order_id": "102", "owner_id": "1", "item": "High-Performance Workstation", "amount": 2999.00, "status": "processing"},
    "201": {"order_id": "201", "owner_id": "2", "item": "Developer Laptop Stand", "amount": 49.99, "status": "delivered"},
    "202": {"order_id": "202", "owner_id": "2", "item": "Noise Cancelling Headphones", "amount": 299.99, "status": "shipped"}
}

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class LoginRequest(BaseModel):
    username: str
    password: str

class OrderCreateRequest(BaseModel):
    item: str
    amount: float

# ==========================================
# AUTH HELPER
# ==========================================
def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Helper to extract user identity from Authorization header token."""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization token header")
    
    token = authorization.replace("Bearer ", "").strip()
    if token not in TOKENS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization token")
    
    return TOKENS[token]

# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Sentinel X Vulnerable Sandbox Target API",
        "port": 9000
    }

@app.post("/login")
def login(credentials: LoginRequest):
    """
    Login endpoint supporting Demo Users:
    - User A: alice / alice123 (user_id: 1)
    - User B: bob / bob123 (user_id: 2)
    """
    if credentials.username == "alice" and credentials.password == "alice123":
        return {
            "access_token": "bearer_token_alice_1",
            "token_type": "bearer",
            "user_id": "1",
            "username": "alice"
        }
    elif credentials.username == "bob" and credentials.password == "bob123":
        return {
            "access_token": "bearer_token_bob_2",
            "token_type": "bearer",
            "user_id": "2",
            "username": "bob"
        }
    
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

# --------------------------------------------------------------------------
# INTENTIONAL EXCESSIVE DATA EXPOSURE VULNERABILITY
# --------------------------------------------------------------------------
@app.get("/users/{user_id}")
def get_user_profile(user_id: str):
    """
    VULNERABILITY NOTICE: INTENTIONAL EXCESSIVE DATA EXPOSURE
    This endpoint returns unmasked internal fields including:
    - password_hash
    - internal_notes
    - phone, email, role
    Instead of serializing a clean public DTO, the entire raw database object is leaked.
    """
    if user_id in USERS_DB:
        return USERS_DB[user_id]
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

# --------------------------------------------------------------------------
# INTENTIONAL BOLA / IDOR VULNERABILITY
# --------------------------------------------------------------------------
@app.get("/orders/{order_id}")
def get_order_by_id(order_id: str, authorization: Optional[str] = Header(None)):
    """
    VULNERABILITY NOTICE: INTENTIONAL BROKEN OBJECT LEVEL AUTHORIZATION (BOLA / IDOR)
    The endpoint authenticates the caller token via get_current_user_id(authorization),
    BUT intentionally DOES NOT verify if caller user_id matches order['owner_id']!
    
    Therefore:
    - Alice (User 1) requesting Order 101 -> 200 OK
    - Bob (User 2) requesting Order 101 -> 200 OK (UNAUTHORIZED CROSS-TENANT ACCESS!)
    """
    caller_user_id = get_current_user_id(authorization)

    if order_id not in ORDERS_DB:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # INTENTIONAL BOLA BUG:
    # No check: if ORDERS_DB[order_id]["owner_id"] != caller_user_id: raise 403 Forbidden
    return ORDERS_DB[order_id]

@app.post("/orders", status_code=status.HTTP_201_CREATED)
def create_order(order_data: OrderCreateRequest, authorization: Optional[str] = Header(None)):
    caller_user_id = get_current_user_id(authorization)
    new_order_id = str(len(ORDERS_DB) + 101)
    
    new_order = {
        "order_id": new_order_id,
        "owner_id": caller_user_id,
        "item": order_data.item,
        "amount": order_data.amount,
        "status": "pending"
    }
    ORDERS_DB[new_order_id] = new_order
    return new_order

@app.get("/admin/users")
def list_all_users():
    return list(USERS_DB.values())

if __name__ == "__main__":
    import os
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 9000)))

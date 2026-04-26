from fastapi import APIRouter, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import HoneypotLog
import logging

router = APIRouter()

# This is a honeypot - fake search endpoint to catch malicious users
@router.get("/search")
async def fake_search(request: Request, q: str = "", db: Session = Depends(get_db)):
    # Log the suspicious activity
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    query = q
    
    # Log to database
    log_entry = HoneypotLog(
        ip_address=client_ip,
        user_agent=user_agent,
        query=query,
        endpoint="/search"
    )
    db.add(log_entry)
    db.commit()
    
    # Log to application logger
    logging.warning(f"Honeypot triggered: IP {client_ip}, Query: {query}")
    
    # Return fake results to keep them engaged
    return {
        "results": [
            {"title": "Asset Management System", "url": "/assets"},
            {"title": "User Dashboard", "url": "/dashboard"},
            {"title": "Reports", "url": "/reports"}
        ],
        "total": 3
    }

@router.post("/search")
async def fake_search_post(request: Request, db: Session = Depends(get_db)):
    # Similar logging for POST requests
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    body = await request.body()
    query = body.decode() if body else ""
    
    log_entry = HoneypotLog(
        ip_address=client_ip,
        user_agent=user_agent,
        query=query,
        endpoint="/search"
    )
    db.add(log_entry)
    db.commit()
    
    logging.warning(f"Honeypot POST triggered: IP {client_ip}, Body: {query}")
    
    return {"message": "Search processed"}

# Additional fake endpoints that might be commonly probed
@router.get("/admin")
async def fake_admin(request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host
    log_entry = HoneypotLog(
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", ""),
        query="",
        endpoint="/admin"
    )
    db.add(log_entry)
    db.commit()
    
    logging.warning(f"Honeypot /admin accessed: IP {client_ip}")
    
    return {"error": "Access denied"}

@router.get("/phpmyadmin")
async def fake_phpmyadmin(request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host
    log_entry = HoneypotLog(
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", ""),
        query="",
        endpoint="/phpmyadmin"
    )
    db.add(log_entry)
    db.commit()
    
    logging.warning(f"Honeypot /phpmyadmin accessed: IP {client_ip}")
    
    return {"error": "Not found"}
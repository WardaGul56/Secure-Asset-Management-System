from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routes import auth, users, zones, assets, operators, assignment, location, honeypot, breaches

app = FastAPI(title="Secure Asset Management System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router,         prefix="/auth",         tags=["Authentication"])
app.include_router(users.router,        prefix="/users",        tags=["User Management"])
app.include_router(zones.router,        prefix="/zones",        tags=["Zones"])
app.include_router(assets.router,       prefix="/assets",       tags=["Assets"])
app.include_router(operators.router,    prefix="/operators",    tags=["Operators"])
app.include_router(assignment.router,   prefix="/assignment",   tags=["Assignment"])
app.include_router(location.router,     prefix="/location",     tags=["Location Logs"])
app.include_router(honeypot.router,     prefix="/search",       tags=["Honeypot"])
app.include_router(breaches.router,     prefix="/breaches",     tags=["Breach Logs"])

@app.get("/")
async def root():
    return {"message": "GeoGuard API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
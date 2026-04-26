from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, users, zones, assets, operators, assignment, location, honeypot, breaches

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Secure Asset Management System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["User Management"])
app.include_router(zones.router, prefix="/zones", tags=["Zone Management"])
app.include_router(assets.router, prefix="/assets", tags=["Asset Management"])
app.include_router(operators.router, prefix="/operators", tags=["Operator Management"])
app.include_router(assignment.router, prefix="/assignments", tags=["Assignment Management"])
app.include_router(location.router, prefix="/location", tags=["Location Logging"])
app.include_router(honeypot.router, prefix="/honeypot", tags=["Honeypot"])
app.include_router(breaches.router, prefix="/breaches", tags=["Breach Management"])

@app.get("/")
async def root():
    return {"message": "Secure Asset Management System API"}

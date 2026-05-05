from fastapi import FastAPI       ##to import FastAPI class from the fastapi library.
from fastapi.middleware.cors import CORSMiddleware  #CORS allows frontend n backend interaction
from fastapi.security import HTTPBearer    #for jwt token
from dotenv import load_dotenv          #to load environment variables from .env
import os

load_dotenv("../.env")

from routes import auth, users, zones, assets, operators, assignment, location, honeypot, breaches

security = HTTPBearer()

#creates fastapi application object
app = FastAPI(
    title="Secure Asset Management System",
    swagger_ui_parameters={"persistAuthorization": True},
    # THIS is what makes the Authorize button appear
    components={
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            }
        }
    },
    security=[{"BearerAuth": []}]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#for allowing paths
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
    uvicorn.run("main:app",reload=True)   #uvicorn to run fastapi apps
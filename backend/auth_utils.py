#this file will handle password hashing,jwt tokens,token verification and role based access control
from jose import JWTError, jwt
from passlib.context import CryptContext     ##to secure hashpasswords
from fastapi import HTTPException, Header
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET") ##key that is being used to assign tokens
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES"))

# bcrypt context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#password hashing
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

#verify password
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict) -> str:
    to_encode = data.copy()    ##Prevents modifying original data
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    
def require_role(allowed_roles: list):
    def checker(authorization: str = Header(...)):
        # frontend sends: "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="missing token")
        token = authorization.split(" ")[1]
        payload = decode_token(token)
        if payload.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="access denied")
        return payload  # returns full user info to the route
    return checker


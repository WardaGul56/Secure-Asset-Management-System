from sqlalchemy import Column, Integer, String, Boolean, Date, TIMESTAMP, Text, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from .database import Base

# Enums
role_type = Enum('admin', 'manager', 'operator', name='role_type')
department_type = Enum('logistics', 'security_patrol', name='department_type')
scheduled_status_type = Enum('scheduled', 'in_progress', 'done', name='scheduled_status_type')
assignment_status_type = Enum('active', 'completed', name='assignment_status_type')

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    joining_date = Column(Date, nullable=False, default=func.current_date())
    role = Column(role_type, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

class SecurityAdmin(Base):
    __tablename__ = "security_admin"
    
    admin_id = Column(String(20), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    username = Column(String(25), nullable=False, unique=True)
    
    user = relationship("User")

class FleetManager(Base):
    __tablename__ = "fleet_manager"
    
    manager_id = Column(String(20), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    username = Column(String(25), nullable=False, unique=True)
    department = Column(department_type, nullable=False)
    
    user = relationship("User")

class Operator(Base):
    __tablename__ = "operators"
    
    op_id = Column(String(20), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    username = Column(String(25), nullable=False, unique=True)
    manager_id = Column(String(20), ForeignKey("fleet_manager.manager_id"), nullable=False)
    active_status = Column(Boolean, nullable=False, default=False)
    
    user = relationship("User")
    manager = relationship("FleetManager")

class Password(Base):
    __tablename__ = "passwords"
    
    username = Column(String(25), primary_key=True)
    pass_hash = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    
    user = relationship("User")

class Zone(Base):
    __tablename__ = "zones"
    
    zone_id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String(100), nullable=False)
    boundary = Column(Geometry('POLYGON', srid=4326), nullable=False)
    is_forbidden = Column(Boolean, nullable=False, default=False)
    created_by = Column(String(20), ForeignKey("security_admin.admin_id"), nullable=False)
    
    creator = relationship("SecurityAdmin")

class Asset(Base):
    __tablename__ = "asset"
    
    asset_id = Column(Integer, primary_key=True, index=True)
    asset_name = Column(String(50), nullable=False)
    plate_number = Column(String(20), nullable=False, unique=True)
    scheduled_status = Column(scheduled_status_type, nullable=False, default='scheduled')

class LocationLog(Base):
    __tablename__ = "location_logs"
    
    log_id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("asset.asset_id"), nullable=False)
    op_id = Column(String(20), ForeignKey("operators.op_id"), nullable=False)
    current_location = Column(Geometry('POINT', srid=4326), nullable=False)
    time_stamp = Column(TIMESTAMP, nullable=False, default=func.current_timestamp())
    
    asset = relationship("Asset")
    operator = relationship("Operator")

class Assignment(Base):
    __tablename__ = "assignments"
    
    assignment_id = Column(Integer, primary_key=True, index=True)
    manager_id = Column(String(20), ForeignKey("fleet_manager.manager_id"), nullable=False)
    op_id = Column(String(20), ForeignKey("operators.op_id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("asset.asset_id"), nullable=False)
    assigned_at = Column(TIMESTAMP, nullable=False, default=func.current_timestamp())
    status = Column(assignment_status_type, nullable=False, default='active')
    
    manager = relationship("FleetManager")
    operator = relationship("Operator")
    asset = relationship("Asset")

class HoneypotLog(Base):
    __tablename__ = "honeypot_logs"
    
    log_id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(45), nullable=False)  # IPv6 support
    user_agent = Column(Text)
    query = Column(Text)
    endpoint = Column(String(255), nullable=False)
    logged_at = Column(TIMESTAMP, nullable=False, default=func.current_timestamp())

class BreachLog(Base):
    __tablename__ = "breach_logs"
    
    breach_id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("location_logs.log_id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("asset.asset_id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.zone_id"), nullable=False)
    breach_type = Column(String(50), nullable=False)
    detected_at = Column(TIMESTAMP, nullable=False, default=func.current_timestamp())
    details = Column(Text)
    
    location_log = relationship("LocationLog")
    asset = relationship("Asset")
    zone = relationship("Zone")

class Dummy(Base):
    __tablename__ = "dummy"
    
    dummy_id = Column(Integer, primary_key=True, index=True)
    asset_name_fake = Column(String(20))
    location_fake = Column(String(50))
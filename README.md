# Secure Asset Management System

A FastAPI-based backend system for managing secure assets (trucks) with geospatial tracking, user management, and breach detection.

## Features

- **User Management**: Role-based access control (Admin, Manager, Operator)
- **Asset Management**: Track trucks/assets with status updates
- **Zone Management**: Define geographical zones with forbidden areas
- **Operator Assignment**: Ternary assignment logic for managers, operators, and assets
- **Location Logging**: Real-time GPS tracking with breach detection
- **Security Features**: Honeypot traps for malicious activity detection
- **Breach Monitoring**: Admin dashboard for security incidents

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database with PostGIS extension

3. Create database tables using `sqlfiles/table_creation.sql`

4. Set environment variables:
```bash
export DATABASE_URL="postgresql://user:password@localhost/secure_asset_db"
export SECRET_KEY="your-secret-key-here"
```

5. Run the application:
```bash
uvicorn main:app --reload
```

## API Endpoints

- `/auth/login` - User authentication
- `/auth/logout` - User logout
- `/users/create-user` - Create new user accounts (admin only)
- `/zones/create-zone` - Create geographical zones (admin only)
- `/zones/zones` - View all zones
- `/assets/create-asset` - Create new assets
- `/assets/assets` - View all assets
- `/operators/operators` - View operators
- `/assignments/assign` - Create operator-asset assignments
- `/location/log-location` - Log asset locations
- `/breaches/breaches` - View breach logs (admin only)
- `/search` - Honeypot endpoint

## Database Schema

The system uses PostgreSQL with PostGIS for geospatial data. Key tables include:
- `users` - User accounts with roles
- `zones` - Geographical zones with boundaries
- `asset` - Tracked vehicles/assets
- `operators` - Field operators
- `assignments` - Operator-asset assignments
- `location_logs` - GPS tracking data
- `breach_logs` - Security breach records
- `honeypot_logs` - Suspicious activity logs
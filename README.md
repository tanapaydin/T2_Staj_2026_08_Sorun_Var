# Sorun Var

A location-based civic issue reporting platform that enables citizens to report problems in their city, municipalities to manage incoming reports, and AI-assisted categorization to speed up resolution.

## Project Structure

```
SorunVar/
├── backend/                # FastAPI backend
├── mobile/                 # Expo React Native application
├── docs/                   # Project documentation
├── docker-compose.yml      # Docker services
└── README.md
```

## Tech Stack

### Backend

* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic
* Docker
* JWT Authentication (planned)

### Mobile

* React Native
* Expo
* TypeScript
* Expo Router

### Storage

* Supabase Storage

### AI

* OpenAI Vision / Image Analysis

## Database

Main entities:

* Users
* Reports
* Report Images
* Comments
* Report Status History

See `docs/database.md` for details.

## Running the Project

### Backend

```bash
docker compose up --build -d
```

API:

```
http://localhost:8000
```

### Database

PostgreSQL:

```
Host: localhost
Port: 5432
Database: sorunburada
User: postgres
Password: postgres
```

## Development Workflow

* `develop` → active development branch
* `main` → production-ready branch
* `feature/*` → feature branches

Example:

```bash
git checkout -b feature/auth
```

## Current Status

* Docker environment configured
* PostgreSQL running
* Alembic migration system configured
* Initial database schema created
* Backend architecture scaffolded
* Mobile Expo project initialized

## License

Private project – Sorun Var team.

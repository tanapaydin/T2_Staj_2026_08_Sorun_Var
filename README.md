# Sorun Var

A location-based civic issue reporting platform built with **FastAPI**, **PostgreSQL**, **Docker**, and **Expo React Native**.

## Project Structure

```text
SorunVar/
├── backend/                # FastAPI backend
├── mobile/                 # Expo React Native application
├── docs/                   # Project documentation
├── docker-compose.yml
└── README.md
```

## Requirements

Install the following software before running the project:

* Git
* Docker Desktop
* Python 3.12+
* Node.js (LTS recommended)
* npm

## Clone the Repository

```bash
git clone https://github.com/tanapaydin/T2_Staj_2026_08_Sorun_Var.git
cd T2_Staj_2026_08_Sorun_Var
```

## Backend Setup

Create and activate a Python virtual environment.

### Windows

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
```

### macOS / Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Return to the project root:

```bash
cd ..
```

## Start Backend and Database

Start the Docker services:

```bash
docker compose up --build -d
```

Run the database migrations:

```bash
docker compose exec backend alembic upgrade head
```

(Optional) Load sample data:

```bash
docker compose exec backend python -m app.seed
```

The backend API will be available at:

```text
http://localhost:8000
```

Swagger documentation:

```text
http://localhost:8000/docs
```

## Mobile Setup

Open a new terminal and install the mobile dependencies:

```bash
cd mobile
npm install
```

Create a local environment file:

### Windows

```bash
copy .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

Edit `.env` and set the backend URL:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
```

Replace `YOUR_LOCAL_IP` with the local IP address of the machine running the backend.

Start the Expo development server:

```bash
npx expo start
```

## PostgreSQL

The default database configuration is:

```text
Host: localhost
Port: 5432
Database: sorunburada
User: postgres
Password: postgres
```

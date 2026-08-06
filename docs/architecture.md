# Architecture

## System Overview

```
React Native (Expo)
        │
        │ HTTP
        ▼
FastAPI
        │
        ├── PostgreSQL
        ├── Supabase Storage
        └── OpenAI API
```

## Request Flow

### Creating a report

1. User captures photo
2. Mobile uploads image
3. Backend stores image in Supabase Storage
4. AI analyzes image
5. Category, title, and description are generated
6. Report is saved in PostgreSQL
7. Mobile receives report response

## Main Modules

### Mobile

* Authentication
* Map
* Report creation
* Report detail
* Profile
* Notifications

### Backend

* Auth
* Reports
* Comments
* AI
* Storage
* Users

### Database

* users
* reports
* report_images
* comments
* report_status_history

## Storage Strategy

Images are never stored directly in PostgreSQL.

Only image URLs are stored.

```
Supabase Storage
       │
       ▼
image_url
       │
       ▼
PostgreSQL
```

## Authentication

JWT access tokens

JWT refresh tokens

Email verification

Password reset

## Deployment

Backend: Docker container

Database: Docker PostgreSQL

Storage: Supabase

Mobile: Expo / EAS Build

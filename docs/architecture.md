# Architecture

## System overview

```text
Expo React Native application
        |
        | HTTP + JWT bearer token
        v
FastAPI backend
        |
        +-- PostgreSQL
        +-- Geoapify (reverse geocoding)
        +-- Nominatim (location search)
        +-- OpenAI (image analysis)
```

## Mobile application

The mobile application uses Expo Router for file-based routing and React Native for the interface. It uses:

- `expo-location` for user coordinates;
- `react-native-maps` and marker clustering for the map;
- AsyncStorage for the saved authentication token;
- `mobile/lib/api.ts` for backend requests;
- `mobile/theme` and reusable components for shared UI styles.

## Report flow

1. The user selects a category, description, location, and optionally a photo for AI assistance.
2. The app sends the report data to `POST /reports` with a JWT token.
3. The backend reverse-geocodes the coordinates through Geoapify.
4. The backend stores the report and its city, district, neighborhood, and address data in PostgreSQL.
5. The mobile app fetches reports, statistics, and location-filtered report lists through the API.

The AI image-analysis endpoint analyzes an uploaded image for category/description assistance. Persistent report-image storage is not currently part of the report creation API.

## Backend modules

- `auth`: registration and login;
- `reports`: report creation, listing, statistics, search, and follows;
- `users`: current profile, followed reports, and account deletion;
- `comments`: listing and creating comments;
- `ai`: image analysis, description/category suggestion, and text moderation.

## Deployment and local development

Docker Compose starts the FastAPI backend on port `8000` and PostgreSQL on port `5432`. The Expo application runs separately and receives its API address from `EXPO_PUBLIC_API_URL`.

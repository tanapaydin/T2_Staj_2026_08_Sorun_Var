# API Specification

## Authentication


### POST /auth/register

Create a new account.

### POST /auth/login

Authenticate user.

### POST /auth/logout

Invalidate current session.

### POST /auth/refresh

Refresh JWT access token.

### POST /auth/verify-email

Verify email using token.

### POST /auth/resend-verification-email

Resend verification email.

### POST /auth/forgot-password

Send password reset email.

---

## Reports

### GET /reports

List reports.

### GET /reports/{id}

Get report details.

### POST /reports

Create report.

### PATCH /reports/{id}

Update report.

### DELETE /reports/{id}

Delete report.

### POST /reports/{id}/images

Upload report images.

### GET /reports/search

Search nearby reports.

Query parameters:

* latitude
* longitude
* radius
* query

### GET /reports/statistics

General report statistics.

### GET /reports/statistics/category

Category-based statistics.

---

## AI

### POST /ai/suggest-category

Analyze image and suggest category.

### POST /ai/generate-description

Generate title and description.

### POST /ai/moderate-image

Moderate uploaded image.

### POST /ai/moderate-text

Moderate user text.

---

## Users

### GET /users/me

Current user profile.

### PATCH /users/me

Update profile.

### GET /users/me/reports

List current user's reports.

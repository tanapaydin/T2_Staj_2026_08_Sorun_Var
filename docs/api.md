# API Specification

Base URL: `http://localhost:8000`
Interactive documentation: `GET /docs`

## Authentication

### POST /auth/register

Creates a user account and returns a JWT access token with the user record.

### POST /auth/login

Authenticates a user and returns a JWT access token with the user record.

## Reports

### GET /reports

Lists reports. Supported query parameters are `category`, `resolved`, `priority`, `date`, `sort`, `city`, `district`, `skip`, and `limit`.

### POST /reports

Creates a report. Requires a JWT bearer token. Required body fields: `title`, `description`, `category`, `latitude`, `longitude`.

### GET /reports/{report_id}

Returns a report's details.

### GET /reports/statistics

Returns total, resolved and pending report counts, average progress, and resolution rate.

### GET /reports/statistics/top

Returns top report and priority statistics. Accepts `period=all|month|week`.

### GET /reports/statistics/category

Returns category distribution statistics.

### GET /reports/search

Searches a Turkish location and returns map coordinates.

### GET /reports/search/suggestions

Returns municipality/city search suggestions for a query of at least two characters.

### POST /reports/{report_id}/follow

Follows a report. Requires a JWT bearer token.

### DELETE /reports/{report_id}/follow

Removes the current user's follow from a report. Requires a JWT bearer token.

## Users

### GET /users/me

Returns the authenticated user's profile.

### GET /users/me/following

Returns reports followed by the authenticated user.

### DELETE /users/me

Deletes the authenticated user's account and related data.

## Comments

### GET /comments?report_id={uuid}

Lists comments, optionally limited to a report.

### POST /comments

Creates a comment. Requires a JWT bearer token.

## AI

### POST /ai/analyze-image

Accepts an `image` file and optional `selected_categories` form field. Returns an AI-generated description and category suggestion.

### POST /ai/generate-description

Generates a description from an image.

### POST /ai/suggest-category

Suggests a category from an image.

### POST /ai/moderate-text

Accepts a text form field and returns its moderation result.

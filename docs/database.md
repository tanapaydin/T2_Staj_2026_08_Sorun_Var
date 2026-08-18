# Database Design

## users

| Field | Type |
| --- | --- |
| id | UUID |
| name | TEXT |
| email | TEXT UNIQUE |
| password_hash | TEXT |
| avatar_url | TEXT nullable |
| role | TEXT |
| email_verified | BOOLEAN |
| created_at | TIMESTAMP |

## reports

| Field | Type |
| --- | --- |
| id | UUID |
| user_id | UUID FK |
| title | TEXT |
| description | TEXT |
| category | TEXT |
| city | TEXT nullable |
| municipality | TEXT nullable |
| district | TEXT nullable |
| neighborhood | TEXT nullable |
| address | TEXT nullable |
| latitude | DOUBLE PRECISION |
| longitude | DOUBLE PRECISION |
| status | TEXT |
| progress | INTEGER |
| priority | TEXT |
| view_count | INTEGER |
| follower_count | INTEGER |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

## report_follows

| Field | Type |
| --- | --- |
| id | INTEGER |
| report_id | UUID FK |
| user_id | UUID FK |
| created_at | TIMESTAMP |

## report_images

| Field | Type |
| --- | --- |
| id | UUID |
| report_id | UUID FK |
| image_url | TEXT |
| created_at | TIMESTAMP |

## comments

| Field | Type |
| --- | --- |
| id | UUID |
| report_id | UUID FK |
| user_id | UUID FK |
| text | TEXT |
| created_at | TIMESTAMP |

## report_status_history

| Field | Type |
| --- | --- |
| id | UUID |
| report_id | UUID FK |
| progress | INTEGER |
| status_text | TEXT |
| changed_by | UUID FK |
| created_at | TIMESTAMP |

## Relationships

```text
User --< Report --< Comment
  |       |
  |       +--< ReportFollow
  |       +--< ReportImage
  |       +--< ReportStatusHistory
  +--< Comment
```

`report_images` and `report_status_history` models exist in the database model. Their complete application workflows are planned separately.

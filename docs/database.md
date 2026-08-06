# Database Design

## users

| Field         | Type                           |
| ------------- | ------------------------------ |
| id            | UUID                           |
| name          | TEXT                           |
| email         | TEXT UNIQUE                    |
| password_hash | TEXT                           |
| avatar_url    | TEXT                           |
| role          | citizen / municipality / admin |
| email_verified| BOOLEAN                        |
| created_at    | TIMESTAMP                      |


---

## reports

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| user_id     | UUID FK   |
| title       | TEXT      |
| description | TEXT      |
| category    | TEXT      |
| latitude    | DOUBLE    |
| longitude   | DOUBLE    |
| status      | TEXT      |
| progress    | INTEGER   |
| priority    | TEXT      | (low-medium-high)
| view_count  | INTEGER   |
| created_at  | TIMESTAMP |
| updated_at  | TIMESTAMP |

---

## report_images

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| report_id  | UUID FK   |
| image_url  | TEXT      |
| created_at | TIMESTAMP |

---

## comments

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| report_id  | UUID FK   |
| user_id    | UUID FK   |
| text       | TEXT      |
| created_at | TIMESTAMP |

---

## report_status_history

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| report_id   | UUID FK   |
| progress    | INTEGER   |
| status_text | TEXT      |
| changed_by  | UUID FK(users.id)  |
| created_at  | TIMESTAMP |

---

## Relationships

```
User
  │
  ├──< Report
  │        │
  │        ├──< ReportImage
  │        ├──< Comment
  │        └──< ReportStatusHistory
  │
  └──< Comment

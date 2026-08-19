import math

import requests
from sqlalchemy.orm import Session

from app.models import Comment, PushSubscription, Report, ReportFollow, User


EARTH_RADIUS_KM = 6371.0
NEARBY_REPORT_RADIUS_KM = 5.0


def distance_km(
    first_latitude: float,
    first_longitude: float,
    second_latitude: float,
    second_longitude: float,
) -> float:
    latitude_delta = math.radians(second_latitude - first_latitude)
    longitude_delta = math.radians(second_longitude - first_longitude)
    first_latitude = math.radians(first_latitude)
    second_latitude = math.radians(second_latitude)

    value = (
        math.sin(latitude_delta / 2) ** 2
        + math.cos(first_latitude)
        * math.cos(second_latitude)
        * math.sin(longitude_delta / 2) ** 2
    )
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def notify_nearby_users(db: Session, report: Report, creator: User) -> None:
    subscriptions = (
        db.query(PushSubscription)
        .join(User, User.id == PushSubscription.user_id)
        .filter(
            User.location_notifications.is_(True),
            PushSubscription.latitude.is_not(None),
            PushSubscription.longitude.is_not(None),
            PushSubscription.user_id != creator.id,
        )
        .all()
    )

    messages = []
    for subscription in subscriptions:
        if distance_km(
            report.latitude,
            report.longitude,
            subscription.latitude,
            subscription.longitude,
        ) <= NEARBY_REPORT_RADIUS_KM:
            messages.append(
                {
                    "to": subscription.token,
                    "title": "Yakınınızda yeni sorun",
                    "body": report.title,
                    "data": {"reportId": str(report.id)},
                    "sound": "default",
                }
            )

    if not messages:
        return

    send_push_messages(messages)


def send_push_messages(messages: list[dict]) -> None:
    if not messages:
        return

    try:
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=messages,
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as error:
        print("PUSH NOTIFICATION ERROR:", error)


def notify_report_followers(
    db: Session,
    report: Report,
    title: str,
    body: str,
    excluded_user_id,
) -> None:
    follower_ids = {
        user_id
        for (user_id,) in db.query(ReportFollow.user_id)
        .filter(ReportFollow.report_id == report.id)
        .all()
    }
    follower_ids.add(report.user_id)
    follower_ids.discard(excluded_user_id)

    subscriptions = (
        db.query(PushSubscription)
        .join(User, User.id == PushSubscription.user_id)
        .filter(
            PushSubscription.user_id.in_(follower_ids),
            User.push_notifications.is_(True),
        )
        .all()
    )

    send_push_messages(
        [
            {
                "to": subscription.token,
                "title": title,
                "body": body,
                "data": {"reportId": str(report.id)},
                "sound": "default",
            }
            for subscription in subscriptions
        ]
    )


def notify_comment_author(db: Session, comment: Comment, report: Report, author: User) -> None:
    notify_report_followers(
        db,
        report,
        "Takip ettiğiniz soruna yeni yorum",
        comment.text[:120],
        author.id,
    )
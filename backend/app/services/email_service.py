import os
import smtplib
import ssl
from email.mime.text import MIMEText

import requests


class EmailDeliveryError(RuntimeError):
    pass


def _send_with_resend(to_email: str, subject: str, body: str) -> bool:
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        return False

    email_from = os.getenv("EMAIL_FROM")
    if not email_from:
        raise EmailDeliveryError("RESEND_API_KEY ayarlı ancak EMAIL_FROM eksik.")

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": email_from,
                "to": [to_email],
                "subject": subject,
                "text": body,
            },
            timeout=15,
        )
        if response.status_code == 403 and "onboarding@resend.dev" in email_from:
            raise EmailDeliveryError(
                "Resend test göndereni yalnızca hesap sahibine e-posta gönderebilir. "
                "Başka adresler için Resend'de bir alan adı doğrulayın."
            )
        response.raise_for_status()
    except EmailDeliveryError:
        raise
    except requests.RequestException as exc:
        raise EmailDeliveryError(
            "E-posta gönderilemedi. Resend ayarlarını kontrol edin."
        ) from exc

    return True


def _send_with_smtp(to_email: str, subject: str, body: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or smtp_username

    if not smtp_host and not smtp_username and not smtp_password:
        return False
    if not smtp_host or not smtp_username or not smtp_password or not smtp_from:
        raise EmailDeliveryError("SMTP ayarları eksik.")

    message = MIMEText(body, "plain", "utf-8")
    message["Subject"] = subject
    message["From"] = smtp_from
    message["To"] = to_email

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls(context=context)
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_from, [to_email], message.as_string())
    except (OSError, smtplib.SMTPException) as exc:
        raise EmailDeliveryError("E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.") from exc

    return True


def send_email(to_email: str, subject: str, body: str) -> None:
    if _send_with_resend(to_email, subject, body):
        return
    if _send_with_smtp(to_email, subject, body):
        return

    raise EmailDeliveryError("E-posta servisi henüz yapılandırılmamış.")

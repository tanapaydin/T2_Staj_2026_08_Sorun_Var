import os
import smtplib
import ssl
from email.mime.text import MIMEText


class EmailDeliveryError(RuntimeError):
    pass


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
    if _send_with_smtp(to_email, subject, body):
        return

    raise EmailDeliveryError("E-posta servisi henüz yapılandırılmamış.")

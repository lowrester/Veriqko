import logging
from email.message import EmailMessage

import aiosmtplib

from veriqko.config import get_settings

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending automated emails natively."""

    def __init__(self):
        self.settings = get_settings()

    async def send_completion_email(self, recipient_email: str, recipient_name: str, job_id: str, serial_number: str) -> bool:
        """
        Send a completion email to the customer.
        Falls back to logging if SMTP is not configured.
        """
        email_content = f"""
Subject: Your Device {serial_number} is Ready!

Dear {recipient_name},

Good news! Your device (Serial: {serial_number}) has passed Quality Control and is ready for shipping.

You can view the full test report and status in your customer portal:
{self.settings.base_url}/r/{job_id}

Thank you for choosing {self.settings.brand_name}.
"""

        if not self.settings.smtp_host or not self.settings.smtp_from_email:
            logger.info(f"[EMAIL MOCK - SMTP NOT CONFIGURED] To: {recipient_email}\n{email_content}")
            return True

        message = EmailMessage()
        message.set_content(email_content)
        message["Subject"] = f"Your Device {serial_number} is Ready!"
        message["From"] = self.settings.smtp_from_email
        message["To"] = recipient_email

        try:
            await aiosmtplib.send(
                message,
                hostname=self.settings.smtp_host,
                port=self.settings.smtp_port,
                username=self.settings.smtp_user,
                password=self.settings.smtp_password,
                use_tls=self.settings.smtp_port == 465,
                start_tls=self.settings.smtp_tls and self.settings.smtp_port != 465,
            )
            logger.info(f"Completion email sent successfully to {recipient_email}")
            return True
        except Exception:
            logger.exception("Failed to send completion email via SMTP")
            return False

    async def send_sla_alert(self, job_id: str, serial_number: str, level: str, assignee_email: str | None = None) -> bool:
        """
        Send an SLA alert to the manager or assignee.
        """
        recipient = assignee_email or "manager@veriqko.local"
        
        email_content = f"""
Subject: [SLA {level}] Device {serial_number} requires attention

Job #{job_id} (Serial: {serial_number}) has reached SLA alert level: {level}.
Please take immediate action to resolve any bottlenecks.

View Job:
{self.settings.base_url}/jobs/{job_id}
"""

        if not self.settings.smtp_host or not self.settings.smtp_from_email:
            logger.info(f"[EMAIL MOCK - SMTP NOT CONFIGURED] To: {recipient}\n{email_content}")
            return True

        message = EmailMessage()
        message.set_content(email_content)
        message["Subject"] = f"[SLA {level}] Device {serial_number} requires attention"
        message["From"] = self.settings.smtp_from_email
        message["To"] = recipient

        try:
            await aiosmtplib.send(
                message,
                hostname=self.settings.smtp_host,
                port=self.settings.smtp_port,
                username=self.settings.smtp_user,
                password=self.settings.smtp_password,
                use_tls=self.settings.smtp_port == 465,
                start_tls=self.settings.smtp_tls and self.settings.smtp_port != 465,
            )
            return True
        except Exception:
            logger.exception(f"Failed to send SLA {level} alert via SMTP")
            return False

email_service = EmailService()

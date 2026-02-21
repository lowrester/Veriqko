"""SLA background monitoring task."""

from datetime import UTC, datetime, timedelta

import structlog
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from veriqko.db.base import async_session_factory
from veriqko.jobs.models import Job, JobStatus
from veriqko.integrations.email import email_service

logger = structlog.get_logger(__name__)

async def check_sla_breaches():
    """
    Check all active jobs for SLA breaches or upcoming breaches.
    Sends notifications to technicians/managers.
    """
    logger.info("Starting SLA breach check")

    async with async_session_factory() as db:
        try:
            now = datetime.now(UTC)

            # 1. Find jobs that are active and have an SLA
            stmt = select(Job).options(
                selectinload(Job.assigned_technician)
            ).where(
                Job.status.not_in([JobStatus.COMPLETED, JobStatus.FAILED]),
                Job.sla_due_at.is_not(None),
                Job.deleted_at.is_(None)
            )

            result = await db.execute(stmt)
            jobs = result.scalars().all()

            for job in jobs:
                assignee_email = job.assigned_technician.email if job.assigned_technician else None

                # Check for breach
                if job.sla_due_at < now and not job.sla_breach_notified_at:
                    logger.warning("SLA breached", job_id=job.id, serial_number=job.serial_number)
                    await email_service.send_sla_alert(job.id, job.serial_number, level="BREACHED", assignee_email=assignee_email)
                    job.sla_breach_notified_at = now
                    db.add(job)

                # Check for near breach (within 2 hours)
                elif job.sla_due_at < now + timedelta(hours=2) and not job.sla_warning_notified_at:
                    logger.info("SLA near breach", job_id=job.id, serial_number=job.serial_number)
                    await email_service.send_sla_alert(job.id, job.serial_number, level="WARNING", assignee_email=assignee_email)
                    job.sla_warning_notified_at = now
                    db.add(job)

            await db.commit()

        except Exception as e:
            logger.exception("Error during SLA check", error=str(e))


async def run_sla_checker():
    """Runner for the SLA checker."""
    await check_sla_breaches()

"""Background tasks for reports."""

import tempfile
from pathlib import Path

import structlog
from sqlalchemy import select

from veriqko.db.base import async_session_factory
from veriqko.evidence.storage import get_storage
from veriqko.reports.generator import ReportData, get_report_generator
from veriqko.reports.models import Report


logger = structlog.get_logger(__name__)


async def generate_and_save_report(
    report_id: str,
    report_data: ReportData,
    job_id: str,
    serial_number: str,
    scope_value: str,
) -> None:
    """Generate a PDF report and save it to storage."""
    logger.info("Starting background PDF generation", report_id=report_id)
    generator = get_report_generator()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        # Generate the PDF file (runs in ThreadPoolExecutor internally)
        await generator.generate(report_data, tmp_path)
        logger.debug("PDF generated locally", tmp_path=str(tmp_path))

        # Save to storage
        storage = get_storage()
        with open(tmp_path, "rb") as f:
            stored = await storage.save(
                file=f,
                job_id=job_id,
                filename=f"report_{serial_number}_{scope_value}.pdf",
                mime_type="application/pdf",
                folder="reports",
            )
            logger.debug("PDF uploaded to storage", file_path=stored.relative_path)

        # Update the database record with file info
        async with async_session_factory() as db:
            stmt = select(Report).where(Report.id == report_id)
            result = await db.execute(stmt)
            report = result.scalar_one_or_none()
            if report:
                report.file_path = stored.relative_path
                report.file_size_bytes = stored.size_bytes
                await db.commit()
                logger.info("Report record updated successfully", report_id=report_id)
            else:
                logger.warning("Report record not found after generation", report_id=report_id)

    except Exception:
        logger.exception("Failed to generate PDF report", report_id=report_id)
    finally:
        if tmp_path.exists():
            tmp_path.unlink()

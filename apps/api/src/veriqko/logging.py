"""Structured logging configuration."""

import logging
import sys
import uuid
from typing import Any

import structlog
from fastapi import Request


def setup_logging(json_format: bool = True, log_level: str = "INFO") -> None:
    """Configure structlog and standard logging."""
    
    # Configure standard logging to use structlog formatting
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper(), logging.INFO),
    )

    # Shared processors
    processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if json_format:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


async def logging_middleware(request: Request, call_next: Any) -> Any:
    """Middleware to inject request context into logs."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else None,
    )

    logger = structlog.get_logger("veriqko.request")
    
    response = await call_next(request)
    
    structlog.contextvars.bind_contextvars(
        status_code=response.status_code,
    )
    
    if response.status_code >= 400:
        logger.warning("Request failed")
    else:
        logger.info("Request completed")
    
    response.headers["X-Request-ID"] = request_id
    return response

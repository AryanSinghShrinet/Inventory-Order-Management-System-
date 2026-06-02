"""Typed application errors that map cleanly to HTTP responses."""

from typing import Any, Dict, Optional

from fastapi import HTTPException, status


class AppError(HTTPException):
    """Base class for application-level errors.

    The frontend can rely on a consistent shape: {"detail", "code", "fields"}.
    """

    code: str = "app_error"
    default_status: int = status.HTTP_400_BAD_REQUEST

    def __init__(
        self,
        detail: str,
        *,
        status_code: Optional[int] = None,
        code: Optional[str] = None,
        fields: Optional[Dict[str, str]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> None:
        super().__init__(
            status_code=status_code or self.default_status,
            detail=detail,
            headers=headers,
        )
        self.code = code or self.code
        self.fields = fields or {}

    def to_payload(self) -> Dict[str, Any]:
        return {
            "detail": self.detail,
            "code": self.code,
            "fields": self.fields,
        }


class NotFoundError(AppError):
    code = "not_found"
    default_status = status.HTTP_404_NOT_FOUND


class ConflictError(AppError):
    code = "conflict"
    default_status = status.HTTP_409_CONFLICT


class ValidationError(AppError):
    code = "validation_error"
    default_status = status.HTTP_422_UNPROCESSABLE_ENTITY


class BusinessRuleError(AppError):
    code = "business_rule"
    default_status = status.HTTP_409_CONFLICT

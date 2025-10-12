"""
Global exception handler for Maverick Aim Rush
Provides uniform error responses with correlation IDs
"""
import uuid
import logging
from rest_framework.views import exception_handler as drf_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

logger = logging.getLogger(__name__)


def exception_handler(exc, context):
    """
    Global DRF exception handler that normalizes errors to:
    {code, message, correlation_id}
    """
    # Generate correlation ID for this request
    correlation_id = str(uuid.uuid4())
    
    # Get the standard DRF response
    response = drf_handler(exc, context)
    
    if response is None:
        # Handle unexpected exceptions
        logger.error(f"Unhandled exception: {exc}", exc_info=True, extra={'correlation_id': correlation_id})
        return Response({
            "code": "internal_error",
            "message": "Something went wrong",
            "correlation_id": correlation_id
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Normalize the response data
    if isinstance(response.data, dict):
        data = response.data
    else:
        data = {"message": str(response.data)}
    
    # Build normalized payload
    payload = {
        "code": data.get("code") or "error",
        "message": data.get("detail") or data.get("message") or "Request failed",
        "correlation_id": correlation_id
    }
    
    # Add retry-after header for rate limiting
    if response.status_code in (429, 503):
        response["Retry-After"] = "30"
    
    # Set correlation ID header
    response["X-Request-ID"] = correlation_id
    
    # Update response data
    response.data = payload
    
    # Log error for monitoring
    if response.status_code >= 400:
        logger.warning(
            f"API Error: {payload['code']} - {payload['message']}",
            extra={
                'correlation_id': correlation_id,
                'status_code': response.status_code,
                'view': context.get('view', {}).__class__.__name__ if context.get('view') else None,
                'request_method': context.get('request', {}).method if context.get('request') else None,
            }
        )
    
    return response


def get_correlation_id(request):
    """
    Extract correlation ID from request headers or generate new one
    """
    return request.META.get('HTTP_X_REQUEST_ID') or str(uuid.uuid4())

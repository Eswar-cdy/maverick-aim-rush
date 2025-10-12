"""
Idempotency mixin for preventing duplicate writes
"""
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings


class IdempotentCreateMixin:
    """
    Mixin to make create operations idempotent using cache
    """
    IDEMPOTENCY_TTL = 60 * 60  # 1 hour
    
    def create(self, request, *args, **kwargs):
        # Skip idempotency if disabled
        if not settings.MAR_FLAGS.get("idempotency_keys", True):
            return super().create(request, *args, **kwargs)
        
        # Get idempotency key from header
        idempotency_key = request.headers.get("Idempotency-Key")
        
        if idempotency_key:
            # Check if we've already processed this request
            cached_response = cache.get(idempotency_key)
            if cached_response:
                return Response(
                    cached_response["payload"], 
                    status=cached_response["status"]
                )
        
        # Process the request normally
        response = super().create(request, *args, **kwargs)
        
        # Cache the response if we have an idempotency key
        if idempotency_key and response.status_code < 400:
            cache.set(
                idempotency_key,
                {
                    "status": response.status_code,
                    "payload": response.data
                },
                timeout=self.IDEMPOTENCY_TTL
            )
        
        return response

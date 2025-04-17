from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import re

class SharedChecklistMiddleware(BaseHTTPMiddleware):
    """
    Middleware to protect edit operations for shared checklists.
    Third-party users accessing a checklist via public link can only upload files,
    but cannot edit the structure of the checklist.
    
    Permission model:
    - Public link (/checklists/public/{public_link}): View-only with file upload permission
    - Edit link (/checklists/edit/{edit_token}): Full edit access
    """
    
    async def dispatch(self, request: Request, call_next):
        # Get the path and method
        path = request.url.path
        method = request.method
        
        # Check if this is a public link access
        if "checklists/public/" in path:
            # Allow GET requests (viewing) for all paths
            if method == "GET":
                return await call_next(request)
                
            # Allow POST requests only for file uploads
            if method == "POST" and "uploads" in path:
                return await call_next(request)
            
            # Block all other methods (PUT, DELETE, POST to non-upload endpoints)
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "You don't have permission to edit this checklist. Use the edit link to modify the structure."}
            )
        
        # For direct API access (not via public or edit links), require edit token in the path or query
        # This applies to PUT, DELETE, and POST operations on checklists, categories, and items
        if method in ["PUT", "DELETE"] or (method == "POST" and "uploads" not in path):
            # Skip this check for the initial checklist creation endpoint and cloning
            if path == "/checklists/" and method == "POST" or "clone" in path:
                return await call_next(request)
                
            # Skip this check if accessing via edit token
            if "checklists/edit/" in path:
                return await call_next(request)
                
            # For all other edit operations, require the edit_token parameter
            query_params = request.query_params
            if "edit_token" not in query_params:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "Edit operations require an edit_token parameter. Use the edit link to modify the structure."}
                )
        
        # For all other requests, proceed normally
        return await call_next(request)

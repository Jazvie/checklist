from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

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
        
        # For edit token access or other API endpoints, proceed normally
        return await call_next(request)

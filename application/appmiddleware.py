from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import requests
'/check-isadmin/:userid'
'/check-user-login/:userid'
class UserAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/upload-document") or request.url.path.startswith("/api/check"):
            path_arr = request.url.path.split("/")[1:]
            if len(path_arr) == 3:
                user_id = path_arr[-1]
            else:
                return JSONResponse(status_code=400, content={"status": 400, "detail": "user id not provided"})
            try:
                response = requests.get(f"http://localhost:5000/check-user-login/:{user_id}")
                if response.status_code != 200:
                    return JSONResponse(status_code=401, content={"status": 401, "detail": "user not authenticated"})
            except requests.exceptions.RequestException as e:
                return JSONResponse(status_code=500, content={"status": 500, "detail": "internal server error"})      
        response = await call_next(request)
        return response

class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("api/check"):
            path_arr = request.url.path.split("/")[1:]
            if len(path_arr) == 3:
                user_id = path_arr[-1]
            else:
                return JSONResponse(status_code=400, content={"status": 400, "detail": "user id not provided"})
            try:
                response = requests.get(f"http://localhost:5000/check-isadmin/:{user_id}")
                if response.status_code != 403:
                    return JSONResponse(status_code=403, content={"status": 401, "detail": "permission denied"})
            except requests.exceptions.RequestException as e:
                return JSONResponse(status_code=500, content={"status": 500, "detail": "internal server wait"})
        response = await call_next(request)
        return response
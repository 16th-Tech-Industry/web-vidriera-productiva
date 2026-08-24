from fastapi import APIRouter
from api.v1.endpoints import user
from api.v1.endpoints.usuario import register, login

api_router_v1 = APIRouter()
api_router_v1.include_router(user.router, tags=["Users V1"])
api_router_v1.include_router(register.router, tags=["Register V1"])
api_router_v1.include_router(login.router, tags=["Login V1"])
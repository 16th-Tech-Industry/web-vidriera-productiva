from fastapi import APIRouter
from api.v1.endpoints import user

api_router_v1 = APIRouter()
api_router_v1.include_router(user.router, prefix="/users", tags=["Users V1"])
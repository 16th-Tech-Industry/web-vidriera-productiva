from fastapi import APIRouter
from api.v1.endpoints import landing, noticias, user
from api.v1.endpoints.usuario import register, login
from api.v1.endpoints.dashboard import empresas as dashboard_empresas
from api.v1.endpoints.dashboard import empresas_revision as dashboard_empresas_revision

api_router_v1 = APIRouter()
api_router_v1.include_router(user.router, tags=["Users V1"])
api_router_v1.include_router(register.router, tags=["Register V1"])
api_router_v1.include_router(login.router, tags=["Login V1"])
api_router_v1.include_router(noticias.router, tags=["Noticias V1"])
api_router_v1.include_router(landing.router, tags=["Landing V1"])
api_router_v1.include_router(dashboard_empresas.router, tags=["Dashboard V1"])
api_router_v1.include_router(dashboard_empresas_revision.router, tags=["Dashboard V1"])
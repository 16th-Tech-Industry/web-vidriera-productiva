from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1.router import api_router_v1

app = FastAPI(
    title="Mi API",
    openapi_url="/api/v1/openapi.json"
)

# Permitir que el frontend (React/Vite) se comunique con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montaje de versiones
app.include_router(api_router_v1, prefix="/api/v1")
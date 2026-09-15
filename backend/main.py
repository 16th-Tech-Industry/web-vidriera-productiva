from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1.router import api_router_v1
from db_connector import close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Al apagar el server, devolvemos/cerramos las conexiones del pool
    # de Oracle en vez de dejarlas colgadas (ver db_connector.py).
    close_pool()


app = FastAPI(
    title="Mi API",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan,
)

# Orígenes permitidos del frontend (React / Vite)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Configuración única de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montaje de rutas de la versión 1
app.include_router(api_router_v1, prefix="/api/v1")
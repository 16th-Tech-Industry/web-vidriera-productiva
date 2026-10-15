from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.v1.router import api_router_v1
from api.v1.servicios.productos_empresa import EMPRESAS_REPO_DIR, NOMBRE_CARPETA
from db_connector import close_pool

# Carpeta donde se guardan las imágenes subidas (ver api/v1/endpoints/noticias.py).
# Se sirve como estático en /uploads, así una noticia con imagen_archivo="x.jpg"
# queda accesible en http://localhost:8000/uploads/noticias/x.jpg
UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
# Imágenes de los productos, una carpeta por empresa (ver
# api/v1/servicios/productos_empresa.py). Un producto con
# ubicacion_imagen="empresas_repo/7/x.jpg" queda accesible en
# http://localhost:8000/empresas_repo/7/x.jpg
EMPRESAS_REPO_DIR.mkdir(parents=True, exist_ok=True)


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

# Un 422 deja en la consola qué campos fallaron (sin los valores, que pueden
# ser contraseñas o datos personales); la respuesta al cliente no cambia.
@app.exception_handler(RequestValidationError)
async def registrar_error_de_validacion(request: Request, exc: RequestValidationError):
    campos = "; ".join(f"{'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in exc.errors())
    print(f"422 en {request.method} {request.url.path} -> {campos}")
    return await request_validation_exception_handler(request, exc)


# Montaje de rutas de la versión 1
app.include_router(api_router_v1, prefix="/api/v1")

# Archivos subidos (imágenes de noticias, etc.)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount(f"/{NOMBRE_CARPETA}", StaticFiles(directory=EMPRESAS_REPO_DIR), name=NOMBRE_CARPETA)
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from api.v1.router import api_router_v1
from db_connector import close_pool

# Las imágenes subidas (noticias y productos) se guardan en la base y se
# sirven en /api/v1/imagenes/{id} (ver api/v1/servicios/imagenes.py): no hay
# carpetas de archivos que publicar.


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Al apagar el server, devolvemos/cerramos las conexiones del pool
    # de la base en vez de dejarlas colgadas (ver db_connector.py).
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
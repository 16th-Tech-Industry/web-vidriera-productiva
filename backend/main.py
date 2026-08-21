from fastapi import FastAPI
from api.v1.router import api_router_v1

app = FastAPI(
    title="Mi API",
    openapi_url="/api/v1/openapi.json"  # Opcional: ajustar OpenAPI global
)

# Montaje de versiones
app.include_router(api_router_v1, prefix="/api/v1")
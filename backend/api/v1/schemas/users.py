# backend/api/v1/schemas/users.py

"""
... (Elipsis
Significa que el campo es estrictamente obligatorio.
Es un objeto nativo de Python que Pydantic usa para indicar que el atributo no tiene un valor por defecto.
Si el cliente no envía este dato en el JSON, la API corta el flujo y devuelve automáticamente un error HTTP 422 (Unprocessable Entity).


Field()
Es una función de Pydantic que sirve para agregar reglas de validación y metadatos a un atributo, yendo un paso más allá del simple tipado de datos.
    
Ej:
    str: El dato debe ser texto.

    ...: Es obligatorio.

    min_length / max_length: Pydantic validará la longitud automáticamente.

"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# Base compartida
class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=50)

# Entrada para crear
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

# Entrada para actualizar (PATCH - campos opcionales)
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    password: Optional[str] = Field(None, min_length=8)

# Salida (Lo que devuelve la API)
class UserResponse(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True # Necesario si usas SQLAlchemy
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from api.v1.schemas.users import UserCreate, UserResponse
from api.v1.servicios.correo import enviar_bienvenida
from db_connector import execute_query
from security import hash_password

router = APIRouter(prefix="/register", tags=["Register"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, background_tasks: BackgroundTasks):
    """Registra un representante nuevo: valida email único, hashea la password, la persiste en `representates` y manda el mail de bienvenida."""
    existe = execute_query(
        "SELECT id_representante FROM representates WHERE email_representante = :email",
        {"email": user.email},
        fetch=True,
    )
    if existe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")
    
    telefono= getattr(user, "telefono", None)
    rol= getattr(user, "rol", 0)
    # estado=1 (activo) porque todavía no hay verificación de cuenta por mail.
    execute_query(
        "INSERT INTO representates "
        "(nombre_representante, apellido_representante, email_representante, "
        "n_telefono_representante, contrasenia_representate, fecha_de_creacion, rol, estado) "
        "VALUES (:nombre, :apellido, :email, :telefono, :password_hash, :fecha, :rol, :estado)",
        {
            "nombre": user.name,
            "apellido": user.apellido,
            "email": user.email,
            "telefono": telefono,
            "password_hash": hash_password(user.password),
            "fecha": datetime.now(),
            "rol": rol,
            "estado": 1,
        },
    )

    nuevo = execute_query(
        "SELECT id_representante, rol FROM representates WHERE email_representante = :email",
        {"email": user.email},
        fetch=True,
    )
    # En segundo plano, después de responder: si el servidor de correo falla,
    # la cuenta ya quedó creada igual.
    background_tasks.add_task(enviar_bienvenida, user.email, user.name)
    return {
        "id": nuevo[0][0], 
        "email": user.email, 
        "name": user.name, 
        "role": nuevo[0][1],
        "is_active": True
        }

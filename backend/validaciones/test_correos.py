"""
Pruebas de los mails transaccionales (api/v1/servicios/correo.py):
- recuperación de contraseña: el token (security.py) y los endpoints
  forgot/reset (api/v1/endpoints/usuario/login.py);
- bienvenida al registrarse (api/v1/endpoints/usuario/register.py).

No necesitan Oracle ni un servidor de correo: la base se reemplaza por una
tabla en memoria y el SMTP por un doble que guarda lo que le mandan.
"""
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import BackgroundTasks, HTTPException

import security
from api.v1.endpoints.usuario import login, register
from api.v1.schemas.users import ForgotPasswordRequest, ResetPasswordRequest, UserCreate
from api.v1.servicios import correo

EMAIL = "ana@empresa.com"
HASH_ORIGINAL = "$2b$12$hashdelacontraseniaoriginal"


class BaseFalsa:
    """Reemplazo de execute_query con un solo representante (id 7)."""

    def __init__(self, estado: int = 1):
        self.password_hash = HASH_ORIGINAL
        self.estado = estado

    def __call__(self, query, params=None, fetch=False):
        if query.startswith("UPDATE"):
            assert params["id"] == 7
            self.password_hash = params["password_hash"]
            return None
        if "email_representante = :email" in query:
            return [(7, "Ana", self.password_hash, self.estado)] if params["email"] == EMAIL else []
        return [(self.password_hash,)] if params["id"] == 7 else []


@pytest.fixture(autouse=True)
def clave_jwt(monkeypatch):
    monkeypatch.setattr(security, "JWT_SECRET_KEY", "clave-de-prueba-suficientemente-larga")
    monkeypatch.setattr(security, "JWT_ALGORITHM", "HS256")


@pytest.fixture
def base(monkeypatch):
    falsa = BaseFalsa()
    monkeypatch.setattr(login, "execute_query", falsa)
    return falsa


def _pedir(email: str) -> BackgroundTasks:
    tareas = BackgroundTasks()
    respuesta = login.forgot_password(ForgotPasswordRequest(email=email), tareas)
    assert respuesta["message"].startswith("Si el email está registrado")
    return tareas


def _cambiar(token: str, nueva: str = "claveNueva123"):
    return login.reset_password(ResetPasswordRequest(token=token, new_password=nueva))


def _rechazado(token: str) -> bool:
    with pytest.raises(HTTPException) as error:
        _cambiar(token)
    return error.value.status_code == 400 and error.value.detail == "Token inválido o expirado"


# --- forgot-password -----------------------------------------------------


def test_email_registrado_encola_un_mail_con_token_valido(base):
    tareas = _pedir(EMAIL).tasks
    assert len(tareas) == 1
    assert tareas[0].func is correo.enviar_recupero_contrasena
    destinatario, nombre, token = tareas[0].args
    assert (destinatario, nombre) == (EMAIL, "Ana")
    assert security.decode_reset_token(token)["sub"] == "7"


def test_email_inexistente_no_envia_nada_y_responde_igual(base):
    assert _pedir("nadie@empresa.com").tasks == []


def test_cuenta_inactiva_no_recibe_mail(base):
    base.estado = 0
    assert _pedir(EMAIL).tasks == []


# --- reset-password ------------------------------------------------------


def test_token_valido_cambia_la_contrasena(base):
    token = security.create_reset_token(7, HASH_ORIGINAL)
    assert _cambiar(token)["message"] == "Contraseña actualizada correctamente"
    assert security.verify_password("claveNueva123", base.password_hash)


def test_token_no_se_puede_usar_dos_veces(base):
    token = security.create_reset_token(7, HASH_ORIGINAL)
    _cambiar(token)
    assert _rechazado(token)


def test_usar_un_token_invalida_los_otros_pedidos_antes(base):
    primero = security.create_reset_token(7, HASH_ORIGINAL)
    segundo = security.create_reset_token(7, HASH_ORIGINAL)
    _cambiar(segundo)
    assert _rechazado(primero)


def test_token_vencido_es_rechazado(base):
    vencido = jwt.encode(
        {
            "sub": "7",
            "huella": security._huella_password(HASH_ORIGINAL),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        security._clave_reset(),
        algorithm="HS256",
    )
    assert _rechazado(vencido)


def test_token_adulterado_es_rechazado(base):
    token = security.create_reset_token(7, HASH_ORIGINAL)
    assert _rechazado(token[:-3] + ("aaa" if not token.endswith("aaa") else "bbb"))
    assert _rechazado("cualquier-cosa")


def test_token_de_sesion_no_sirve_para_cambiar_la_contrasena(base):
    sesion = security.create_access_token({"sub": "7", "email": EMAIL, "rol": 0})
    assert _rechazado(sesion)


def test_token_de_recupero_no_sirve_como_sesion():
    token = security.create_reset_token(7, HASH_ORIGINAL)
    with pytest.raises(jwt.InvalidTokenError):
        jwt.decode(token, security.JWT_SECRET_KEY, algorithms=["HS256"])


def test_token_de_usuario_inexistente_es_rechazado(base):
    assert _rechazado(security.create_reset_token(99, HASH_ORIGINAL))


# --- mail ----------------------------------------------------------------


class SMTPFalso:
    enviados = []

    def __init__(self, host, port, timeout=None):
        self.destino = (host, port)

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def ehlo(self):
        pass

    def has_extn(self, _):
        return False

    def login(self, usuario, clave):
        pass

    def send_message(self, mensaje):
        SMTPFalso.enviados.append(mensaje)


@pytest.fixture
def smtp(monkeypatch):
    SMTPFalso.enviados = []
    monkeypatch.setattr(correo, "SMTP_HOST", "smtp.prueba.local")
    monkeypatch.setattr(correo, "FRONTEND_URL", "http://localhost:5173/")
    monkeypatch.setattr(correo.smtplib, "SMTP", SMTPFalso)
    return SMTPFalso


def test_mail_de_recupero_lleva_link_y_token(smtp):
    correo.enviar_recupero_contrasena(EMAIL, "Ana <b>", "tok.en-123")
    (mensaje,) = smtp.enviados
    assert mensaje["To"] == EMAIL
    texto = mensaje.get_body(("plain",)).get_content()
    cuerpo_html = mensaje.get_body(("html",)).get_content()
    assert "http://localhost:5173/?reset_token=tok.en-123" in texto
    assert "http://localhost:5173/?reset_token=tok.en-123" in cuerpo_html
    assert "Ana &lt;b&gt;" in cuerpo_html


def test_falla_del_smtp_no_se_propaga(smtp, monkeypatch):
    def explota(*_, **__):
        raise OSError("sin conexión")

    monkeypatch.setattr(correo.smtplib, "SMTP", explota)
    correo.enviar_recupero_contrasena(EMAIL, "Ana", "token")


def test_sin_smtp_configurado_no_se_propaga(monkeypatch):
    monkeypatch.setattr(correo, "SMTP_HOST", None)
    correo.enviar_recupero_contrasena(EMAIL, "Ana", "token")


# --- bienvenida ----------------------------------------------------------


def _registrar(monkeypatch, ya_existe: bool) -> BackgroundTasks:
    consultas = iter([[(7,)] if ya_existe else [], None, [(7, 0)]])
    monkeypatch.setattr(register, "execute_query", lambda *_, **__: next(consultas))
    tareas = BackgroundTasks()
    register.create_user(UserCreate(email=EMAIL, name="Ana", apellido="Paz", password="clave12345"), tareas)
    return tareas


def test_registro_encola_el_mail_de_bienvenida(monkeypatch):
    (tarea,) = _registrar(monkeypatch, ya_existe=False).tasks
    assert tarea.func is correo.enviar_bienvenida
    assert tarea.args == (EMAIL, "Ana")


def test_registro_rechazado_no_manda_bienvenida(monkeypatch):
    with pytest.raises(HTTPException):
        _registrar(monkeypatch, ya_existe=True)


def test_mail_de_bienvenida_lleva_el_link_a_la_plataforma(smtp):
    correo.enviar_bienvenida(EMAIL, "Ana")
    (mensaje,) = smtp.enviados
    assert mensaje["To"] == EMAIL
    assert "Bienvenido" in mensaje["Subject"]
    assert "http://localhost:5173/" in mensaje.get_body(("plain",)).get_content()
    assert "Hola Ana" in mensaje.get_body(("html",)).get_content()

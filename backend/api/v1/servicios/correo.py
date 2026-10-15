# backend/api/v1/servicios/correo.py
"""
Envío de mails transaccionales, por la API HTTPS de Mailtrap o por SMTP.

Para qué: avisos que la app le manda al usuario por correo (hoy, la
bienvenida al registrarse, el recupero de contraseña y el resultado de la
revisión de su empresa). Usa `smtplib` de la librería estándar contra el
servidor configurado en el .env — en desarrollo, la casilla de pruebas de
Mailtrap, que recibe los mails sin entregarlos a nadie.

Dos niveles:
- enviar_correo(): genérico, no sabe de qué trata el mail. Si falla, lanza
  la excepción.
- enviar_bienvenida(), enviar_recupero_contrasena(),
  enviar_revision_empresa() y las que se sumen: arman el contenido de
  un escenario y NUNCA lanzan; si el envío falla queda en el log. Están
  pensadas para correr en segundo plano (BackgroundTasks), donde ya se le
  respondió al usuario y no hay a quién devolverle el error.

Por dónde sale el mail:
- API de Mailtrap (HTTPS), si están MAILTRAP_API_TOKEN y MAILTRAP_INBOX_ID.
  Es lo que se usa en Railway, que bloquea SMTP en sus planes Free, Trial y
  Hobby. Los mails van a la casilla de pruebas, igual que por SMTP.
- SMTP, si no: SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASSWORD.

Otras variables (ver .envexample): MAIL_FROM y FRONTEND_URL.
"""
import html
import json
import logging
import os
import smtplib
import time
import urllib.error
import urllib.request
from email.message import EmailMessage
from email.utils import parseaddr
from typing import Optional
from urllib.parse import quote

from dotenv import load_dotenv

from security import RESET_TOKEN_EXPIRE_MINUTES

load_dotenv()

logger = logging.getLogger(__name__)

MAILTRAP_API_TOKEN = os.getenv("MAILTRAP_API_TOKEN")
MAILTRAP_INBOX_ID = os.getenv("MAILTRAP_INBOX_ID")
MAILTRAP_API_URL = "https://sandbox.api.mailtrap.io/api/send/{inbox}"

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "2525"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM", "Córdoba Vidriera Productiva <no-responder@vidrieraproductiva.local>")
# URL pública del frontend, para armar los links que van dentro de los mails.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

SMTP_TIMEOUT_SEGUNDOS = 10
# Reintentos ante un rechazo temporal del servidor. El plan gratis de Mailtrap
# acepta más o menos un mail cada 10 segundos y al resto le responde
# "Too many emails per second": con estos valores se insiste hasta 15 segundos.
MAXIMO_INTENTOS = 4
ESPERA_ENTRE_INTENTOS_SEGUNDOS = 5


class CorreoNoConfigurado(RuntimeError):
    """No hay API de Mailtrap ni SMTP_HOST en el .env: no hay a dónde mandar el mail."""


class RechazoTemporalDeLaApi(RuntimeError):
    """La API respondió 429 (demasiados mails) o un error 5xx: conviene reintentar."""


def enviar_correo(destinatario: str, asunto: str, texto: str, cuerpo_html: Optional[str] = None) -> None:
    """Manda un mail. `texto` va siempre; `cuerpo_html` es la versión con formato, opcional."""
    if MAILTRAP_API_TOKEN and MAILTRAP_INBOX_ID:
        _enviar_por_api(destinatario, asunto, texto, cuerpo_html)
    elif SMTP_HOST:
        _enviar_por_smtp(destinatario, asunto, texto, cuerpo_html)
    else:
        raise CorreoNoConfigurado("Falta MAILTRAP_API_TOKEN/MAILTRAP_INBOX_ID o SMTP_HOST")


def _enviar_por_api(destinatario: str, asunto: str, texto: str, cuerpo_html: Optional[str]) -> None:
    nombre, direccion = parseaddr(MAIL_FROM)
    cuerpo = {
        "from": {"email": direccion, "name": nombre},
        "to": [{"email": destinatario}],
        "subject": asunto,
        "text": texto,
    }
    if cuerpo_html:
        cuerpo["html"] = cuerpo_html
    pedido = urllib.request.Request(
        MAILTRAP_API_URL.format(inbox=MAILTRAP_INBOX_ID),
        data=json.dumps(cuerpo).encode("utf-8"),
        # User-Agent propio: la API rechaza con 403 el que manda urllib por defecto.
        headers={
            "Api-Token": MAILTRAP_API_TOKEN,
            "Content-Type": "application/json",
            "User-Agent": "vidriera-productiva-backend",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(pedido, timeout=SMTP_TIMEOUT_SEGUNDOS):
            pass
    except urllib.error.HTTPError as error:
        if error.code == 429 or error.code >= 500:
            raise RechazoTemporalDeLaApi(f"Mailtrap respondió {error.code}") from error
        raise


def _enviar_por_smtp(destinatario: str, asunto: str, texto: str, cuerpo_html: Optional[str]) -> None:
    mensaje = EmailMessage()
    mensaje["From"] = MAIL_FROM
    mensaje["To"] = destinatario
    mensaje["Subject"] = asunto
    mensaje.set_content(texto)
    if cuerpo_html:
        mensaje.add_alternative(cuerpo_html, subtype="html")

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT_SEGUNDOS) as servidor:
        servidor.ehlo()
        if servidor.has_extn("starttls"):
            servidor.starttls()
            servidor.ehlo()
        if SMTP_USER:
            servidor.login(SMTP_USER, SMTP_PASSWORD or "")
        servidor.send_message(mensaje)


def _es_rechazo_temporal(error: Exception) -> bool:
    if isinstance(error, RechazoTemporalDeLaApi):
        return True
    if not isinstance(error, smtplib.SMTPResponseException):
        return False
    return 400 <= error.smtp_code < 500 or b"too many" in bytes(error.smtp_error or b"").lower()


def _enviar_sin_fallar(escenario: str, destinatario: str, asunto: str, texto: str, cuerpo_html: str) -> None:
    for intento in range(1, MAXIMO_INTENTOS + 1):
        try:
            enviar_correo(destinatario, asunto, texto, cuerpo_html)
            return
        except CorreoNoConfigurado:
            logger.warning("Mail de %s no enviado: falta configurar la API de Mailtrap o SMTP en el .env", escenario)
            return
        except Exception as error:
            if intento < MAXIMO_INTENTOS and _es_rechazo_temporal(error):
                time.sleep(ESPERA_ENTRE_INTENTOS_SEGUNDOS)
                continue
            # El contenido no se loguea: el mail de recupero lleva un token que
            # le permitiría cambiar la contraseña a quien lea el log.
            logger.exception("Falló el envío del mail de %s", escenario)
            return


def link_recupero(token: str) -> str:
    """Link al frontend que abre el formulario de nueva contraseña con el token cargado (ver App.tsx)."""
    return f"{FRONTEND_URL.rstrip('/')}/?reset_token={quote(token, safe='')}"


def enviar_recupero_contrasena(destinatario: str, nombre: str, token: str) -> None:
    """Mail con el link y el token para elegir una contraseña nueva."""
    link = link_recupero(token)
    texto = (
        f"Hola {nombre}:\n\n"
        "Recibimos un pedido para restablecer tu contraseña de Córdoba Vidriera Productiva.\n\n"
        f"Abrí este link para elegir una nueva (vence en {RESET_TOKEN_EXPIRE_MINUTES} minutos):\n{link}\n\n"
        f"Si el link no funciona, copiá este token en la pantalla de recuperación:\n{token}\n\n"
        "Si no fuiste vos, ignorá este mensaje: tu contraseña sigue siendo la misma.\n"
    )
    cuerpo_html = f"""\
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
  <h2 style="color: #12395e;">Restablecer contraseña</h2>
  <p>Hola {html.escape(nombre)}:</p>
  <p>Recibimos un pedido para restablecer tu contraseña de Córdoba Vidriera Productiva.</p>
  <p style="margin: 28px 0;">
    <a href="{html.escape(link)}" style="background: #12395e; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Restablecer contraseña</a>
  </p>
  <p>El link vence en {RESET_TOKEN_EXPIRE_MINUTES} minutos y sirve una sola vez.</p>
  <p>Si el botón no funciona, copiá este token en la pantalla de recuperación:</p>
  <p style="word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px;">{html.escape(token)}</p>
  <p style="color: #64748b; font-size: 13px;">Si no fuiste vos, ignorá este mensaje: tu contraseña sigue siendo la misma.</p>
</div>
"""
    _enviar_sin_fallar("recupero", destinatario, "Restablecé tu contraseña", texto, cuerpo_html)


def enviar_bienvenida(destinatario: str, nombre: str) -> None:
    """Mail de bienvenida que se manda al registrarse."""
    link = FRONTEND_URL.rstrip("/") + "/"
    texto = (
        f"Hola {nombre}:\n\n"
        "Tu cuenta en Córdoba Vidriera Productiva ya está creada.\n\n"
        f"Iniciá sesión con este correo para cargar los datos de tu empresa:\n{link}\n\n"
        "Si no creaste esta cuenta, ignorá este mensaje.\n"
    )
    cuerpo_html = f"""\
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
  <h2 style="color: #12395e;">¡Bienvenido a Córdoba Vidriera Productiva!</h2>
  <p>Hola {html.escape(nombre)}:</p>
  <p>Tu cuenta ya está creada. Iniciá sesión con este correo para cargar los datos de tu empresa.</p>
  <p style="margin: 28px 0;">
    <a href="{html.escape(link)}" style="background: #12395e; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Ir a la plataforma</a>
  </p>
  <p style="color: #64748b; font-size: 13px;">Si no creaste esta cuenta, ignorá este mensaje.</p>
</div>
"""
    _enviar_sin_fallar("bienvenida", destinatario, "¡Bienvenido a Córdoba Vidriera Productiva!", texto, cuerpo_html)


def enviar_revision_empresa(destinatario: str, nombre: str, razon_social: str, aprobada: bool, motivo: Optional[str] = None) -> None:
    """Mail que le avisa al representante que un administrador aprobó o rechazó su empresa."""
    link = FRONTEND_URL.rstrip("/") + "/"
    if aprobada:
        asunto = "Tu empresa fue aprobada"
        titulo = "¡Tu empresa fue aprobada!"
        detalle = f"{razon_social} ya está publicada en Córdoba Vidriera Productiva y es visible para todos los visitantes."
        cierre = "Podés revisar cómo quedó desde tu panel:"
        bloque_motivo = ""
    else:
        asunto = "Tu empresa necesita cambios"
        titulo = "Tu empresa no fue aprobada"
        detalle = f"Revisamos {razon_social} y por ahora no podemos publicarla en Córdoba Vidriera Productiva."
        cierre = "Entrá a tu panel para corregir los datos:"
        bloque_motivo = (
            '<p style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px;">'
            f"<strong>Motivo:</strong> {html.escape(motivo or '')}</p>"
        )

    texto = f"Hola {nombre}:\n\n{detalle}\n\n"
    if not aprobada:
        texto += f"Motivo: {motivo or ''}\n\n"
    texto += f"{cierre}\n{link}\n"
    cuerpo_html = f"""\
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
  <h2 style="color: #12395e;">{titulo}</h2>
  <p>Hola {html.escape(nombre)}:</p>
  <p>{html.escape(detalle)}</p>
  {bloque_motivo}
  <p>{cierre}</p>
  <p style="margin: 28px 0;">
    <a href="{html.escape(link)}" style="background: #12395e; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Ir a mi panel</a>
  </p>
</div>
"""
    _enviar_sin_fallar("revisión de empresa", destinatario, asunto, texto, cuerpo_html)

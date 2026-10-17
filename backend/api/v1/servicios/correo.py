# backend/api/v1/servicios/correo.py
"""
Envío de mails transaccionales por SMTP.

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

Variables de entorno (ver .envexample): SMTP_HOST, SMTP_PORT, SMTP_USER,
SMTP_PASSWORD, MAIL_FROM y FRONTEND_URL.
"""
import html
import logging
import os
import smtplib
import time
from email.message import EmailMessage
from typing import Optional
from urllib.parse import quote

from dotenv import load_dotenv

from security import RESET_TOKEN_EXPIRE_MINUTES

load_dotenv()

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "2525"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM", "Córdoba Vidriera Productiva <no-responder@vidrieraproductiva.local>")
# URL pública del frontend, para armar los links que van dentro de los mails.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
# Con CORREO_DESACTIVADO=1 no se manda nada (para tests automáticos: el plan
# gratis de Mailtrap no aguanta ráfagas y no queremos llenar la casilla).
CORREO_DESACTIVADO = os.getenv("CORREO_DESACTIVADO", "").lower() in ("1", "true", "si", "sí")

SMTP_TIMEOUT_SEGUNDOS = 10
# Reintentos ante un rechazo temporal del servidor. El plan gratis de Mailtrap
# acepta más o menos un mail cada 10 segundos y al resto le responde
# "Too many emails per second": con estos valores se insiste hasta 15 segundos.
MAXIMO_INTENTOS = 4
ESPERA_ENTRE_INTENTOS_SEGUNDOS = 5


class CorreoNoConfigurado(RuntimeError):
    """Falta SMTP_HOST en el .env: no hay a dónde mandar el mail."""


def enviar_correo(destinatario: str, asunto: str, texto: str, cuerpo_html: Optional[str] = None) -> None:
    """Manda un mail. `texto` va siempre; `cuerpo_html` es la versión con formato, opcional."""
    if CORREO_DESACTIVADO:
        logger.info("Correo desactivado (CORREO_DESACTIVADO=1): no se envía '%s' a %s", asunto, destinatario)
        return
    if not SMTP_HOST:
        raise CorreoNoConfigurado("SMTP_HOST no está definido")

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
    if not isinstance(error, smtplib.SMTPResponseException):
        return False
    return 400 <= error.smtp_code < 500 or b"too many" in bytes(error.smtp_error or b"").lower()


def _enviar_sin_fallar(escenario: str, destinatario: str, asunto: str, texto: str, cuerpo_html: str) -> None:
    for intento in range(1, MAXIMO_INTENTOS + 1):
        try:
            enviar_correo(destinatario, asunto, texto, cuerpo_html)
            return
        except CorreoNoConfigurado:
            logger.warning("Mail de %s no enviado: falta configurar SMTP_HOST en el .env", escenario)
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

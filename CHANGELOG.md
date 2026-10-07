# Changelog

Todas las modificaciones notables del proyecto "Córdoba Vidriera Productiva" serán registradas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] - 2026-10-22

### Añadido
- *Módulo Público de Autogestión:* Registro y autenticación de nexos representantes de PyMEs, con formularios dinámicos para la carga de datos del emprendimiento y aceptación obligatoria del "Manual del Expositor".
- *Repositorio de Activos Digitales:* Sistema de almacenamiento y validación de logotipos en formatos editables y galerías fotográficas de productos (mínimo 1, máximo 5 archivos).
- *Dashboard Administrativo:* Panel centralizado para los agentes ministeriales enfocado en la gestión de estados (nuevos, pendientes, registrados y rechazados), control de calidad humano y filtrado avanzado por localización y rubro.
- *Expositor Digital y Geolocalización:* Mapa provincial interactivo dividido por departamentos para consulta pública de la ciudadanía y despliegue de fichas de oferta productiva.
- *Automatización y Comunicación:* Sistema de notificaciones automáticas por correo electrónico ante aprobaciones o rechazos, e integración de canales asíncronos mediante WebSockets.
- *Infraestructura y Despliegue:* Contenedorización completa de la solución bajo un enfoque monolítico utilizando Dockerfile para su integración en los servidores del Ministerio.
- *Base de Datos y Geografía:* Scripts DDL para la estructura del esquema `CBA_VIDRIERA` y carga inicial (*seeding*) de datos de zonas, departamentos y localidades de la provincia de Córdoba.

### Cambios
- Migración definitiva del flujo manual basado en Google Forms y planillas de Google Sheets hacia una arquitectura robusta con backend en *FastAPI* y base de datos relacional *Oracle*.
- Implementación de Single Page Application (SPA) en el frontend utilizando *React*, optimizando la navegación mediante Server Components (RSC) y Server-Side Rendering (SSR).

### Seguridad e Integridad
- Incorporación de validadores asíncronos con Pydantic para el control de extensiones y tamaños de archivos adjuntos.
- Aplicación de prácticas de sustentabilidad informática (4 R) y rutinas automáticas de limpieza para archivos temporales y gestión de cuentas inactivas.
